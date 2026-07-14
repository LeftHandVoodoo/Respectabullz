use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{Connection, Row, Sqlite, SqliteConnection};

use crate::database_integrity::loaded_sqlite_pool;

const MAX_DEMO_STATEMENTS: usize = 512;
const MAX_SQL_BYTES: usize = 8 * 1024;
const MAX_PARAMS_PER_STATEMENT: usize = 64;
const DEMO_APP_IDENTIFIER: &str = "com.respectabullz.demo";

const ALLOWED_INSERT_TABLES: &[&str] = &[
    "client_interests",
    "clients",
    "communication_logs",
    "dogs",
    "expense_categories",
    "expenses",
    "external_studs",
    "genetic_tests",
    "health_schedule_templates",
    "heat_cycles",
    "heat_events",
    "litters",
    "medical_records",
    "pedigree_entries",
    "puppy_health_tasks",
    "sale_puppies",
    "sales",
    "settings",
    "transports",
    "vaccination_records",
    "waitlist_entries",
    "weight_entries",
];

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DemoStatement {
    sql: String,
    params: Vec<Value>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DemoSeedReport {
    statements_applied: usize,
    foreign_keys_verified: bool,
}

fn seed_error(message: impl AsRef<str>) -> String {
    format!("Synthetic demo seed failed: {}", message.as_ref())
}

fn validate_demo_runtime(identifier: &str, debug_build: bool) -> Result<(), String> {
    if !debug_build {
        return Err(seed_error("this command is disabled in release builds"));
    }
    if identifier != DEMO_APP_IDENTIFIER {
        return Err(seed_error(format!(
            "this command requires the isolated {DEMO_APP_IDENTIFIER} application identity"
        )));
    }

    Ok(())
}

fn validated_insert_table(sql: &str) -> Result<&str, String> {
    if sql.len() > MAX_SQL_BYTES {
        return Err(seed_error("a statement exceeds the SQL size limit"));
    }
    if sql.contains(';') {
        return Err(seed_error("multi-statement SQL is not allowed"));
    }

    let mut tokens = sql.split_whitespace();
    let insert = tokens.next().unwrap_or_default();
    let into = tokens.next().unwrap_or_default();
    let table = tokens.next().unwrap_or_default();

    if !insert.eq_ignore_ascii_case("INSERT") || !into.eq_ignore_ascii_case("INTO") {
        return Err(seed_error("only INSERT INTO statements are allowed"));
    }
    if !ALLOWED_INSERT_TABLES.contains(&table) {
        return Err(seed_error(format!(
            "inserts into the {table:?} table are not allowed"
        )));
    }

    Ok(table)
}

fn bind_json_value<'q>(
    query: sqlx::query::Query<'q, Sqlite, sqlx::sqlite::SqliteArguments<'q>>,
    value: Value,
) -> Result<sqlx::query::Query<'q, Sqlite, sqlx::sqlite::SqliteArguments<'q>>, String> {
    match value {
        Value::Null => Ok(query.bind(Option::<String>::None)),
        Value::Bool(value) => Ok(query.bind(value)),
        Value::Number(value) => {
            if let Some(value) = value.as_i64() {
                Ok(query.bind(value))
            } else if let Some(value) = value.as_u64() {
                let value = i64::try_from(value)
                    .map_err(|_| seed_error("an integer parameter exceeds SQLite's range"))?;
                Ok(query.bind(value))
            } else if let Some(value) = value.as_f64() {
                Ok(query.bind(value))
            } else {
                Err(seed_error("a numeric parameter is not representable"))
            }
        }
        Value::String(value) => Ok(query.bind(value)),
        Value::Array(_) | Value::Object(_) => {
            Err(seed_error("array and object parameters are not allowed"))
        }
    }
}

async fn assert_database_is_empty(connection: &mut SqliteConnection) -> Result<(), String> {
    let tables = sqlx::query(
        "SELECT name FROM sqlite_master
         WHERE type = 'table'
           AND name NOT LIKE 'sqlite_%'
           AND name <> '_schema_version'",
    )
    .fetch_all(&mut *connection)
    .await
    .map_err(|error| seed_error(format!("could not inspect the database: {error}")))?;

    for row in tables {
        let name: String = row
            .try_get("name")
            .map_err(|error| seed_error(format!("could not read a table name: {error}")))?;
        let mut characters = name.chars();
        let valid_name = characters
            .next()
            .is_some_and(|character| character.is_ascii_alphabetic())
            && characters.all(|character| character.is_ascii_alphanumeric() || character == '_');
        if !valid_name {
            return Err(seed_error("the database contains an unexpected table name"));
        }

        let where_clause = match name.as_str() {
            "document_tags" => " WHERE is_custom = 1",
            "contact_categories" => " WHERE is_predefined = 0",
            _ => "",
        };
        let count_sql = format!("SELECT COUNT(*) FROM \"{name}\"{where_clause}");
        let count: i64 = sqlx::query_scalar(&count_sql)
            .fetch_one(&mut *connection)
            .await
            .map_err(|error| seed_error(format!("could not inspect the {name} table: {error}")))?;
        if count > 0 {
            return Err(seed_error(format!(
                "existing user-created records were found in {name}; a fresh operational database is required"
            )));
        }
    }

    Ok(())
}

async fn execute_demo_statements(
    connection: &mut SqliteConnection,
    statements: Vec<DemoStatement>,
) -> Result<DemoSeedReport, String> {
    if statements.is_empty() || statements.len() > MAX_DEMO_STATEMENTS {
        return Err(seed_error(
            "the statement count is outside the allowed range",
        ));
    }

    assert_database_is_empty(connection).await?;
    let statement_count = statements.len();

    for statement in statements {
        validated_insert_table(&statement.sql)?;
        if statement.params.len() > MAX_PARAMS_PER_STATEMENT {
            return Err(seed_error("a statement has too many parameters"));
        }

        let mut query = sqlx::query(&statement.sql);
        for value in statement.params {
            query = bind_json_value(query, value)?;
        }
        query.execute(&mut *connection).await.map_err(|error| {
            seed_error(format!("a fixture insert was rejected by SQLite: {error}"))
        })?;
    }

    let violations = sqlx::query("PRAGMA foreign_key_check")
        .fetch_all(&mut *connection)
        .await
        .map_err(|error| seed_error(format!("could not verify foreign keys: {error}")))?;
    if !violations.is_empty() {
        return Err(seed_error(format!(
            "foreign-key verification found {} violation(s)",
            violations.len()
        )));
    }

    Ok(DemoSeedReport {
        statements_applied: statement_count,
        foreign_keys_verified: true,
    })
}

async fn apply_on_connection(
    connection: &mut SqliteConnection,
    statements: Vec<DemoStatement>,
) -> Result<DemoSeedReport, String> {
    sqlx::query("PRAGMA foreign_keys = ON")
        .execute(&mut *connection)
        .await
        .map_err(|error| seed_error(format!("could not enable foreign keys: {error}")))?;
    sqlx::query("PRAGMA busy_timeout = 5000")
        .execute(&mut *connection)
        .await
        .map_err(|error| seed_error(format!("could not set the busy timeout: {error}")))?;
    let mut transaction = connection
        .begin_with("BEGIN IMMEDIATE")
        .await
        .map_err(|error| seed_error(format!("could not acquire the demo write lock: {error}")))?;

    match execute_demo_statements(&mut transaction, statements).await {
        Ok(report) => {
            transaction.commit().await.map_err(|error| {
                seed_error(format!("could not commit the demo fixture: {error}"))
            })?;
            Ok(report)
        }
        Err(error) => {
            transaction.rollback().await.map_err(|rollback_error| {
                seed_error(format!("{error}; rollback also failed: {rollback_error}"))
            })?;
            Err(error)
        }
    }
}

#[tauri::command]
pub async fn apply_demo_seed(
    app: tauri::AppHandle,
    statements: Vec<DemoStatement>,
) -> Result<DemoSeedReport, String> {
    validate_demo_runtime(&app.config().identifier, cfg!(debug_assertions))?;

    let pool = loaded_sqlite_pool(app).await?;
    let mut connection = pool
        .acquire()
        .await
        .map_err(|error| seed_error(format!("could not acquire SQLite: {error}")))?;
    apply_on_connection(&mut connection, statements).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::{Connection, SqliteConnection};

    fn statement(sql: &str, params: Vec<Value>) -> DemoStatement {
        DemoStatement {
            sql: sql.to_string(),
            params,
        }
    }

    async fn empty_test_database() -> SqliteConnection {
        let mut connection = SqliteConnection::connect("sqlite::memory:")
            .await
            .expect("connect");
        sqlx::query("CREATE TABLE dogs (id TEXT PRIMARY KEY, name TEXT NOT NULL)")
            .execute(&mut connection)
            .await
            .expect("create dogs");
        connection
    }

    #[test]
    fn only_bounded_allowlisted_inserts_are_accepted() {
        assert_eq!(
            validated_insert_table("INSERT INTO dogs (id) VALUES (?)").expect("allowed"),
            "dogs"
        );
        assert!(validated_insert_table("DELETE FROM dogs").is_err());
        assert!(validated_insert_table("INSERT INTO documents (id) VALUES (?)").is_err());
        assert!(
            validated_insert_table("INSERT INTO dogs (id) VALUES (?); DELETE FROM dogs").is_err()
        );
    }

    #[test]
    fn demo_runtime_requires_debug_build_and_isolated_identity() {
        assert!(validate_demo_runtime(DEMO_APP_IDENTIFIER, true).is_ok());
        assert!(validate_demo_runtime("com.respectabullz.app", true).is_err());
        assert!(validate_demo_runtime(DEMO_APP_IDENTIFIER, false).is_err());
    }

    #[tokio::test]
    async fn a_rejected_fixture_rolls_back_every_insert() {
        let mut connection = empty_test_database().await;
        let statements = vec![
            statement(
                "INSERT INTO dogs (id, name) VALUES (?, ?)",
                vec![Value::from("demo-1"), Value::from("Aurora")],
            ),
            statement(
                "INSERT INTO dogs (id, name) VALUES (?, ?)",
                vec![Value::from("demo-1"), Value::from("Duplicate")],
            ),
        ];

        assert!(apply_on_connection(&mut connection, statements)
            .await
            .is_err());
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM dogs")
            .fetch_one(&mut connection)
            .await
            .expect("count");
        assert_eq!(count, 0);
    }

    #[tokio::test]
    async fn a_valid_fixture_commits_once() {
        let mut connection = empty_test_database().await;
        let statements = vec![statement(
            "INSERT INTO dogs (id, name) VALUES (?, ?)",
            vec![Value::from("demo-1"), Value::from("Aurora")],
        )];

        let report = apply_on_connection(&mut connection, statements)
            .await
            .expect("seed");
        assert_eq!(report.statements_applied, 1);
        assert!(report.foreign_keys_verified);
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM dogs")
            .fetch_one(&mut connection)
            .await
            .expect("count");
        assert_eq!(count, 1);
    }
}

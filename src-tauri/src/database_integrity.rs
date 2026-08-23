use serde::Serialize;
use sqlx::{pool::PoolConnection, raw_sql, Connection, Row, Sqlite, SqliteConnection, SqlitePool};
use tauri::Manager;
use tauri_plugin_sql::{DbInstances, DbPool};

const DATABASE_URL: &str = "sqlite:respectabullz.db";
const CURRENT_SCHEMA_VERSION: i64 = 5;
const OLDEST_SUPPORTED_SCHEMA_VERSION: i64 = 4;
const SCHEMA_SQL: &str = include_str!("../../src/lib/db/schema.sql");

const REQUIRED_TABLES: &[&str] = &[
    "_schema_version",
    "attachments",
    "client_interests",
    "clients",
    "communication_logs",
    "contact_categories",
    "contact_category_links",
    "contacts",
    "document_tag_links",
    "document_tags",
    "documents",
    "dog_documents",
    "dog_photos",
    "dogs",
    "expense_categories",
    "expense_documents",
    "expenses",
    "external_studs",
    "genetic_tests",
    "health_schedule_templates",
    "heat_cycles",
    "heat_events",
    "litter_documents",
    "litter_photos",
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

#[derive(Clone, Copy)]
struct RequiredIndex {
    table: &'static str,
    name: Option<&'static str>,
    columns: &'static [&'static str],
    unique: bool,
}

const REQUIRED_INDEXES: &[RequiredIndex] = &[
    RequiredIndex {
        table: "dogs",
        name: Some("idx_dogs_status"),
        columns: &["status"],
        unique: false,
    },
    RequiredIndex {
        table: "dogs",
        name: Some("idx_dogs_sire"),
        columns: &["sire_id"],
        unique: false,
    },
    RequiredIndex {
        table: "dogs",
        name: Some("idx_dogs_dam"),
        columns: &["dam_id"],
        unique: false,
    },
    RequiredIndex {
        table: "dogs",
        name: Some("idx_dogs_litter"),
        columns: &["litter_id"],
        unique: false,
    },
    RequiredIndex {
        table: "litters",
        name: Some("idx_litters_status"),
        columns: &["status"],
        unique: false,
    },
    RequiredIndex {
        table: "litters",
        name: Some("idx_litters_sire"),
        columns: &["sire_id"],
        unique: false,
    },
    RequiredIndex {
        table: "litters",
        name: Some("idx_litters_dam"),
        columns: &["dam_id"],
        unique: false,
    },
    RequiredIndex {
        table: "document_tags",
        name: Some("idx_document_tags_name"),
        columns: &["name"],
        unique: false,
    },
    RequiredIndex {
        table: "documents",
        name: None,
        columns: &["id"],
        unique: true,
    },
    RequiredIndex {
        table: "document_tag_links",
        name: Some("idx_document_tag_links_document"),
        columns: &["document_id"],
        unique: false,
    },
    RequiredIndex {
        table: "document_tag_links",
        name: Some("idx_document_tag_links_tag"),
        columns: &["tag_id"],
        unique: false,
    },
    RequiredIndex {
        table: "document_tag_links",
        name: None,
        columns: &["document_id", "tag_id"],
        unique: true,
    },
    RequiredIndex {
        table: "dog_documents",
        name: Some("idx_dog_documents_dog"),
        columns: &["dog_id"],
        unique: false,
    },
    RequiredIndex {
        table: "dog_documents",
        name: Some("idx_dog_documents_document"),
        columns: &["document_id"],
        unique: false,
    },
    RequiredIndex {
        table: "dog_documents",
        name: None,
        columns: &["dog_id", "document_id"],
        unique: true,
    },
    RequiredIndex {
        table: "litter_documents",
        name: Some("idx_litter_documents_litter"),
        columns: &["litter_id"],
        unique: false,
    },
    RequiredIndex {
        table: "litter_documents",
        name: Some("idx_litter_documents_document"),
        columns: &["document_id"],
        unique: false,
    },
    RequiredIndex {
        table: "litter_documents",
        name: None,
        columns: &["litter_id", "document_id"],
        unique: true,
    },
    RequiredIndex {
        table: "expense_documents",
        name: Some("idx_expense_documents_expense"),
        columns: &["expense_id"],
        unique: false,
    },
    RequiredIndex {
        table: "expense_documents",
        name: Some("idx_expense_documents_document"),
        columns: &["document_id"],
        unique: false,
    },
    RequiredIndex {
        table: "expense_documents",
        name: None,
        columns: &["expense_id", "document_id"],
        unique: true,
    },
    RequiredIndex {
        table: "contact_categories",
        name: Some("idx_contact_categories_name"),
        columns: &["name"],
        unique: false,
    },
    RequiredIndex {
        table: "contacts",
        name: Some("idx_contacts_name"),
        columns: &["name"],
        unique: false,
    },
    RequiredIndex {
        table: "contacts",
        name: Some("idx_contacts_email"),
        columns: &["email"],
        unique: false,
    },
    RequiredIndex {
        table: "contact_category_links",
        name: Some("idx_contact_category_links_contact"),
        columns: &["contact_id"],
        unique: false,
    },
    RequiredIndex {
        table: "contact_category_links",
        name: Some("idx_contact_category_links_category"),
        columns: &["category_id"],
        unique: false,
    },
    RequiredIndex {
        table: "contact_category_links",
        name: None,
        columns: &["contact_id", "category_id"],
        unique: true,
    },
    RequiredIndex {
        table: "settings",
        name: None,
        columns: &["key"],
        unique: true,
    },
];

#[derive(Clone, Copy)]
struct RequiredForeignKey {
    table: &'static str,
    column: &'static str,
    referenced_table: &'static str,
    referenced_column: &'static str,
    on_delete: &'static str,
}

const REQUIRED_FOREIGN_KEYS: &[RequiredForeignKey] = &[
    RequiredForeignKey {
        table: "dogs",
        column: "sire_id",
        referenced_table: "dogs",
        referenced_column: "id",
        on_delete: "SET NULL",
    },
    RequiredForeignKey {
        table: "dogs",
        column: "dam_id",
        referenced_table: "dogs",
        referenced_column: "id",
        on_delete: "SET NULL",
    },
    RequiredForeignKey {
        table: "dogs",
        column: "litter_id",
        referenced_table: "litters",
        referenced_column: "id",
        on_delete: "SET NULL",
    },
    RequiredForeignKey {
        table: "litters",
        column: "sire_id",
        referenced_table: "dogs",
        referenced_column: "id",
        on_delete: "SET NULL",
    },
    RequiredForeignKey {
        table: "litters",
        column: "dam_id",
        referenced_table: "dogs",
        referenced_column: "id",
        on_delete: "SET NULL",
    },
    RequiredForeignKey {
        table: "document_tag_links",
        column: "document_id",
        referenced_table: "documents",
        referenced_column: "id",
        on_delete: "CASCADE",
    },
    RequiredForeignKey {
        table: "document_tag_links",
        column: "tag_id",
        referenced_table: "document_tags",
        referenced_column: "id",
        on_delete: "CASCADE",
    },
    RequiredForeignKey {
        table: "dog_documents",
        column: "dog_id",
        referenced_table: "dogs",
        referenced_column: "id",
        on_delete: "CASCADE",
    },
    RequiredForeignKey {
        table: "dog_documents",
        column: "document_id",
        referenced_table: "documents",
        referenced_column: "id",
        on_delete: "CASCADE",
    },
    RequiredForeignKey {
        table: "litter_documents",
        column: "litter_id",
        referenced_table: "litters",
        referenced_column: "id",
        on_delete: "CASCADE",
    },
    RequiredForeignKey {
        table: "litter_documents",
        column: "document_id",
        referenced_table: "documents",
        referenced_column: "id",
        on_delete: "CASCADE",
    },
    RequiredForeignKey {
        table: "expense_documents",
        column: "expense_id",
        referenced_table: "expenses",
        referenced_column: "id",
        on_delete: "CASCADE",
    },
    RequiredForeignKey {
        table: "expense_documents",
        column: "document_id",
        referenced_table: "documents",
        referenced_column: "id",
        on_delete: "CASCADE",
    },
    RequiredForeignKey {
        table: "contacts",
        column: "business_card_document_id",
        referenced_table: "documents",
        referenced_column: "id",
        on_delete: "SET NULL",
    },
    RequiredForeignKey {
        table: "contact_category_links",
        column: "contact_id",
        referenced_table: "contacts",
        referenced_column: "id",
        on_delete: "CASCADE",
    },
    RequiredForeignKey {
        table: "contact_category_links",
        column: "category_id",
        referenced_table: "contact_categories",
        referenced_column: "id",
        on_delete: "CASCADE",
    },
];

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrationReport {
    from_version: i64,
    to_version: i64,
    applied_versions: Vec<i64>,
    foreign_keys_verified: bool,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum MigrationFailpoint {
    AfterSchema,
    AfterCompanyName,
}

type IntegrityFuture<'a, T> =
    std::pin::Pin<Box<dyn std::future::Future<Output = Result<T, String>> + Send + 'a>>;

fn integrity_error(message: impl Into<String>) -> String {
    format!("Database integrity setup failed: {}", message.into())
}

fn integrity_ipc_error(detail: String) -> String {
    eprintln!(
        "{}",
        serde_json::json!({
            "level": "error",
            "event": "database_integrity_setup_failed",
            "detail": detail,
        })
    );
    "Database setup could not be completed. Restart Respectabullz and try again.".to_string()
}

fn quote_sqlite_identifier(identifier: &str) -> String {
    format!("\"{}\"", identifier.replace('"', "\"\""))
}

fn user_table_names(
    connection: &mut SqliteConnection,
) -> IntegrityFuture<'_, std::collections::HashSet<String>> {
    Box::pin(async move {
        let rows = sqlx::query(
            "SELECT name FROM sqlite_master \
         WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
        )
        .fetch_all(&mut *connection)
        .await
        .map_err(|error| integrity_error(format!("could not inspect schema: {error}")))?;

        rows.iter()
            .map(|row| {
                row.try_get::<String, _>("name").map_err(|error| {
                    integrity_error(format!("could not read schema table name: {error}"))
                })
            })
            .collect()
    })
}

fn validate_required_columns(
    connection: &mut SqliteConnection,
    allow_legacy_company_name_missing: bool,
) -> IntegrityFuture<'_, ()> {
    Box::pin(async move {
        // Build the expected column-name set from the embedded schema itself.
        // This keeps every REQUIRED_TABLE covered without maintaining a second,
        // partial hand-written column list. It intentionally validates names
        // only; indexes and foreign keys retain their focused checks below.
        let mut reference =
            SqliteConnection::connect("sqlite::memory:")
                .await
                .map_err(|error| {
                    integrity_error(format!(
                        "could not open embedded-schema reference database: {error}"
                    ))
                })?;
        sqlx::Executor::execute(&mut reference, raw_sql(SCHEMA_SQL))
            .await
            .map_err(|error| {
                integrity_error(format!(
                    "could not build embedded-schema reference database: {error}"
                ))
            })?;

        let mut missing = Vec::new();

        for table in REQUIRED_TABLES {
            let statement = format!("PRAGMA table_info({})", quote_sqlite_identifier(table));
            let expected_rows = sqlx::query(&statement)
                .fetch_all(&mut reference)
                .await
                .map_err(|error| {
                    integrity_error(format!(
                        "could not inspect embedded columns for {table}: {error}"
                    ))
                })?;
            let expected_columns = expected_rows
                .iter()
                .map(|row| {
                    row.try_get::<String, _>("name").map_err(|error| {
                        integrity_error(format!(
                            "could not read an embedded column name for {table}: {error}"
                        ))
                    })
                })
                .collect::<Result<std::collections::HashSet<_>, _>>()?;

            let actual_rows = sqlx::query(&statement)
                .fetch_all(&mut *connection)
                .await
                .map_err(|error| {
                    integrity_error(format!("could not inspect columns for {table}: {error}"))
                })?;
            let actual_columns = actual_rows
                .iter()
                .map(|row| {
                    row.try_get::<String, _>("name").map_err(|error| {
                        integrity_error(format!(
                            "could not read a column name for {table}: {error}"
                        ))
                    })
                })
                .collect::<Result<std::collections::HashSet<_>, _>>()?;

            missing.extend(
                expected_columns
                    .into_iter()
                    .filter(|column| {
                        !(allow_legacy_company_name_missing
                            && *table == "contacts"
                            && column == "company_name")
                    })
                    .filter(|column| !actual_columns.contains(column))
                    .map(|column| format!("{table}.{column}")),
            );
        }

        missing.sort();

        if missing.is_empty() {
            Ok(())
        } else {
            Err(integrity_error(format!(
                "unexpected schema drift; missing column(s): {}",
                missing.join(", ")
            )))
        }
    })
}

fn required_index_exists(
    connection: &mut SqliteConnection,
    required: RequiredIndex,
) -> IntegrityFuture<'_, bool> {
    Box::pin(async move {
        let statement = format!(
            "PRAGMA index_list({})",
            quote_sqlite_identifier(required.table)
        );
        let rows = sqlx::query(&statement)
            .fetch_all(&mut *connection)
            .await
            .map_err(|error| {
                integrity_error(format!(
                    "could not inspect indexes for {}: {error}",
                    required.table
                ))
            })?;

        for row in rows {
            let name = row.try_get::<String, _>("name").map_err(|error| {
                integrity_error(format!(
                    "could not read an index name for {}: {error}",
                    required.table
                ))
            })?;
            let is_unique = row.try_get::<i64, _>("unique").map_err(|error| {
                integrity_error(format!(
                    "could not read index uniqueness for {}.{name}: {error}",
                    required.table
                ))
            })? == 1;

            if required.name.is_some_and(|expected| expected != name)
                || required.unique != is_unique
            {
                continue;
            }

            let info_statement = format!("PRAGMA index_info({})", quote_sqlite_identifier(&name));
            let info_rows = sqlx::query(&info_statement)
                .fetch_all(&mut *connection)
                .await
                .map_err(|error| {
                    integrity_error(format!(
                        "could not inspect index {}.{name}: {error}",
                        required.table
                    ))
                })?;
            let mut indexed_columns = info_rows
                .iter()
                .map(|info_row| {
                    let sequence = info_row.try_get::<i64, _>("seqno").map_err(|error| {
                        integrity_error(format!(
                            "could not read index order for {}.{name}: {error}",
                            required.table
                        ))
                    })?;
                    let column = info_row.try_get::<String, _>("name").map_err(|error| {
                        integrity_error(format!(
                            "could not read an indexed column for {}.{name}: {error}",
                            required.table
                        ))
                    })?;
                    Ok::<_, String>((sequence, column))
                })
                .collect::<Result<Vec<_>, _>>()?;
            indexed_columns.sort_by_key(|(sequence, _)| *sequence);
            let indexed_columns = indexed_columns
                .iter()
                .map(|(_, column)| column.as_str())
                .collect::<Vec<_>>();

            if indexed_columns == required.columns {
                return Ok(true);
            }
        }

        Ok(false)
    })
}

fn validate_required_indexes(connection: &mut SqliteConnection) -> IntegrityFuture<'_, ()> {
    Box::pin(async move {
        let mut missing = Vec::new();

        for required in REQUIRED_INDEXES {
            if !required_index_exists(connection, *required).await? {
                let description = required.name.map(str::to_owned).unwrap_or_else(|| {
                    format!(
                        "{} index on ({})",
                        if required.unique {
                            "unique"
                        } else {
                            "non-unique"
                        },
                        required.columns.join(", ")
                    )
                });
                missing.push(format!("{}.{}", required.table, description));
            }
        }

        if missing.is_empty() {
            Ok(())
        } else {
            Err(integrity_error(format!(
                "unexpected schema drift; missing or malformed index(es): {}",
                missing.join(", ")
            )))
        }
    })
}

fn required_foreign_key_exists(
    connection: &mut SqliteConnection,
    required: RequiredForeignKey,
) -> IntegrityFuture<'_, bool> {
    Box::pin(async move {
        let statement = format!(
            "PRAGMA foreign_key_list({})",
            quote_sqlite_identifier(required.table)
        );
        let rows = sqlx::query(&statement)
            .fetch_all(&mut *connection)
            .await
            .map_err(|error| {
                integrity_error(format!(
                    "could not inspect foreign keys for {}: {error}",
                    required.table
                ))
            })?;

        for row in rows {
            let column = row.try_get::<String, _>("from").map_err(|error| {
                integrity_error(format!(
                    "could not read a foreign-key column for {}: {error}",
                    required.table
                ))
            })?;
            let referenced_table = row.try_get::<String, _>("table").map_err(|error| {
                integrity_error(format!(
                    "could not read a foreign-key target table for {}.{column}: {error}",
                    required.table
                ))
            })?;
            let referenced_column = row.try_get::<String, _>("to").map_err(|error| {
                integrity_error(format!(
                    "could not read a foreign-key target column for {}.{column}: {error}",
                    required.table
                ))
            })?;
            let on_delete = row.try_get::<String, _>("on_delete").map_err(|error| {
                integrity_error(format!(
                    "could not read a foreign-key delete action for {}.{column}: {error}",
                    required.table
                ))
            })?;

            if column == required.column
                && referenced_table == required.referenced_table
                && referenced_column == required.referenced_column
                && on_delete.eq_ignore_ascii_case(required.on_delete)
            {
                return Ok(true);
            }
        }

        Ok(false)
    })
}

fn validate_required_foreign_keys(connection: &mut SqliteConnection) -> IntegrityFuture<'_, ()> {
    Box::pin(async move {
        let mut missing = Vec::new();

        for required in REQUIRED_FOREIGN_KEYS {
            if !required_foreign_key_exists(connection, *required).await? {
                missing.push(format!(
                    "{}.{} -> {}.{} ON DELETE {}",
                    required.table,
                    required.column,
                    required.referenced_table,
                    required.referenced_column,
                    required.on_delete
                ));
            }
        }

        if missing.is_empty() {
            Ok(())
        } else {
            Err(integrity_error(format!(
                "unexpected schema drift; missing or malformed foreign key(s): {}",
                missing.join(", ")
            )))
        }
    })
}

fn validate_existing_schema(
    connection: &mut SqliteConnection,
    allow_legacy_company_name_missing: bool,
) -> IntegrityFuture<'_, ()> {
    Box::pin(async move {
        let table_names = user_table_names(connection).await?;

        let missing = REQUIRED_TABLES
            .iter()
            .filter(|table| !table_names.contains(**table))
            .copied()
            .collect::<Vec<_>>();

        if !missing.is_empty() {
            return Err(integrity_error(format!(
                "unexpected schema drift; missing table(s): {}",
                missing.join(", ")
            )));
        }

        validate_required_columns(connection, allow_legacy_company_name_missing).await?;
        validate_required_indexes(connection).await?;
        validate_required_foreign_keys(connection).await
    })
}

fn contacts_has_company_name(connection: &mut SqliteConnection) -> IntegrityFuture<'_, bool> {
    Box::pin(async move {
        let rows = sqlx::query("PRAGMA table_info(contacts)")
            .fetch_all(&mut *connection)
            .await
            .map_err(|error| {
                integrity_error(format!("could not inspect contacts table: {error}"))
            })?;

        Ok(rows.iter().any(|row| {
            row.try_get::<String, _>("name")
                .map(|name| name == "company_name")
                .unwrap_or(false)
        }))
    })
}

fn apply_embedded_schema(connection: &mut SqliteConnection) -> IntegrityFuture<'_, ()> {
    Box::pin(async move {
        sqlx::Executor::execute(&mut *connection, raw_sql(SCHEMA_SQL))
            .await
            .map(|_| ())
            .map_err(|error| integrity_error(format!("schema application failed: {error}")))
    })
}

fn read_schema_version<'a>(
    connection: &'a mut SqliteConnection,
    action: &'static str,
) -> IntegrityFuture<'a, i64> {
    Box::pin(async move {
        sqlx::query_scalar("SELECT version FROM _schema_version WHERE id = 1")
            .fetch_one(&mut *connection)
            .await
            .map_err(|error| integrity_error(format!("could not {action} schema version: {error}")))
    })
}

fn add_company_name_column(connection: &mut SqliteConnection) -> IntegrityFuture<'_, ()> {
    Box::pin(async move {
        sqlx::query("ALTER TABLE contacts ADD COLUMN company_name TEXT")
            .execute(&mut *connection)
            .await
            .map(|_| ())
            .map_err(|error| {
                integrity_error(format!("migration 5 could not add company_name: {error}"))
            })
    })
}

fn record_current_schema_version(connection: &mut SqliteConnection) -> IntegrityFuture<'_, ()> {
    Box::pin(async move {
        sqlx::query(
            "UPDATE _schema_version SET version = ?, applied_at = datetime('now') WHERE id = 1",
        )
        .bind(CURRENT_SCHEMA_VERSION)
        .execute(&mut *connection)
        .await
        .map(|_| ())
        .map_err(|error| {
            integrity_error(format!("migration 5 could not record its version: {error}"))
        })
    })
}

fn foreign_key_violation_count(connection: &mut SqliteConnection) -> IntegrityFuture<'_, usize> {
    Box::pin(async move {
        sqlx::query("PRAGMA foreign_key_check")
            .fetch_all(&mut *connection)
            .await
            .map(|rows| rows.len())
            .map_err(|error| {
                integrity_error(format!("foreign-key validation could not run: {error}"))
            })
    })
}

fn apply_setup<'a>(
    connection: &'a mut SqliteConnection,
    failpoint: Option<MigrationFailpoint>,
) -> IntegrityFuture<'a, MigrationReport> {
    Box::pin(async move {
        let table_names = user_table_names(connection).await?;
        let version_table_exists = table_names.contains("_schema_version");
        let is_fresh_database = !version_table_exists;

        if is_fresh_database {
            let mut existing_tables = table_names.into_iter().collect::<Vec<_>>();
            existing_tables.sort();
            if !existing_tables.is_empty() {
                return Err(integrity_error(format!(
                    "schema version table is missing but application table(s) already exist: {}; refusing to initialize an unversioned database",
                    existing_tables.join(", ")
                )));
            }
        }

        let existing_version = if is_fresh_database {
            None
        } else {
            let version = read_schema_version(connection, "read").await?;
            if version < OLDEST_SUPPORTED_SCHEMA_VERSION {
                return Err(integrity_error(format!(
                    "schema version {version} is unsupported; minimum supported version is {OLDEST_SUPPORTED_SCHEMA_VERSION}"
                )));
            }
            if version > CURRENT_SCHEMA_VERSION {
                return Err(integrity_error(format!(
                    "schema version {version} is newer than this application supports"
                )));
            }
            validate_existing_schema(connection, version == OLDEST_SUPPORTED_SCHEMA_VERSION)
                .await?;
            Some(version)
        };

        apply_embedded_schema(connection).await?;

        if failpoint == Some(MigrationFailpoint::AfterSchema) {
            return Err(integrity_error("injected failure after schema application"));
        }

        let from_version = match existing_version {
            Some(version) => version,
            None => read_schema_version(connection, "read").await?,
        };

        let mut applied_versions = Vec::new();
        let has_company_name = contacts_has_company_name(connection).await?;

        match from_version {
            OLDEST_SUPPORTED_SCHEMA_VERSION => {
                if !has_company_name {
                    add_company_name_column(connection).await?;
                }

                if failpoint == Some(MigrationFailpoint::AfterCompanyName) {
                    return Err(integrity_error(
                        "injected failure after company_name migration",
                    ));
                }

                record_current_schema_version(connection).await?;
                applied_versions.push(CURRENT_SCHEMA_VERSION);
            }
            CURRENT_SCHEMA_VERSION => {
                if !has_company_name {
                    return Err(integrity_error(
                        "schema version is 5 but contacts.company_name is missing",
                    ));
                }
            }
            _ if is_fresh_database => {}
            _ => {
                return Err(integrity_error(format!(
                    "no migration path is defined from schema version {from_version}"
                )));
            }
        }

        // Validate the resulting schema as well as pre-existing schemas. This
        // makes the embedded schema itself subject to the same runtime contract.
        validate_existing_schema(connection, false).await?;
        if !contacts_has_company_name(connection).await? {
            return Err(integrity_error(
                "schema version is 5 but contacts.company_name is missing",
            ));
        }

        let violation_count = foreign_key_violation_count(connection).await?;
        if violation_count != 0 {
            return Err(integrity_error(format!(
                "foreign-key validation found {} violation(s)",
                violation_count
            )));
        }

        let to_version = read_schema_version(connection, "verify").await?;

        Ok(MigrationReport {
            from_version: if is_fresh_database { 0 } else { from_version },
            to_version,
            applied_versions,
            foreign_keys_verified: true,
        })
    })
}

fn retire_after_setup_commit_failure(
    connection: &mut PoolConnection<Sqlite>,
    error: sqlx::Error,
) -> String {
    connection.close_on_drop();
    integrity_error(format!(
        "could not commit setup: {error}; SQLite connection retired"
    ))
}

fn setup_pool<'a>(
    pool: &'a SqlitePool,
    failpoint: Option<MigrationFailpoint>,
) -> IntegrityFuture<'a, MigrationReport> {
    Box::pin(async move {
        let mut connection = pool.acquire().await.map_err(|error| {
            integrity_error(format!("could not acquire SQLite connection: {error}"))
        })?;

        sqlx::query("PRAGMA foreign_keys = ON")
            .execute(&mut *connection)
            .await
            .map_err(|error| integrity_error(format!("could not enable foreign keys: {error}")))?;

        let foreign_keys_enabled: i64 = sqlx::query_scalar("PRAGMA foreign_keys")
            .fetch_one(&mut *connection)
            .await
            .map_err(|error| integrity_error(format!("could not verify foreign keys: {error}")))?;
        if foreign_keys_enabled != 1 {
            return Err(integrity_error("foreign-key enforcement is disabled"));
        }

        sqlx::query("PRAGMA busy_timeout = 5000")
            .execute(&mut *connection)
            .await
            .map_err(|error| {
                integrity_error(format!("could not set SQLite busy timeout: {error}"))
            })?;

        // BEGIN IMMEDIATE obtains SQLite's write reservation before schema
        // inspection. Use SQLx's tracked transaction instead of sending raw
        // BEGIN/COMMIT statements so a failed COMMIT schedules a rollback on
        // drop instead of leaving an untracked write lock on a pooled
        // connection.
        let mut transaction = connection
            .begin_with("BEGIN IMMEDIATE")
            .await
            .map_err(|error| {
                integrity_error(format!("could not acquire migration lock: {error}"))
            })?;

        let operation = apply_setup(&mut transaction, failpoint).await;

        match operation {
            Ok(report) => {
                match transaction.commit().await {
                    Ok(()) => Ok(report),
                    Err(error) => {
                        // Transaction::commit keeps the transaction open when
                        // SQLite rejects COMMIT; its Drop queues a rollback.
                        // Retire the connection as an additional fail-closed
                        // boundary so it can never return to the pool locked.
                        Err(retire_after_setup_commit_failure(&mut connection, error))
                    }
                }
            }
            Err(mut error) => {
                if let Err(rollback_error) = transaction.rollback().await {
                    connection.close_on_drop();
                    error = integrity_error(format!(
                        "{error}; rollback also failed: {rollback_error}; SQLite connection retired"
                    ));
                }
                Err(error)
            }
        }
    })
}

pub(crate) async fn loaded_sqlite_pool(app: tauri::AppHandle) -> Result<SqlitePool, String> {
    let db_instances = app.state::<DbInstances>();
    let instances = db_instances.0.read().await;
    let database = instances
        .get(DATABASE_URL)
        .ok_or_else(|| integrity_error("SQLite pool is not loaded"))?;
    let DbPool::Sqlite(pool) = database;
    Ok(pool.clone())
}

fn setup_owned_pool(pool: SqlitePool) -> IntegrityFuture<'static, MigrationReport> {
    Box::pin(async move { setup_pool(&pool, None).await })
}

#[tauri::command]
pub async fn setup_integrity_database(app: tauri::AppHandle) -> Result<MigrationReport, String> {
    let result = async {
        let pool = loaded_sqlite_pool(app).await?;
        setup_owned_pool(pool).await
    }
    .await;
    result.map_err(integrity_ipc_error)
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn ipc_error_does_not_expose_database_details() {
        let error = integrity_ipc_error(
            r"SQL error in C:\Users\person\private\respectabullz.db".to_string(),
        );
        assert!(!error.contains("person"));
        assert!(!error.contains("SQL"));
    }

    async fn test_pool() -> SqlitePool {
        SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("in-memory SQLite pool should open")
    }

    async fn schema_version(pool: &SqlitePool) -> i64 {
        sqlx::query_scalar("SELECT version FROM _schema_version WHERE id = 1")
            .fetch_one(pool)
            .await
            .expect("schema version should exist")
    }

    async fn create_version_four_fixture(pool: &SqlitePool) {
        raw_sql(SCHEMA_SQL)
            .execute(pool)
            .await
            .expect("current schema fixture should apply");
        sqlx::query("UPDATE _schema_version SET version = 4 WHERE id = 1")
            .execute(pool)
            .await
            .expect("fixture version should update");
        sqlx::query("ALTER TABLE contacts DROP COLUMN company_name")
            .execute(pool)
            .await
            .expect("fixture should remove the version 5 column");
    }

    async fn company_name_exists(pool: &SqlitePool) -> bool {
        sqlx::query("PRAGMA table_info(contacts)")
            .fetch_all(pool)
            .await
            .expect("contacts table should be inspectable")
            .iter()
            .any(|row| row.try_get::<String, _>("name").unwrap_or_default() == "company_name")
    }

    #[tokio::test]
    async fn creates_a_complete_fresh_schema() {
        let pool = test_pool().await;

        let report = setup_pool(&pool, None)
            .await
            .expect("fresh setup should succeed");

        assert_eq!(report.from_version, 0);
        assert_eq!(report.to_version, CURRENT_SCHEMA_VERSION);
        assert!(report.foreign_keys_verified);
        assert!(company_name_exists(&pool).await);
        assert_eq!(schema_version(&pool).await, CURRENT_SCHEMA_VERSION);
    }

    #[tokio::test]
    async fn migrates_the_supported_version_four_fixture() {
        let pool = test_pool().await;
        create_version_four_fixture(&pool).await;

        let report = setup_pool(&pool, None)
            .await
            .expect("version 4 migration should succeed");

        assert_eq!(report.from_version, 4);
        assert_eq!(report.applied_versions, vec![5]);
        assert!(company_name_exists(&pool).await);
        assert_eq!(schema_version(&pool).await, 5);
    }

    #[tokio::test]
    async fn current_schema_second_run_is_a_noop() {
        let pool = test_pool().await;
        setup_pool(&pool, None)
            .await
            .expect("fresh setup should succeed");

        let report = setup_pool(&pool, None)
            .await
            .expect("current schema should be accepted");

        assert_eq!(report.from_version, CURRENT_SCHEMA_VERSION);
        assert_eq!(report.to_version, CURRENT_SCHEMA_VERSION);
        assert!(report.applied_versions.is_empty());
    }

    #[tokio::test]
    async fn rejects_an_unversioned_database_with_existing_tables_without_mutation() {
        let pool = test_pool().await;
        sqlx::query("CREATE TABLE dogs (id TEXT PRIMARY KEY, marker TEXT NOT NULL)")
            .execute(&pool)
            .await
            .expect("unversioned fixture table should be created");
        sqlx::query("INSERT INTO dogs (id, marker) VALUES ('existing-dog', 'preserve-me')")
            .execute(&pool)
            .await
            .expect("unversioned fixture row should be created");

        let error = setup_pool(&pool, None)
            .await
            .expect_err("an unversioned nonempty database should be rejected");

        assert!(error.contains("schema version table is missing"));
        let marker: String =
            sqlx::query_scalar("SELECT marker FROM dogs WHERE id = 'existing-dog'")
                .fetch_one(&pool)
                .await
                .expect("the pre-existing row should remain untouched");
        assert_eq!(marker, "preserve-me");
        let version_table_count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = '_schema_version'",
        )
        .fetch_one(&pool)
        .await
        .expect("schema catalog should remain readable");
        assert_eq!(version_table_count, 0);
    }

    #[tokio::test]
    async fn rejects_required_column_drift() {
        let pool = test_pool().await;
        setup_pool(&pool, None)
            .await
            .expect("fresh setup should succeed");
        sqlx::query("ALTER TABLE documents DROP COLUMN file_size")
            .execute(&pool)
            .await
            .expect("fixture should remove a runtime-critical column");

        let error = setup_pool(&pool, None)
            .await
            .expect_err("required-column drift should be rejected");

        assert!(error.contains("missing column(s): documents.file_size"));
        assert_eq!(schema_version(&pool).await, CURRENT_SCHEMA_VERSION);
    }

    #[tokio::test]
    async fn rejects_column_drift_in_a_previously_unlisted_table() {
        let pool = test_pool().await;
        setup_pool(&pool, None)
            .await
            .expect("fresh setup should succeed");
        sqlx::query("ALTER TABLE sales DROP COLUMN price")
            .execute(&pool)
            .await
            .expect("fixture should remove an expected sales column");

        let error = setup_pool(&pool, None)
            .await
            .expect_err("embedded-schema column drift should be rejected");

        assert!(error.contains("sales.price"));
        assert_eq!(schema_version(&pool).await, CURRENT_SCHEMA_VERSION);
    }

    #[tokio::test]
    async fn rejects_required_index_drift() {
        let pool = test_pool().await;
        setup_pool(&pool, None)
            .await
            .expect("fresh setup should succeed");
        sqlx::query("DROP INDEX idx_document_tag_links_document")
            .execute(&pool)
            .await
            .expect("fixture should remove a runtime-critical index");

        let error = setup_pool(&pool, None)
            .await
            .expect_err("required-index drift should be rejected");

        assert!(error.contains("idx_document_tag_links_document"));
        let index_count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'index' AND name = 'idx_document_tag_links_document'",
        )
        .fetch_one(&pool)
        .await
        .expect("schema catalog should remain readable");
        assert_eq!(index_count, 0, "validation must not silently repair drift");
    }

    #[tokio::test]
    async fn rejects_required_foreign_key_definition_drift() {
        let pool = test_pool().await;
        setup_pool(&pool, None)
            .await
            .expect("fresh setup should succeed");
        sqlx::query("PRAGMA foreign_keys = OFF")
            .execute(&pool)
            .await
            .expect("fixture should disable enforcement while rebuilding a table");
        raw_sql(
            "DROP TABLE dog_documents;
             CREATE TABLE dog_documents (
               id TEXT PRIMARY KEY,
               dog_id TEXT NOT NULL,
               document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
               created_at TEXT NOT NULL DEFAULT (datetime('now')),
               UNIQUE(dog_id, document_id)
             );
             CREATE INDEX idx_dog_documents_dog ON dog_documents(dog_id);
             CREATE INDEX idx_dog_documents_document ON dog_documents(document_id);",
        )
        .execute(&pool)
        .await
        .expect("fixture should omit only the dog relationship definition");

        let error = setup_pool(&pool, None)
            .await
            .expect_err("required foreign-key definition drift should be rejected");

        assert!(error.contains("dog_documents.dog_id -> dogs.id ON DELETE CASCADE"));
    }

    #[tokio::test]
    async fn concurrent_initialization_serializes_on_one_database() {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time should be valid")
            .as_nanos();
        let path = std::env::temp_dir().join(format!(
            "respectabullz-migration-{}-{unique}.db",
            std::process::id()
        ));
        let options = SqliteConnectOptions::new()
            .filename(&path)
            .create_if_missing(true);
        let pool = SqlitePoolOptions::new()
            .max_connections(2)
            .connect_with(options)
            .await
            .expect("temporary SQLite pool should open");

        let (first, second) = tokio::join!(setup_pool(&pool, None), setup_pool(&pool, None));
        let first = first.expect("first concurrent setup should succeed");
        let second = second.expect("second concurrent setup should succeed");

        let mut observed_from_versions = vec![first.from_version, second.from_version];
        observed_from_versions.sort_unstable();
        assert_eq!(observed_from_versions, vec![0, CURRENT_SCHEMA_VERSION]);
        assert_eq!(schema_version(&pool).await, CURRENT_SCHEMA_VERSION);

        pool.close().await;
        drop(pool);
        let mut remove_result = std::fs::remove_file(&path);
        for _ in 0..25 {
            if remove_result.is_ok() {
                break;
            }
            // SQLite's worker thread can release the Windows file handle a few
            // milliseconds after the pool reports closed.
            std::thread::sleep(std::time::Duration::from_millis(20));
            remove_result = std::fs::remove_file(&path);
        }
        remove_result.expect("temporary SQLite database should be removable");
    }

    #[tokio::test]
    async fn failed_commit_retires_the_pooled_connection() {
        let pool = test_pool().await;
        let mut connection = pool
            .acquire()
            .await
            .expect("fixture connection should be acquired");
        sqlx::query("PRAGMA foreign_keys = ON")
            .execute(&mut *connection)
            .await
            .expect("foreign keys should be enabled");
        raw_sql(
            "CREATE TABLE commit_parent (id INTEGER PRIMARY KEY);
             CREATE TABLE commit_child (
               parent_id INTEGER,
               FOREIGN KEY (parent_id) REFERENCES commit_parent(id)
                 DEFERRABLE INITIALLY DEFERRED
             );",
        )
        .execute(&mut *connection)
        .await
        .expect("deferred foreign-key fixture should apply");

        let mut transaction = connection
            .begin_with("BEGIN IMMEDIATE")
            .await
            .expect("tracked write transaction should begin");
        sqlx::query("INSERT INTO commit_child (parent_id) VALUES (404)")
            .execute(&mut *transaction)
            .await
            .expect("deferred violation should be accepted until commit");
        let commit_error = transaction
            .commit()
            .await
            .expect_err("deferred violation should reject commit");
        let error = retire_after_setup_commit_failure(&mut connection, commit_error);
        assert!(error.contains("SQLite connection retired"));
        drop(connection);

        // An in-memory SQLite database is connection-local. The fixture tables
        // disappear only if the failed connection was retired and replaced.
        let fixture_table_count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'commit_parent'",
        )
        .fetch_one(&pool)
        .await
        .expect("replacement connection should remain usable");
        assert_eq!(fixture_table_count, 0);
    }

    #[tokio::test]
    async fn rolls_back_an_injected_failure_and_retries_cleanly() {
        let pool = test_pool().await;
        create_version_four_fixture(&pool).await;

        let error = setup_pool(&pool, Some(MigrationFailpoint::AfterCompanyName))
            .await
            .expect_err("failpoint should stop the migration");
        assert!(error.contains("injected failure"));
        assert_eq!(schema_version(&pool).await, 4);
        assert!(!company_name_exists(&pool).await);

        setup_pool(&pool, None)
            .await
            .expect("retry after rollback should succeed");
        assert_eq!(schema_version(&pool).await, 5);
        assert!(company_name_exists(&pool).await);
    }

    #[tokio::test]
    async fn rejects_an_unsupported_existing_schema_without_mutation() {
        let pool = test_pool().await;
        create_version_four_fixture(&pool).await;
        sqlx::query("UPDATE _schema_version SET version = 3 WHERE id = 1")
            .execute(&pool)
            .await
            .expect("fixture version should update");

        let error = setup_pool(&pool, None)
            .await
            .expect_err("unsupported schema should be rejected");

        assert!(error.contains("minimum supported version is 4"));
        assert_eq!(schema_version(&pool).await, 3);
        assert!(!company_name_exists(&pool).await);
    }

    #[tokio::test]
    async fn rejects_foreign_key_violations() {
        let pool = test_pool().await;
        setup_pool(&pool, None)
            .await
            .expect("fresh setup should succeed");
        sqlx::query("PRAGMA foreign_keys = OFF")
            .execute(&pool)
            .await
            .expect("fixture should disable enforcement");
        sqlx::query(
            "INSERT INTO dog_documents (id, dog_id, document_id) VALUES ('invalid-link', 'missing-dog', 'missing-document')",
        )
        .execute(&pool)
        .await
        .expect("fixture should create an invalid relationship");

        let error = setup_pool(&pool, None)
            .await
            .expect_err("foreign-key drift should be rejected");
        assert!(error.contains("foreign-key validation found"));
    }
}

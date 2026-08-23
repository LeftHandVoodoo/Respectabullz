use std::{
    io::{self, Write},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    time::{Duration, Instant},
};

use serde::Serialize;
use serde_json::{Map, Value};
use sqlx::{
    pool::PoolConnection,
    sqlite::{SqliteArguments, SqliteRow},
    Column, Connection, Executor, Row, Sqlite, SqlitePool, Transaction, TypeInfo,
    Value as SqlxValue, ValueRef as SqlxValueRef,
};
use tauri::State;
use tauri_plugin_sql::{DbInstances, DbPool};

const DATABASE_URL: &str = "sqlite:respectabullz.db";
const MAX_SQL_BYTES: usize = 64 * 1024;
const MAX_PARAMETERS: usize = 1_024;
const QUERY_TIMEOUT: Duration = Duration::from_secs(5);
const MAX_RESULT_ROWS: usize = 10_000;
const MAX_RESPONSE_BYTES: usize = 16 * 1024 * 1024;
const MAX_MUTATION_ROWS: u64 = 1_000;
const SQLITE_PROGRESS_INTERVAL: i32 = 1_000;
const SQLITE_DEFAULT_BUSY_TIMEOUT: Duration = Duration::from_secs(5);
const CONNECTION_CLEANUP_TIMEOUT: Duration = Duration::from_secs(1);
const QUOTED_IDENTIFIER_PREFIX: &str = "QUOTED:";
// Schema bookkeeping and the transactionally coupled sale aggregate are
// changed only by database_integrity.rs and sale_workflow.rs. Keeping them out
// of the generic renderer mutation command preserves those native invariants.
const PROTECTED_GENERIC_MUTATION_TABLES: &[&str] = &["_SCHEMA_VERSION", "SALES", "SALE_PUPPIES"];

#[derive(Clone, Copy, Debug)]
struct ResourceLimits {
    timeout: Duration,
    max_result_rows: usize,
    max_response_bytes: usize,
    max_mutation_rows: u64,
}

const RESOURCE_LIMITS: ResourceLimits = ResourceLimits {
    timeout: QUERY_TIMEOUT,
    max_result_rows: MAX_RESULT_ROWS,
    max_response_bytes: MAX_RESPONSE_BYTES,
    max_mutation_rows: MAX_MUTATION_ROWS,
};

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DatabaseCommandError {
    code: &'static str,
    message: &'static str,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DatabaseExecuteResult {
    last_insert_id: i64,
    rows_affected: u64,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum StatementKind {
    Select,
    Execute,
}

#[derive(Debug, PartialEq, Eq)]
struct ValidationError(&'static str);

fn log_database_error(event: &str, detail: impl AsRef<str>) {
    eprintln!(
        "{}",
        serde_json::json!({
            "level": "error",
            "event": event,
            "detail": detail.as_ref(),
        })
    );
}

fn rejected_statement(error: ValidationError) -> DatabaseCommandError {
    log_database_error("database_statement_rejected", error.0);
    DatabaseCommandError {
        code: "database_statement_rejected",
        message: "The database request was rejected.",
    }
}

fn failed_request(operation: &str, error: impl std::fmt::Display) -> DatabaseCommandError {
    log_database_error(
        "database_request_failed",
        format!("{operation} failed: {error}"),
    );
    DatabaseCommandError {
        code: "database_request_failed",
        message: "The database request could not be completed.",
    }
}

fn timed_out(operation: &str) -> DatabaseCommandError {
    log_database_error("database_request_timed_out", operation);
    DatabaseCommandError {
        code: "database_request_timed_out",
        message: "The database request exceeded its time limit.",
    }
}

fn resource_limit(detail: impl AsRef<str>) -> DatabaseCommandError {
    log_database_error("database_resource_limit", detail);
    DatabaseCommandError {
        code: "database_resource_limit",
        message: "The database request exceeded a resource limit.",
    }
}

fn sql_tokens(sql: &str) -> Result<(Vec<String>, Vec<String>), ValidationError> {
    if sql.is_empty() || sql.len() > MAX_SQL_BYTES || sql.contains('\0') {
        return Err(ValidationError("SQL length or contents are invalid"));
    }

    let characters: Vec<char> = sql.chars().collect();
    let mut tokens = Vec::new();
    let mut quoted_identifiers = Vec::new();
    let mut token = String::new();
    let mut index = 0;

    let flush_token = |token: &mut String, tokens: &mut Vec<String>| {
        if !token.is_empty() {
            tokens.push(std::mem::take(token).to_ascii_uppercase());
        }
    };

    while index < characters.len() {
        let character = characters[index];

        if character == ';' {
            return Err(ValidationError("statement separators are not allowed"));
        }

        if character == '\'' {
            flush_token(&mut token, &mut tokens);
            index += 1;
            let mut closed = false;
            while index < characters.len() {
                if characters[index] == '\'' {
                    if index + 1 < characters.len() && characters[index + 1] == '\'' {
                        index += 2;
                        continue;
                    }
                    closed = true;
                    index += 1;
                    break;
                }
                index += 1;
            }
            if !closed {
                return Err(ValidationError("a quoted SQL value is not terminated"));
            }
            continue;
        }

        if character == '"' || character == '`' || character == '[' {
            flush_token(&mut token, &mut tokens);
            let closing_quote = if character == '[' { ']' } else { character };
            index += 1;
            let mut identifier = String::new();
            let mut closed = false;
            while index < characters.len() {
                if characters[index] == closing_quote {
                    if character != '['
                        && index + 1 < characters.len()
                        && characters[index + 1] == closing_quote
                    {
                        identifier.push(closing_quote);
                        index += 2;
                        continue;
                    }
                    closed = true;
                    index += 1;
                    break;
                }
                identifier.push(characters[index]);
                index += 1;
            }
            if !closed {
                return Err(ValidationError("a quoted SQL identifier is not terminated"));
            }
            let identifier = identifier.to_ascii_uppercase();
            tokens.push(format!("{QUOTED_IDENTIFIER_PREFIX}{identifier}"));
            quoted_identifiers.push(identifier);
            continue;
        }

        if character == '-' && index + 1 < characters.len() && characters[index + 1] == '-' {
            flush_token(&mut token, &mut tokens);
            index += 2;
            while index < characters.len() && characters[index] != '\n' {
                index += 1;
            }
            continue;
        }

        if character == '/' && index + 1 < characters.len() && characters[index + 1] == '*' {
            flush_token(&mut token, &mut tokens);
            index += 2;
            let mut closed = false;
            while index + 1 < characters.len() {
                if characters[index] == '*' && characters[index + 1] == '/' {
                    index += 2;
                    closed = true;
                    break;
                }
                index += 1;
            }
            if !closed {
                return Err(ValidationError("a SQL comment is not terminated"));
            }
            continue;
        }

        if character == '?' {
            flush_token(&mut token, &mut tokens);
            tokens.push("?".to_string());
        } else if character == '.' {
            flush_token(&mut token, &mut tokens);
            tokens.push(".".to_string());
        } else if character == '(' || character == ')' {
            flush_token(&mut token, &mut tokens);
            tokens.push(character.to_string());
        } else if character.is_ascii_alphanumeric() || character == '_' {
            token.push(character);
        } else {
            flush_token(&mut token, &mut tokens);
        }
        index += 1;
    }

    flush_token(&mut token, &mut tokens);
    if tokens.is_empty() {
        return Err(ValidationError("SQL contains no statement"));
    }
    Ok((tokens, quoted_identifiers))
}

fn mutation_target<'a>(tokens: &'a [String], statement: &str) -> Option<&'a str> {
    let mut index = match statement {
        "INSERT" | "REPLACE" => tokens.iter().position(|token| token == "INTO")? + 1,
        "UPDATE" => {
            let mut index = 1;
            if tokens.get(index).map(String::as_str) == Some("OR") {
                index += 2;
            }
            index
        }
        "DELETE" => tokens.iter().position(|token| token == "FROM")? + 1,
        _ => return None,
    };

    let mut target = tokens.get(index)?.as_str();
    while tokens.get(index + 1).map(String::as_str) == Some(".") {
        index += 2;
        target = tokens.get(index)?.as_str();
    }
    Some(
        target
            .strip_prefix(QUOTED_IDENTIFIER_PREFIX)
            .unwrap_or(target),
    )
}

fn is_protected_mutation_table(table: &str) -> bool {
    table.starts_with("SQLITE_") || PROTECTED_GENERIC_MUTATION_TABLES.contains(&table)
}

fn has_parameterized_where(tokens: &[String]) -> bool {
    let mut depth = 0_usize;
    let mut in_where_predicate = false;

    for token in tokens {
        match token.as_str() {
            "(" => depth = depth.saturating_add(1),
            ")" => depth = depth.saturating_sub(1),
            "WHERE" if depth == 0 => in_where_predicate = true,
            "RETURNING" | "ORDER" | "LIMIT" if depth == 0 && in_where_predicate => break,
            "?" if in_where_predicate => return true,
            _ => {}
        }
    }

    false
}

fn validate_statement(
    sql: &str,
    parameter_count: usize,
    kind: StatementKind,
) -> Result<(), ValidationError> {
    if parameter_count > MAX_PARAMETERS {
        return Err(ValidationError("too many SQL parameters were supplied"));
    }

    let (tokens, quoted_identifiers) = sql_tokens(sql)?;
    let first = tokens.first().map(String::as_str).unwrap_or_default();
    const FORBIDDEN: &[&str] = &[
        "ALTER",
        "ANALYZE",
        "ATTACH",
        "BEGIN",
        "COMMIT",
        "CREATE",
        "DBSTAT",
        "DETACH",
        "DROP",
        "FTS3_TOKENIZER",
        "LOAD_EXTENSION",
        "PRAGMA",
        "PRAGMA_DATABASE_LIST",
        "READFILE",
        "REINDEX",
        "RELEASE",
        "ROLLBACK",
        "SAVEPOINT",
        "SQLITE_DBSTAT",
        "VACUUM",
        "WRITEFILE",
    ];

    if tokens
        .iter()
        .chain(quoted_identifiers.iter())
        .any(|token| FORBIDDEN.contains(&token.as_str()) || token.starts_with("PRAGMA_"))
    {
        return Err(ValidationError(
            "schema, transaction, extension, and filesystem SQL is not allowed",
        ));
    }

    match kind {
        StatementKind::Select => {
            if first != "SELECT" && first != "WITH" {
                return Err(ValidationError("only read queries are allowed"));
            }
            if !tokens.iter().any(|token| token == "SELECT")
                || tokens.iter().any(|token| {
                    matches!(token.as_str(), "INSERT" | "UPDATE" | "DELETE" | "REPLACE")
                })
            {
                return Err(ValidationError("a read query may not mutate data"));
            }
        }
        StatementKind::Execute => {
            if !matches!(first, "INSERT" | "UPDATE" | "DELETE" | "REPLACE") {
                return Err(ValidationError("only one data mutation is allowed"));
            }

            let target = mutation_target(&tokens, first).ok_or(ValidationError(
                "the mutation target could not be identified",
            ))?;
            if is_protected_mutation_table(target) {
                return Err(ValidationError(
                    "the table may only be changed by its typed native workflow",
                ));
            }

            if matches!(first, "INSERT" | "REPLACE") {
                if !tokens.iter().any(|token| token == "VALUES")
                    || tokens.iter().any(|token| token == "SELECT")
                {
                    return Err(ValidationError(
                        "insert and replace statements must use VALUES only",
                    ));
                }
            } else if !has_parameterized_where(&tokens) {
                return Err(ValidationError(
                    "update and delete statements require a parameterized WHERE clause",
                ));
            }
        }
    }

    Ok(())
}

fn bind_json_value<'q>(
    query: sqlx::query::Query<'q, Sqlite, SqliteArguments<'q>>,
    value: Value,
) -> Result<sqlx::query::Query<'q, Sqlite, SqliteArguments<'q>>, ValidationError> {
    match value {
        Value::Null => Ok(query.bind(Option::<String>::None)),
        Value::Bool(value) => Ok(query.bind(value)),
        Value::Number(value) => {
            if let Some(value) = value.as_i64() {
                Ok(query.bind(value))
            } else if let Some(value) = value.as_u64() {
                let value = i64::try_from(value)
                    .map_err(|_| ValidationError("an integer parameter exceeds SQLite range"))?;
                Ok(query.bind(value))
            } else if let Some(value) = value.as_f64() {
                Ok(query.bind(value))
            } else {
                Err(ValidationError("a numeric parameter is not representable"))
            }
        }
        Value::String(value) => Ok(query.bind(value)),
        Value::Array(_) | Value::Object(_) => Err(ValidationError(
            "array and object SQL parameters are not allowed",
        )),
    }
}

fn sqlite_value(row: &SqliteRow, index: usize) -> Result<Value, sqlx::Error> {
    let raw = row.try_get_raw(index)?;
    if raw.is_null() {
        return Ok(Value::Null);
    }

    let value = match raw.type_info().name() {
        "TEXT" | "DATE" | "TIME" | "DATETIME" => {
            raw.to_owned().try_decode::<String>().map(Value::String)?
        }
        "REAL" => Value::from(raw.to_owned().try_decode::<f64>()?),
        "INTEGER" | "NUMERIC" => Value::from(raw.to_owned().try_decode::<i64>()?),
        "BOOLEAN" => Value::Bool(raw.to_owned().try_decode::<bool>()?),
        "BLOB" => Value::Array(
            raw.to_owned()
                .try_decode::<Vec<u8>>()?
                .into_iter()
                .map(Value::from)
                .collect(),
        ),
        _ => Value::Null,
    };
    Ok(value)
}

async fn acquire_connection(
    pool: &SqlitePool,
    timeout: Duration,
) -> Result<PoolConnection<Sqlite>, DatabaseCommandError> {
    match tokio::time::timeout(timeout, pool.acquire()).await {
        Ok(Ok(connection)) => Ok(connection),
        Ok(Err(error)) => Err(failed_request("pool acquisition", error)),
        Err(_) => Err(timed_out("pool acquisition")),
    }
}

fn remaining_time(
    deadline: Instant,
    operation: &'static str,
) -> Result<Duration, DatabaseCommandError> {
    let remaining = deadline.saturating_duration_since(Instant::now());
    if remaining.is_zero() {
        Err(timed_out(operation))
    } else {
        Ok(remaining)
    }
}

async fn apply_busy_timeout<'e, E>(executor: E, busy_timeout: Duration) -> Result<(), sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    // SQLx configures every SQLite connection with an independent five-second
    // sqlite3_busy_timeout. Restrict it to the request's remaining wall-clock
    // budget so a lock wait cannot begin late and outlive the global deadline.
    let milliseconds = busy_timeout.as_millis().clamp(1, i32::MAX as u128);
    let statement = format!("PRAGMA busy_timeout = {milliseconds}");
    sqlx::query(&statement).execute(executor).await?;
    Ok(())
}

async fn apply_deadline_busy_timeout<'e, E>(
    executor: E,
    deadline: Instant,
    operation: &'static str,
) -> Result<(), DatabaseCommandError>
where
    E: Executor<'e, Database = Sqlite>,
{
    let remaining = remaining_time(deadline, operation)?;
    match tokio::time::timeout(remaining, apply_busy_timeout(executor, remaining)).await {
        Ok(Ok(())) => Ok(()),
        Ok(Err(error)) => Err(failed_request(operation, error)),
        Err(_) => Err(timed_out(operation)),
    }
}

async fn install_deadline(
    connection: &mut PoolConnection<Sqlite>,
    deadline: Instant,
) -> Result<Arc<AtomicBool>, DatabaseCommandError> {
    let remaining = remaining_time(deadline, "deadline setup")?;
    let mut handle = match tokio::time::timeout(remaining, connection.lock_handle()).await {
        Ok(Ok(handle)) => handle,
        Ok(Err(error)) => return Err(failed_request("deadline setup", error)),
        Err(_) => return Err(timed_out("deadline setup")),
    };
    let interrupted = Arc::new(AtomicBool::new(false));
    let callback_interrupted = Arc::clone(&interrupted);
    handle.set_progress_handler(SQLITE_PROGRESS_INTERVAL, move || {
        if Instant::now() < deadline {
            true
        } else {
            // Abort the active statement once. A subsequent rollback must be
            // allowed to run so timed-out mutations cannot remain pending.
            callback_interrupted.swap(true, Ordering::SeqCst)
        }
    });
    Ok(interrupted)
}

async fn remove_deadline(
    connection: &mut PoolConnection<Sqlite>,
) -> Result<(), DatabaseCommandError> {
    {
        let mut handle = match tokio::time::timeout(
            CONNECTION_CLEANUP_TIMEOUT,
            connection.lock_handle(),
        )
        .await
        {
            Ok(Ok(handle)) => handle,
            Ok(Err(error)) => return Err(failed_request("deadline cleanup", error)),
            Err(_) => return Err(timed_out("deadline cleanup")),
        };
        handle.remove_progress_handler();
    }

    match tokio::time::timeout(
        CONNECTION_CLEANUP_TIMEOUT,
        apply_busy_timeout(&mut **connection, SQLITE_DEFAULT_BUSY_TIMEOUT),
    )
    .await
    {
        Ok(Ok(())) => Ok(()),
        Ok(Err(error)) => Err(failed_request("busy-timeout cleanup", error)),
        Err(_) => Err(timed_out("busy-timeout cleanup")),
    }
}

async fn rollback_transaction(
    mut transaction: Transaction<'_, Sqlite>,
) -> Result<(), DatabaseCommandError> {
    // Rollback does not need to wait for another connection's lock. Disable the
    // normal lock wait and cap cleanup so an error path cannot add another five
    // seconds after the request deadline. Dropping a timed-out SQLx transaction
    // also queues a rollback before its connection can be reused.
    match tokio::time::timeout(
        CONNECTION_CLEANUP_TIMEOUT,
        apply_busy_timeout(&mut *transaction, Duration::ZERO),
    )
    .await
    {
        Ok(Ok(())) => {}
        Ok(Err(error)) => return Err(failed_request("rollback lock-wait setup", error)),
        Err(_) => return Err(timed_out("rollback lock-wait setup")),
    }

    match tokio::time::timeout(CONNECTION_CLEANUP_TIMEOUT, transaction.rollback()).await {
        Ok(Ok(())) => Ok(()),
        Ok(Err(error)) => Err(failed_request("transaction rollback", error)),
        Err(_) => Err(timed_out("transaction rollback")),
    }
}

struct ResponseByteCounter {
    bytes: usize,
    maximum: usize,
}

impl Write for ResponseByteCounter {
    fn write(&mut self, buffer: &[u8]) -> io::Result<usize> {
        let bytes = self
            .bytes
            .checked_add(buffer.len())
            .ok_or_else(|| io::Error::other("response byte count overflowed"))?;
        if bytes > self.maximum {
            return Err(io::Error::other("response byte limit exceeded"));
        }
        self.bytes = bytes;
        Ok(buffer.len())
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

fn decode_rows(
    rows: Vec<SqliteRow>,
    limits: ResourceLimits,
) -> Result<Vec<Map<String, Value>>, DatabaseCommandError> {
    if rows.len() > limits.max_result_rows {
        return Err(resource_limit(format!(
            "select returned more than {} rows",
            limits.max_result_rows
        )));
    }

    let mut decoded = Vec::with_capacity(rows.len());
    // Account for the JSON array delimiters up front and stream serialization
    // into a counter so measuring a row never allocates another row-sized buffer.
    let mut response_counter = ResponseByteCounter {
        bytes: 2,
        maximum: limits.max_response_bytes,
    };
    for row in rows {
        let mut value = Map::new();
        for (index, column) in row.columns().iter().enumerate() {
            value.insert(
                column.name().to_string(),
                sqlite_value(&row, index).map_err(|error| failed_request("decode", error))?,
            );
        }
        if !decoded.is_empty() && response_counter.write_all(b",").is_err() {
            return Err(resource_limit(format!(
                "decoded response exceeded {} bytes",
                limits.max_response_bytes
            )));
        }
        if serde_json::to_writer(&mut response_counter, &value).is_err() {
            return Err(resource_limit(format!(
                "decoded response exceeded {} bytes",
                limits.max_response_bytes
            )));
        }
        decoded.push(value);
    }
    Ok(decoded)
}

async fn select_from_pool_with_limits(
    pool: &SqlitePool,
    sql: String,
    params: Vec<Value>,
    limits: ResourceLimits,
) -> Result<Vec<Map<String, Value>>, DatabaseCommandError> {
    validate_statement(&sql, params.len(), StatementKind::Select).map_err(rejected_statement)?;

    // The outer LIMIT bounds rows inside SQLite before SQLx materializes them.
    let bounded_sql = format!(
        "SELECT * FROM ({sql}) AS \"_respectabullz_bounded\" LIMIT {}",
        limits.max_result_rows.saturating_add(1)
    );
    let mut query = sqlx::query(&bounded_sql);
    for value in params {
        query = bind_json_value(query, value).map_err(rejected_statement)?;
    }

    let deadline = Instant::now() + limits.timeout;
    let mut connection = acquire_connection(pool, limits.timeout).await?;
    let interrupted = match install_deadline(&mut connection, deadline).await {
        Ok(interrupted) => interrupted,
        Err(error) => {
            connection.close_on_drop();
            return Err(error);
        }
    };
    if let Err(error) =
        apply_deadline_busy_timeout(&mut *connection, deadline, "select lock wait setup").await
    {
        connection.close_on_drop();
        return Err(error);
    }

    let query_result = query.fetch_all(&mut *connection).await;
    let request_timed_out = interrupted.load(Ordering::SeqCst) || Instant::now() >= deadline;
    if let Err(error) = remove_deadline(&mut connection).await {
        connection.close_on_drop();
        return Err(error);
    }
    if request_timed_out {
        return Err(timed_out("select"));
    }
    let rows = query_result.map_err(|error| failed_request("select", error))?;
    decode_rows(rows, limits)
}

async fn select_from_pool(
    pool: &SqlitePool,
    sql: String,
    params: Vec<Value>,
) -> Result<Vec<Map<String, Value>>, DatabaseCommandError> {
    select_from_pool_with_limits(pool, sql, params, RESOURCE_LIMITS).await
}

async fn execute_on_pool_with_limits(
    pool: &SqlitePool,
    sql: String,
    params: Vec<Value>,
    limits: ResourceLimits,
) -> Result<DatabaseExecuteResult, DatabaseCommandError> {
    validate_statement(&sql, params.len(), StatementKind::Execute).map_err(rejected_statement)?;

    let mut query = sqlx::query(&sql);
    for value in params {
        query = bind_json_value(query, value).map_err(rejected_statement)?;
    }

    let deadline = Instant::now() + limits.timeout;
    let mut connection = acquire_connection(pool, limits.timeout).await?;
    let interrupted = match install_deadline(&mut connection, deadline).await {
        Ok(interrupted) => interrupted,
        Err(error) => {
            connection.close_on_drop();
            return Err(error);
        }
    };
    if let Err(error) = apply_deadline_busy_timeout(
        &mut *connection,
        deadline,
        "transaction begin lock wait setup",
    )
    .await
    {
        connection.close_on_drop();
        return Err(error);
    }
    let transaction_result = connection.begin().await;
    if transaction_result.is_err() {
        let error = transaction_result.expect_err("transaction begin result was checked");
        let request_timed_out = interrupted.load(Ordering::SeqCst) || Instant::now() >= deadline;
        connection.close_on_drop();
        return if request_timed_out {
            Err(timed_out("transaction begin"))
        } else {
            Err(failed_request("transaction begin", error))
        };
    }
    let mut transaction = transaction_result.expect("transaction begin result was checked");
    if interrupted.load(Ordering::SeqCst) || Instant::now() >= deadline {
        let rollback_failed = rollback_transaction(transaction).await.is_err();
        let cleanup_failed = rollback_failed || remove_deadline(&mut connection).await.is_err();
        if cleanup_failed {
            connection.close_on_drop();
        }
        return Err(timed_out("transaction begin"));
    }

    if let Err(error) =
        apply_deadline_busy_timeout(&mut *transaction, deadline, "execute lock wait setup").await
    {
        let rollback_failed = rollback_transaction(transaction).await.is_err();
        let cleanup_failed = rollback_failed || remove_deadline(&mut connection).await.is_err();
        if cleanup_failed {
            connection.close_on_drop();
        }
        return Err(error);
    }

    let execution = query.execute(&mut *transaction).await;
    let request_timed_out = interrupted.load(Ordering::SeqCst) || Instant::now() >= deadline;
    if request_timed_out {
        let rollback_failed = rollback_transaction(transaction).await.is_err();
        let cleanup_failed = rollback_failed || remove_deadline(&mut connection).await.is_err();
        if cleanup_failed {
            connection.close_on_drop();
        }
        return Err(timed_out("execute"));
    }
    let result = match execution {
        Ok(result) => result,
        Err(error) => {
            let rollback_failed = rollback_transaction(transaction).await.is_err();
            let cleanup_failed = rollback_failed || remove_deadline(&mut connection).await.is_err();
            if cleanup_failed {
                connection.close_on_drop();
            }
            return Err(failed_request("execute", error));
        }
    };

    if result.rows_affected() > limits.max_mutation_rows {
        let affected = result.rows_affected();
        if rollback_transaction(transaction).await.is_err() {
            connection.close_on_drop();
            return Err(failed_request(
                "mutation rollback",
                "the row-limit rollback could not be confirmed",
            ));
        }
        if let Err(error) = remove_deadline(&mut connection).await {
            connection.close_on_drop();
            return Err(error);
        }
        return Err(resource_limit(format!(
            "mutation affected {affected} rows; maximum is {}",
            limits.max_mutation_rows
        )));
    }

    let response = DatabaseExecuteResult {
        last_insert_id: result.last_insert_rowid(),
        rows_affected: result.rows_affected(),
    };
    if let Err(error) =
        apply_deadline_busy_timeout(&mut *transaction, deadline, "commit lock wait setup").await
    {
        let rollback_failed = rollback_transaction(transaction).await.is_err();
        let cleanup_failed = rollback_failed || remove_deadline(&mut connection).await.is_err();
        if cleanup_failed {
            connection.close_on_drop();
        }
        return Err(error);
    }
    if let Err(error) = transaction.commit().await {
        let request_timed_out = interrupted.load(Ordering::SeqCst) || Instant::now() >= deadline;
        connection.close_on_drop();
        return if request_timed_out {
            Err(timed_out("transaction commit"))
        } else {
            Err(failed_request("transaction commit", error))
        };
    }
    if let Err(error) = remove_deadline(&mut connection).await {
        connection.close_on_drop();
        return Err(error);
    }
    Ok(response)
}

async fn execute_on_pool(
    pool: &SqlitePool,
    sql: String,
    params: Vec<Value>,
) -> Result<DatabaseExecuteResult, DatabaseCommandError> {
    execute_on_pool_with_limits(pool, sql, params, RESOURCE_LIMITS).await
}

async fn loaded_pool(
    instances: State<'_, DbInstances>,
) -> Result<SqlitePool, DatabaseCommandError> {
    let instances = instances.0.read().await;
    let database = instances
        .get(DATABASE_URL)
        .ok_or_else(|| failed_request("pool lookup", "the fixed SQLite pool is not loaded"))?;
    let DbPool::Sqlite(pool) = database;
    Ok(pool.clone())
}

#[tauri::command]
pub async fn database_select(
    instances: State<'_, DbInstances>,
    sql: String,
    params: Vec<Value>,
) -> Result<Vec<Map<String, Value>>, DatabaseCommandError> {
    let pool = loaded_pool(instances).await?;
    select_from_pool(&pool, sql, params).await
}

#[tauri::command]
pub async fn database_execute(
    instances: State<'_, DbInstances>,
    sql: String,
    params: Vec<Value>,
) -> Result<DatabaseExecuteResult, DatabaseCommandError> {
    let pool = loaded_pool(instances).await?;
    execute_on_pool(&pool, sql, params).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{path::Path, time::SystemTime};

    use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};

    #[test]
    fn allows_only_single_data_statements() {
        assert!(validate_statement("SELECT * FROM dogs", 0, StatementKind::Select).is_ok());
        assert!(validate_statement(
            "WITH active AS (SELECT * FROM dogs) SELECT * FROM active",
            0,
            StatementKind::Select,
        )
        .is_ok());
        assert!(validate_statement(
            "INSERT INTO dogs (id, name) VALUES (?, ?)",
            2,
            StatementKind::Execute,
        )
        .is_ok());
        assert!(validate_statement(
            "UPDATE dogs SET name = ? WHERE id = ?",
            2,
            StatementKind::Execute,
        )
        .is_ok());
    }

    #[test]
    fn allows_every_renderer_mutation_grammar_class() {
        let supported = [
            (
                "INSERT INTO dogs (id, name) VALUES (?, ?)",
                2,
            ),
            (
                "INSERT OR IGNORE INTO dog_documents (id, dog_id, document_id) VALUES (?, ?, ?)",
                3,
            ),
            (
                "INSERT OR REPLACE INTO settings (id, key, value) VALUES (?, ?, ?)",
                3,
            ),
            (
                "REPLACE INTO settings (id, key, value) VALUES (?, ?, ?)",
                3,
            ),
            (
                "INSERT INTO pedigree_entries (id, dog_id, generation, position, ancestor_name) VALUES (?, ?, ?, ?, ?) ON CONFLICT(dog_id, generation, position) DO UPDATE SET ancestor_name = excluded.ancestor_name",
                5,
            ),
            (
                "UPDATE contacts SET name = ?, email = ?, updated_at = ? WHERE id = ?",
                4,
            ),
            (
                "UPDATE waitlist_entries SET position = ?, updated_at = ? WHERE id = ?",
                3,
            ),
            (
                "UPDATE puppy_health_tasks SET completed_date = NULL, updated_at = ? WHERE id = ?",
                2,
            ),
            (
                "UPDATE health_schedule_templates SET is_default = ? WHERE is_default <> ?",
                2,
            ),
            (
                "DELETE FROM document_tag_links WHERE document_id = ? AND tag_id = ?",
                2,
            ),
        ];

        for (sql, parameter_count) in supported {
            assert!(
                validate_statement(sql, parameter_count, StatementKind::Execute).is_ok(),
                "rejected supported renderer grammar {sql:?}"
            );
        }
    }

    #[test]
    fn rejects_stacked_schema_transaction_and_filesystem_sql() {
        for sql in [
            "SELECT 1; DROP TABLE dogs",
            "PRAGMA writable_schema = ON",
            "ATTACH DATABASE ? AS stolen",
            "SELECT load_extension(?)",
            "SELECT readfile(?)",
            "SELECT * FROM [pragma_database_list]",
            "SELECT * FROM \"pragma_compile_options\"",
            "SELECT `load_extension`(?)",
            "BEGIN IMMEDIATE",
            "CREATE TABLE stolen (value TEXT)",
            "WITH target AS (SELECT id FROM dogs) DELETE FROM dogs",
        ] {
            let kind = if sql.starts_with("SELECT") || sql.starts_with("WITH") {
                StatementKind::Select
            } else {
                StatementKind::Execute
            };
            assert!(
                validate_statement(sql, 0, kind).is_err(),
                "accepted {sql:?}"
            );
        }
    }

    #[test]
    fn rejects_unbounded_or_protected_generic_mutations() {
        for sql in [
            "INSERT INTO sales (id) VALUES (?)",
            "UPDATE \"sale_puppies\" SET price = ? WHERE id = ?",
            "DELETE FROM main._schema_version WHERE id = ?",
            "DELETE FROM sqlite_sequence WHERE name = ?",
            "INSERT INTO dogs (id) SELECT id FROM archived_dogs",
            "REPLACE INTO dogs (id) SELECT id FROM archived_dogs",
            "UPDATE dogs SET status = ?",
            "UPDATE dogs SET status = ? WHERE id = 'dog-1'",
            "DELETE FROM dogs WHERE status = 'inactive'",
        ] {
            assert!(
                validate_statement(sql, 2, StatementKind::Execute).is_err(),
                "accepted {sql:?}"
            );
        }

        assert!(validate_statement(
            "INSERT OR IGNORE INTO dog_documents (id, dog_id, document_id) VALUES (?, ?, ?)",
            3,
            StatementKind::Execute,
        )
        .is_ok());
        assert!(validate_statement(
            "DELETE FROM dog_documents WHERE dog_id = ? AND document_id = ?",
            2,
            StatementKind::Execute,
        )
        .is_ok());
    }

    #[test]
    fn ignores_keywords_and_semicolons_inside_quoted_values_and_comments() {
        assert!(validate_statement(
            "SELECT 'DROP; ATTACH', name FROM dogs -- PRAGMA hidden\n WHERE id = ?",
            1,
            StatementKind::Select,
        )
        .is_ok());
    }

    #[test]
    fn handles_comments_quotes_ctes_returning_and_upserts_without_parser_bypasses() {
        for (sql, parameter_count) in [
            (
                "UPDATE/**/\"dogs\" SET name = ? WHERE id = ? RETURNING id",
                2,
            ),
            (
                "UPDATE dogs SET name = ? WHERE id IN (SELECT id FROM dogs WHERE status = ?) RETURNING ?",
                3,
            ),
            (
                "INSERT/**/OR/**/REPLACE/**/INTO/**/`settings` (id, key, value) VALUES (?, ?, ?) RETURNING id",
                3,
            ),
            (
                "INSERT INTO pedigree_entries (id, dog_id) VALUES (?, ?) ON CONFLICT(dog_id) DO UPDATE SET id = excluded.id RETURNING id",
                2,
            ),
        ] {
            assert!(
                validate_statement(sql, parameter_count, StatementKind::Execute).is_ok(),
                "rejected supported syntax {sql:?}"
            );
        }

        for sql in [
            "UPDATE/**/\"sales\" SET status = ? WHERE id = ?",
            "DELETE/**/FROM/**/[sale_puppies] WHERE id = ?",
            "INSERT/**/INTO/**/main.`_schema_version` (id) VALUES (?)",
            "WITH chosen AS (SELECT id FROM dogs) UPDATE dogs SET name = ? WHERE id = ?",
            "INSERT INTO dogs (id) VALUES (?) RETURNING (SELECT id FROM sales LIMIT 1)",
            "UPDATE dogs SET name = ? WHERE \"?\"",
            "UPDATE dogs SET name = ? WHERE [?]",
            "UPDATE dogs SET name = ? WHERE id = '?' /* ? */",
            "UPDATE dogs SET name = 'x' WHERE 1 = 1 RETURNING ?",
            "DELETE FROM dogs WHERE 1 = 1 RETURNING ?",
            "UPDATE dogs SET name = ? WHERE id = 1 ORDER BY ? LIMIT ?",
            "DELETE FROM dogs WHERE status = 'old' ORDER BY id LIMIT ?",
        ] {
            assert!(
                validate_statement(sql, 2, StatementKind::Execute).is_err(),
                "accepted parser bypass {sql:?}"
            );
        }

        assert!(validate_statement(
            "WITH named AS (SELECT \"UPDATE\" AS keyword FROM dogs) SELECT keyword FROM named",
            0,
            StatementKind::Select,
        )
        .is_ok());
    }

    #[test]
    fn public_errors_do_not_expose_internal_details() {
        let error = failed_request(
            "select",
            "database file C:\\Users\\person\\private\\respectabullz.db is locked",
        );
        assert_eq!(error.code, "database_request_failed");
        assert!(!error.message.contains("person"));
        assert!(!error.message.contains("locked"));
    }

    #[tokio::test]
    async fn query_and_execute_round_trip_supported_json_types() {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("test database should open");
        sqlx::query("CREATE TABLE fixture (id INTEGER PRIMARY KEY, name TEXT, enabled BOOLEAN)")
            .execute(&pool)
            .await
            .expect("fixture schema should apply");

        let result = execute_on_pool(
            &pool,
            "INSERT INTO fixture (name, enabled) VALUES (?, ?)".to_string(),
            vec![Value::String("sample".to_string()), Value::Bool(true)],
        )
        .await
        .expect("insert should pass");
        assert_eq!(result.last_insert_id, 1);
        assert_eq!(result.rows_affected, 1);

        let rows = select_from_pool(
            &pool,
            "SELECT id, name, enabled FROM fixture WHERE id = ?".to_string(),
            vec![Value::from(1)],
        )
        .await
        .expect("select should pass");
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].get("name"), Some(&Value::String("sample".into())));
    }

    #[tokio::test]
    async fn select_limits_rows_before_materialization_and_caps_decoded_bytes() {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("test database should open");
        let limits = ResourceLimits {
            timeout: Duration::from_secs(1),
            max_result_rows: 2,
            max_response_bytes: 1_024,
            max_mutation_rows: 10,
        };
        let row_error = select_from_pool_with_limits(
            &pool,
            "SELECT 1 AS value UNION ALL SELECT 2 UNION ALL SELECT 3".to_string(),
            vec![],
            limits,
        )
        .await
        .expect_err("third row must hit the pre-materialization limit");
        assert_eq!(row_error.code, "database_resource_limit");

        let byte_error = select_from_pool_with_limits(
            &pool,
            "SELECT 'a decoded value that is intentionally too large' AS value".to_string(),
            vec![],
            ResourceLimits {
                max_response_bytes: 16,
                ..limits
            },
        )
        .await
        .expect_err("decoded response must be capped");
        assert_eq!(byte_error.code, "database_resource_limit");
    }

    #[tokio::test]
    async fn recursive_select_is_interrupted_at_its_deadline() {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("test database should open");
        let error = select_from_pool_with_limits(
            &pool,
            "WITH RECURSIVE counter(value) AS (VALUES (1) UNION ALL SELECT value + 1 FROM counter WHERE value < 100000000) SELECT SUM(value) AS total FROM counter".to_string(),
            vec![],
            ResourceLimits {
                timeout: Duration::from_millis(10),
                max_result_rows: 2,
                max_response_bytes: 1_024,
                max_mutation_rows: 10,
            },
        )
        .await
        .expect_err("expensive query must be interrupted");
        assert_eq!(error.code, "database_request_timed_out");
    }

    #[tokio::test]
    async fn sqlite_lock_waits_use_remaining_request_deadline_and_roll_back() {
        let unique = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .expect("system clock should be after the Unix epoch")
            .as_nanos();
        let path = std::env::temp_dir().join(format!(
            "respectabullz-boundary-lock-{}-{unique}.db",
            std::process::id()
        ));
        let options = SqliteConnectOptions::new()
            .filename(&path)
            .create_if_missing(true);
        let pool = SqlitePoolOptions::new()
            .max_connections(2)
            .connect_with(options)
            .await
            .expect("test database should open");
        sqlx::raw_sql(
            "CREATE TABLE fixture (id INTEGER PRIMARY KEY, name TEXT NOT NULL); \
             INSERT INTO fixture (id, name) VALUES (1, 'old');",
        )
        .execute(&pool)
        .await
        .expect("fixture should be created");

        // Keep both physical connections open so the request cannot avoid the
        // lock by opening or reusing the connection that owns it.
        let mut lock_connection = pool.acquire().await.expect("lock connection should open");
        let warm_connection = pool
            .acquire()
            .await
            .expect("request connection should open");
        drop(warm_connection);
        sqlx::query("BEGIN IMMEDIATE")
            .execute(&mut *lock_connection)
            .await
            .expect("writer lock should be acquired");

        let started = Instant::now();
        let error = execute_on_pool_with_limits(
            &pool,
            "UPDATE fixture SET name = ? WHERE id = ?".to_string(),
            vec![Value::String("new".into()), Value::from(1)],
            ResourceLimits {
                timeout: Duration::from_millis(250),
                max_result_rows: 10,
                max_response_bytes: 1_024,
                max_mutation_rows: 10,
            },
        )
        .await
        .expect_err("the competing writer must hit the request deadline");
        let elapsed = started.elapsed();
        assert_eq!(error.code, "database_request_timed_out");
        assert!(
            elapsed < Duration::from_secs(2),
            "request used SQLite's independent five-second busy timeout: {elapsed:?}"
        );

        sqlx::query("ROLLBACK")
            .execute(&mut *lock_connection)
            .await
            .expect("writer lock should be released");
        drop(lock_connection);
        let unchanged: String = sqlx::query_scalar("SELECT name FROM fixture WHERE id = 1")
            .fetch_one(&pool)
            .await
            .expect("fixture should remain readable");
        assert_eq!(unchanged, "old");

        // A reader permits the competing UPDATE but prevents its COMMIT from
        // taking the exclusive lock. This separately exercises the commit
        // busy-wait path and SQLx's queued rollback after a failed commit.
        let mut read_connection = pool.acquire().await.expect("reader should open");
        let warm_connection = pool
            .acquire()
            .await
            .expect("commit test connection should open");
        drop(warm_connection);
        sqlx::query("BEGIN")
            .execute(&mut *read_connection)
            .await
            .expect("read transaction should begin");
        let _: String = sqlx::query_scalar("SELECT name FROM fixture WHERE id = 1")
            .fetch_one(&mut *read_connection)
            .await
            .expect("reader should hold a shared lock");

        let started = Instant::now();
        let error = execute_on_pool_with_limits(
            &pool,
            "UPDATE fixture SET name = ? WHERE id = ?".to_string(),
            vec![Value::String("new".into()), Value::from(1)],
            ResourceLimits {
                timeout: Duration::from_millis(250),
                max_result_rows: 10,
                max_response_bytes: 1_024,
                max_mutation_rows: 10,
            },
        )
        .await
        .expect_err("the commit must hit the reader-held lock deadline");
        let elapsed = started.elapsed();
        assert_eq!(error.code, "database_request_timed_out");
        assert!(
            elapsed < Duration::from_secs(2),
            "commit used SQLite's independent five-second busy timeout: {elapsed:?}"
        );

        sqlx::query("ROLLBACK")
            .execute(&mut *read_connection)
            .await
            .expect("reader lock should be released");
        drop(read_connection);
        pool.close().await;

        let verify_pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect_with(
                SqliteConnectOptions::new()
                    .filename(&path)
                    .create_if_missing(false),
            )
            .await
            .expect("test database should reopen");
        let unchanged: String = sqlx::query_scalar("SELECT name FROM fixture WHERE id = 1")
            .fetch_one(&verify_pool)
            .await
            .expect("failed commit should have been rolled back before close");
        assert_eq!(unchanged, "old");
        verify_pool.close().await;
        remove_sqlite_test_files(&path);
    }

    #[tokio::test]
    async fn oversized_mutation_is_rolled_back() {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("test database should open");
        sqlx::raw_sql(
            "CREATE TABLE fixture (id INTEGER PRIMARY KEY, name TEXT NOT NULL); \
             INSERT INTO fixture (name) VALUES ('old'), ('old'), ('old');",
        )
        .execute(&pool)
        .await
        .expect("fixture should be created");

        let error = execute_on_pool_with_limits(
            &pool,
            "UPDATE fixture SET name = ? WHERE name = ?".to_string(),
            vec![Value::String("new".into()), Value::String("old".into())],
            ResourceLimits {
                timeout: Duration::from_secs(1),
                max_result_rows: 10,
                max_response_bytes: 1_024,
                max_mutation_rows: 2,
            },
        )
        .await
        .expect_err("three-row update must exceed the mutation cap");
        assert_eq!(error.code, "database_resource_limit");
        let unchanged: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM fixture WHERE name = 'old'")
            .fetch_one(&pool)
            .await
            .expect("rollback should leave all rows unchanged");
        assert_eq!(unchanged, 3);
    }

    fn remove_sqlite_test_files(path: &Path) {
        for suffix in ["", "-wal", "-shm", "-journal"] {
            let mut candidate = path.as_os_str().to_os_string();
            candidate.push(suffix);
            let _ = std::fs::remove_file(candidate);
        }
    }
}

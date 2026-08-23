use serde::{Deserialize, Serialize};
use sqlx::{pool::PoolConnection, Connection, Row, Sqlite, SqlitePool, Transaction};
use std::collections::HashSet;

const MAX_PUPPIES_PER_SALE: usize = 100;
const MAX_ID_LENGTH: usize = 128;
const MAX_DATE_LENGTH: usize = 64;
const MAX_PATH_LENGTH: usize = 4_096;
const MAX_TEXT_LENGTH: usize = 100_000;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SalePuppyInput {
    dog_id: String,
    price: f64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleWriteRequest {
    client_id: String,
    sale_date: String,
    price: f64,
    deposit_amount: Option<f64>,
    deposit_date: Option<String>,
    contract_path: Option<String>,
    shipped_date: Option<String>,
    received_date: Option<String>,
    is_local_pickup: bool,
    payment_status: String,
    warranty_info: Option<String>,
    registration_transfer_date: Option<String>,
    transport_id: Option<String>,
    notes: Option<String>,
    puppies: Vec<SalePuppyInput>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleWorkflowError {
    code: String,
    message: String,
}

fn workflow_error(code: impl Into<String>, message: impl Into<String>) -> SaleWorkflowError {
    SaleWorkflowError {
        code: code.into(),
        message: message.into(),
    }
}

fn validate_identifier(value: &str, label: &str) -> Result<(), SaleWorkflowError> {
    if value.trim().is_empty() || value.len() > MAX_ID_LENGTH {
        return Err(workflow_error(
            "invalid_sale",
            format!("{label} is missing or invalid."),
        ));
    }
    Ok(())
}

fn validate_optional_text(
    value: Option<&str>,
    max_length: usize,
    label: &str,
) -> Result<(), SaleWorkflowError> {
    if value.is_some_and(|value| value.len() > max_length) {
        return Err(workflow_error(
            "invalid_sale",
            format!("{label} is too long."),
        ));
    }
    Ok(())
}

fn validate_request(request: &SaleWriteRequest) -> Result<(), SaleWorkflowError> {
    validate_identifier(&request.client_id, "Client")?;
    if request.sale_date.trim().is_empty() || request.sale_date.len() > MAX_DATE_LENGTH {
        return Err(workflow_error("invalid_sale", "Sale date is invalid."));
    }
    for (value, label) in [
        (request.deposit_date.as_deref(), "Deposit date"),
        (request.shipped_date.as_deref(), "Shipped date"),
        (request.received_date.as_deref(), "Received date"),
        (
            request.registration_transfer_date.as_deref(),
            "Registration transfer date",
        ),
    ] {
        validate_optional_text(value, MAX_DATE_LENGTH, label)?;
    }
    validate_optional_text(
        request.contract_path.as_deref(),
        MAX_PATH_LENGTH,
        "Contract path",
    )?;
    validate_optional_text(
        request.warranty_info.as_deref(),
        MAX_TEXT_LENGTH,
        "Warranty information",
    )?;
    validate_optional_text(request.notes.as_deref(), MAX_TEXT_LENGTH, "Notes")?;

    if !request.price.is_finite() || request.price < 0.0 {
        return Err(workflow_error(
            "invalid_sale",
            "Total sale price must be a finite, non-negative amount.",
        ));
    }
    if request
        .deposit_amount
        .is_some_and(|deposit| !deposit.is_finite() || deposit < 0.0 || deposit > request.price)
    {
        return Err(workflow_error(
            "invalid_sale",
            "Deposit must be a finite amount between zero and the sale total.",
        ));
    }
    if !matches!(
        request.payment_status.as_str(),
        "deposit_only" | "paid_in_full" | "partial" | "refunded"
    ) {
        return Err(workflow_error("invalid_sale", "Payment status is invalid."));
    }
    if request.is_local_pickup && request.transport_id.is_some() {
        return Err(workflow_error(
            "invalid_sale",
            "A local-pickup sale cannot also have a transport assignment.",
        ));
    }
    if let Some(transport_id) = request.transport_id.as_deref() {
        validate_identifier(transport_id, "Transport")?;
    }

    if request.puppies.is_empty() || request.puppies.len() > MAX_PUPPIES_PER_SALE {
        return Err(workflow_error(
            "invalid_puppies",
            format!("A sale must contain between 1 and {MAX_PUPPIES_PER_SALE} puppies."),
        ));
    }

    let mut dog_ids = HashSet::with_capacity(request.puppies.len());
    let mut calculated_total = 0.0;
    for puppy in &request.puppies {
        validate_identifier(&puppy.dog_id, "Puppy")?;
        if !dog_ids.insert(puppy.dog_id.as_str()) {
            return Err(workflow_error(
                "duplicate_puppy",
                "The same puppy cannot be assigned to a sale more than once.",
            ));
        }
        if !puppy.price.is_finite() || puppy.price < 0.0 {
            return Err(workflow_error(
                "invalid_puppies",
                "Each puppy price must be a finite, non-negative amount.",
            ));
        }
        calculated_total += puppy.price;
    }

    if (calculated_total - request.price).abs() > 0.005 {
        return Err(workflow_error(
            "price_mismatch",
            "The sale total must equal the sum of its puppy prices.",
        ));
    }

    Ok(())
}

async fn configure_connection(
    connection: &mut PoolConnection<Sqlite>,
) -> Result<(), SaleWorkflowError> {
    sqlx::query("PRAGMA foreign_keys = ON")
        .execute(&mut **connection)
        .await
        .map_err(|_| {
            workflow_error(
                "database_unavailable",
                "Could not enable database integrity checks.",
            )
        })?;
    let foreign_keys: i64 = sqlx::query_scalar("PRAGMA foreign_keys")
        .fetch_one(&mut **connection)
        .await
        .map_err(|_| {
            workflow_error(
                "database_unavailable",
                "Could not verify database integrity checks.",
            )
        })?;
    if foreign_keys != 1 {
        return Err(workflow_error(
            "database_unavailable",
            "Database integrity checks are unavailable.",
        ));
    }
    sqlx::query("PRAGMA busy_timeout = 5000")
        .execute(&mut **connection)
        .await
        .map_err(|_| {
            workflow_error(
                "database_unavailable",
                "Could not configure the sale database connection.",
            )
        })?;
    Ok(())
}

async fn begin_write<'a>(
    connection: &'a mut PoolConnection<Sqlite>,
) -> Result<Transaction<'a, Sqlite>, SaleWorkflowError> {
    (**connection)
        .begin_with("BEGIN IMMEDIATE")
        .await
        .map_err(|_| {
            workflow_error(
                "database_busy",
                "Could not start the sale transaction. Please try again.",
            )
        })
}

async fn next_id(transaction: &mut Transaction<'_, Sqlite>) -> Result<String, SaleWorkflowError> {
    sqlx::query_scalar("SELECT lower(hex(randomblob(16)))")
        .fetch_one(&mut **transaction)
        .await
        .map_err(|_| workflow_error("database_write_failed", "Could not generate a record ID."))
}

async fn validate_relations(
    transaction: &mut Transaction<'_, Sqlite>,
    request: &SaleWriteRequest,
    current_sale_id: Option<&str>,
) -> Result<(), SaleWorkflowError> {
    for (date, label) in [
        (Some(request.sale_date.as_str()), "Sale date"),
        (request.deposit_date.as_deref(), "Deposit date"),
        (request.shipped_date.as_deref(), "Shipped date"),
        (request.received_date.as_deref(), "Received date"),
        (
            request.registration_transfer_date.as_deref(),
            "Registration transfer date",
        ),
    ] {
        if let Some(date) = date {
            let parsed: Option<f64> = sqlx::query_scalar("SELECT julianday(?)")
                .bind(date)
                .fetch_one(&mut **transaction)
                .await
                .map_err(|_| {
                    workflow_error("database_read_failed", "Could not validate the sale dates.")
                })?;
            if parsed.is_none() {
                return Err(workflow_error(
                    "invalid_sale",
                    format!("{label} is invalid."),
                ));
            }
        }
    }

    let client_exists: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM clients WHERE id = ?")
        .bind(&request.client_id)
        .fetch_one(&mut **transaction)
        .await
        .map_err(|_| {
            workflow_error(
                "database_read_failed",
                "Could not validate the sale client.",
            )
        })?;
    if client_exists != 1 {
        return Err(workflow_error(
            "invalid_client",
            "The selected client no longer exists.",
        ));
    }

    if let Some(transport_id) = request.transport_id.as_deref() {
        let conflict_count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM sales WHERE transport_id = ? \
             AND (? IS NULL OR id <> ?)",
        )
        .bind(transport_id)
        .bind(current_sale_id)
        .bind(current_sale_id)
        .fetch_one(&mut **transaction)
        .await
        .map_err(|_| {
            workflow_error(
                "database_read_failed",
                "Could not validate the sale transport.",
            )
        })?;
        let transport_exists: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM transports WHERE id = ?")
                .bind(transport_id)
                .fetch_one(&mut **transaction)
                .await
                .map_err(|_| {
                    workflow_error(
                        "database_read_failed",
                        "Could not validate the sale transport.",
                    )
                })?;
        if transport_exists != 1 {
            return Err(workflow_error(
                "invalid_transport",
                "The selected transport no longer exists.",
            ));
        }
        if conflict_count != 0 {
            return Err(workflow_error(
                "transport_conflict",
                "The selected transport is already assigned to another sale.",
            ));
        }
    }

    for puppy in &request.puppies {
        let row = sqlx::query("SELECT status FROM dogs WHERE id = ?")
            .bind(&puppy.dog_id)
            .fetch_optional(&mut **transaction)
            .await
            .map_err(|_| {
                workflow_error(
                    "database_read_failed",
                    "Could not validate the selected puppies.",
                )
            })?
            .ok_or_else(|| {
                workflow_error(
                    "invalid_puppy",
                    "One of the selected puppies no longer exists.",
                )
            })?;
        let status: String = row.try_get("status").map_err(|_| {
            workflow_error(
                "database_read_failed",
                "Could not validate the selected puppies.",
            )
        })?;
        let belongs_to_current_sale = if let Some(sale_id) = current_sale_id {
            sqlx::query_scalar::<_, i64>(
                "SELECT COUNT(*) FROM sale_puppies WHERE sale_id = ? AND dog_id = ?",
            )
            .bind(sale_id)
            .bind(&puppy.dog_id)
            .fetch_one(&mut **transaction)
            .await
            .map_err(|_| {
                workflow_error(
                    "database_read_failed",
                    "Could not validate the selected puppies.",
                )
            })? == 1
        } else {
            false
        };
        if status != "active" && !(status == "sold" && belongs_to_current_sale) {
            return Err(workflow_error(
                "puppy_unavailable",
                "A selected puppy is no longer available for sale.",
            ));
        }

        let other_sale_count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM sale_puppies WHERE dog_id = ? AND (? IS NULL OR sale_id <> ?)",
        )
        .bind(&puppy.dog_id)
        .bind(current_sale_id)
        .bind(current_sale_id)
        .fetch_one(&mut **transaction)
        .await
        .map_err(|_| {
            workflow_error(
                "database_read_failed",
                "Could not validate the selected puppies.",
            )
        })?;
        if other_sale_count != 0 {
            return Err(workflow_error(
                "puppy_already_sold",
                "A selected puppy is already assigned to another sale.",
            ));
        }
    }

    Ok(())
}

async fn write_sale_row(
    transaction: &mut Transaction<'_, Sqlite>,
    sale_id: &str,
    request: &SaleWriteRequest,
    creating: bool,
) -> Result<(), SaleWorkflowError> {
    if creating {
        sqlx::query(
            "INSERT INTO sales (id, client_id, sale_date, price, deposit_amount, deposit_date, \
             contract_path, shipped_date, received_date, is_local_pickup, payment_status, \
             warranty_info, registration_transfer_date, transport_id, notes, created_at, updated_at) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, \
             strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
        )
        .bind(sale_id)
        .bind(&request.client_id)
        .bind(&request.sale_date)
        .bind(request.price)
        .bind(request.deposit_amount)
        .bind(&request.deposit_date)
        .bind(&request.contract_path)
        .bind(&request.shipped_date)
        .bind(&request.received_date)
        .bind(i64::from(request.is_local_pickup))
        .bind(&request.payment_status)
        .bind(&request.warranty_info)
        .bind(&request.registration_transfer_date)
        .bind(&request.transport_id)
        .bind(&request.notes)
        .execute(&mut **transaction)
        .await
        .map_err(|_| {
            workflow_error(
                "database_write_failed",
                "The sale record could not be created.",
            )
        })?;
    } else {
        let result = sqlx::query(
            "UPDATE sales SET client_id = ?, sale_date = ?, price = ?, deposit_amount = ?, \
             deposit_date = ?, contract_path = ?, shipped_date = ?, received_date = ?, \
             is_local_pickup = ?, payment_status = ?, warranty_info = ?, \
             registration_transfer_date = ?, transport_id = ?, notes = ?, \
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?",
        )
        .bind(&request.client_id)
        .bind(&request.sale_date)
        .bind(request.price)
        .bind(request.deposit_amount)
        .bind(&request.deposit_date)
        .bind(&request.contract_path)
        .bind(&request.shipped_date)
        .bind(&request.received_date)
        .bind(i64::from(request.is_local_pickup))
        .bind(&request.payment_status)
        .bind(&request.warranty_info)
        .bind(&request.registration_transfer_date)
        .bind(&request.transport_id)
        .bind(&request.notes)
        .bind(sale_id)
        .execute(&mut **transaction)
        .await
        .map_err(|_| {
            workflow_error(
                "database_write_failed",
                "The sale record could not be updated.",
            )
        })?;
        if result.rows_affected() != 1 {
            return Err(workflow_error(
                "sale_not_found",
                "The sale no longer exists.",
            ));
        }
    }
    Ok(())
}

async fn replace_sale_puppies(
    transaction: &mut Transaction<'_, Sqlite>,
    sale_id: &str,
    request: &SaleWriteRequest,
) -> Result<(), SaleWorkflowError> {
    let previous_dog_ids: Vec<String> =
        sqlx::query_scalar("SELECT dog_id FROM sale_puppies WHERE sale_id = ?")
            .bind(sale_id)
            .fetch_all(&mut **transaction)
            .await
            .map_err(|_| {
                workflow_error(
                    "database_read_failed",
                    "Could not read the existing puppy assignments.",
                )
            })?;

    sqlx::query("DELETE FROM sale_puppies WHERE sale_id = ?")
        .bind(sale_id)
        .execute(&mut **transaction)
        .await
        .map_err(|_| {
            workflow_error(
                "database_write_failed",
                "Could not replace the puppy assignments.",
            )
        })?;

    for puppy in &request.puppies {
        let junction_id = next_id(transaction).await?;
        sqlx::query(
            "INSERT INTO sale_puppies (id, sale_id, dog_id, price, created_at) \
             VALUES (?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
        )
        .bind(junction_id)
        .bind(sale_id)
        .bind(&puppy.dog_id)
        .bind(puppy.price)
        .execute(&mut **transaction)
        .await
        .map_err(|_| {
            workflow_error(
                "database_write_failed",
                "Could not save the puppy assignments.",
            )
        })?;
        sqlx::query(
            "UPDATE dogs SET status = 'sold', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') \
             WHERE id = ?",
        )
        .bind(&puppy.dog_id)
        .execute(&mut **transaction)
        .await
        .map_err(|_| {
            workflow_error(
                "database_write_failed",
                "Could not update the puppy sale status.",
            )
        })?;
    }

    let selected_ids: HashSet<&str> = request
        .puppies
        .iter()
        .map(|puppy| puppy.dog_id.as_str())
        .collect();
    for dog_id in previous_dog_ids {
        if !selected_ids.contains(dog_id.as_str()) {
            sqlx::query(
                "UPDATE dogs SET status = 'active', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') \
                 WHERE id = ? AND status = 'sold' \
                 AND NOT EXISTS (SELECT 1 FROM sale_puppies WHERE dog_id = ?)",
            )
            .bind(&dog_id)
            .bind(&dog_id)
            .execute(&mut **transaction)
            .await
            .map_err(|_| {
                workflow_error(
                    "database_write_failed",
                    "Could not restore a removed puppy's status.",
                )
            })?;
        }
    }
    Ok(())
}

async fn convert_interest(
    transaction: &mut Transaction<'_, Sqlite>,
    interest_id: &str,
    sale_id: &str,
    request: &SaleWriteRequest,
) -> Result<(), SaleWorkflowError> {
    validate_identifier(interest_id, "Interest")?;
    let row = sqlx::query(
        "SELECT client_id, dog_id, status, converted_to_sale_id FROM client_interests WHERE id = ?",
    )
    .bind(interest_id)
    .fetch_optional(&mut **transaction)
    .await
    .map_err(|_| {
        workflow_error(
            "database_read_failed",
            "Could not validate the client interest.",
        )
    })?
    .ok_or_else(|| {
        workflow_error(
            "interest_not_found",
            "The client interest no longer exists.",
        )
    })?;
    let interest_client_id: String = row.try_get("client_id").map_err(|_| {
        workflow_error(
            "database_read_failed",
            "Could not validate the client interest.",
        )
    })?;
    let interest_dog_id: String = row.try_get("dog_id").map_err(|_| {
        workflow_error(
            "database_read_failed",
            "Could not validate the client interest.",
        )
    })?;
    let status: String = row.try_get("status").map_err(|_| {
        workflow_error(
            "database_read_failed",
            "Could not validate the client interest.",
        )
    })?;
    let converted_sale_id: Option<String> = row.try_get("converted_to_sale_id").map_err(|_| {
        workflow_error(
            "database_read_failed",
            "Could not validate the client interest.",
        )
    })?;
    if status == "converted" || converted_sale_id.is_some() {
        return Err(workflow_error(
            "interest_already_converted",
            "The client interest has already been converted.",
        ));
    }
    if interest_client_id != request.client_id
        || !request
            .puppies
            .iter()
            .any(|puppy| puppy.dog_id == interest_dog_id)
    {
        return Err(workflow_error(
            "interest_mismatch",
            "The sale must use the interest's client and include its puppy.",
        ));
    }

    let result = sqlx::query(
        "UPDATE client_interests SET status = 'converted', converted_to_sale_id = ?, \
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') \
         WHERE id = ? AND status <> 'converted' AND converted_to_sale_id IS NULL",
    )
    .bind(sale_id)
    .bind(interest_id)
    .execute(&mut **transaction)
    .await
    .map_err(|_| {
        workflow_error(
            "database_write_failed",
            "Could not convert the client interest.",
        )
    })?;
    if result.rows_affected() != 1 {
        return Err(workflow_error(
            "interest_conflict",
            "The client interest changed before it could be converted.",
        ));
    }
    Ok(())
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum SaleFailpoint {
    AfterSaleRow,
}

async fn write_sale_core(
    pool: &SqlitePool,
    sale_id: Option<&str>,
    interest_id: Option<&str>,
    request: &SaleWriteRequest,
    failpoint: Option<SaleFailpoint>,
) -> Result<String, SaleWorkflowError> {
    validate_request(request)?;
    let mut connection = pool
        .acquire()
        .await
        .map_err(|_| workflow_error("database_unavailable", "Could not open the sale database."))?;
    configure_connection(&mut connection).await?;
    let mut transaction = begin_write(&mut connection).await?;

    let operation: Result<String, SaleWorkflowError> = async {
        validate_relations(&mut transaction, request, sale_id).await?;
        let id = match sale_id {
            Some(id) => id.to_owned(),
            None => next_id(&mut transaction).await?,
        };
        write_sale_row(&mut transaction, &id, request, sale_id.is_none()).await?;
        if failpoint == Some(SaleFailpoint::AfterSaleRow) {
            return Err(workflow_error(
                "injected_failure",
                "Injected sale workflow failure.",
            ));
        }
        replace_sale_puppies(&mut transaction, &id, request).await?;
        if let Some(interest_id) = interest_id {
            convert_interest(&mut transaction, interest_id, &id, request).await?;
        }
        Ok(id)
    }
    .await;

    match operation {
        Ok(id) => match transaction.commit().await {
            Ok(()) => Ok(id),
            Err(_) => {
                connection.close_on_drop();
                Err(workflow_error(
                    "database_commit_failed",
                    "The sale could not be committed. No success was reported.",
                ))
            }
        },
        Err(mut error) => {
            if transaction.rollback().await.is_err() {
                connection.close_on_drop();
                error.message = format!(
                    "{} The rollback could not be confirmed; the database connection was retired.",
                    error.message
                );
            }
            Err(error)
        }
    }
}

async fn delete_sale_core(pool: &SqlitePool, sale_id: &str) -> Result<bool, SaleWorkflowError> {
    validate_identifier(sale_id, "Sale")?;
    let mut connection = pool
        .acquire()
        .await
        .map_err(|_| workflow_error("database_unavailable", "Could not open the sale database."))?;
    configure_connection(&mut connection).await?;
    let mut transaction = begin_write(&mut connection).await?;
    let operation: Result<bool, SaleWorkflowError> = async {
        let dog_ids: Vec<String> =
            sqlx::query_scalar("SELECT dog_id FROM sale_puppies WHERE sale_id = ?")
                .bind(sale_id)
                .fetch_all(&mut *transaction)
                .await
                .map_err(|_| {
                    workflow_error(
                        "database_read_failed",
                        "Could not read the sale assignments.",
                    )
                })?;
        sqlx::query(
            "UPDATE client_interests SET status = 'interested', converted_to_sale_id = NULL, \
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE converted_to_sale_id = ?",
        )
        .bind(sale_id)
        .execute(&mut *transaction)
        .await
        .map_err(|_| {
            workflow_error(
                "database_write_failed",
                "Could not restore linked client interests.",
            )
        })?;
        sqlx::query(
            "UPDATE waitlist_entries SET status = 'waiting', converted_sale_id = NULL, \
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE converted_sale_id = ?",
        )
        .bind(sale_id)
        .execute(&mut *transaction)
        .await
        .map_err(|_| {
            workflow_error(
                "database_write_failed",
                "Could not restore linked waitlist entries.",
            )
        })?;
        let deleted = sqlx::query("DELETE FROM sales WHERE id = ?")
            .bind(sale_id)
            .execute(&mut *transaction)
            .await
            .map_err(|_| {
                workflow_error(
                    "database_write_failed",
                    "The sale record could not be deleted.",
                )
            })?
            .rows_affected()
            == 1;
        for dog_id in dog_ids {
            sqlx::query(
                "UPDATE dogs SET status = 'active', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') \
                 WHERE id = ? AND status = 'sold' \
                 AND NOT EXISTS (SELECT 1 FROM sale_puppies WHERE dog_id = ?)",
            )
            .bind(&dog_id)
            .bind(&dog_id)
            .execute(&mut *transaction)
            .await
            .map_err(|_| {
                workflow_error(
                    "database_write_failed",
                    "Could not restore a deleted sale's puppy status.",
                )
            })?;
        }
        Ok(deleted)
    }
    .await;

    match operation {
        Ok(deleted) => match transaction.commit().await {
            Ok(()) => Ok(deleted),
            Err(_) => {
                connection.close_on_drop();
                Err(workflow_error(
                    "database_commit_failed",
                    "The sale deletion could not be committed.",
                ))
            }
        },
        Err(mut error) => {
            if transaction.rollback().await.is_err() {
                connection.close_on_drop();
                error.message = format!(
                    "{} The rollback could not be confirmed; the database connection was retired.",
                    error.message
                );
            }
            Err(error)
        }
    }
}

async fn app_pool(app: tauri::AppHandle) -> Result<SqlitePool, SaleWorkflowError> {
    crate::database_integrity::loaded_sqlite_pool(app)
        .await
        .map_err(|_| workflow_error("database_unavailable", "The SQLite database is not loaded."))
}

#[tauri::command]
pub async fn create_sale_atomic(
    app: tauri::AppHandle,
    request: SaleWriteRequest,
) -> Result<String, SaleWorkflowError> {
    let pool = app_pool(app).await?;
    write_sale_core(&pool, None, None, &request, None).await
}

#[tauri::command]
pub async fn update_sale_atomic(
    app: tauri::AppHandle,
    sale_id: String,
    request: SaleWriteRequest,
) -> Result<String, SaleWorkflowError> {
    validate_identifier(&sale_id, "Sale")?;
    let pool = app_pool(app).await?;
    write_sale_core(&pool, Some(&sale_id), None, &request, None).await
}

#[tauri::command]
pub async fn convert_interest_to_sale_atomic(
    app: tauri::AppHandle,
    interest_id: String,
    request: SaleWriteRequest,
) -> Result<String, SaleWorkflowError> {
    let pool = app_pool(app).await?;
    write_sale_core(&pool, None, Some(&interest_id), &request, None).await
}

#[tauri::command]
pub async fn delete_sale_atomic(
    app: tauri::AppHandle,
    sale_id: String,
) -> Result<bool, SaleWorkflowError> {
    let pool = app_pool(app).await?;
    delete_sale_core(&pool, &sale_id).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;

    const TEST_SCHEMA: &str = r#"
        PRAGMA foreign_keys = ON;
        CREATE TABLE clients (id TEXT PRIMARY KEY);
        CREATE TABLE transports (id TEXT PRIMARY KEY);
        CREATE TABLE dogs (
          id TEXT PRIMARY KEY,
          status TEXT NOT NULL,
          updated_at TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE sales (
          id TEXT PRIMARY KEY,
          client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
          sale_date TEXT NOT NULL,
          price REAL NOT NULL,
          deposit_amount REAL,
          deposit_date TEXT,
          contract_path TEXT,
          shipped_date TEXT,
          received_date TEXT,
          is_local_pickup INTEGER NOT NULL,
          payment_status TEXT NOT NULL,
          warranty_info TEXT,
          registration_transfer_date TEXT,
          transport_id TEXT UNIQUE REFERENCES transports(id) ON DELETE SET NULL,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE sale_puppies (
          id TEXT PRIMARY KEY,
          sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
          dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
          price REAL NOT NULL,
          created_at TEXT NOT NULL,
          UNIQUE(sale_id, dog_id)
        );
        CREATE TABLE client_interests (
          id TEXT PRIMARY KEY,
          client_id TEXT NOT NULL REFERENCES clients(id),
          dog_id TEXT NOT NULL REFERENCES dogs(id),
          status TEXT NOT NULL,
          converted_to_sale_id TEXT REFERENCES sales(id) ON DELETE SET NULL,
          updated_at TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE waitlist_entries (
          id TEXT PRIMARY KEY,
          status TEXT NOT NULL,
          converted_sale_id TEXT REFERENCES sales(id) ON DELETE SET NULL,
          updated_at TEXT NOT NULL DEFAULT ''
        );
    "#;

    async fn test_pool() -> SqlitePool {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("test database should open");
        sqlx::raw_sql(TEST_SCHEMA)
            .execute(&pool)
            .await
            .expect("test schema should apply");
        sqlx::query("INSERT INTO clients (id) VALUES ('client-1')")
            .execute(&pool)
            .await
            .expect("client fixture");
        for dog_id in ["dog-1", "dog-2", "dog-3"] {
            sqlx::query("INSERT INTO dogs (id, status) VALUES (?, 'active')")
                .bind(dog_id)
                .execute(&pool)
                .await
                .expect("dog fixture");
        }
        pool
    }

    fn request(dog_ids: &[&str]) -> SaleWriteRequest {
        let puppies: Vec<SalePuppyInput> = dog_ids
            .iter()
            .map(|dog_id| SalePuppyInput {
                dog_id: (*dog_id).to_owned(),
                price: 1_000.0,
            })
            .collect();
        SaleWriteRequest {
            client_id: "client-1".to_owned(),
            sale_date: "2026-08-22T12:00:00.000Z".to_owned(),
            price: puppies.iter().map(|puppy| puppy.price).sum(),
            deposit_amount: Some(500.0),
            deposit_date: None,
            contract_path: None,
            shipped_date: None,
            received_date: None,
            is_local_pickup: true,
            payment_status: "deposit_only".to_owned(),
            warranty_info: None,
            registration_transfer_date: None,
            transport_id: None,
            notes: None,
            puppies,
        }
    }

    async fn scalar(pool: &SqlitePool, sql: &str) -> i64 {
        sqlx::query_scalar(sql)
            .fetch_one(pool)
            .await
            .expect("scalar query")
    }

    #[tokio::test]
    async fn create_commits_sale_assignments_and_statuses_together() {
        let pool = test_pool().await;
        let sale_id = write_sale_core(&pool, None, None, &request(&["dog-1", "dog-2"]), None)
            .await
            .expect("sale should commit");

        assert_eq!(scalar(&pool, "SELECT COUNT(*) FROM sales").await, 1);
        assert_eq!(scalar(&pool, "SELECT COUNT(*) FROM sale_puppies").await, 2);
        let sold: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM dogs WHERE id IN ('dog-1', 'dog-2') AND status = 'sold'",
        )
        .fetch_one(&pool)
        .await
        .expect("sold status count");
        assert_eq!(sold, 2);
        assert!(!sale_id.is_empty());
    }

    #[tokio::test]
    async fn injected_failure_rolls_back_every_sale_write() {
        let pool = test_pool().await;
        let error = write_sale_core(
            &pool,
            None,
            None,
            &request(&["dog-1"]),
            Some(SaleFailpoint::AfterSaleRow),
        )
        .await
        .expect_err("injected failure should roll back");

        assert_eq!(error.code, "injected_failure");
        assert_eq!(scalar(&pool, "SELECT COUNT(*) FROM sales").await, 0);
        assert_eq!(scalar(&pool, "SELECT COUNT(*) FROM sale_puppies").await, 0);
        assert_eq!(
            scalar(&pool, "SELECT COUNT(*) FROM dogs WHERE status = 'sold'").await,
            0
        );
    }

    #[tokio::test]
    async fn update_replaces_assignments_and_restores_removed_puppies() {
        let pool = test_pool().await;
        let sale_id = write_sale_core(&pool, None, None, &request(&["dog-1", "dog-3"]), None)
            .await
            .expect("initial sale");
        sqlx::query("UPDATE dogs SET status = 'retired' WHERE id = 'dog-3'")
            .execute(&pool)
            .await
            .expect("later lifecycle status");
        write_sale_core(&pool, Some(&sale_id), None, &request(&["dog-2"]), None)
            .await
            .expect("sale update");

        let dog_one_status: String =
            sqlx::query_scalar("SELECT status FROM dogs WHERE id = 'dog-1'")
                .fetch_one(&pool)
                .await
                .expect("dog one status");
        let dog_two_status: String =
            sqlx::query_scalar("SELECT status FROM dogs WHERE id = 'dog-2'")
                .fetch_one(&pool)
                .await
                .expect("dog two status");
        let dog_three_status: String =
            sqlx::query_scalar("SELECT status FROM dogs WHERE id = 'dog-3'")
                .fetch_one(&pool)
                .await
                .expect("dog three status");
        assert_eq!(dog_one_status, "active");
        assert_eq!(dog_two_status, "sold");
        assert_eq!(dog_three_status, "retired");
        let assigned: String =
            sqlx::query_scalar("SELECT dog_id FROM sale_puppies WHERE sale_id = ?")
                .bind(sale_id)
                .fetch_one(&pool)
                .await
                .expect("replacement assignment");
        assert_eq!(assigned, "dog-2");
    }

    #[tokio::test]
    async fn interest_conversion_is_part_of_the_sale_transaction() {
        let pool = test_pool().await;
        sqlx::query(
            "INSERT INTO client_interests (id, client_id, dog_id, status) \
             VALUES ('interest-1', 'client-1', 'dog-1', 'interested')",
        )
        .execute(&pool)
        .await
        .expect("interest fixture");

        let sale_id = write_sale_core(&pool, None, Some("interest-1"), &request(&["dog-1"]), None)
            .await
            .expect("conversion should commit");
        let converted_sale_id: String = sqlx::query_scalar(
            "SELECT converted_to_sale_id FROM client_interests WHERE id = 'interest-1'",
        )
        .fetch_one(&pool)
        .await
        .expect("converted interest");
        assert_eq!(converted_sale_id, sale_id);
    }

    #[tokio::test]
    async fn unavailable_or_duplicate_puppies_are_rejected_without_writes() {
        let pool = test_pool().await;
        let duplicate = request(&["dog-1", "dog-1"]);
        assert_eq!(
            write_sale_core(&pool, None, None, &duplicate, None)
                .await
                .expect_err("duplicates must fail")
                .code,
            "duplicate_puppy"
        );
        sqlx::query("UPDATE dogs SET status = 'deceased' WHERE id = 'dog-2'")
            .execute(&pool)
            .await
            .expect("status fixture");
        assert_eq!(
            write_sale_core(&pool, None, None, &request(&["dog-2"]), None)
                .await
                .expect_err("unavailable puppy must fail")
                .code,
            "puppy_unavailable"
        );
        assert_eq!(scalar(&pool, "SELECT COUNT(*) FROM sales").await, 0);
    }

    #[tokio::test]
    async fn delete_restores_puppy_and_interest_state() {
        let pool = test_pool().await;
        sqlx::query(
            "INSERT INTO client_interests (id, client_id, dog_id, status) \
             VALUES ('interest-1', 'client-1', 'dog-1', 'interested')",
        )
        .execute(&pool)
        .await
        .expect("interest fixture");
        let sale_id = write_sale_core(
            &pool,
            None,
            Some("interest-1"),
            &request(&["dog-1", "dog-2"]),
            None,
        )
        .await
        .expect("sale conversion");
        sqlx::query("UPDATE dogs SET status = 'deceased' WHERE id = 'dog-2'")
            .execute(&pool)
            .await
            .expect("later lifecycle status");

        assert!(delete_sale_core(&pool, &sale_id)
            .await
            .expect("delete should commit"));
        let dog_status: String = sqlx::query_scalar("SELECT status FROM dogs WHERE id = 'dog-1'")
            .fetch_one(&pool)
            .await
            .expect("dog status");
        let deceased_status: String =
            sqlx::query_scalar("SELECT status FROM dogs WHERE id = 'dog-2'")
                .fetch_one(&pool)
                .await
                .expect("deceased dog status");
        let interest_status: String =
            sqlx::query_scalar("SELECT status FROM client_interests WHERE id = 'interest-1'")
                .fetch_one(&pool)
                .await
                .expect("interest status");
        assert_eq!(dog_status, "active");
        assert_eq!(deceased_status, "deceased");
        assert_eq!(interest_status, "interested");
        assert_eq!(scalar(&pool, "SELECT COUNT(*) FROM sales").await, 0);
    }
}

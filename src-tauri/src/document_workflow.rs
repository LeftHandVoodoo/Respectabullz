use serde::{Deserialize, Serialize};
use sqlx::{
    pool::PoolConnection, Connection, Row, Sqlite, SqliteConnection, SqlitePool, Transaction,
};
use std::collections::HashSet;
use std::fs;
use std::io::Read;
use std::path::{Component, Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;
use tauri_plugin_fs::FsExt;
use tauri_plugin_sql::{DbInstances, DbPool};

use crate::managed_paths::{ensure_managed_directory, ensure_managed_grandchild};

const DATABASE_URL: &str = "sqlite:respectabullz.db";
const SUPPORTED_EXTENSIONS: &[&str] = &[
    "jpg", "jpeg", "png", "gif", "webp", "pdf", "doc", "docx", "xls", "xlsx",
];
const MAX_DOCUMENT_BYTES: u64 = 100 * 1024 * 1024;
static UNIQUE_COUNTER: AtomicU64 = AtomicU64::new(0);

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentWorkflowError {
    code: String,
    message: String,
    cleanup_residue: Option<String>,
}

impl DocumentWorkflowError {
    fn new(code: &str, message: impl Into<String>) -> Self {
        Self {
            code: code.to_string(),
            message: message.into(),
            cleanup_residue: None,
        }
    }

    fn with_residue(mut self, residue: String) -> Self {
        self.cleanup_residue = Some(residue);
        self
    }

    fn for_ipc(mut self, operation: &str) -> Self {
        eprintln!(
            "{}",
            serde_json::json!({
                "level": "error",
                "event": "document_workflow_failed",
                "operation": operation,
                "code": self.code,
                "detail": self.message,
                "cleanupResidue": self.cleanup_residue,
            })
        );

        self.message = match self.code.as_str() {
            "source_not_authorized" => {
                "The document must be selected through the native file dialog before upload."
            }
            "unsupported_file" => "The selected file type is not supported.",
            "signature_mismatch" => "The selected file contents do not match its extension.",
            "document_not_found" => "The managed document could not be found.",
            "invalid_filename" => "The stored document filename is invalid.",
            _ => "The document operation could not be completed.",
        }
        .to_string();
        self
    }
}

#[derive(Clone, Copy, Debug, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DocumentEntityType {
    Dog,
    Litter,
    Expense,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateDocumentRequest {
    source_path: String,
    entity_type: DocumentEntityType,
    entity_id: String,
    notes: Option<String>,
    #[serde(default)]
    tag_ids: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDocumentRequest {
    document_id: String,
    notes: Option<String>,
    #[serde(default)]
    tag_ids: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReplaceDocumentTagsRequest {
    document_id: String,
    #[serde(default)]
    tag_ids: Vec<String>,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DocumentRecord {
    id: String,
    filename: String,
    original_name: String,
    file_path: String,
    mime_type: String,
    file_size: i64,
    notes: Option<String>,
    uploaded_at: String,
    updated_at: String,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DeleteDocumentResult {
    deleted: bool,
    cleanup_residue: Option<String>,
}

#[derive(Debug, Default, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ReconciliationReport {
    scanned: usize,
    restored: usize,
    removed_staging: usize,
    removed_tombstones: usize,
    quarantined_orphans: usize,
    failures: usize,
    truncated: bool,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[cfg_attr(not(test), allow(dead_code))]
enum CreateFailpoint {
    BeforePromotion,
    AfterDatabaseWrites,
    AfterPromotion,
    AfterPromotionCleanupFailure,
    CommitAmbiguous,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum UpdateFailpoint {
    AfterTagRemoval,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum DeleteFailpoint {
    AfterQuarantine,
    BeforeCommit,
    CommitAmbiguous,
    CleanupFailure,
    RestoreFailure,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum ReconcileFailpoint {
    FileOperationFailure,
}

fn workflow_error(code: &str, message: impl Into<String>) -> DocumentWorkflowError {
    DocumentWorkflowError::new(code, message)
}

fn ipc_result<T>(
    operation: &str,
    result: Result<T, DocumentWorkflowError>,
) -> Result<T, DocumentWorkflowError> {
    result.map_err(|error| error.for_ipc(operation))
}

fn log_residue(operation: &str, residue: &str) {
    eprintln!(
        "{}",
        serde_json::json!({
            "level": "error",
            "event": "document_workflow_cleanup_residue",
            "operation": operation,
            "residue": residue,
        })
    );
}

fn unique_token() -> String {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let counter = UNIQUE_COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("{nanos}-{}-{counter}", std::process::id())
}

fn stored_filename(extension: &str) -> String {
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let counter = UNIQUE_COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("{millis}-{}{counter}.{extension}", std::process::id())
}

fn database_id(prefix: &str) -> String {
    format!("{prefix}-{}", unique_token())
}

fn supported_extension(path: &Path) -> Result<String, DocumentWorkflowError> {
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .map(str::to_ascii_lowercase)
        .ok_or_else(|| {
            workflow_error(
                "unsupported_file",
                "The selected file has no supported extension.",
            )
        })?;

    if SUPPORTED_EXTENSIONS.contains(&extension.as_str()) {
        Ok(extension)
    } else {
        Err(workflow_error(
            "unsupported_file",
            "The selected file type is not supported.",
        ))
    }
}

fn mime_type(extension: &str) -> &'static str {
    match extension {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "pdf" => "application/pdf",
        "doc" => "application/msword",
        "docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "xls" => "application/vnd.ms-excel",
        "xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        _ => "application/octet-stream",
    }
}

fn validate_file_signature(path: &Path, extension: &str) -> Result<(), DocumentWorkflowError> {
    let mut file = fs::File::open(path).map_err(|error| {
        workflow_error(
            "source_read_failed",
            format!("Could not inspect the selected document: {error}"),
        )
    })?;
    let mut header = [0_u8; 16];
    let read = file.read(&mut header).map_err(|error| {
        workflow_error(
            "source_read_failed",
            format!("Could not inspect the selected document: {error}"),
        )
    })?;
    let header = &header[..read];

    let starts_with_any = |signatures: &[&[u8]]| {
        signatures
            .iter()
            .any(|signature| header.starts_with(signature))
    };
    let valid = match extension {
        "pdf" => header.starts_with(b"%PDF-"),
        "png" => header.starts_with(&[0x89, b'P', b'N', b'G', 0x0d, 0x0a, 0x1a, 0x0a]),
        "jpg" | "jpeg" => header.starts_with(&[0xff, 0xd8, 0xff]),
        "gif" => starts_with_any(&[b"GIF87a", b"GIF89a"]),
        "webp" => header.len() >= 12 && header.starts_with(b"RIFF") && &header[8..12] == b"WEBP",
        "docx" | "xlsx" => starts_with_any(&[b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08"]),
        // Legacy Word and Excel files use the OLE Compound File signature.
        "doc" | "xls" => header.starts_with(&[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
        _ => false,
    };

    if valid {
        Ok(())
    } else {
        Err(workflow_error(
            "signature_mismatch",
            "The selected file contents do not match its extension.",
        ))
    }
}

fn unique_tag_ids(tag_ids: &[String]) -> Vec<&str> {
    let mut seen = HashSet::new();
    tag_ids
        .iter()
        .map(String::as_str)
        .filter(|id| seen.insert(*id))
        .collect()
}

fn document_directories(root: &Path) -> Result<(PathBuf, PathBuf, PathBuf), DocumentWorkflowError> {
    let documents = ensure_managed_directory(root, "documents").map_err(|error| {
        workflow_error(
            "file_prepare_failed",
            format!("Could not validate managed document storage: {error}"),
        )
    })?;
    let staging = ensure_managed_grandchild(&documents, ".staging").map_err(|error| {
        workflow_error(
            "file_prepare_failed",
            format!("Could not validate document staging: {error}"),
        )
    })?;
    let quarantine = ensure_managed_grandchild(&documents, ".quarantine").map_err(|error| {
        workflow_error(
            "file_prepare_failed",
            format!("Could not validate document quarantine: {error}"),
        )
    })?;
    Ok((documents, staging, quarantine))
}

async fn configure_connection(
    connection: &mut SqliteConnection,
) -> Result<(), DocumentWorkflowError> {
    sqlx::query("PRAGMA foreign_keys = ON")
        .execute(&mut *connection)
        .await
        .map_err(|error| {
            workflow_error(
                "database_unavailable",
                format!("Could not enable database integrity checks: {error}"),
            )
        })?;
    let enabled: i64 = sqlx::query_scalar("PRAGMA foreign_keys")
        .fetch_one(&mut *connection)
        .await
        .map_err(|error| {
            workflow_error(
                "database_unavailable",
                format!("Could not verify database integrity checks: {error}"),
            )
        })?;
    if enabled != 1 {
        return Err(workflow_error(
            "database_unavailable",
            "Database foreign-key enforcement is disabled.",
        ));
    }
    sqlx::query("PRAGMA busy_timeout = 5000")
        .execute(&mut *connection)
        .await
        .map_err(|error| {
            workflow_error(
                "database_unavailable",
                format!("Could not configure the database connection: {error}"),
            )
        })?;
    Ok(())
}

async fn begin_write<'a>(
    connection: &'a mut PoolConnection<Sqlite>,
) -> Result<Transaction<'a, Sqlite>, DocumentWorkflowError> {
    (**connection)
        .begin_with("BEGIN IMMEDIATE")
        .await
        .map_err(|error| {
            workflow_error(
                "database_begin_failed",
                format!("Could not start the document transaction: {error}"),
            )
        })
}

async fn rollback(transaction: Transaction<'_, Sqlite>, error: &mut DocumentWorkflowError) -> bool {
    if let Err(rollback_error) = transaction.rollback().await {
        error.message = format!("{} Rollback also failed: {rollback_error}", error.message);
        return false;
    }
    true
}

fn retire_after_commit_failure(
    connection: &mut PoolConnection<Sqlite>,
    action: &str,
    error: sqlx::Error,
) -> DocumentWorkflowError {
    connection.close_on_drop();
    workflow_error(
        "database_commit_failed",
        format!("{action}: {error}. The SQLite connection was retired."),
    )
}

fn cleanup_failed_create(
    operation: &str,
    cleanup_path: &Path,
    residue: String,
    inject_failure: bool,
    mut error: DocumentWorkflowError,
) -> DocumentWorkflowError {
    let cleanup_result = if inject_failure {
        Err(std::io::Error::new(
            std::io::ErrorKind::PermissionDenied,
            "injected cleanup failure",
        ))
    } else if cleanup_path.exists() {
        fs::remove_file(cleanup_path)
    } else {
        Ok(())
    };

    if let Err(cleanup_error) = cleanup_result {
        error.message = format!(
            "{} Cleanup could not remove the recoverable residue: {cleanup_error}",
            error.message
        );
        log_residue(operation, &residue);
        error = error.with_residue(residue);
    }
    error
}

async fn fetch_document(
    connection: &mut SqliteConnection,
    document_id: &str,
) -> Result<Option<DocumentRecord>, DocumentWorkflowError> {
    let row = sqlx::query(
        "SELECT id, filename, original_name, file_path, mime_type, file_size, notes, uploaded_at, updated_at FROM documents WHERE id = ?",
    )
    .bind(document_id)
    .fetch_optional(&mut *connection)
    .await
    .map_err(|error| workflow_error("database_read_failed", format!("Could not read the document record: {error}")))?;

    row.map(|row| {
        Ok(DocumentRecord {
            id: row
                .try_get("id")
                .map_err(|error| workflow_error("database_read_failed", error.to_string()))?,
            filename: row
                .try_get("filename")
                .map_err(|error| workflow_error("database_read_failed", error.to_string()))?,
            original_name: row
                .try_get("original_name")
                .map_err(|error| workflow_error("database_read_failed", error.to_string()))?,
            file_path: row
                .try_get("file_path")
                .map_err(|error| workflow_error("database_read_failed", error.to_string()))?,
            mime_type: row
                .try_get("mime_type")
                .map_err(|error| workflow_error("database_read_failed", error.to_string()))?,
            file_size: row
                .try_get("file_size")
                .map_err(|error| workflow_error("database_read_failed", error.to_string()))?,
            notes: row
                .try_get("notes")
                .map_err(|error| workflow_error("database_read_failed", error.to_string()))?,
            uploaded_at: row
                .try_get("uploaded_at")
                .map_err(|error| workflow_error("database_read_failed", error.to_string()))?,
            updated_at: row
                .try_get("updated_at")
                .map_err(|error| workflow_error("database_read_failed", error.to_string()))?,
        })
    })
    .transpose()
}

async fn insert_tags(
    connection: &mut SqliteConnection,
    document_id: &str,
    tag_ids: &[String],
) -> Result<(), DocumentWorkflowError> {
    for tag_id in unique_tag_ids(tag_ids) {
        sqlx::query(
            "INSERT INTO document_tag_links (id, document_id, tag_id, created_at) VALUES (?, ?, ?, datetime('now'))",
        )
        .bind(database_id("document-tag"))
        .bind(document_id)
        .bind(tag_id)
        .execute(&mut *connection)
        .await
        .map_err(|error| workflow_error("database_write_failed", format!("Could not assign document tags: {error}")))?;
    }
    Ok(())
}

async fn insert_entity_link(
    connection: &mut SqliteConnection,
    document_id: &str,
    entity_type: DocumentEntityType,
    entity_id: &str,
) -> Result<(), DocumentWorkflowError> {
    let statement = match entity_type {
        DocumentEntityType::Dog => {
            "INSERT INTO dog_documents (id, dog_id, document_id, created_at) VALUES (?, ?, ?, datetime('now'))"
        }
        DocumentEntityType::Litter => {
            "INSERT INTO litter_documents (id, litter_id, document_id, created_at) VALUES (?, ?, ?, datetime('now'))"
        }
        DocumentEntityType::Expense => {
            "INSERT INTO expense_documents (id, expense_id, document_id, created_at) VALUES (?, ?, ?, datetime('now'))"
        }
    };

    sqlx::query(statement)
        .bind(database_id("document-link"))
        .bind(entity_id)
        .bind(document_id)
        .execute(&mut *connection)
        .await
        .map_err(|error| {
            workflow_error(
                "database_write_failed",
                format!("Could not link the document to its record: {error}"),
            )
        })?;
    Ok(())
}

async fn create_document_core(
    pool: &SqlitePool,
    app_data_root: &Path,
    request: &CreateDocumentRequest,
    failpoint: Option<CreateFailpoint>,
) -> Result<DocumentRecord, DocumentWorkflowError> {
    let source = Path::new(&request.source_path);
    if !source.is_absolute() {
        return Err(workflow_error(
            "source_not_authorized",
            "The selected document path must be absolute.",
        ));
    }
    let source_metadata = fs::metadata(source).map_err(|error| {
        workflow_error(
            "source_read_failed",
            format!("Could not read the selected document: {error}"),
        )
    })?;
    if !source_metadata.is_file() {
        return Err(workflow_error(
            "source_read_failed",
            "The selected document is not a regular file.",
        ));
    }
    if source_metadata.len() > MAX_DOCUMENT_BYTES {
        return Err(workflow_error(
            "document_too_large",
            "The selected document exceeds the 100 MB upload limit.",
        ));
    }
    let original_name = source
        .file_name()
        .and_then(|value| value.to_str())
        .filter(|value| !value.is_empty())
        .ok_or_else(|| {
            workflow_error(
                "source_read_failed",
                "The selected document name is invalid.",
            )
        })?
        .to_string();
    let extension = supported_extension(source)?;
    validate_file_signature(source, &extension)?;
    let filename = stored_filename(&extension);
    let (documents, staging, _) = document_directories(app_data_root)?;
    let final_path = documents.join(&filename);
    let stage_name = format!("{filename}.stage-{}", unique_token());
    let stage_path = staging.join(&stage_name);
    let stage_residue = format!("documents/.staging/{stage_name}");
    let final_residue = format!("documents/{filename}");

    fs::copy(source, &stage_path).map_err(|error| {
        cleanup_failed_create(
            "create",
            &stage_path,
            stage_residue.clone(),
            false,
            workflow_error(
                "source_copy_failed",
                format!("Could not stage the selected document: {error}"),
            ),
        )
    })?;
    fs::OpenOptions::new()
        .write(true)
        .open(&stage_path)
        .and_then(|file| file.sync_all())
        .map_err(|error| {
            cleanup_failed_create(
                "create",
                &stage_path,
                stage_residue.clone(),
                false,
                workflow_error(
                    "source_copy_failed",
                    format!("Could not flush the staged document: {error}"),
                ),
            )
        })?;

    // The user-selected source can change between the initial metadata check
    // and the copy. Trust only the staged bytes that will actually be managed.
    let staged_metadata = fs::metadata(&stage_path).map_err(|error| {
        cleanup_failed_create(
            "create",
            &stage_path,
            stage_residue.clone(),
            false,
            workflow_error(
                "source_copy_failed",
                format!("Could not verify the staged document: {error}"),
            ),
        )
    })?;
    if staged_metadata.len() > MAX_DOCUMENT_BYTES {
        return Err(cleanup_failed_create(
            "create",
            &stage_path,
            stage_residue,
            false,
            workflow_error(
                "file_too_large",
                "The selected document exceeds the 100 MB limit.",
            ),
        ));
    }
    validate_file_signature(&stage_path, &extension).map_err(|error| {
        cleanup_failed_create("create", &stage_path, stage_residue.clone(), false, error)
    })?;

    if failpoint == Some(CreateFailpoint::BeforePromotion) {
        return Err(cleanup_failed_create(
            "create",
            &stage_path,
            stage_residue,
            false,
            workflow_error(
                "file_promotion_failed",
                "Injected failure before file promotion.",
            ),
        ));
    }

    let mut connection = pool.acquire().await.map_err(|error| {
        cleanup_failed_create(
            "create",
            &stage_path,
            stage_residue.clone(),
            false,
            workflow_error(
                "database_unavailable",
                format!("Could not acquire the document database: {error}"),
            ),
        )
    })?;
    configure_connection(&mut connection)
        .await
        .map_err(|error| {
            cleanup_failed_create("create", &stage_path, stage_residue.clone(), false, error)
        })?;
    let mut transaction = begin_write(&mut connection).await.map_err(|error| {
        cleanup_failed_create("create", &stage_path, stage_residue.clone(), false, error)
    })?;

    let document_id = database_id("document");
    let mut promoted = false;
    let mut commit_attempted = false;
    let operation: Result<DocumentRecord, DocumentWorkflowError> = async {
        sqlx::query(
            "INSERT INTO documents (id, filename, original_name, file_path, mime_type, file_size, notes, uploaded_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
        )
        .bind(&document_id)
        .bind(&filename)
        .bind(&original_name)
        .bind(format!("documents/{filename}"))
        .bind(mime_type(&extension))
        .bind(i64::try_from(staged_metadata.len()).map_err(|_| workflow_error("source_read_failed", "The selected document is too large."))?)
        .bind(&request.notes)
        .execute(&mut *transaction)
        .await
        .map_err(|error| workflow_error("database_write_failed", format!("Could not create the document record: {error}")))?;

        insert_tags(&mut transaction, &document_id, &request.tag_ids).await?;
        insert_entity_link(
            &mut transaction,
            &document_id,
            request.entity_type,
            &request.entity_id,
        )
        .await?;

        if failpoint == Some(CreateFailpoint::AfterDatabaseWrites) {
            return Err(workflow_error(
                "database_write_failed",
                "Injected failure after database writes.",
            ));
        }

        fs::rename(&stage_path, &final_path).map_err(|error| {
            workflow_error(
                "file_promotion_failed",
                format!("Could not promote the staged document: {error}"),
            )
        })?;
        promoted = true;

        if matches!(
            failpoint,
            Some(CreateFailpoint::AfterPromotion | CreateFailpoint::AfterPromotionCleanupFailure)
        ) {
            return Err(workflow_error(
                "database_commit_failed",
                "Injected failure after file promotion.",
            ));
        }

        let record = fetch_document(&mut transaction, &document_id)
            .await?
            .ok_or_else(|| workflow_error("database_read_failed", "The new document record could not be verified."))?;
        commit_attempted = true;
        if failpoint == Some(CreateFailpoint::CommitAmbiguous) {
            return Err(workflow_error(
                "database_commit_failed",
                "Injected ambiguous commit failure.",
            ));
        }
        Ok(record)
    }
    .await;

    match operation {
        Ok(record) => match transaction.commit().await {
            Ok(()) => Ok(record),
            Err(commit_error) => {
                let error = retire_after_commit_failure(
                    &mut connection,
                    "Could not commit the document transaction",
                    commit_error,
                );
                log_residue("create_commit_ambiguous", &final_residue);
                Err(error.with_residue(final_residue))
            }
        },
        Err(mut error) => {
            if !rollback(transaction, &mut error).await {
                connection.close_on_drop();
            }
            if commit_attempted && promoted {
                log_residue("create_commit_ambiguous", &final_residue);
                return Err(error.with_residue(final_residue));
            }
            let (cleanup_path, residue) = if promoted {
                (&final_path, final_residue)
            } else {
                (&stage_path, stage_residue)
            };
            Err(cleanup_failed_create(
                "create",
                cleanup_path,
                residue,
                failpoint == Some(CreateFailpoint::AfterPromotionCleanupFailure),
                error,
            ))
        }
    }
}

async fn update_document_core(
    pool: &SqlitePool,
    request: &UpdateDocumentRequest,
    failpoint: Option<UpdateFailpoint>,
) -> Result<DocumentRecord, DocumentWorkflowError> {
    let mut connection = pool.acquire().await.map_err(|error| {
        workflow_error(
            "database_unavailable",
            format!("Could not acquire the document database: {error}"),
        )
    })?;
    configure_connection(&mut connection).await?;
    let mut transaction = begin_write(&mut connection).await?;

    let operation: Result<DocumentRecord, DocumentWorkflowError> = async {
        if fetch_document(&mut transaction, &request.document_id)
            .await?
            .is_none()
        {
            return Err(workflow_error(
                "document_not_found",
                "The document no longer exists.",
            ));
        }
        sqlx::query("UPDATE documents SET notes = ?, updated_at = datetime('now') WHERE id = ?")
            .bind(&request.notes)
            .bind(&request.document_id)
            .execute(&mut *transaction)
            .await
            .map_err(|error| {
                workflow_error(
                    "database_write_failed",
                    format!("Could not update document notes: {error}"),
                )
            })?;
        sqlx::query("DELETE FROM document_tag_links WHERE document_id = ?")
            .bind(&request.document_id)
            .execute(&mut *transaction)
            .await
            .map_err(|error| {
                workflow_error(
                    "database_write_failed",
                    format!("Could not replace document tags: {error}"),
                )
            })?;

        if failpoint == Some(UpdateFailpoint::AfterTagRemoval) {
            return Err(workflow_error(
                "database_write_failed",
                "Injected failure after tag removal.",
            ));
        }

        insert_tags(&mut transaction, &request.document_id, &request.tag_ids).await?;
        let record = fetch_document(&mut transaction, &request.document_id)
            .await?
            .ok_or_else(|| {
                workflow_error("document_not_found", "The document no longer exists.")
            })?;
        Ok(record)
    }
    .await;

    match operation {
        Ok(record) => match transaction.commit().await {
            Ok(()) => Ok(record),
            Err(commit_error) => Err(retire_after_commit_failure(
                &mut connection,
                "Could not commit document changes",
                commit_error,
            )),
        },
        Err(mut error) => {
            if !rollback(transaction, &mut error).await {
                connection.close_on_drop();
            }
            Err(error)
        }
    }
}

async fn replace_document_tags_core(
    pool: &SqlitePool,
    request: &ReplaceDocumentTagsRequest,
) -> Result<(), DocumentWorkflowError> {
    let mut connection = pool.acquire().await.map_err(|error| {
        workflow_error(
            "database_unavailable",
            format!("Could not acquire the document database: {error}"),
        )
    })?;
    configure_connection(&mut connection).await?;
    let mut transaction = begin_write(&mut connection).await?;

    let operation: Result<(), DocumentWorkflowError> = async {
        if fetch_document(&mut transaction, &request.document_id)
            .await?
            .is_none()
        {
            return Err(workflow_error(
                "document_not_found",
                "The document no longer exists.",
            ));
        }
        sqlx::query("DELETE FROM document_tag_links WHERE document_id = ?")
            .bind(&request.document_id)
            .execute(&mut *transaction)
            .await
            .map_err(|error| {
                workflow_error(
                    "database_write_failed",
                    format!("Could not replace document tags: {error}"),
                )
            })?;
        insert_tags(&mut transaction, &request.document_id, &request.tag_ids).await?;
        sqlx::query("UPDATE documents SET updated_at = datetime('now') WHERE id = ?")
            .bind(&request.document_id)
            .execute(&mut *transaction)
            .await
            .map_err(|error| {
                workflow_error(
                    "database_write_failed",
                    format!("Could not update the document timestamp: {error}"),
                )
            })?;
        Ok(())
    }
    .await;

    match operation {
        Ok(()) => match transaction.commit().await {
            Ok(()) => Ok(()),
            Err(commit_error) => Err(retire_after_commit_failure(
                &mut connection,
                "Could not commit document tags",
                commit_error,
            )),
        },
        Err(mut error) => {
            if !rollback(transaction, &mut error).await {
                connection.close_on_drop();
            }
            Err(error)
        }
    }
}

fn is_safe_stored_filename(filename: &str) -> bool {
    let path = Path::new(filename);
    path.components().count() == 1
        && matches!(path.components().next(), Some(Component::Normal(_)))
        && path.file_name().and_then(|value| value.to_str()) == Some(filename)
        && supported_extension(path).is_ok()
        && !filename.contains("..")
}

async fn delete_document_core(
    pool: &SqlitePool,
    app_data_root: &Path,
    document_id: &str,
    failpoint: Option<DeleteFailpoint>,
) -> Result<DeleteDocumentResult, DocumentWorkflowError> {
    let (documents, _, quarantine) = document_directories(app_data_root)?;
    let mut connection = pool.acquire().await.map_err(|error| {
        workflow_error(
            "database_unavailable",
            format!("Could not acquire the document database: {error}"),
        )
    })?;
    configure_connection(&mut connection).await?;
    let mut transaction = begin_write(&mut connection).await?;

    let record = match fetch_document(&mut transaction, document_id).await {
        Ok(Some(record)) => record,
        Ok(None) => {
            let mut error = workflow_error("document_not_found", "The document no longer exists.");
            if !rollback(transaction, &mut error).await {
                connection.close_on_drop();
            }
            return Err(error);
        }
        Err(mut error) => {
            if !rollback(transaction, &mut error).await {
                connection.close_on_drop();
            }
            return Err(error);
        }
    };
    if !is_safe_stored_filename(&record.filename) {
        let mut error = workflow_error(
            "invalid_filename",
            "The stored document filename is invalid.",
        );
        if !rollback(transaction, &mut error).await {
            connection.close_on_drop();
        }
        return Err(error);
    }

    let final_path = documents.join(&record.filename);
    let quarantine_name = format!("{}.tombstone-{}", record.filename, unique_token());
    let quarantine_path = quarantine.join(&quarantine_name);
    let quarantine_residue = format!("documents/.quarantine/{quarantine_name}");
    let mut quarantined = false;

    let operation: Result<(), DocumentWorkflowError> = async {
        if !final_path.is_file() {
            return Err(workflow_error(
                "document_file_missing",
                "The managed document file is missing; its database record was preserved.",
            ));
        }
        fs::rename(&final_path, &quarantine_path).map_err(|error| {
            workflow_error(
                "file_quarantine_failed",
                format!("Could not move the document into recoverable quarantine: {error}"),
            )
        })?;
        quarantined = true;

        if failpoint == Some(DeleteFailpoint::AfterQuarantine)
            || failpoint == Some(DeleteFailpoint::RestoreFailure)
        {
            return Err(workflow_error(
                "database_write_failed",
                "Injected failure after file quarantine.",
            ));
        }

        sqlx::query("DELETE FROM documents WHERE id = ?")
            .bind(document_id)
            .execute(&mut *transaction)
            .await
            .map_err(|error| {
                workflow_error(
                    "database_write_failed",
                    format!("Could not delete the document record: {error}"),
                )
            })?;

        if failpoint == Some(DeleteFailpoint::BeforeCommit) {
            return Err(workflow_error(
                "database_commit_failed",
                "Injected failure before delete commit.",
            ));
        }

        Ok(())
    }
    .await;

    if let Err(mut error) = operation {
        if !rollback(transaction, &mut error).await {
            connection.close_on_drop();
        }
        if quarantined {
            let restore_result = if failpoint == Some(DeleteFailpoint::RestoreFailure) {
                Err(std::io::Error::new(
                    std::io::ErrorKind::PermissionDenied,
                    "injected restore failure",
                ))
            } else {
                fs::rename(&quarantine_path, &final_path)
            };
            if let Err(restore_error) = restore_result {
                error.message = format!(
                    "{} The database was preserved, but the quarantined file could not be restored: {restore_error}",
                    error.message
                );
                log_residue("delete_restore", &quarantine_residue);
                error = error.with_residue(quarantine_residue);
            }
        }
        return Err(error);
    }

    if let Err(commit_error) = transaction.commit().await {
        // Once COMMIT was attempted, its outcome may be unknowable from the
        // returned transport error. Never restore the file based on that
        // ambiguous result: startup reconciliation checks the durable row
        // state and either restores or removes this tombstone.
        let error = retire_after_commit_failure(
            &mut connection,
            "Could not commit document deletion",
            commit_error,
        );
        log_residue("delete_commit_ambiguous", &quarantine_residue);
        return Err(error.with_residue(quarantine_residue));
    }
    if failpoint == Some(DeleteFailpoint::CommitAmbiguous) {
        let error = workflow_error(
            "database_commit_failed",
            "Injected ambiguous delete commit result.",
        );
        log_residue("delete_commit_ambiguous", &quarantine_residue);
        return Err(error.with_residue(quarantine_residue));
    }

    let cleanup_result = if failpoint == Some(DeleteFailpoint::CleanupFailure) {
        Err(std::io::Error::new(
            std::io::ErrorKind::PermissionDenied,
            "injected cleanup failure",
        ))
    } else {
        fs::remove_file(&quarantine_path)
    };
    if let Err(error) = cleanup_result {
        log_residue("delete_cleanup", &quarantine_residue);
        eprintln!(
            "{}",
            serde_json::json!({
                "level": "warn",
                "event": "document_delete_cleanup_deferred",
                "error": error.to_string(),
            })
        );
        return Ok(DeleteDocumentResult {
            deleted: true,
            cleanup_residue: Some(quarantine_residue),
        });
    }

    Ok(DeleteDocumentResult {
        deleted: true,
        cleanup_residue: None,
    })
}

fn encoded_filename<'a>(name: &'a str, marker: &str) -> Option<&'a str> {
    let (filename, suffix) = name.split_once(marker)?;
    if suffix.is_empty() || !is_safe_stored_filename(filename) {
        return None;
    }
    Some(filename)
}

async fn document_row_exists(
    connection: &mut SqliteConnection,
    filename: &str,
) -> Result<bool, DocumentWorkflowError> {
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM documents WHERE filename = ?")
        .bind(filename)
        .fetch_one(&mut *connection)
        .await
        .map_err(|error| {
            workflow_error(
                "database_read_failed",
                format!("Could not reconcile managed document storage: {error}"),
            )
        })?;
    Ok(count == 1)
}

fn reconciliation_remove(
    path: &Path,
    failpoint: Option<ReconcileFailpoint>,
) -> std::io::Result<()> {
    if failpoint == Some(ReconcileFailpoint::FileOperationFailure) {
        Err(std::io::Error::new(
            std::io::ErrorKind::PermissionDenied,
            "injected reconciliation failure",
        ))
    } else {
        fs::remove_file(path)
    }
}

fn reconciliation_rename(
    from: &Path,
    to: &Path,
    failpoint: Option<ReconcileFailpoint>,
) -> std::io::Result<()> {
    if failpoint == Some(ReconcileFailpoint::FileOperationFailure) {
        Err(std::io::Error::new(
            std::io::ErrorKind::PermissionDenied,
            "injected reconciliation failure",
        ))
    } else {
        fs::rename(from, to)
    }
}

async fn reconcile_document_storage_core(
    pool: &SqlitePool,
    app_data_root: &Path,
    max_entries: usize,
    failpoint: Option<ReconcileFailpoint>,
) -> Result<ReconciliationReport, DocumentWorkflowError> {
    if max_entries == 0 {
        return Ok(ReconciliationReport {
            truncated: true,
            ..ReconciliationReport::default()
        });
    }

    let (documents, staging, quarantine) = document_directories(app_data_root)?;
    let mut connection = pool.acquire().await.map_err(|error| {
        workflow_error(
            "database_unavailable",
            format!("Could not acquire the document database: {error}"),
        )
    })?;
    configure_connection(&mut connection).await?;
    // Serialize reconciliation with create/update/delete operations, including
    // across a second process using the same SQLite database. Every document
    // writer obtains the same BEGIN IMMEDIATE reservation before touching files.
    let mut transaction = begin_write(&mut connection).await?;

    let operation: Result<ReconciliationReport, DocumentWorkflowError> = async {
        let mut report = ReconciliationReport::default();

        // A staging name embeds the intended final filename. If a row survived,
        // restore the file; otherwise the never-committed staging copy is safe to
        // remove. Failed operations leave the residue in place for the next run.
        let staging_entries = fs::read_dir(&staging).map_err(|error| {
            workflow_error(
                "reconciliation_scan_failed",
                format!("Could not scan document staging: {error}"),
            )
        })?;
        for entry in staging_entries {
            if report.scanned >= max_entries {
                report.truncated = true;
                return Ok(report);
            }
            report.scanned += 1;
            let entry = match entry {
                Ok(entry) => entry,
                Err(_) => {
                    report.failures += 1;
                    continue;
                }
            };
            if !entry
                .file_type()
                .map(|kind| kind.is_file())
                .unwrap_or(false)
            {
                continue;
            }
            let name = entry.file_name();
            let name = match name.to_str() {
                Some(name) => name,
                None => {
                    report.failures += 1;
                    continue;
                }
            };
            let filename = match encoded_filename(name, ".stage-") {
                Some(filename) => filename,
                None => {
                    report.failures += 1;
                    continue;
                }
            };
            let row_exists = document_row_exists(&mut transaction, filename).await?;
            let final_path = documents.join(filename);
            let result = if row_exists && !final_path.exists() {
                reconciliation_rename(&entry.path(), &final_path, failpoint).map(|_| "restored")
            } else {
                reconciliation_remove(&entry.path(), failpoint).map(|_| "removed")
            };
            match result {
                Ok("restored") => report.restored += 1,
                Ok(_) => report.removed_staging += 1,
                Err(_) => report.failures += 1,
            }
        }

        // Delete tombstones only when their row is gone (the delete committed).
        // If the row remains, the delete rolled back or the process terminated
        // before commit, so restore the encoded filename.
        let quarantine_entries = fs::read_dir(&quarantine).map_err(|error| {
            workflow_error(
                "reconciliation_scan_failed",
                format!("Could not scan document quarantine: {error}"),
            )
        })?;
        for entry in quarantine_entries {
            if report.scanned >= max_entries {
                report.truncated = true;
                return Ok(report);
            }
            report.scanned += 1;
            let entry = match entry {
                Ok(entry) => entry,
                Err(_) => {
                    report.failures += 1;
                    continue;
                }
            };
            if !entry
                .file_type()
                .map(|kind| kind.is_file())
                .unwrap_or(false)
            {
                continue;
            }
            let name = entry.file_name();
            let name = match name.to_str() {
                Some(name) => name,
                None => {
                    report.failures += 1;
                    continue;
                }
            };
            let filename = match encoded_filename(name, ".tombstone-") {
                Some(filename) => filename,
                None => continue, // Deliberately retain orphan/conflict residues.
            };
            let row_exists = document_row_exists(&mut transaction, filename).await?;
            let final_path = documents.join(filename);
            let result = if row_exists && !final_path.exists() {
                reconciliation_rename(&entry.path(), &final_path, failpoint).map(|_| "restored")
            } else if !row_exists {
                reconciliation_remove(&entry.path(), failpoint).map(|_| "removed")
            } else {
                // A row, final file, and tombstone all exist. Retain the tombstone
                // as a recoverable conflict instead of overwriting either copy.
                report.failures += 1;
                continue;
            };
            match result {
                Ok("restored") => report.restored += 1,
                Ok(_) => report.removed_tombstones += 1,
                Err(_) => report.failures += 1,
            }
        }

        // Any supported direct child not represented by documents.filename is an
        // orphan from an interrupted create. Quarantine it so normal UI paths can
        // never present it as a committed document.
        let document_entries = fs::read_dir(&documents).map_err(|error| {
            workflow_error(
                "reconciliation_scan_failed",
                format!("Could not scan managed documents: {error}"),
            )
        })?;
        for entry in document_entries {
            if report.scanned >= max_entries {
                report.truncated = true;
                return Ok(report);
            }
            report.scanned += 1;
            let entry = match entry {
                Ok(entry) => entry,
                Err(_) => {
                    report.failures += 1;
                    continue;
                }
            };
            if !entry
                .file_type()
                .map(|kind| kind.is_file())
                .unwrap_or(false)
            {
                continue;
            }
            let filename = match entry.file_name().to_str() {
                Some(filename) if is_safe_stored_filename(filename) => filename.to_string(),
                Some(_) => {
                    report.failures += 1;
                    continue;
                }
                None => {
                    report.failures += 1;
                    continue;
                }
            };
            if document_row_exists(&mut transaction, &filename).await? {
                continue;
            }
            let orphan_name = format!("{filename}.orphan-{}", unique_token());
            if reconciliation_rename(&entry.path(), &quarantine.join(orphan_name), failpoint)
                .is_ok()
            {
                report.quarantined_orphans += 1;
            } else {
                report.failures += 1;
            }
        }

        Ok(report)
    }
    .await;

    match operation {
        Ok(report) => match transaction.commit().await {
            Ok(()) => Ok(report),
            Err(commit_error) => Err(retire_after_commit_failure(
                &mut connection,
                "Could not release the document reconciliation lock",
                commit_error,
            )),
        },
        Err(mut error) => {
            if !rollback(transaction, &mut error).await {
                connection.close_on_drop();
            }
            Err(error)
        }
    }
}

async fn app_pool(app: &tauri::AppHandle) -> Result<SqlitePool, DocumentWorkflowError> {
    let db_instances = app.state::<DbInstances>();
    let instances = db_instances.0.read().await;
    let database = instances
        .get(DATABASE_URL)
        .ok_or_else(|| workflow_error("database_unavailable", "The SQLite pool is not loaded."))?;
    let DbPool::Sqlite(pool) = database;
    Ok(pool.clone())
}

fn app_data_root(app: &tauri::AppHandle) -> Result<PathBuf, DocumentWorkflowError> {
    app.path().app_data_dir().map_err(|error| {
        workflow_error(
            "file_prepare_failed",
            format!("Could not locate application data storage: {error}"),
        )
    })
}

fn source_is_authorized<R: tauri::Runtime>(app: &tauri::AppHandle<R>, source_path: &Path) -> bool {
    app.fs_scope().is_allowed(source_path)
}

#[tauri::command]
pub async fn create_document_with_file(
    app: tauri::AppHandle,
    request: CreateDocumentRequest,
) -> Result<DocumentRecord, DocumentWorkflowError> {
    let result = async {
        if !source_is_authorized(&app, Path::new(&request.source_path)) {
            return Err(workflow_error(
                "source_not_authorized",
                "The document must be selected through the native file dialog before upload.",
            ));
        }
        let pool = app_pool(&app).await?;
        let root = app_data_root(&app)?;
        create_document_core(&pool, &root, &request, None).await
    }
    .await;
    ipc_result("create", result)
}

#[tauri::command]
pub async fn update_document_metadata(
    app: tauri::AppHandle,
    request: UpdateDocumentRequest,
) -> Result<DocumentRecord, DocumentWorkflowError> {
    let result = async {
        let pool = app_pool(&app).await?;
        update_document_core(&pool, &request, None).await
    }
    .await;
    ipc_result("update_metadata", result)
}

#[tauri::command]
pub async fn replace_document_tags(
    app: tauri::AppHandle,
    request: ReplaceDocumentTagsRequest,
) -> Result<(), DocumentWorkflowError> {
    let result = async {
        let pool = app_pool(&app).await?;
        replace_document_tags_core(&pool, &request).await
    }
    .await;
    ipc_result("replace_tags", result)
}

#[tauri::command]
pub async fn delete_document_recoverable(
    app: tauri::AppHandle,
    document_id: String,
) -> Result<DeleteDocumentResult, DocumentWorkflowError> {
    let result = async {
        let pool = app_pool(&app).await?;
        let root = app_data_root(&app)?;
        delete_document_core(&pool, &root, &document_id, None).await
    }
    .await;
    ipc_result("delete", result)
}

#[tauri::command]
pub async fn reconcile_document_storage(
    app: tauri::AppHandle,
) -> Result<ReconciliationReport, DocumentWorkflowError> {
    const STARTUP_SCAN_LIMIT: usize = 10_000;
    let result = async {
        let pool = app_pool(&app).await?;
        let root = app_data_root(&app)?;
        reconcile_document_storage_core(&pool, &root, STARTUP_SCAN_LIMIT, None).await
    }
    .await;
    ipc_result("reconcile", result)
}

async fn open_managed_document_inner(
    app: tauri::AppHandle,
    filename: String,
) -> Result<(), DocumentWorkflowError> {
    if !is_safe_stored_filename(&filename) {
        return Err(workflow_error(
            "invalid_filename",
            "The stored document filename is invalid.",
        ));
    }

    let pool = app_pool(&app).await?;
    let managed_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM documents WHERE filename = ?")
            .bind(&filename)
            .fetch_one(&pool)
            .await
            .map_err(|error| {
                workflow_error(
                    "database_read_failed",
                    format!("Could not verify the managed document: {error}"),
                )
            })?;
    if managed_count != 1 {
        return Err(workflow_error(
            "document_not_found",
            "The document is not registered in application storage.",
        ));
    }

    let root = app_data_root(&app)?;
    let canonical_documents = ensure_managed_directory(&root, "documents").map_err(|error| {
        workflow_error(
            "document_file_missing",
            format!("Could not validate managed document storage: {error}"),
        )
    })?;
    let canonical_file =
        fs::canonicalize(canonical_documents.join(&filename)).map_err(|error| {
            workflow_error(
                "document_file_missing",
                format!("Could not access the managed document: {error}"),
            )
        })?;
    if canonical_file.parent() != Some(canonical_documents.as_path()) {
        return Err(workflow_error(
            "invalid_filename",
            "The document path escapes managed application storage.",
        ));
    }

    #[cfg(target_os = "windows")]
    let mut command = Command::new(r"C:\Windows\explorer.exe");
    #[cfg(target_os = "macos")]
    let mut command = Command::new("open");
    #[cfg(all(unix, not(target_os = "macos")))]
    let mut command = Command::new("xdg-open");

    command.arg(&canonical_file).spawn().map_err(|error| {
        workflow_error(
            "open_failed",
            format!("Could not open the managed document: {error}"),
        )
    })?;
    Ok(())
}

#[tauri::command]
pub async fn open_managed_document(
    app: tauri::AppHandle,
    filename: String,
) -> Result<(), DocumentWorkflowError> {
    let result = open_managed_document_inner(app, filename).await;
    ipc_result("open", result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;

    #[test]
    fn ipc_errors_log_details_but_return_only_stable_public_messages() {
        let error = workflow_error(
            "database_read_failed",
            r"SQLite failed at C:\Users\person\private\respectabullz.db",
        )
        .for_ipc("test");

        assert_eq!(
            error.message,
            "The document operation could not be completed."
        );
        assert!(!error.message.contains("person"));
        assert!(!error.message.contains("SQLite"));
    }

    const TEST_SCHEMA: &str = r#"
        PRAGMA foreign_keys = ON;
        CREATE TABLE dogs (id TEXT PRIMARY KEY);
        CREATE TABLE litters (id TEXT PRIMARY KEY);
        CREATE TABLE expenses (id TEXT PRIMARY KEY);
        CREATE TABLE document_tags (id TEXT PRIMARY KEY);
        CREATE TABLE documents (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            notes TEXT,
            uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE document_tag_links (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
            tag_id TEXT NOT NULL REFERENCES document_tags(id) ON DELETE CASCADE,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(document_id, tag_id)
        );
        CREATE TABLE dog_documents (
            id TEXT PRIMARY KEY,
            dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
            document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(dog_id, document_id)
        );
        CREATE TABLE litter_documents (
            id TEXT PRIMARY KEY,
            litter_id TEXT NOT NULL REFERENCES litters(id) ON DELETE CASCADE,
            document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(litter_id, document_id)
        );
        CREATE TABLE expense_documents (
            id TEXT PRIMARY KEY,
            expense_id TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
            document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(expense_id, document_id)
        );
    "#;

    struct Fixture {
        pool: SqlitePool,
        root: PathBuf,
        source: PathBuf,
    }

    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.root);
        }
    }

    async fn fixture() -> Fixture {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("in-memory SQLite should open");
        sqlx::raw_sql(TEST_SCHEMA)
            .execute(&pool)
            .await
            .expect("test schema should apply");
        sqlx::query("INSERT INTO dogs (id) VALUES ('dog-1')")
            .execute(&pool)
            .await
            .expect("dog fixture should insert");
        sqlx::query("INSERT INTO document_tags (id) VALUES ('tag-1'), ('tag-2')")
            .execute(&pool)
            .await
            .expect("tag fixtures should insert");

        let root =
            std::env::temp_dir().join(format!("respectabullz-doc-workflow-{}", unique_token()));
        fs::create_dir_all(&root).expect("temporary root should exist");
        let source = root.join("selected.pdf");
        fs::write(&source, b"%PDF-1.7\ntest document bytes").expect("source fixture should write");
        Fixture { pool, root, source }
    }

    fn create_request(source: &Path) -> CreateDocumentRequest {
        CreateDocumentRequest {
            source_path: source.to_string_lossy().into_owned(),
            entity_type: DocumentEntityType::Dog,
            entity_id: "dog-1".to_string(),
            notes: Some("initial notes".to_string()),
            tag_ids: vec!["tag-1".to_string()],
        }
    }

    async fn count(pool: &SqlitePool, table: &str) -> i64 {
        sqlx::query_scalar(&format!("SELECT COUNT(*) FROM {table}"))
            .fetch_one(pool)
            .await
            .expect("fixture count should run")
    }

    #[tokio::test]
    async fn create_commits_file_row_tags_and_entity_link_together() {
        let fixture = fixture().await;
        let record = create_document_core(
            &fixture.pool,
            &fixture.root,
            &create_request(&fixture.source),
            None,
        )
        .await
        .expect("create should succeed");

        assert!(fixture.root.join(&record.file_path).is_file());
        assert_eq!(count(&fixture.pool, "documents").await, 1);
        assert_eq!(count(&fixture.pool, "document_tag_links").await, 1);
        assert_eq!(count(&fixture.pool, "dog_documents").await, 1);
    }

    #[tokio::test]
    async fn failed_document_commit_retires_the_pooled_connection() {
        let fixture = fixture().await;
        let mut connection = fixture
            .pool
            .acquire()
            .await
            .expect("fixture connection should be acquired");
        configure_connection(&mut connection)
            .await
            .expect("fixture connection should be configured");
        sqlx::raw_sql(
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

        let mut transaction = begin_write(&mut connection)
            .await
            .expect("tracked document transaction should begin");
        sqlx::query("INSERT INTO commit_child (parent_id) VALUES (404)")
            .execute(&mut *transaction)
            .await
            .expect("deferred violation should be accepted until commit");
        let commit_error = transaction
            .commit()
            .await
            .expect_err("deferred violation should reject commit");
        let error = retire_after_commit_failure(
            &mut connection,
            "Could not commit test document transaction",
            commit_error,
        );
        assert_eq!(error.code, "database_commit_failed");
        assert!(error.message.contains("SQLite connection was retired"));
        drop(connection);

        // The in-memory fixture is connection-local. Losing its table proves
        // the failed connection was closed instead of returned to the pool.
        let fixture_table_count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'commit_parent'",
        )
        .fetch_one(&fixture.pool)
        .await
        .expect("replacement connection should remain usable");
        assert_eq!(fixture_table_count, 0);
    }

    #[tokio::test]
    async fn rejects_a_document_over_the_bounded_size_limit() {
        let fixture = fixture().await;
        let oversized = fixture.root.join("oversized.pdf");
        let file = fs::File::create(&oversized).expect("oversized fixture should create");
        file.set_len(MAX_DOCUMENT_BYTES + 1)
            .expect("sparse oversized fixture should resize");

        let error = create_document_core(
            &fixture.pool,
            &fixture.root,
            &create_request(&oversized),
            None,
        )
        .await
        .expect_err("oversized source should be rejected");

        assert_eq!(error.code, "document_too_large");
        assert_eq!(count(&fixture.pool, "documents").await, 0);
    }

    #[tokio::test]
    async fn rejects_an_extension_and_signature_mismatch() {
        let fixture = fixture().await;
        let disguised_pdf = fixture.root.join("disguised.pdf");
        fs::write(&disguised_pdf, b"this is not a PDF")
            .expect("signature mismatch fixture should write");

        let error = create_document_core(
            &fixture.pool,
            &fixture.root,
            &create_request(&disguised_pdf),
            None,
        )
        .await
        .expect_err("signature mismatch should be rejected");

        assert_eq!(error.code, "signature_mismatch");
        assert_eq!(count(&fixture.pool, "documents").await, 0);
    }

    #[test]
    fn validates_minimum_magic_for_each_supported_format_family() {
        let root =
            std::env::temp_dir().join(format!("respectabullz-signatures-{}", unique_token()));
        fs::create_dir_all(&root).expect("signature root should exist");
        let fixtures: &[(&str, &[u8])] = &[
            ("sample.pdf", b"%PDF-1.7"),
            (
                "sample.png",
                &[0x89, b'P', b'N', b'G', 0x0d, 0x0a, 0x1a, 0x0a],
            ),
            ("sample.jpg", &[0xff, 0xd8, 0xff, 0xe0]),
            ("sample.gif", b"GIF89a"),
            ("sample.webp", b"RIFF\x00\x00\x00\x00WEBP"),
            ("sample.docx", b"PK\x03\x04"),
            ("sample.xlsx", b"PK\x03\x04"),
            (
                "sample.doc",
                &[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
            ),
            (
                "sample.xls",
                &[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
            ),
        ];
        for (name, bytes) in fixtures {
            let path = root.join(name);
            fs::write(&path, bytes).expect("signature fixture should write");
            let extension = supported_extension(&path).expect("extension should be supported");
            validate_file_signature(&path, &extension).expect("signature should match");
        }
        fs::remove_dir_all(root).expect("signature root should clean up");
    }

    #[tokio::test]
    async fn file_promotion_failure_leaves_no_database_or_file_residue() {
        let fixture = fixture().await;
        let error = create_document_core(
            &fixture.pool,
            &fixture.root,
            &create_request(&fixture.source),
            Some(CreateFailpoint::BeforePromotion),
        )
        .await
        .expect_err("injected promotion failure should surface");

        assert_eq!(error.code, "file_promotion_failed");
        assert_eq!(count(&fixture.pool, "documents").await, 0);
        assert!(fs::read_dir(fixture.root.join("documents/.staging"))
            .expect("staging should exist")
            .next()
            .is_none());
    }

    #[tokio::test]
    async fn database_failure_rolls_back_and_removes_staged_file() {
        let fixture = fixture().await;
        let error = create_document_core(
            &fixture.pool,
            &fixture.root,
            &create_request(&fixture.source),
            Some(CreateFailpoint::AfterDatabaseWrites),
        )
        .await
        .expect_err("injected database failure should surface");

        assert_eq!(error.code, "database_write_failed");
        assert_eq!(count(&fixture.pool, "documents").await, 0);
        assert_eq!(count(&fixture.pool, "document_tag_links").await, 0);
        assert_eq!(count(&fixture.pool, "dog_documents").await, 0);
        assert!(fs::read_dir(fixture.root.join("documents/.staging"))
            .expect("staging should exist")
            .next()
            .is_none());
    }

    #[tokio::test]
    async fn failure_after_promotion_rolls_back_and_removes_final_file() {
        let fixture = fixture().await;
        let error = create_document_core(
            &fixture.pool,
            &fixture.root,
            &create_request(&fixture.source),
            Some(CreateFailpoint::AfterPromotion),
        )
        .await
        .expect_err("post-promotion failure should surface");

        assert_eq!(error.code, "database_commit_failed");
        assert_eq!(count(&fixture.pool, "documents").await, 0);
        let managed_files = fs::read_dir(fixture.root.join("documents"))
            .expect("documents should exist")
            .filter_map(Result::ok)
            .filter(|entry| entry.path().is_file())
            .count();
        assert_eq!(managed_files, 0);
    }

    #[tokio::test]
    async fn ambiguous_commit_preserves_file_for_startup_reconciliation() {
        let fixture = fixture().await;
        let error = create_document_core(
            &fixture.pool,
            &fixture.root,
            &create_request(&fixture.source),
            Some(CreateFailpoint::CommitAmbiguous),
        )
        .await
        .expect_err("ambiguous commit should surface");

        let residue = error
            .cleanup_residue
            .expect("final residue should be reported");
        assert_eq!(count(&fixture.pool, "documents").await, 0);
        assert!(fixture.root.join(&residue).is_file());

        let report = reconcile_document_storage_core(&fixture.pool, &fixture.root, 100, None)
            .await
            .expect("startup reconciliation should succeed");
        assert_eq!(report.quarantined_orphans, 1);
        assert!(!fixture.root.join(residue).exists());
    }

    #[tokio::test]
    async fn cleanup_failure_is_typed_and_reports_recoverable_residue() {
        let fixture = fixture().await;
        let error = create_document_core(
            &fixture.pool,
            &fixture.root,
            &create_request(&fixture.source),
            Some(CreateFailpoint::AfterPromotionCleanupFailure),
        )
        .await
        .expect_err("cleanup failure should surface");

        let residue = error.cleanup_residue.expect("residue should be reported");
        assert_eq!(count(&fixture.pool, "documents").await, 0);
        assert!(fixture.root.join(residue).is_file());
    }

    #[tokio::test]
    async fn metadata_and_tag_failure_preserves_previous_values() {
        let fixture = fixture().await;
        let record = create_document_core(
            &fixture.pool,
            &fixture.root,
            &create_request(&fixture.source),
            None,
        )
        .await
        .expect("create should succeed");
        let request = UpdateDocumentRequest {
            document_id: record.id.clone(),
            notes: Some("changed".to_string()),
            tag_ids: vec!["tag-2".to_string()],
        };

        update_document_core(
            &fixture.pool,
            &request,
            Some(UpdateFailpoint::AfterTagRemoval),
        )
        .await
        .expect_err("injected update failure should surface");

        let notes: Option<String> = sqlx::query_scalar("SELECT notes FROM documents WHERE id = ?")
            .bind(&record.id)
            .fetch_one(&fixture.pool)
            .await
            .expect("notes should read");
        let tag: String =
            sqlx::query_scalar("SELECT tag_id FROM document_tag_links WHERE document_id = ?")
                .bind(&record.id)
                .fetch_one(&fixture.pool)
                .await
                .expect("original tag should remain");
        assert_eq!(notes.as_deref(), Some("initial notes"));
        assert_eq!(tag, "tag-1");
    }

    #[tokio::test]
    async fn delete_database_failure_restores_file_and_row() {
        let fixture = fixture().await;
        let record = create_document_core(
            &fixture.pool,
            &fixture.root,
            &create_request(&fixture.source),
            None,
        )
        .await
        .expect("create should succeed");

        delete_document_core(
            &fixture.pool,
            &fixture.root,
            &record.id,
            Some(DeleteFailpoint::BeforeCommit),
        )
        .await
        .expect_err("injected delete failure should surface");

        assert_eq!(count(&fixture.pool, "documents").await, 1);
        assert!(fixture.root.join(&record.file_path).is_file());
        assert!(fs::read_dir(fixture.root.join("documents/.quarantine"))
            .expect("quarantine should exist")
            .next()
            .is_none());
    }

    #[tokio::test]
    async fn delete_cleanup_failure_commits_row_delete_and_retains_quarantine() {
        let fixture = fixture().await;
        let record = create_document_core(
            &fixture.pool,
            &fixture.root,
            &create_request(&fixture.source),
            None,
        )
        .await
        .expect("create should succeed");

        let result = delete_document_core(
            &fixture.pool,
            &fixture.root,
            &record.id,
            Some(DeleteFailpoint::CleanupFailure),
        )
        .await
        .expect("cleanup failure should be a successful delete with residue");

        let residue = result.cleanup_residue.expect("residue should be reported");
        assert_eq!(count(&fixture.pool, "documents").await, 0);
        assert!(!fixture.root.join(&record.file_path).exists());
        assert!(fixture.root.join(residue).is_file());
    }

    #[tokio::test]
    async fn ambiguous_delete_commit_preserves_tombstone_for_reconciliation() {
        let fixture = fixture().await;
        let record = create_document_core(
            &fixture.pool,
            &fixture.root,
            &create_request(&fixture.source),
            None,
        )
        .await
        .expect("create should succeed");

        let error = delete_document_core(
            &fixture.pool,
            &fixture.root,
            &record.id,
            Some(DeleteFailpoint::CommitAmbiguous),
        )
        .await
        .expect_err("ambiguous commit should surface");

        let residue = error
            .cleanup_residue
            .expect("quarantine residue should be reported");
        assert_eq!(count(&fixture.pool, "documents").await, 0);
        assert!(!fixture.root.join(&record.file_path).exists());
        assert!(fixture.root.join(&residue).is_file());

        let report = reconcile_document_storage_core(&fixture.pool, &fixture.root, 100, None)
            .await
            .expect("startup reconciliation should finish the committed delete");
        assert_eq!(report.removed_tombstones, 1);
        assert!(!fixture.root.join(residue).exists());
    }

    #[tokio::test]
    async fn failed_restore_preserves_row_and_reports_quarantine_residue() {
        let fixture = fixture().await;
        let record = create_document_core(
            &fixture.pool,
            &fixture.root,
            &create_request(&fixture.source),
            None,
        )
        .await
        .expect("create should succeed");

        let error = delete_document_core(
            &fixture.pool,
            &fixture.root,
            &record.id,
            Some(DeleteFailpoint::RestoreFailure),
        )
        .await
        .expect_err("restore failure should surface");

        let residue = error
            .cleanup_residue
            .expect("quarantine residue should be reported");
        assert_eq!(count(&fixture.pool, "documents").await, 1);
        assert!(fixture.root.join(residue).is_file());
    }

    #[tokio::test]
    async fn startup_reconciliation_removes_uncommitted_staging_residue() {
        let fixture = fixture().await;
        let (_, staging, _) =
            document_directories(&fixture.root).expect("directories should exist");
        let residue = staging.join("1700000000000-abc123.pdf.stage-crash");
        fs::write(&residue, b"staged crash residue").expect("staging residue should write");

        let report = reconcile_document_storage_core(&fixture.pool, &fixture.root, 100, None)
            .await
            .expect("reconciliation should succeed");

        assert_eq!(report.removed_staging, 1);
        assert_eq!(report.failures, 0);
        assert!(!residue.exists());
    }

    #[tokio::test]
    async fn startup_reconciliation_restores_tombstone_when_row_survived() {
        let fixture = fixture().await;
        let record = create_document_core(
            &fixture.pool,
            &fixture.root,
            &create_request(&fixture.source),
            None,
        )
        .await
        .expect("create should succeed");
        let final_path = fixture.root.join(&record.file_path);
        let quarantine = fixture.root.join("documents/.quarantine");
        let tombstone = quarantine.join(format!("{}.tombstone-crash", record.filename));
        fs::rename(&final_path, &tombstone).expect("crash state should move file");

        let report = reconcile_document_storage_core(&fixture.pool, &fixture.root, 100, None)
            .await
            .expect("reconciliation should succeed");

        assert_eq!(report.restored, 1);
        assert!(final_path.is_file());
        assert!(!tombstone.exists());
        assert_eq!(count(&fixture.pool, "documents").await, 1);
    }

    #[tokio::test]
    async fn startup_reconciliation_removes_tombstone_when_delete_committed() {
        let fixture = fixture().await;
        let record = create_document_core(
            &fixture.pool,
            &fixture.root,
            &create_request(&fixture.source),
            None,
        )
        .await
        .expect("create should succeed");
        let final_path = fixture.root.join(&record.file_path);
        let tombstone = fixture
            .root
            .join("documents/.quarantine")
            .join(format!("{}.tombstone-crash", record.filename));
        fs::rename(&final_path, &tombstone).expect("crash state should move file");
        sqlx::query("DELETE FROM documents WHERE id = ?")
            .bind(&record.id)
            .execute(&fixture.pool)
            .await
            .expect("committed delete fixture should remove row");

        let report = reconcile_document_storage_core(&fixture.pool, &fixture.root, 100, None)
            .await
            .expect("reconciliation should succeed");

        assert_eq!(report.removed_tombstones, 1);
        assert!(!tombstone.exists());
        assert_eq!(count(&fixture.pool, "documents").await, 0);
    }

    #[tokio::test]
    async fn startup_reconciliation_quarantines_orphan_final_file() {
        let fixture = fixture().await;
        let (documents, _, quarantine) =
            document_directories(&fixture.root).expect("directories should exist");
        let orphan = documents.join("1700000000000-orphan.pdf");
        fs::write(&orphan, b"orphan after process termination").expect("orphan should write");

        let report = reconcile_document_storage_core(&fixture.pool, &fixture.root, 100, None)
            .await
            .expect("reconciliation should succeed");

        assert_eq!(report.quarantined_orphans, 1);
        assert!(!orphan.exists());
        assert!(fs::read_dir(quarantine)
            .expect("quarantine should exist")
            .filter_map(Result::ok)
            .any(|entry| entry
                .file_name()
                .to_string_lossy()
                .starts_with("1700000000000-orphan.pdf.orphan-")));
    }

    #[tokio::test]
    async fn reconciliation_failure_keeps_residue_for_a_later_run() {
        let fixture = fixture().await;
        let (_, staging, _) =
            document_directories(&fixture.root).expect("directories should exist");
        let residue = staging.join("1700000000000-abc123.pdf.stage-crash");
        fs::write(&residue, b"staged crash residue").expect("staging residue should write");

        let report = reconcile_document_storage_core(
            &fixture.pool,
            &fixture.root,
            100,
            Some(ReconcileFailpoint::FileOperationFailure),
        )
        .await
        .expect("reconciliation should return a bounded failure report");

        assert_eq!(report.failures, 1);
        assert!(residue.is_file());
    }

    #[tokio::test]
    async fn reconciliation_reports_when_the_bounded_scan_is_truncated() {
        let fixture = fixture().await;
        document_directories(&fixture.root).expect("directories should exist");

        let report = reconcile_document_storage_core(&fixture.pool, &fixture.root, 0, None)
            .await
            .expect("bounded report should return");

        assert!(report.truncated);
        assert_eq!(report.scanned, 0);
    }
}

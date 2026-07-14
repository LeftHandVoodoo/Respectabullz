use tauri::Manager;

mod database_integrity;
mod demo_seed;
mod document_workflow;
mod external_links;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            database_integrity::setup_integrity_database,
            demo_seed::apply_demo_seed,
            document_workflow::create_document_with_file,
            document_workflow::update_document_metadata,
            document_workflow::replace_document_tags,
            document_workflow::delete_document_recoverable,
            document_workflow::reconcile_document_storage,
            document_workflow::open_managed_document,
            external_links::open_support_issue_page
        ])
        .setup(|app| {
            // Get the app data directory and create it if it doesn't exist
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            std::fs::create_dir_all(&app_data_dir).expect("Failed to create app data dir");

            // Create subdirectories for data storage
            let photos_dir = app_data_dir.join("photos");
            let attachments_dir = app_data_dir.join("attachments");
            let backups_dir = app_data_dir.join("backups");
            let contracts_dir = app_data_dir.join("contracts");
            let documents_dir = app_data_dir.join("documents");

            std::fs::create_dir_all(&photos_dir)?;
            std::fs::create_dir_all(&attachments_dir)?;
            std::fs::create_dir_all(&backups_dir)?;
            std::fs::create_dir_all(&contracts_dir)?;
            std::fs::create_dir_all(&documents_dir)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

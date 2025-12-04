use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            // Get the app data directory and create it if it doesn't exist
            let app_data_dir = app.path().app_data_dir().expect("Failed to get app data dir");
            std::fs::create_dir_all(&app_data_dir).expect("Failed to create app data dir");
            
            // Create subdirectories for data storage
            let photos_dir = app_data_dir.join("photos");
            let attachments_dir = app_data_dir.join("attachments");
            let backups_dir = app_data_dir.join("backups");
            let contracts_dir = app_data_dir.join("contracts");
            
            std::fs::create_dir_all(&photos_dir).ok();
            std::fs::create_dir_all(&attachments_dir).ok();
            std::fs::create_dir_all(&backups_dir).ok();
            std::fs::create_dir_all(&contracts_dir).ok();
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


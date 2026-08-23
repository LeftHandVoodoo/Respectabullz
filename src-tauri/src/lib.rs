use tauri::Manager;

fn write_ci_readiness_marker(logs: &std::path::Path) -> Result<(), String> {
    let marker = logs.join("ci-ready-v1");
    let temporary_marker = logs.join(format!(".ci-ready-v1-{}.tmp", std::process::id()));

    let result = (|| {
        let mut file = std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&temporary_marker)
            .map_err(|_| "Could not create the CI readiness marker.".to_string())?;
        std::io::Write::write_all(&mut file, b"ready-v1\n")
            .map_err(|_| "Could not write the CI readiness marker.".to_string())?;
        file.sync_all()
            .map_err(|_| "Could not persist the CI readiness marker.".to_string())?;
        drop(file);
        std::fs::rename(&temporary_marker, &marker)
            .map_err(|_| "Could not publish the CI readiness marker.".to_string())?;
        Ok(())
    })();

    if result.is_err() {
        let _ = std::fs::remove_file(&temporary_marker);
    }
    result
}

#[tauri::command]
fn report_application_ready(app: tauri::AppHandle) -> Result<(), String> {
    if std::env::var("GITHUB_ACTIONS").as_deref() != Ok("true") {
        return Ok(());
    }

    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| "Could not resolve the CI readiness directory.".to_string())?;
    let logs = managed_paths::ensure_managed_directory(&app_data_dir, "logs")
        .map_err(|_| "Could not validate the CI readiness directory.".to_string())?;
    write_ci_readiness_marker(&logs)
}

#[cfg(test)]
mod readiness_tests {
    use super::write_ci_readiness_marker;

    #[test]
    fn readiness_marker_is_published_only_with_complete_content() {
        let unique = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("system time should follow the Unix epoch")
            .as_nanos();
        let directory = std::env::temp_dir().join(format!(
            "respectabullz-readiness-test-{}-{unique}",
            std::process::id()
        ));
        std::fs::create_dir(&directory).expect("test directory should be created");

        write_ci_readiness_marker(&directory).expect("readiness marker should be published");

        let marker = directory.join("ci-ready-v1");
        assert_eq!(
            std::fs::read_to_string(&marker).expect("marker should be readable"),
            "ready-v1\n"
        );
        assert_eq!(
            std::fs::read_dir(&directory)
                .expect("test directory should be readable")
                .count(),
            1,
            "the sibling temporary marker should be removed by rename"
        );

        std::fs::remove_file(marker).expect("test marker should be removed");
        std::fs::remove_dir(directory).expect("empty test directory should be removed");
    }
}

mod database_access;
mod database_integrity;
mod demo_seed;
mod document_workflow;
mod external_links;
mod managed_paths;
mod navigation_guard;
mod sale_workflow;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(navigation_guard::plugin())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            database_access::database_select,
            database_access::database_execute,
            report_application_ready,
            database_integrity::setup_integrity_database,
            demo_seed::apply_demo_seed,
            document_workflow::create_document_with_file,
            document_workflow::update_document_metadata,
            document_workflow::replace_document_tags,
            document_workflow::delete_document_recoverable,
            document_workflow::reconcile_document_storage,
            document_workflow::open_managed_document,
            external_links::open_support_issue_page,
            sale_workflow::create_sale_atomic,
            sale_workflow::update_sale_atomic,
            sale_workflow::convert_interest_to_sale_atomic,
            sale_workflow::delete_sale_atomic
        ])
        .setup(|app| {
            // Get the app data directory and create it if it doesn't exist
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            std::fs::create_dir_all(&app_data_dir).expect("Failed to create app data dir");

            // Every application-managed child must remain a real, canonical
            // directory beneath the operating-system application-data root.
            for directory in [
                "photos",
                "attachments",
                "backups",
                "contracts",
                "documents",
                "logs",
            ] {
                managed_paths::ensure_managed_directory(&app_data_dir, directory)?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

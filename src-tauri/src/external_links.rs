use std::process::Command;

const SUPPORT_ISSUE_URL: &str = "https://github.com/LeftHandVoodoo/Respectabullz/issues/new";

#[tauri::command]
pub fn open_support_issue_page() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    let mut command = Command::new(r"C:\Windows\explorer.exe");
    #[cfg(target_os = "macos")]
    let mut command = Command::new("open");
    #[cfg(all(unix, not(target_os = "macos")))]
    let mut command = Command::new("xdg-open");

    command
        .arg(SUPPORT_ISSUE_URL)
        .spawn()
        .map(|_| ())
        .map_err(|error| {
            eprintln!(
                "{}",
                serde_json::json!({
                    "level": "error",
                    "event": "support_page_open_failed",
                    "detail": error.to_string(),
                })
            );
            "Could not open the support page.".to_string()
        })
}

#[cfg(test)]
mod tests {
    use super::SUPPORT_ISSUE_URL;

    #[test]
    fn support_issue_destination_is_fixed_and_has_no_report_query() {
        assert_eq!(
            SUPPORT_ISSUE_URL,
            "https://github.com/LeftHandVoodoo/Respectabullz/issues/new"
        );
        assert!(!SUPPORT_ISSUE_URL.contains('?'));
        assert!(!SUPPORT_ISSUE_URL.contains('#'));
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn windows_uses_an_absolute_system_explorer_path() {
        let explorer = std::path::Path::new(r"C:\Windows\explorer.exe");
        assert!(explorer.is_absolute());
        assert_eq!(
            explorer.file_name().and_then(|value| value.to_str()),
            Some("explorer.exe")
        );
    }
}

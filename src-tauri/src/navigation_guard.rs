use tauri::{plugin::TauriPlugin, Runtime, Url, Webview, Wry};

fn is_allowed_main_navigation(url: &Url, debug_build: bool) -> bool {
    match url.scheme() {
        "tauri" => url.host_str() == Some("localhost") && url.port().is_none(),
        "http" => {
            if url.host_str() == Some("tauri.localhost") && url.port().is_none() {
                return true;
            }
            debug_build
                && matches!(url.host_str(), Some("localhost") | Some("127.0.0.1"))
                && url.port_or_known_default() == Some(1420)
        }
        "about" => url.as_str() == "about:blank",
        _ => false,
    }
}

fn is_allowed_navigation(webview_label: &str, url: &Url, debug_build: bool) -> bool {
    webview_label == "main" && is_allowed_main_navigation(url, debug_build)
}

fn allow_navigation<R: Runtime>(webview: &Webview<R>, url: &Url) -> bool {
    let allowed = is_allowed_navigation(webview.label(), url, cfg!(debug_assertions));
    if !allowed {
        eprintln!(
            "{}",
            serde_json::json!({
                "level": "warn",
                "event": "webview_navigation_blocked",
                "webview": webview.label(),
                "scheme": url.scheme(),
                "host": url.host_str(),
            })
        );
    }
    allowed
}

pub fn plugin() -> TauriPlugin<Wry> {
    tauri::plugin::Builder::new("navigation-guard")
        .on_navigation(allow_navigation)
        .build()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn url(value: &str) -> Url {
        Url::parse(value).expect("test URL should parse")
    }

    #[test]
    fn production_allows_only_local_application_origins_and_blank_print_pages() {
        assert!(is_allowed_main_navigation(
            &url("tauri://localhost/dogs"),
            false
        ));
        assert!(is_allowed_main_navigation(
            &url("http://tauri.localhost/litters"),
            false,
        ));
        assert!(is_allowed_main_navigation(&url("about:blank"), false));
        assert!(!is_allowed_main_navigation(
            &url("https://example.com/phishing"),
            false,
        ));
        assert!(!is_allowed_main_navigation(
            &url("http://localhost:1420"),
            false,
        ));
        assert!(!is_allowed_main_navigation(
            &url("http://tauri.localhost:8080/phishing"),
            false,
        ));
    }

    #[test]
    fn development_allows_only_the_configured_loopback_server() {
        assert!(is_allowed_main_navigation(
            &url("http://localhost:1420/dogs"),
            true,
        ));
        assert!(is_allowed_main_navigation(
            &url("http://127.0.0.1:1420/dogs"),
            true,
        ));
        assert!(!is_allowed_main_navigation(
            &url("http://localhost:1421/dogs"),
            true,
        ));
        assert!(!is_allowed_main_navigation(
            &url("https://localhost:1420/dogs"),
            true,
        ));
    }

    #[test]
    fn secondary_webviews_cannot_navigate() {
        assert!(!is_allowed_navigation("print", &url("about:blank"), false));
        assert!(!is_allowed_navigation(
            "print",
            &url("javascript:alert(document.domain)"),
            false,
        ));
        assert!(!is_allowed_navigation(
            "print",
            &url("https://example.com/phishing"),
            false,
        ));
        assert!(!is_allowed_navigation(
            "print",
            &url("file:///C:/private/contract.docx"),
            false,
        ));
        assert!(!is_allowed_navigation(
            "print",
            &url("data:text/html,<script>alert(1)</script>"),
            false,
        ));
    }
}

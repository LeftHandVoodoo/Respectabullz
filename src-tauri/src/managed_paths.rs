use std::fs;
use std::io;
use std::path::{Path, PathBuf};

#[cfg(target_os = "windows")]
use std::os::windows::fs::MetadataExt;

#[cfg(target_os = "windows")]
const FILE_ATTRIBUTE_REPARSE_POINT: u32 = 0x0400;

fn invalid_managed_path(message: &'static str) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidData, message)
}

fn reject_link_or_reparse(path: &Path) -> io::Result<()> {
    let metadata = fs::symlink_metadata(path)?;
    if metadata.file_type().is_symlink() {
        return Err(invalid_managed_path(
            "managed storage may not be a symbolic link",
        ));
    }

    #[cfg(target_os = "windows")]
    if metadata.file_attributes() & FILE_ATTRIBUTE_REPARSE_POINT != 0 {
        return Err(invalid_managed_path(
            "managed storage may not be a Windows reparse point",
        ));
    }

    if !metadata.is_dir() {
        return Err(invalid_managed_path("managed storage must be a directory"));
    }
    Ok(())
}

/// Creates and validates a direct application-managed child directory.
///
/// The operating-system application-data root itself may be redirected by policy.
/// Every child controlled by this application must remain a real directory whose
/// canonical path is contained by that trusted root.
pub fn ensure_managed_directory(root: &Path, name: &str) -> io::Result<PathBuf> {
    if name.is_empty() || name == "." || name == ".." || name.contains('/') || name.contains('\\') {
        return Err(invalid_managed_path("managed directory name is invalid"));
    }

    fs::create_dir_all(root)?;
    let canonical_root = fs::canonicalize(root)?;
    let child = root.join(name);
    fs::create_dir_all(&child)?;
    reject_link_or_reparse(&child)?;

    let canonical_child = fs::canonicalize(&child)?;
    if canonical_child.parent() != Some(canonical_root.as_path()) {
        return Err(invalid_managed_path(
            "managed storage escapes the application-data root",
        ));
    }
    Ok(canonical_child)
}

pub fn ensure_managed_grandchild(parent: &Path, name: &str) -> io::Result<PathBuf> {
    ensure_managed_directory(parent, name)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn test_root() -> PathBuf {
        let token = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock should be available")
            .as_nanos();
        std::env::temp_dir().join(format!(
            "respectabullz-managed-path-test-{}-{token}",
            std::process::id()
        ))
    }

    #[test]
    fn creates_only_canonically_contained_directories() {
        let root = test_root();
        let documents = ensure_managed_directory(&root, "documents")
            .expect("managed documents should be created");
        let staging = ensure_managed_grandchild(&documents, ".staging")
            .expect("managed staging should be created");

        assert_eq!(documents.parent(), fs::canonicalize(&root).ok().as_deref());
        assert_eq!(staging.parent(), Some(documents.as_path()));
        fs::remove_dir_all(&root).expect("test storage should clean up");
    }

    #[test]
    fn rejects_escaping_or_nested_names() {
        let root = test_root();
        for name in ["", ".", "..", "../escape", "nested/path", "nested\\path"] {
            assert!(ensure_managed_directory(&root, name).is_err());
        }
        if root.exists() {
            fs::remove_dir_all(&root).expect("test storage should clean up");
        }
    }

    #[cfg(unix)]
    #[test]
    fn rejects_symbolic_link_managed_roots() {
        use std::os::unix::fs::symlink;

        let root = test_root();
        let outside = test_root();
        fs::create_dir_all(&root).expect("root should exist");
        fs::create_dir_all(&outside).expect("outside should exist");
        symlink(&outside, root.join("documents")).expect("fixture symlink should be created");

        assert!(ensure_managed_directory(&root, "documents").is_err());
        fs::remove_dir_all(&root).expect("test root should clean up");
        fs::remove_dir_all(&outside).expect("outside should clean up");
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn rejects_windows_junction_managed_roots() {
        use std::process::Command;

        let root = test_root();
        let outside = test_root();
        let junction = root.join("documents");
        fs::create_dir_all(&root).expect("root should exist");
        fs::create_dir_all(&outside).expect("outside should exist");

        let output = Command::new(r"C:\Windows\System32\cmd.exe")
            .args(["/D", "/C", "mklink", "/J"])
            .arg(&junction)
            .arg(&outside)
            .output()
            .expect("junction command should launch");
        assert!(
            output.status.success(),
            "junction fixture should be created: {}",
            String::from_utf8_lossy(&output.stderr)
        );

        assert!(ensure_managed_directory(&root, "documents").is_err());
        fs::remove_dir(&junction).expect("junction should clean up without touching its target");
        fs::remove_dir_all(&root).expect("test root should clean up");
        fs::remove_dir_all(&outside).expect("outside should clean up");
    }
}

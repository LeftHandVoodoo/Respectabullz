#!/usr/bin/env python3
"""
Start Respectabullz Tauri development server.

This script starts the Tauri dev server with proper environment setup.
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path


def resolve_command(name: str, search_path: str) -> str:
    """Resolve a tool once so child processes cannot be redirected through PATH."""
    resolved = shutil.which(name, path=search_path)
    if not resolved:
        raise FileNotFoundError(name)
    return str(Path(resolved).resolve())


def main():
    # Get the project root directory
    project_root = Path(__file__).parent.absolute()
    
    # Rust toolchain path (adjust if your username is different)
    rust_path = Path.home() / ".rustup" / "toolchains" / "stable-x86_64-pc-windows-msvc" / "bin"
    
    # Build a child environment without mutating the current Python process.
    child_env = os.environ.copy()
    current_path = child_env.get("PATH", "")
    rust_bin = str(rust_path)
    if rust_bin not in current_path:
        child_env["PATH"] = os.pathsep.join([rust_bin, current_path])
        print(f"Added Rust to PATH: {rust_bin}")

    cargo_name = "cargo.exe" if sys.platform == "win32" else "cargo"
    npm_name = "npm.cmd" if sys.platform == "win32" else "npm"

    # Verify cargo is accessible
    try:
        cargo_command = resolve_command(cargo_name, child_env["PATH"])
        result = subprocess.run(
            [cargo_command, "--version"],
            capture_output=True,
            text=True,
            check=True,
            shell=False,
            env=child_env,
        )
        print(f"✓ Found: {result.stdout.strip()}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("✗ Error: Cargo not found. Please ensure Rust is installed and in PATH.")
        sys.exit(1)
    
    # Verify npm is accessible
    try:
        npm_command = resolve_command(npm_name, child_env["PATH"])
        result = subprocess.run(
            [npm_command, "--version"],
            capture_output=True,
            text=True,
            check=True,
            shell=False,
            env=child_env,
        )
        print(f"✓ Found npm: {result.stdout.strip()}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("✗ Error: npm not found. Please ensure Node.js is installed and in PATH.")
        sys.exit(1)
    
    # Change to project directory
    os.chdir(project_root)
    
    print("\nStarting Tauri development server...")
    print("=" * 50)
    
    # Run the already-resolved npm launcher with fixed arguments.
    try:
        subprocess.run(
            [npm_command, "run", "tauri:dev"],
            check=True,
            shell=False,
            env=child_env,
        )
    except KeyboardInterrupt:
        print("\n\nStopped by user.")
        sys.exit(0)
    except subprocess.CalledProcessError as e:
        print(f"\n✗ Error running dev server: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print("\n✗ Error: npm not found. Please ensure Node.js is installed and in PATH.")
        sys.exit(1)

if __name__ == "__main__":
    main()


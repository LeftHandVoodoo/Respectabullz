#!/usr/bin/env python3
"""
Start Respectabullz Tauri development server.

This script starts the Tauri dev server with proper environment setup.
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    # Get the project root directory
    project_root = Path(__file__).parent.absolute()
    
    # Rust toolchain path (adjust if your username is different)
    rust_path = Path.home() / ".rustup" / "toolchains" / "stable-x86_64-pc-windows-msvc" / "bin"
    
    # Get current PATH
    current_path = os.environ.get("PATH", "")
    
    # Add Rust to PATH if not already there
    rust_bin = str(rust_path)
    if rust_bin not in current_path:
        os.environ["PATH"] = f"{rust_bin};{current_path}"
        print(f"Added Rust to PATH: {rust_bin}")
    
    # Verify cargo is accessible
    try:
        result = subprocess.run(
            ["cargo", "--version"],
            capture_output=True,
            text=True,
            check=True,
            shell=(sys.platform == "win32")
        )
        print(f"✓ Found: {result.stdout.strip()}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("✗ Error: Cargo not found. Please ensure Rust is installed and in PATH.")
        sys.exit(1)
    
    # Verify npm is accessible
    try:
        result = subprocess.run(
            ["npm", "--version"],
            capture_output=True,
            text=True,
            check=True,
            shell=(sys.platform == "win32")
        )
        print(f"✓ Found npm: {result.stdout.strip()}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("✗ Error: npm not found. Please ensure Node.js is installed and in PATH.")
        sys.exit(1)
    
    # Change to project directory
    os.chdir(project_root)
    
    print("\nStarting Tauri development server...")
    print("=" * 50)
    
    # Run npm tauri:dev
    # On Windows, use shell=True to find npm.cmd
    try:
        if sys.platform == "win32":
            subprocess.run(["npm", "run", "tauri:dev"], check=True, shell=True)
        else:
            subprocess.run(["npm", "run", "tauri:dev"], check=True)
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


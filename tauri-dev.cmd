@echo off
set "PATH=C:\Users\bax11.MIKE\.rustup\toolchains\stable-x86_64-pc-windows-msvc\bin;%PATH%"
where cargo >nul 2>&1
if errorlevel 1 (
    echo Cargo not found in PATH
    exit /b 1
)
tauri dev


$rustPath = "C:\Users\bax11.MIKE\.rustup\toolchains\stable-x86_64-pc-windows-msvc\bin"
$env:PATH = "$rustPath;$env:PATH"
$env:CARGO_HOME = "C:\Users\bax11.MIKE\.cargo"
$env:RUSTUP_HOME = "C:\Users\bax11.MIKE\.rustup"

# Verify cargo is accessible
$cargoPath = Join-Path $rustPath "cargo.exe"
if (-not (Test-Path $cargoPath)) {
    Write-Host "Error: Cargo not found at $cargoPath"
    exit 1
}

Write-Host "Using cargo from: $cargoPath"
& cargo --version
tauri dev


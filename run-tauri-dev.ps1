$ErrorActionPreference = 'Stop'

Push-Location -LiteralPath $PSScriptRoot
try {
    & npm.cmd run tauri:dev
    if ($LASTEXITCODE -ne 0) {
        throw "Tauri development command failed with exit code $LASTEXITCODE."
    }
} finally {
    Pop-Location
}


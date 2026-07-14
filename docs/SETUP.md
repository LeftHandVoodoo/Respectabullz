# Respectabullz Setup Guide

Last reviewed: 2026-07-14

This guide covers source development on Windows. A verified public portfolio
installer has not yet been established. Do not use the historical restore,
clear/reset, or test-data removal controls with important records.

## Requirements

- Windows 10 or later, 64-bit
- Git
- Node.js 22.x with npm 10.x (`.nvmrc` pins the local/CI Node release)
- Rust stable toolchain
- Microsoft Visual Studio C++ Build Tools required by Tauri
- Microsoft Edge WebView2 Runtime

Confirm the main tools in PowerShell:

```powershell
node --version
npm --version
rustc --version
cargo --version
```

## Clone and install

```powershell
git clone https://github.com/LeftHandVoodoo/Respectabullz.git
Set-Location .\Respectabullz
npm ci
```

`npm ci` uses the committed lockfile. Use it for reproducible review unless a
dependency update is the task.

## Run the desktop application

```powershell
npm run tauri:dev
```

The first Tauri build can take several minutes while Rust dependencies compile.

For frontend-only iteration:

```powershell
npm run dev
```

The Vite-only mode cannot validate native SQLite, filesystem, dialog, notification,
shell, or packaging behavior. Do not treat it as an end-to-end test.

## Configuration

No environment file is required for the normal runtime database path.

Supported development values include:

```dotenv
VITE_APP_NAME="Respectabullz"
VITE_LOG_LEVEL="debug"
```

`DATABASE_URL="file:./data/respectabullz.db"` is used only by optional Prisma
reference tooling. Runtime data is opened through `tauri-plugin-sql`.

### Do not configure a GitHub token

Do not set `VITE_GITHUB_TOKEN` or place any repository credential in `.env`. Vite
variables are renderer-visible and can be embedded in build artifacts. The historical
direct GitHub API design is unsupported.

The remediation reporter shows the full sanitized preview, then copies that reviewed
draft and opens the fixed blank GitHub Issues/new page only after an explicit click.
Report contents are not placed in the URL. Review the copied text again before pasting
and submitting because automatic redaction cannot identify every sensitive domain
detail. Use the private route in [SECURITY.md](../SECURITY.md) for a vulnerability.

The checked-in `.env.example` accepts no GitHub token or repository destination. Its
`VITE_APP_VERSION` value is a display mirror checked against canonical `VERSION`; it
is not independently authoritative.

## Local data locations

The Tauri application-data directory on Windows contains or can contain:

```text
%APPDATA%\com.respectabullz.app\
├── respectabullz.db
├── photos\
├── documents\
├── contracts\
└── logs\respectabullz.log
```

The exact base path is resolved by Tauri. A user-selected export target can live
elsewhere. A custom contracts folder is authorized by the native folder dialog for the
current app session only; reselect it after every restart. The application ignores a
persisted legacy custom-path setting because the native grant does not survive restart.

The database, files, logs, and current exports are plaintext unless Windows or the
destination storage supplies encryption. Do not use real client records for
development, screenshots, or issue reproduction.

## Sample and demo data

Production first launch offers only **Start Fresh** with an empty database and exposes
no synthetic-data control. For controlled portfolio capture, run:

```powershell
npm run demo:dev
```

This development flavor uses the separate `com.respectabullz.demo` Tauri identity,
application-data directory, asset scope, and inline capability. Both the interface
and Rust command require that exact identity plus a debug build; ordinary
`npm run tauri:dev` cannot expose or invoke the seed. The seed refuses to run when any
user-created application record exists, uses fixed IDs/dates, reserved `.test`
contacts, `202-555-01xx` phone numbers, and `DEMO-*` animal identifiers. Focused tests
cover those boundaries.

The demo has no automated teardown and is not exposed in production. Do not weaken
the identity guards or treat fixture output as customer evidence. Use only
rights-reviewed synthetic media.

## Restore, export, and reset status

- Restore is withdrawn and is not a supported operation.
- Existing JSON and ZIP outputs are partial exports, not verified backups. The ZIP is
  written directly to the exact native-dialog target and is not atomic; interruption
  can leave an incomplete file.
- There is no verified in-app factory reset.
- External exports and custom directories remain outside application lifecycle
  control.

The remediation UI removes restore, **Clear All Data**, and **Remove Test Data**. Any
older build that still exposes those controls should be treated as unsupported. See
[Reliability](RELIABILITY.md),
[Privacy](../PRIVACY.md), and the proposed [backup format](BACKUP_FORMAT.md).

## Local checks

Run the following from PowerShell:

```powershell
npm run lint
npm run typecheck
npm run test -- --run
npm run build
npm run version:check
```

`npm run version:check` is a drift-enforcing gate. It compares canonical `VERSION`
with npm package and lock metadata, the Rust crate and lock entry, Tauri configuration,
the generated frontend constant, and `.env.example` display metadata.

The dated baseline, coverage command, advisory counts, and missing checks are in
[`TEST_EVIDENCE.md`](case-study/TEST_EVIDENCE.md).

## Build a local Windows bundle

```powershell
npm run tauri:build
```

This command can produce an NSIS installer locally. A successful local build does not
make the artifact a verified release.

Before publishing an installer, require:

- the exact tag and commit in all presentation material;
- clean lint, type, tests, and critical-path evidence;
- a controlled Windows build and clean-machine smoke test;
- dependency and secret-scan triage;
- SHA-256 checksum;
- SBOM where practical; and
- explicit signing status.

If unsigned, label the artifact as unsigned and explain that Windows SmartScreen may
warn. A checksum provides integrity for the downloaded bytes; it does not establish
publisher identity or software safety.

## Optional Prisma reference tooling

Prisma is not the runtime database layer. These commands are for schema/reference
work only and can drift from runtime migrations:

```powershell
npm run db:generate
npm run db:studio
```

Do not use `db:push` or `db:migrate` against valuable data unless the task explicitly
requires it and the resulting runtime compatibility has been reviewed.

## Troubleshooting

### Rust or linker errors

```powershell
rustup update stable
rustup default stable
```

Confirm Visual Studio Build Tools include the Desktop development with C++ workload.

### Port 1420 is busy

Find the owning process before terminating anything:

```powershell
Get-NetTCPConnection -LocalPort 1420 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress, LocalPort, State, OwningProcess
```

### Dependency install problems

Preserve `package-lock.json`. Remove only generated dependencies, then reinstall:

```powershell
Remove-Item -LiteralPath .\node_modules -Recurse -Force
npm ci
```

### Database errors

Do not delete or replace the database as a first troubleshooting step. Copy the
entire application-data directory to a safe location, record the exact app version
and error, and reproduce with a synthetic database where possible.

Restore is not available as a recovery shortcut.

### Logs

Logs can be stored under the application's `logs` directory. Treat them as sensitive:
review names, paths, error details, and contextual values before sharing.

## Updating source

Before pulling changes, preserve the current commit and use synthetic data:

```powershell
git status --short --branch
git pull --ff-only
npm ci
```

Automatic migration does not currently have complete transactional/restart evidence.
Do not assert that an upgrade preserves every record and file until the supported
migration matrix passes.

## Related documentation

- [Architecture](ARCHITECTURE.md)
- [Reliability](RELIABILITY.md)
- [Threat model](THREAT_MODEL.md)
- [Privacy](../PRIVACY.md)
- [Security](../SECURITY.md)
- [Rights](../RIGHTS.md)

# Respectabullz Development Guide

Respectabullz is publicly visible for portfolio review but is not an open-source
project. Public visibility is not an invitation to submit changes. Read
[RIGHTS.md](RIGHTS.md) before reusing material or proposing work, and obtain
written contribution terms from the repository owner before submitting code,
documentation, assets, or contract language.

## Development environment

The supported development environment is Windows with PowerShell.

### Prerequisites

- Node.js 22.x (`.nvmrc` pins the local/CI Node release)
- npm 10.x
- Rust installed through [rustup](https://rustup.rs/)
- Git
- Microsoft C++ Build Tools and WebView2 prerequisites required by Tauri

### Install and run

```powershell
git clone <repository-url>
Set-Location Respectabullz
npm ci
npm run tauri:dev
```

`npm run dev` starts only the Vite frontend. Database and native file operations
require the full Tauri process, so frontend-only mode is not an end-to-end app
test.

Do not add a GitHub personal access token to this project. The bug-report flow is
credential-free: it shows a sanitized draft for review, lets the user copy it,
and can open the fixed blank GitHub Issues/new page. Report text is not placed in
the URL; the user pastes and submits it manually.

## Working agreement

1. Read `AGENTS.md`, the root documentation, and the relevant source and tests.
2. Keep changes small, focused, and consistent with the existing architecture.
3. Add or update tests for changed behavior, including failure and cancellation
   paths where relevant.
4. Update user-facing documentation and `CHANGELOG.md` when behavior changes.
5. Run the applicable checks and report the exact commands and results.
6. Stage only files related to the change.

Use conventional commit subjects such as `feat:`, `fix:`, `test:`, `docs:`, and
`chore:`. Do not commit generated coverage output, local databases, logs, secrets,
or unrelated workspace changes.

## Code conventions

- Keep TypeScript strict and avoid untyped escape hatches.
- Use functional React components and focused hooks.
- Follow the existing domain-oriented structure under `src/components/`,
  `src/hooks/`, and `src/lib/`.
- Use Tailwind and the existing shared UI primitives.
- Use the centralized logger instead of adding production `console.*` calls.
- Never log credentials, raw contract contents, health details, or unnecessary
  personal information. Structured logging reduces ambiguity; it does not make
  arbitrary data safe to record.

## Required checks

Run the checks that apply to the change:

```powershell
npm run lint
npm run version:check
npm run check:demo-data
npm run typecheck
npm run test -- --run
npm run build
npm run test:coverage
cargo test --manifest-path src-tauri/Cargo.toml
```

Behavioral changes require focused regression tests in addition to the broad
suite. A changing test count is not a quality target. The dated baseline and
current limitations are recorded in
[docs/case-study/TEST_EVIDENCE.md](docs/case-study/TEST_EVIDENCE.md).

The required GitHub Actions workflow repeats these checks, adds a Windows Rust/Tauri
build, secret-history and artifact scans, dependency evidence, and installer
checksums. A configured workflow is not proof of a release; link the successful
final-SHA run and retained artifacts when making a release claim.

For release candidates, also build the Windows Tauri artifact in a clean
environment and exercise the installer and upgrade path with disposable data.
No release claim should exceed the evidence actually collected.

## Documentation map

- [README.md](README.md) — project status and presentation boundary
- [SECURITY.md](SECURITY.md) — security posture and private reporting guidance
- [PRIVACY.md](PRIVACY.md) — local data and export privacy boundary
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system architecture
- [docs/RELIABILITY.md](docs/RELIABILITY.md) — reliability claims and limitations
- [docs/BACKUP_FORMAT.md](docs/BACKUP_FORMAT.md) — partial export format and
  withdrawn recovery behavior
- [docs/API.md](docs/API.md) — internal API reference
- [docs/SETUP.md](docs/SETUP.md) — development setup

## Versioning

`VERSION` is the canonical semantic version. The bump helper updates npm package and
lock metadata, Rust crate and lock metadata, Tauri configuration, the frontend version
constant, and `.env.example` display metadata.

Run `npm run version:check` after a bump. It fails on invalid semantic versions or
drift across the nine checked sources. Review the resulting diff before tagging.

## Release gate

A public release requires more than a successful frontend build:

- version fields and release notes agree;
- lint, focused tests, the full test suite, and Rust tests pass;
- the Windows Tauri installer builds and is exercised on a clean machine;
- upgrade and data-migration paths are tested with disposable fixtures;
- partial exports are not described as verified backups;
- dependency findings are reviewed and recorded;
- checksums and an SBOM are generated for published artifacts;
- code-signing status is stated explicitly; and
- release notes link to the evidence used for each material claim.

The application has no in-app updater. Releases are installed manually from the
repository owner's published release channel.

## Security reports and questions

Do not place vulnerabilities, personal records, logs containing sensitive data,
or private contract material in a public issue. Follow the private reporting route
described in [SECURITY.md](SECURITY.md). General project questions should also use
a contact route approved by the repository owner.

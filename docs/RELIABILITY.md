# Reliability Model

Last reviewed: 2026-07-14 against commit
`fd21363beae044f0649a1e03f3bb6bcc2249f970`

## Purpose

This document separates demonstrated behavior from containment decisions and future
designs. It does not describe Respectabullz as production-grade.

Evidence labels used here:

- **Verified baseline** — reproduced locally with a command or direct code trace.
- **Current limitation** — behavior or evidence known to be incomplete.
- **Containment decision** — a feature is withdrawn or restricted to prevent an
  overclaim.
- **Proposed** — an acceptance contract that is not implemented.

## Current support summary

| Area | Status | What can be claimed |
| --- | --- | --- |
| Routine local CRUD | Partially exercised | Broad workflow implementation exists; coverage and failure evidence vary by module |
| UI optimistic updates | Path-specific | Some hooks restore cached state after errors; this is not end-to-end rollback |
| Individual file writes | Path-specific | Some utilities use write-to-temp then rename; this does not make database plus file work atomic |
| Declared schema-v4→v5 migration | Implemented; final Windows verification pending | One Rust/SQLx connection, `BEGIN IMMEDIATE`, per-connection busy timeout, explicit FK check, and seven real-SQLite tests; older versions unsupported |
| Legacy browser-storage conversion | Withdrawn | Read-only detection blocks before SQLite setup and preserves the payload; no automatic conversion or cleanup is attempted |
| Managed-document coordination | Implemented and path-tested | Create, tag/update, delete, canonical open, and startup reconciliation use a staged/tombstone/quarantine protocol around one-connection SQL transactions; this is not a global file-workflow guarantee |
| Partial exports | Available with qualification | Existing JSON/ZIP outputs export subsets of state; the ZIP writes directly to the exact dialog-granted target and is non-atomic, so neither output is a verified backup |
| Custom contract destination | Session-scoped | A native folder grant is used only for the current session; the folder must be reselected after restart and persisted legacy paths are ignored |
| Diagnostic logs | Path-specific | Redaction/truncation is scoped; clear/export serialize with pending disk writes, but semantic PII can remain |
| Restore | Withdrawn | No supported restore format or in-app recovery operation |
| Factory reset | Withdrawn | No verified operation removes every table and managed file |
| CI/release evidence | Workflow present; public final-SHA smoke pending | Frontend, Windows Rust/Tauri build/smoke on an ephemeral runner, history-secret, dependency-evidence, npm SBOM, artifact, and checksum jobs are defined; no successful public run or controlled release proof is linked yet |

## Reliability principles

### Success means committed state

A user-visible success message is valid only after every required side effect is
complete and verified. Queuing a write, copying one file, or updating cached UI state
is not sufficient.

### Failure must be visible and actionable

Operations must distinguish:

- user cancellation;
- validation rejection before mutation;
- complete success;
- complete failure with original state preserved; and
- partial failure requiring compensation or explicit recovery guidance.

Silent catch blocks and generic success messages are not acceptable on destructive or
cross-boundary paths.

### Database and filesystem are separate systems

SQLite transactions cannot roll back filesystem changes. Each workflow that touches
both needs a protocol:

1. define the invariant;
2. stage the reversible side effect;
3. commit the database change in a transaction where appropriate;
4. finalize the file operation;
5. compensate or roll back on every failpoint; and
6. verify the resulting database rows and files before success.

Temporary-file rename can protect an individual destination from a torn write, but
does not satisfy this whole protocol by itself.

## Critical paths and remaining gaps

### Migrations

The reviewed baseline applied migration statements without one trustworthy
connection-owned transaction. The remediation replaces that scoped path with a typed
Rust command that acquires one SQLx connection, sets a per-connection busy timeout,
and starts `BEGIN IMMEDIATE` for fresh setup or the declared schema-v4→v5 upgrade. It
enables/verifies foreign keys, validates required tables, applies `schema.sql`,
conditionally adds `contacts.company_name`, updates the schema version, runs
`foreign_key_check`, then commits or rolls back.

Seven real-SQLite tests cover:

- a complete fresh schema;
- schema v4→v5;
- a no-op second run on the current schema;
- serialized concurrent initialization through two connections to one database;
- injected failure after the column change, rollback, and clean retry;
- rejection of an unsupported schema without mutation; and
- rejection of a foreign-key violation.

`cargo test --manifest-path src-tauri/Cargo.toml` passes 7/7 for this implementation.
The supported baseline is intentionally narrow: older schemas are rejected. A final
Windows Tauri build, packaged upgrade from the real supported prior release, and
interruption/locked-file evidence remain pending. The command's FK setting applies to
its acquired setup connection; it is not evidence that every later pooled application
connection enforces foreign keys.

An older, separate browser-storage importer issued many independent table writes and
deleted the source payload after its success path. It is now removed. A read-only
check for the legacy `respectabullz_db` key runs before any SQLite setup; detection or
an inspection error blocks startup and leaves the payload unchanged. Recovery from
that legacy format remains unsupported until a staged, transactional import contract
and failure matrix are implemented.

### Documents and managed files

Document upload, metadata/tag updates, and deletion cross SQLite and filesystem
boundaries. The reviewed baseline copied a file before later database/link work and
could delete metadata when file removal failed. The remediation replaces that managed
path with Rust commands and explicit recovery state:

- upload selection does not make a permanent copy;
- create validates a 100 MB limit and supported file signatures, stages the copy, and
  creates the document, tags, and entity link on one SQLx connection/transaction;
- notes/tag edits share one transaction;
- delete uses a recoverable tombstone instead of treating an immediate file removal as
  proof of complete success; an ambiguous commit result preserves that tombstone for
  startup to decide from durable row state;
- managed open resolves only the canonical database-backed path; and
- startup reconciliation takes `BEGIN IMMEDIATE`, removes uncommitted staging files,
  restores row-backed
  tombstones, removes committed-delete tombstones, quarantines unregistered final
  files, and blocks startup on actual failures.

The operational app shell is gated behind successful database integrity setup and
document reconciliation. A failure presents a blocking retry screen. Reaching the
10,000-entry reconciliation scan limit produces a warning and permits startup when no
actual failure was recorded; that result is truncated and not proof of an exhaustive
scan.

The reconciliation state model covers:

| File state | Database state | Required outcome |
| --- | --- | --- |
| Absent | Absent | Clean precondition or complete delete |
| Present | Present and valid | Complete success |
| Present | Absent | Detect and remove/quarantine orphan |
| Absent | Present | Detect missing file and preserve actionable metadata |

The Rust library suite includes managed-document success and failure/reconciliation
paths. This evidence is deliberately scoped: it does not make
SQLite and the filesystem one transaction, prove every other photo/contract/export
workflow, or replace packaged-Windows and adversarial file-system testing.

### Partial exports and external contract destinations

The partial ZIP exporter writes directly to the exact file selected in the native save
dialog. The runtime grant does not cover a sibling temporary path, so this export does
not use temp-write/rename and must not be called atomic. Interruption can leave an
incomplete target; the output is not a recovery artifact. Before destination
selection, the exporter now reads every enumerated managed photo and aborts on any
enumeration/read failure. This prevents a missing photo from being silently presented
as a successful ZIP, but does not make the subset complete or the final write atomic.

Likewise, a custom contract-folder grant lasts only for the current app session. The
generation path ignores a previously persisted custom path and uses the application
default after restart unless the user reselects the folder. This makes the native
permission lifetime visible instead of assuming stale authority.

### Optimistic UI

An optimistic cache rollback repairs what the user sees; it does not prove that the
database or filesystem returned to its original state. Each optimistic mutation must
be paired with persistence assertions and a refetch after an injected failure.

### Clear/reset

The legacy clear path does not enumerate every current table or managed-file
category, runs sequential statements without a verified transaction, and is also
used by test-data removal. No complete erasure claim is permitted.

A future factory reset must:

- inventory every table and managed directory;
- exclude user-owned external files unless the user explicitly selects them;
- preflight permissions and open handles;
- use a database transaction;
- report file failures without claiming complete deletion;
- clear local first-launch/settings state consistently; and
- verify the postcondition by enumerating residual records and managed files.

## Restore withdrawal

The legacy ZIP restore extracted photos before database import. Database import in the
reviewed implementation did not complete, allowing a failure to mutate files while
leaving records unchanged. The export also omitted categories of managed data.

Restore is therefore withdrawn, and existing exports are called **partial exports**.
The future contract is documented in [BACKUP_FORMAT.md](BACKUP_FORMAT.md). No restore
button or demo may imply that contract exists today.

## Local verification baseline

At the reviewed commit, lint, TypeScript, and 290 tests passed locally. Configured
coverage reported 10.93% statements/lines, with migration and key document modules at
0%. No required CI workflow or Windows clean-machine smoke evidence existed.

The later remediation working tree adds real-SQLite migration tests for the declared
path plus managed-document success and reconciliation/failure coverage. The latest
local pre-release checkpoint passes 354 frontend tests in 39 files
and 39 Rust tests. A pinned Node 22.23.1/npm 10.9.8 rehearsal also passes lint,
TypeScript, version/demo guards, web and NSIS builds/scans, production audit,
history/current-source Gitleaks scans, workflow lint, and npm SBOM generation.

The local pre-release coverage checkpoint meets the configured initial floors at
22.21% statements/lines, 62.73% branches, and 27.85% functions. Statement/line coverage
is still low across the broad application; the stronger claim is limited to focused
tests for the new migration, managed-document, and startup paths.

A native smoke exposed a Tokio nested-runtime startup panic. After correction, a
rebuilt executable remained alive for eight seconds with empty stderr. The attempted
process-level `APPDATA` override did not isolate Tauri on this Windows machine: the
real profile's SQLite WAL/SHM and WebView state were opened, while the main database
file mtime remained unchanged. No second local launch was attempted. The exact final
SHA must pass the workflow's smoke step on an ephemeral hosted runner before this is
public release evidence.

See [TEST_EVIDENCE.md](case-study/TEST_EVIDENCE.md) for the exact commands and scope
caveats. Passing local checks does not close the release and clean-machine gates below.

## Track A reliability gate

A recruiter-visible Track A build may describe reliability work only within tested
scope. Minimum gate:

- restore controls unavailable and every recovery overclaim removed;
- destructive clear/test-data removal unavailable or accurately bounded;
- one declared migration path transactional, restartable, and foreign-key checked;
- three demonstrated workflows with success and meaningful failure-path evidence;
- no demonstrated database/filesystem path silently reports success after partial
  failure;
- required public CI for the displayed commit; and
- residual risks linked from README and case study.

The managed-document work supplies scoped workflow evidence, but the overall gate
remains open until the other conditions pass. Until then, this document is a
remediation contract and limitation
record, not proof that Track A is complete.

## Track B reliability gate

Complete recovery claims require the full format, every-table/every-file fixture,
round-trip and failpoint matrix, interruption/restart testing, factory-reset proof,
supported historical migrations, and clean Windows release evidence. This work is
separate from the initial portfolio containment package.

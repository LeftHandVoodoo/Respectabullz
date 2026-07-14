# Threat Model

Last reviewed: 2026-07-14

## Scope

This threat model covers the single-user Windows desktop application, its React/Tauri
process, local SQLite database, managed files, imports/exports, diagnostics, and
release artifacts. It is a self-review and does not represent an independent security
assessment.

## Assets

- breeder and client contact information;
- animal identity, health, genetic, pedigree, and breeding records;
- sales, deposits, expenses, and transport details;
- photos, contracts, uploaded documents, and generated packets;
- application settings and local diagnostic logs;
- source/build integrity and any future signing identity; and
- user trust in destructive, export, and recovery messages.

## Trust boundaries

```mermaid
flowchart LR
    U["Windows user"] --> R["React renderer"]
    R --> T["Tauri capability and plugin boundary"]
    T --> DB["Local SQLite"]
    T --> FS["Managed AppData files"]
    T --> X["User-selected external paths"]
    R -. "user-reviewed browser action" .-> G["GitHub / external web"]
    Build["npm + Cargo supply chain"] --> R
    Build --> T
```

Crossing into an external path, browser, cloud-synchronized folder, removable drive,
or uploaded issue leaves the application-managed local boundary.

## Assumptions and non-goals

The application assumes the Windows user and operating system are not already fully
compromised. It does not provide application login, multi-user isolation, field-level
encryption, cloud authorization, or protection from an attacker who controls the
Windows account.

It still needs to handle untrusted files, malformed databases/archives, path input,
dependency compromise, accidental destructive actions, partial failure, and renderer
compromise within granted capabilities.

## Threats and required controls

| Threat | Impact | Current posture | Required evidence/control |
| --- | --- | --- | --- |
| Renderer-side credential exposure | Repository compromise | Historical Vite-bundled PAT design is unsupported | No credential inputs or authorization header in renderer/build; secret and artifact scan |
| Renderer compromise using broad capabilities | Read/write/open beyond intent | CSP/capabilities exist; `http://asset.localhost` image access is allowed for Tauri `convertFileSrc`, while connection sources are self-only. The SQL plugin preloads one fixed pool and renderer capabilities omit pool load/close, but renderer select/execute authority still reaches the application database | Least-privilege capability/asset-origin diff, negative permission/network tests, and continued movement of high-risk mutations behind typed Rust commands |
| Partial restore mutates files | Data inconsistency/loss | Restore withdrawn | Staged format, full validation, pre-restore snapshot, rollback/failpoint matrix |
| Partial legacy browser-storage conversion | Split or duplicated records and source-data loss | Non-transactional importer and automatic cleanup removed; read-only detection blocks before SQLite setup and preserves the payload | Versioned transactional importer, full mapping/validation, rollback/retry matrix, and explicit source-retention policy before reinstatement |
| Incomplete reset reports success | Privacy and trust failure | No verified factory reset | Table/file inventory, transaction, residual enumeration, precise result summary |
| Database/filesystem split-brain | Orphans or broken references | Managed documents use staged files, recoverable tombstones/quarantine, `BEGIN IMMEDIATE` serialization, startup reconciliation, and focused Rust tests; commit ambiguity preserves residue for durable-state recovery; other file workflows remain path-specific | Extend state machines and injected-failure tests to every database/file workflow |
| Bounded reconciliation misses later residue | Uninspected orphan/tombstone remains | Actual failures block operational routes, but the 10,000-entry scan limit warns and permits startup with an explicitly truncated result | Operational continuation/full-scan tooling, residue metrics, and limit-exhaustion tests before claiming exhaustive cleanup |
| Interrupted or incomplete partial ZIP export | Incomplete file mistaken for recovery | ZIP writes directly to the exact dialog-granted target and is explicitly non-atomic/non-recoverable; managed-photo enumeration/read failures abort before the save dialog instead of silently omitting files | Clear partial-export labeling, visible write failure, independent backups, and future staged recovery format |
| Malicious ZIP/archive | Traversal, overwrite, decompression exhaustion | No complete adversarial matrix | Canonical paths, entry/size/count limits, duplicate rejection, staged extraction |
| Malformed image/PDF/Office file | Parser exploit or resource exhaustion | Managed-document intake enforces a 100 MB cap and supported signature checks; this is not parser-safety proof | Dimension/page/decompression limits, timeout/resource tests, maintained parsers, and broader adversarial fixtures |
| Path manipulation or stale grant | Access outside managed/dialog-selected scope | Managed-document selection is dialog-scoped and canonical opens are database-backed; custom contract folders are session-scoped and persisted legacy paths are ignored | Canonicalization, allowlisted roots/extensions, symlink/reparse handling, and negative tests for every file workflow |
| Sensitive log/report disclosure | Personal data leaves device | Central rules redact common sensitive keys/values and truncate output; log clear/export serialize with pending writes; semantic PII can remain | Default minimization, preview, focused redaction/ordering tests, explicit consent, retention controls |
| Plaintext local storage | Disclosure after local/device access | Database/files/exports are plaintext | Document limitation; recommend OS/storage encryption; future encryption design if required |
| Dependency compromise/advisory | Code execution or data access | Production npm graph is clean for the dated lockfile; 7 full-graph development findings are triaged in the [risk ledger](case-study/DEPENDENCY_RISK.md); pinned Rust audit retains 5 vulnerability entries plus warning groups after two patch updates | Locked installs, per-target reachability triage, secret/dependency scans, SBOM, controlled framework upgrades |
| Unsigned or substituted installer | Publisher impersonation/malware delivery | Signing evidence not established | Controlled Windows build, checksum, SBOM, explicit unsigned status; verified signature/timestamp if signed |
| Stale documentation | Unsafe user action and false assurance | High-risk public manuals corrected; legacy reports archived with obsolete banners | Keep claim-to-evidence review and link checks in the change gate |

## Existing defensive signals

The repository includes:

- a configured CSP;
- Tauri capabilities rather than unrestricted shell execution;
- parameterized SQL in database modules;
- selected path and filename validation;
- UUID-based managed filenames in newer paths;
- structured local logging; and
- an operational-shell startup gate with retry on actual database-integrity or
  document-reconciliation failures; and
- write-to-temp/rename helpers for selected file writes.

These are useful controls, not comprehensive guarantees. Their coverage, scope, and
failure behavior must be verified per boundary.

## Privacy abuse cases

- A screenshot includes a real client name or Windows username.
- A bug report includes a token, stack trace, path, or record content.
- A clear/reset message causes a user to discard other copies while residual local
  files remain.
- A partial export is called a backup, leading to unrecoverable records.
- A contract or export saved to a synchronized folder is assumed to remain local.
- A developer runs the standard seed against an important empty database or mistakes
  fixture records for customer evidence.

The controls are synthetic demo data, user-visible previews, precise scope language,
the separate `com.respectabullz.demo` application-data and capability boundary,
explicit external-boundary notices, and verified residual enumeration. The seed still
has no automated teardown and refuses existing user-created records rather than deleting data.

## Security test corpus

Security-sensitive tests should include:

- `..`, rooted, alternate-separator, reserved-device, long-path, Unicode-normalization,
  symlink, junction, and reparse-point paths;
- duplicate/case-colliding ZIP entries, zip bombs, huge entry counts, invalid CRC,
  truncated archives, and nested archives;
- oversized/decompression-heavy images, invalid PDFs/Office files, and extension/
  content mismatches;
- locked, read-only, missing, low-space, and permission-denied destinations;
- database corruption, foreign-key violations, version mismatch, interruption, and
  retry; and
- report/log payloads containing emails, phone numbers, Windows paths, access tokens,
  and record fragments.

## Release and review cadence

Revisit this model whenever permissions, CSP, storage, imports, exports, logging,
reporting, migrations, recovery, or release automation changes. A release summary
should link to the exact commit, dated scans, accepted-risk decisions, and tests for
affected threats.

Related documents: [Security](../SECURITY.md), [Privacy](../PRIVACY.md),
[Reliability](RELIABILITY.md), and [Test evidence](case-study/TEST_EVIDENCE.md).

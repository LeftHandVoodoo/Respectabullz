# Security Policy

Respectabullz is a local-first Windows desktop project under active portfolio
remediation. This policy describes the current reporting route, evidence boundaries,
and known limitations. It is not a security certification or warranty.

## Supported scope

Security remediation is focused on the current default-branch source. Previously
published binaries and older `1.10.x` builds are not represented as independently
assessed or production-safe. A release is not considered a verified portfolio
artifact unless its tag, commit, checksum, dependency results, signing status, and
clean-machine smoke evidence are published together.

## Report a vulnerability privately

Use GitHub's private security-advisory form:

<https://github.com/LeftHandVoodoo/Respectabullz/security/advisories/new>

Do not open a public issue containing exploit details, credentials, personal records,
database files, logs, photos, contracts, or other sensitive material.

Please include only the minimum information needed to reproduce the issue:

- affected version, tag, or commit;
- operating-system version;
- affected component and prerequisites;
- reproduction steps using synthetic data;
- observed and expected behavior;
- plausible impact; and
- a minimal proof of concept with secrets and personal information removed.

No fixed response or remediation timeline is promised. Receipt, severity, and next
steps will be communicated through the private advisory when possible.

## Current assessment status

The repository has undergone self-review and local automated checks. It has not been
independently penetration tested or certified.

On 2026-07-14, local checks against commit
`fd21363beae044f0649a1e03f3bb6bcc2249f970` found:

- ESLint, TypeScript compilation, and 290 Vitest tests passing;
- low overall automated coverage, including 0% coverage in critical migration and
  document paths;
- 24 npm advisory findings across all dependencies (3 critical, 9 high, 11 moderate,
  and 1 low); and
- 10 npm advisory findings in production dependencies (4 high and 6 moderate).

Advisory counts are time-sensitive signals, not exploitability conclusions. They
must be triaged for reachability, affected runtime, upgrade risk, and compensating
controls. See [test evidence](docs/case-study/TEST_EVIDENCE.md) for exact commands and
missing gates.

The remediation tree defines a required GitHub Actions workflow with frontend,
Windows Rust/Tauri build and packaged smoke on an ephemeral hosted runner, secret-history, dependency-evidence,
npm CycloneDX SBOM, installer-artifact, and checksum jobs, plus weekly Dependabot review.
No successful public run is yet linked to a frozen final commit; the locally generated
SBOM is not a published release artifact, and there is no code-signing verification or
independent security report at this time.

## Security-relevant architecture

- Core records use local SQLite through `tauri-plugin-sql`.
- Photos, documents, contracts, and logs can be stored in application data; users can
  also select external export destinations.
- A Tauri capability boundary and content security policy are configured. Their
  current breadth remains under review and should not be interpreted as least-
  privilege proof.
- TypeScript modules issue parameterized SQL in many paths, but validation and
  authorization properties must be evaluated per operation.
- The application is single-user and has no application-level authentication or
  multi-user authorization model.
- Local database, managed files, logs, and current exports are plaintext unless the
  host or storage layer provides encryption.

The full boundary and attacker model is documented in
[`THREAT_MODEL.md`](docs/THREAT_MODEL.md).

## Withdrawn or unsupported security-sensitive features

### Restore

The historical restore path is withdrawn. It could mutate files before database
import completed and did not prove complete recovery. Restore must remain disabled in
any recruiter-visible build until the proposed format and failure matrix pass. The
current export formats are partial exports, not verified backups.

### Destructive reset

There is no verified in-app factory reset. Legacy clear/test-data removal paths do
not prove removal of every table and managed file and must not claim that all data was
deleted.

### GitHub credentials

A GitHub personal access token must not be placed in any `VITE_` variable, renderer
bundle, source file, documentation example, or distributed artifact. Older source
contained a renderer-side direct GitHub API design; that design is unsupported. The
remediation flow now prepares a sanitized full preview locally, requires user review,
copies that exact draft, and opens the fixed blank GitHub Issues/new page without a
bundled repository credential or direct API request. Report contents are not placed in
the URL. It attaches no logs, database records, photos, or documents automatically;
the user pastes and submits the report manually.

If a token was ever embedded in a build, revoke or rotate it and rebuild from a clean
environment. Deleting the local file alone does not invalidate the credential.

The latest local pre-release checkpoint passed 354 frontend tests in
39 files and 39 Rust tests. The exact tree also passed lint/type/
version/demo guards, web and NSIS builds, artifact scans, production audit,
source/history secret scans, workflow lint, and npm SBOM generation. Production npm
audit reported 0 findings; the informative full graph retained 7. Pinned Rust audit
retained 5 vulnerability entries plus warning groups after two transitive patch
updates; target reachability and deferrals are in the dependency risk ledger. A native smoke caught
a Tokio nested-runtime startup panic. After correction, the rebuilt executable remained
alive for eight seconds with empty stderr, but Windows/Tauri ignored the attempted local
`APPDATA` override and opened the real profile's SQLite sidecars. No records were deleted;
the main database file mtime was unchanged. Exact final-SHA smoke evidence is therefore
required from the ephemeral hosted CI runner.

## Known residual risks

- The declared schema-v4→v5 path is transaction- and failpoint-tested against real
  SQLite, but a packaged Windows upgrade is still pending, older schemas are rejected,
  and the setup connection's foreign-key setting is not global pooled-connection proof.
- Managed-document create, tag/update, delete, open, and startup reconciliation now
  use a staged/tombstone/quarantine protocol around `BEGIN IMMEDIATE` SQL transactions.
  Actual reconciliation failures block operational routes behind a retry screen;
  scan-limit truncation warns and is non-exhaustive. Ambiguous delete commits preserve
  the tombstone for startup to resolve from durable row state.
  Other database/filesystem workflows remain path-specific and may still partially
  complete because SQLite and the filesystem do not share a transaction.
- Managed-document intake enforces a 100 MB cap and signature checks for supported
  formats. Archive, image, PDF, and Office parsing still need broader adversarial and
  decompression/resource-limit evidence, including for other file workflows.
- The partial ZIP export writes directly to the exact dialog-granted target and is
  non-atomic; interruption can leave an incomplete file. Photo enumeration/read errors
  abort before destination selection rather than silently omitting managed photos.
  Custom contract-folder grants last only for the current session and must be
  reselected after restart.
- Central logging redacts sensitive context-key families and common credentials,
  paths, email/phone values, and UUIDs, and truncates long values before console,
  memory, or disk output. Focused tests cover those patterns, but semantic personal
  information outside the rules can still appear and must be reviewed before sharing.
  Log clear/export serialize with pending writes to avoid queue-order races.
- The CSP permits inline styles and `http://asset.localhost` image loading for Tauri
  `convertFileSrc`; connection sources are self-only. The SQL plugin preloads only
  `sqlite:respectabullz.db`, and renderer capabilities omit pool load/close authority.
  Renderer compromise can still issue select/execute operations against that fixed
  database, so capability and asset-origin scope still need least-privilege review.
- Dependency advisories remain unresolved. They have a dated local reachability and
  deferral triage in the risk ledger, but no final-SHA public scan evidence yet.
- Unsigned Windows artifacts do not establish publisher identity and may trigger
  SmartScreen.
- A local attacker with access to the Windows account or application-data directory
  can read or alter plaintext application data.

## Security expectations for changes

Security-sensitive changes should include:

- explicit trust boundaries and misuse cases;
- positive, negative, and failure-path tests;
- path, size, type, and resource limits for untrusted files;
- rollback or compensation behavior for cross-database/filesystem work;
- no credentials in renderer-visible configuration;
- dependency and secret scans with dated results;
- review of Tauri capabilities and CSP changes; and
- documentation of accepted residual risk.

Passing a scanner or test suite is evidence for a defined scope only. Do not describe
self-review as an independent audit, a checksum as authenticity, a signature as proof
of safety, or an advisory count as complete vulnerability knowledge.

## Related documents

- [Privacy](PRIVACY.md)
- [Threat model](docs/THREAT_MODEL.md)
- [Reliability](docs/RELIABILITY.md)
- [Future backup-format contract](docs/BACKUP_FORMAT.md)
- [Test evidence](docs/case-study/TEST_EVIDENCE.md)
- [Dependency risk ledger](docs/case-study/DEPENDENCY_RISK.md)

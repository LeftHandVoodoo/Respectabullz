# Security Policy

Respectabullz is a local-first Windows desktop project. This policy records the
current reporting route, implemented trust boundaries, and residual risks. It is a
self-review, not an independent penetration test, certification, or warranty.

## Supported scope

Security work applies to the current default-branch source and newly produced
artifacts. Older `1.10.x` source and binaries are not represented as having the same
controls. A release is verified only when its exact version tag, commit, dependency
reports, SBOMs, checksums, Authenticode verification, and clean-runner database-
readiness evidence are retained together.

## Report a vulnerability privately

Use GitHub's private security-advisory form:

<https://github.com/LeftHandVoodoo/Respectabullz/security/advisories/new>

Do not open a public issue containing exploit details, credentials, personal records,
database files, logs, photos, contracts, or other sensitive material.

Include only the minimum synthetic information needed to reproduce the issue:

- affected version, tag, or commit;
- operating-system version;
- component and prerequisites;
- reproduction steps using synthetic data;
- observed and expected behavior; and
- plausible impact and a minimal redacted proof of concept.

No fixed response or remediation timeline is promised. Receipt, severity, and next
steps will be communicated through the private advisory when possible.

## Current assessment status

The 2026-08-22 remediation addressed the identified application findings:

- Renderer SQL plugin permissions were removed. Reads and ordinary mutations now
  cross typed Rust commands backed by one fixed SQLite pool. Rust rejects multiple
  statements, schema/transaction/extension/filesystem SQL, oversized input, and
  unsupported parameter types. Multi-row sale operations use dedicated native
  transactions instead of renderer-controlled statement sequences.
- Filesystem capabilities are deny-by-default and limited to direct files in the
  managed photos, contracts, documents, and logs directories. Asset URLs expose only
  direct managed photo files. Native managed-path checks reject links and reparse
  points before sensitive document operations.
- Photo input and export enforce strict managed names, type/signature, dimensions,
  per-frame and aggregate decoded-pixel work, item-size, aggregate-size, and count
  limits. Animated formats are charged one full canvas per frame, including small
  delta frames. Packet PDFs embed validated data URLs under 8 MiB per photo, 25
  distinct photos, and 48 MiB total rather than fetching asset/remote/local-path URLs.
  Replaced or deleted database-referenced photos are physically cleaned when possible;
  unreferenced files are excluded from export.
- CSV cells are formula-neutralized and serialized consistently; managed document
  filenames are validated before preview/open. Inline preview is limited to PDFs that
  reject non-files and payloads above 20 MiB before reading and discard stale results;
  legacy image documents open in the system application instead of an inline decoder.
  PDF external navigation is blocked, and Help Markdown escapes raw HTML and
  allowlists safe links.
- The JavaScript lockfile reports zero advisories. Rust advisory policy has no
  unignored vulnerability entries and documents one unavailable-patch exception for
  an unselected SQLx MySQL/RSA option that is not compiled into the SQLite-only app.
- CI no longer uploads an unsigned installer and requires a versioned readiness marker
  after database initialization and reconciliation. A separate exact-version-tag
  release workflow imports a protected PFX, requires timestamping, runs all test and
  audit gates, verifies every executable/installer signature and certificate
  thumbprint, scans artifacts, and publishes SBOM/checksum evidence only after those
  checks pass.

Local automated checks exercise these boundaries, but configuration is not public run
evidence. Exact commands and results are maintained in
[test evidence](docs/case-study/TEST_EVIDENCE.md).

## Security-relevant architecture

- Core records use one local SQLite database owned by the Tauri process.
- The renderer can request read queries and ordinary single-statement data mutations
  through the constrained native boundary. This is query-shape containment, not
  per-record authorization or a sandbox for a fully compromised renderer.
- Photos, documents, contracts, and logs can be stored in application data. Users can
  select external export destinations, which leave application lifecycle control.
- The application is single-user and has no application login, multi-user
  authorization, cloud account, analytics backend, or synchronization service.
- Local databases, files, logs, and exports are plaintext unless the host or storage
  layer provides encryption.

The complete attacker and boundary model is in
[THREAT_MODEL.md](docs/THREAT_MODEL.md).

## Withdrawn or unsupported security-sensitive features

### Restore

The historical restore path remains withdrawn. It could mutate files before database
import completed and did not prove complete recovery. Current JSON and ZIP outputs are
partial exports, not verified backups.

### Destructive reset

There is no verified in-app factory reset. Legacy reset paths did not prove removal of
every table and managed file and must not be described as complete erasure.

### GitHub credentials

A GitHub personal access token must never be placed in a `VITE_` variable, renderer
bundle, source file, documentation example, or distributed artifact. The current bug
report flow sanitizes and previews a local draft, copies only after user review, and
opens a fixed blank GitHub issue page. It does not attach records or submit through an
application credential.

If a token was embedded in any historical build, revoke or rotate it and rebuild from
a clean environment. Deleting a file does not invalidate a credential.

## Known residual risks

- A local attacker who controls the Windows account or application-data directory can
  read or alter plaintext data. Use operating-system and storage encryption where the
  records require it.
- A compromised renderer can still read and perform ordinary data mutations in the
  fixed application database and can access direct files in the four granted managed
  directories. Moving every domain/file operation behind purpose-specific native
  commands would narrow this further.
- Photo row updates and filesystem deletion do not share a transaction. Cleanup is
  record-first and reports failures; a failed file deletion can leave an orphan, but
  that orphan is not included in exports.
- Managed documents have a staged/tombstone/quarantine protocol and startup
  reconciliation. Other database/filesystem workflows do not automatically inherit
  that state machine.
- The partial ZIP export is non-atomic. Interruption can leave an incomplete target;
  it must not be treated as a sole recovery copy.
- File type/signature, container/header, frame, and resource limits reduce parser
  exposure but are not a complete codec decode or bitstream-integrity proof and do not
  prove that third-party image, PDF, Office, or archive parsers are vulnerability-free.
  Legacy image documents are delegated to the operating-system viewer, so its decoder
  and patch state remain outside this application's assurance boundary.
- `cargo audit` ignores RUSTSEC-2023-0071 only for the unselected `sqlx-mysql` →
  `rsa@0.9.9` lockfile path because RustSec has no patched RSA release and the app
  selects SQLite only. Enabling MySQL or changing SQLx features invalidates that
  exception. Informational cross-target/unmaintained/yanked entries remain visible in
  the [dependency ledger](docs/case-study/DEPENDENCY_RISK.md).
- The signed-release workflow cannot establish publisher identity until the protected
  certificate/password and timestamp URL are configured and a successful run is
  retained. Locally built or historical installers remain unsigned unless separately
  verified.
- Restore and complete factory reset remain unavailable.

## Security expectations for changes

Security-sensitive changes require:

- explicit trust boundaries and misuse cases;
- positive, negative, and failure-path tests;
- path, size, type, and resource limits for untrusted files;
- rollback or compensation behavior for mixed database/filesystem work;
- no credentials in renderer-visible configuration;
- dated dependency, source, history, and artifact scans;
- review of Tauri capabilities, navigation policy, and CSP changes; and
- documentation of any accepted residual risk.

Passing a scanner or test suite is evidence for its defined scope only. Do not describe
self-review as independent assurance, a checksum as authenticity, or a signature as
proof that software is safe.

## Related documents

- [Privacy](PRIVACY.md)
- [Threat model](docs/THREAT_MODEL.md)
- [Reliability](docs/RELIABILITY.md)
- [Future backup format](docs/BACKUP_FORMAT.md)
- [Test evidence](docs/case-study/TEST_EVIDENCE.md)
- [Dependency risk ledger](docs/case-study/DEPENDENCY_RISK.md)

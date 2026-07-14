# Privacy Statement

Last updated: 2026-07-14

Respectabullz is a local-first desktop application. The project does not operate a
cloud account, synchronization service, analytics service, or application backend
for core records. Local-first does not mean that information can never leave the
computer: users can export files, open external applications, and submit reports to
third-party services.

This document describes the current repository and its known limitations. It is not
legal advice or a promise that older binaries behave identically.

## Information the application can hold

Depending on how it is used, Respectabullz can contain:

- breeder and business contact information;
- client, inquiry, communication, sale, deposit, and transport records;
- dog identity, pedigree, genetic, breeding, and health information;
- expenses and other financial records;
- photos, PDFs, Office documents, contracts, and generated packets;
- user-selected file paths and application preferences; and
- diagnostic messages, timestamps, stack traces, and contextual values written to
  local logs.

Users control what they enter. Real client or business data should not be used in a
portfolio demonstration, issue report, screenshot, or test fixture.

## Where information is stored

Runtime records are stored in a local SQLite database opened by
`tauri-plugin-sql`. Managed photos, documents, generated contracts, and logs can be
stored beneath the application's Windows application-data directory. Users can also
choose locations outside that directory for imports and exports.

A custom contract-folder grant lasts only for the current app session and must be
reselected after restart; persisted legacy paths are ignored. This permission lifetime
does not delete contracts already written to an external folder.

The database, managed files, logs, and current export formats are plaintext unless
Windows, the destination drive, or another user-controlled tool provides encryption.
Respectabullz does not currently provide field-level or archive encryption.

Files copied or exported to Documents, Desktop, Downloads, cloud-synchronized
folders, removable drives, email, or another application are outside Respectabullz's
lifecycle control.

## Network and third-party boundaries

Core record management does not require an application backend. The repository does
not establish telemetry or behavioral analytics.

Network-related boundaries still exist:

- opening GitHub, release, documentation, or issue-reporting pages transfers control
  to the user's browser and those services' privacy terms;
- a user may place exports in a cloud-synchronized folder;
- the historical source included optional direct GitHub issue creation with a
  renderer-visible token; that design is unsupported and must not be configured; and
- the remediation flow prepares and sanitizes a full report preview locally, then
  copies the reviewed draft and opens the fixed blank GitHub Issues/new page only
  after an explicit user action. Report contents are not placed in the URL. It uses
  no application credential or direct issue-submission request; the user pastes and
  submits the draft manually.

The CSP's `http://asset.localhost` image source is Tauri's local asset-protocol origin
used by `convertFileSrc`; it is not a hosted telemetry or application-backend endpoint.

The reporting flow attaches no log, database, photo, document, or contract
automatically. Its redaction rules are defense in depth and cannot recognize every
domain-specific name or detail. Before submitting a public issue, remove names,
addresses, email addresses, phone numbers, file paths, database contents, tokens, and
other sensitive context. Security reports belong in the private route described in
[SECURITY.md](SECURITY.md).

## Diagnostics and logs

The application can maintain a local structured log. Entries may include a timestamp,
severity, message, error name/message/stack, and context passed by application code.
Before console, memory, or disk output, central logging redacts sensitive context-key
families and common credential, path, email/phone, and UUID patterns and truncates
long values. Focused tests cover those rules, but they cannot recognize every
domain-specific name or semantic personal detail. A formal retention policy is not
established.

Clear and export operations serialize with pending disk writes so they observe the log
write queue in order. That prevents a queue race; it does not make arbitrary log
content safe to disclose.

Treat exported logs as potentially sensitive. Review them before sharing. Clearing a
log removes the application-managed copy; it cannot remove copies already exported,
backed up, synchronized, or submitted elsewhere.

## Deletion and reset

There is no verified in-app factory reset at this time. Legacy **Clear All Data** and
**Remove Test Data** behavior does not prove deletion of every database table and
managed file and must not be described as complete erasure.

Closing the application and deleting its application-data directory may remove the
local managed copy, but it does not remove:

- custom contract directories;
- external imports or exports;
- cloud or backup copies;
- files copied to other applications or devices; or
- data submitted to GitHub or another third party.

Before relying on deletion for a legal or contractual requirement, inventory all
storage locations and verify the result independently.

## Backup and recovery

Current JSON and ZIP exports are partial exports, not verified complete backups.
Restore is withdrawn. Do not rely on these exports as the sole copy of important
records. The ZIP writes directly to the exact native-dialog target and is not atomic;
an interrupted write can leave an incomplete file. The proposed future recovery
contract is documented in
[`BACKUP_FORMAT.md`](docs/BACKUP_FORMAT.md) and is explicitly not implemented.

## Portfolio and development data

Screenshots, recordings, tests, and demo fixtures must use deterministic fictional
records and rights-reviewed assets. `npm run demo:dev` uses the separate
`com.respectabullz.demo` application identity and demo-only capability scope. Its seed
refuses databases containing user-created records and is not exposed in production. It has no automated
teardown, so it remains a controlled development fixture rather than a user feature.

Contributors and reviewers should minimize data collected during debugging and use a
small synthetic reproduction whenever possible.

## User responsibilities

Users are responsible for:

- controlling access to the Windows account and device;
- enabling appropriate disk, folder, or backup encryption;
- choosing safe export destinations;
- reviewing diagnostic content before sharing it;
- following applicable record-retention and privacy obligations; and
- maintaining independent backups until a verified recovery feature exists.

## Changes and questions

Material behavior changes should update this document in the same change. General
questions may be opened as public repository issues only when they contain no
sensitive information. Vulnerabilities must use the private advisory route in
[SECURITY.md](SECURITY.md).

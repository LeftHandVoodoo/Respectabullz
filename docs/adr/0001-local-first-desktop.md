# ADR 0001: Local-First Windows Desktop

- Status: Accepted
- Date: 2026-07-14 (decision documented; architecture predates this ADR)

## Context

The product domain combines structured records with photos, Office/PDF documents,
contracts, exports, and Windows file habits. Records can contain sensitive business,
client, health, and financial information. A single operator may need the application
without reliable connectivity and may prefer direct ownership of local files.

The current repository does not provide a hosted backend, cloud account, multi-user
authorization, or synchronization service.

## Decision

Respectabullz is a single-user Windows desktop application packaged with Tauri 2.
React and TypeScript implement the UI and most application behavior. Runtime records
use local SQLite through `tauri-plugin-sql`; native Tauri plugins provide dialog,
filesystem, and notification boundaries. Broad shell-open permission is removed;
narrow Rust commands open canonical managed documents and the fixed support page.

Core workflows do not require an application backend. External browser and export
actions must be explicit and visible to the user.

## Consequences

### Positive

- Core operation can remain offline.
- Users control the local database and managed files directly.
- Native dialogs and local document workflows fit the target Windows use case.
- No hosted service is required to hold core records.

### Costs and risks

- There is no built-in multi-device sync, centralized recovery, or multi-user access
  control.
- The Windows user/device security boundary becomes important.
- Local data and exports are plaintext unless the host/storage layer encrypts them.
- SQLite and filesystem work require explicit cross-boundary failure protocols.
- Windows packaging, permission scope, signing, and SmartScreen behavior add release
  complexity.
- A user-controlled browser/export action can move information outside the local
  application boundary.

## Rejected alternatives

- **Hosted API and cloud database:** rejected for the current scope because it adds
  identity, authorization, availability, hosting, privacy, and migration obligations
  without evidence that multi-device collaboration is required.
- **Browser-only application:** rejected because native local file/document workflows
  are central to the current product shape.
- **Prisma runtime ORM:** not selected; current runtime SQL is issued through
  `tauri-plugin-sql`. Prisma remains reference tooling only.

## Follow-up requirements

- Keep Tauri capabilities and CSP as narrow as supported workflows allow.
- Maintain an accurate inventory of local and external storage locations.
- Require explicit user review before external issue/report submission.
- Document plaintext and no-sync limitations.
- Treat recovery, migration, and database/filesystem consistency as first-class
  reliability work.

Related: [Architecture](../ARCHITECTURE.md), [Privacy](../../PRIVACY.md), and
[Threat model](../THREAT_MODEL.md).

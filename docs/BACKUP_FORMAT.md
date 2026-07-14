# Proposed Backup and Restore Contract

Status: **Proposed; not implemented**
Last reviewed: 2026-07-14

## Safety notice

Respectabullz has no supported restore format today. The historical restore path is
withdrawn and must remain disabled. Existing JSON and ZIP outputs are **partial
exports**, not backups conforming to this document.

The current partial ZIP writes directly to the exact file granted by the native save
dialog. It does not use an atomic sibling-temp rename, so interruption can leave an
incomplete target. That behavior is an explicit limitation of the convenience export,
not part of the proposed recovery contract below. Managed-photo enumeration and reads
fail closed before destination selection; this prevents silent photo omission but does
not make the remaining record subset a backup.

This specification defines the minimum contract required before an in-app feature may
be called backup and restore.

## Goals

A conforming format must:

- identify its format and application/schema compatibility;
- capture one consistent SQLite snapshot;
- enumerate every application-managed file included or deliberately excluded;
- detect missing, duplicate, changed, or extra archive entries;
- validate without changing current application state;
- restore through staging with a pre-restore snapshot and rollback;
- fail closed on corruption, incompatibility, insufficient space, or permission
  failure; and
- produce a human-readable result that distinguishes success, cancellation, and
  preserved-state failure.

## Non-goals for the first format

- encryption;
- cloud synchronization;
- incremental or differential backups;
- cross-user merge;
- recovery of external files outside application management; and
- authenticity or publisher identity.

If the first format is plaintext, the UI and documentation must say so. A SHA-256
digest detects changed bytes but does not prove who created an archive. A future
signature can establish signing identity but does not prove software or data safety.

## Proposed archive layout

```text
respectabullz-backup.zip
├── manifest.json
├── database/
│   └── respectabullz.db
├── files/
│   ├── photos/
│   ├── documents/
│   └── contracts/
└── reports/
    └── inventory.json
```

Only regular files beneath allowlisted archive roots are permitted. Archive paths use
forward slashes and are relative. Drive-qualified, rooted, parent-segment, alternate
data stream, symlink, junction, reparse-point, and duplicate/case-colliding entries
must be rejected.

## Proposed manifest

`manifest.json` should contain at least:

```json
{
  "format": "respectabullz-backup",
  "formatVersion": 1,
  "createdAt": "2026-07-14T12:00:00.000Z",
  "applicationVersion": "1.10.3",
  "schemaVersion": 5,
  "database": {
    "path": "database/respectabullz.db",
    "bytes": 0,
    "sha256": "hex-digest"
  },
  "files": [
    {
      "logicalType": "photo",
      "archivePath": "files/photos/example.jpg",
      "bytes": 0,
      "sha256": "hex-digest"
    }
  ],
  "excluded": [
    {
      "category": "external-contracts",
      "reason": "outside application-managed storage"
    }
  ]
}
```

The final schema must be versioned, machine-validated, documented, and covered by
golden valid/invalid fixtures. Unknown required fields or unsupported format/schema
versions fail before mutation.

## Snapshot creation protocol

1. Refuse to run while a destructive or restore operation is active.
2. Resolve the managed application-data root and inventory database/file state.
3. Check available destination and staging space with a conservative margin.
4. Quiesce writes and use SQLite's supported snapshot/backup mechanism, accounting
   for WAL state; copying only the main database file is not sufficient evidence.
5. Run SQLite integrity and foreign-key checks on the snapshot.
6. Copy each allowlisted managed file into a staging directory.
7. Hash the exact staged bytes and write the manifest/inventory.
8. Build the archive to a temporary destination.
9. Reopen the archive and verify every entry, size, digest, and manifest reference.
10. Rename the verified temporary archive to the user-selected destination.
11. Report counts, excluded categories, plaintext status, and the final archive
    digest.

Cancellation or failure before step 10 must leave no successful-looking destination.

## Restore protocol

Restore must never extract directly into the live application-data directory.

1. Ask for explicit confirmation and show that restore replaces managed state.
2. Read central-directory metadata without extraction and enforce archive size, entry
   count, per-entry, expansion-ratio, and path limits.
3. Parse and validate the manifest and supported compatibility range.
4. Check available staging and rollback space.
5. Extract only allowlisted regular entries into a new private staging directory.
6. Verify exact entry set, byte sizes, hashes, and absence of extras/duplicates.
7. Open the staged database separately; run integrity, schema, migration dry-run, and
   foreign-key checks.
8. Verify every managed-file reference and any required inverse inventory rule.
9. Close live database/file handles and create a verified pre-restore snapshot.
10. Switch staged managed state into place using a documented Windows-safe protocol.
11. Reopen the application database and rerun post-switch checks.
12. On any failure, restore the pre-restore snapshot and verify the original state.
13. Delete staging only after a verified success or verified rollback.
14. Show a structured result with format version, source app/schema version, counts,
    exclusions, and verification status.

A state in which files changed but database import failed is a failed restore and must
roll back; it is never a partial success.

## Compatibility policy

No compatibility range is currently supported.

Before enabling restore, publish a matrix such as:

| Format | Source app/schema | Restore target | Status |
| --- | --- | --- | --- |
| 1 | Explicit versions only | Explicit versions only | Proposed |

Unsupported future versions must fail with no mutation. Migration during restore must
use the same transactional/restart-safe code and tests as an application upgrade.

## Required test matrix

### Complete fixture

Use a deterministic synthetic oracle containing at least one record in every supported
table and at least one file in every managed category, including Unicode and boundary-
length names. No real people, locations, records, images, or contract data may appear.

### Round trip

- snapshot → archive → validate → restore to clean destination;
- compare table counts and canonical row content;
- compare file inventory, sizes, and hashes;
- restart application and re-query representative workflows; and
- repeat restore or reject it according to an explicit overwrite policy.

### Failure and interruption

- corrupt/truncated database;
- corrupt/truncated archive and invalid CRC;
- missing, extra, duplicate, and case-colliding entries;
- path traversal and rooted/reserved Windows paths;
- unsupported format/application/schema versions;
- insufficient space at preflight and during staging;
- permission denied, read-only destination, locked/open files;
- interruption at every stage and switch failpoint;
- migration failure and foreign-key violation;
- digest mismatch after extraction; and
- rollback failure, which must preserve recovery artifacts and issue explicit manual
  guidance.

Every pre-switch failure must prove that original database and file hashes are
unchanged. Every post-switch failure must prove verified rollback.

## Enablement gate

The restore UI may be enabled and README may use “backup and restore” only when:

- format schema and fixtures are committed;
- full round-trip and failure matrix pass in required Windows CI;
- complete scope/exclusions are documented in UI and privacy material;
- staging/rollback behavior is manually verified on a clean Windows machine;
- a supported compatibility matrix is published; and
- the exact release commit links to test artifacts and residual risks.

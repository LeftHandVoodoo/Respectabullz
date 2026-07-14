# ADR 0002: Withdraw the Unsafe Restore Path

- Status: Accepted; containment verification required before recruiter visibility
- Date: 2026-07-14

## Context

The historical UI and documentation described a full backup and restore. Code review
showed that the ZIP path could extract photos before database import completed, while
the database import path did not complete successfully. The export omitted categories
of application-managed state and did not define a versioned compatibility contract,
staging, rollback, or interruption behavior.

This creates two unacceptable outcomes:

- a failed restore can still mutate live files; and
- users can reasonably believe a partial export is sufficient recovery evidence.

## Decision

Withdraw restore as a supported feature.

- Disable restore entry points in recruiter-visible and distributed builds.
- Use the exact user-facing status: “Restore is temporarily unavailable while
  complete recovery verification is implemented.”
- Refer to existing JSON/ZIP outputs as **partial data exports**, not backups.
- Remove complete-recovery claims from README, manuals, demos, release material, and
  presentations.
- Do not demonstrate a restore button as evidence.
- Preserve the failure as a documented engineering lesson.
- Require the proposed [backup-format contract](../BACKUP_FORMAT.md) and its complete
  test matrix before re-enablement.

## Consequences

### Positive

- No new user is encouraged to rely on a recovery path that cannot meet its promise.
- Portfolio claims match verified behavior.
- The future design starts from explicit invariants, compatibility, staging, and
  rollback rather than preserving a misleading interface.

### Negative

- There is no supported in-app restore during containment.
- Existing exports cannot be the sole backup for important records.
- Documentation and UI across several legacy locations must be corrected.
- A full implementation requires Windows-specific failure, interruption, and space/
  permission testing.

## Re-enable gate

Restore remains disabled until all of the following are true:

- one versioned archive schema and compatibility matrix exist;
- one deterministic every-table/every-file synthetic oracle exists;
- staged validation changes no live state;
- pre-restore snapshot, atomic switch protocol, and verified rollback exist;
- round-trip, corruption, missing/extra file, failpoint, interruption, retry,
  insufficient-space, locked-file, and permission-denied tests pass;
- required Windows CI and clean-machine evidence exist; and
- README, privacy, security, case study, and demo link to the same passing commit.

Until then, recovery is an explicit limitation and postmortem—not a roadmap claim
presented as current capability.

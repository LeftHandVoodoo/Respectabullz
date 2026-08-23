# Employer Demo Scripts

These scripts align to `Respectabullz_Employer_Case_Study.pptx`. They present
Respectabullz as supporting evidence of product and reliability engineering—not as
an AI application, production-adoption claim, independent audit, or completed
recovery system.

Demo only with synthetic records through the dedicated `com.respectabullz.demo`
development configuration. Do not
show real breeder, client, health, financial, filesystem, or account
data. Do not demonstrate restore: the historical restore path is withdrawn.

## 90-second version

### Slide 1 — Respectabullz: local-first product engineering under constraint (11s)

“Respectabullz v1.10.4 is a Windows breeder-management app. This case study shows how
I narrowed unsafe claims, redesigned failure-sensitive paths, and made the remaining
evidence reproducible.”

### Slide 2 — Local-first raises the cost of silent failure (10s)

“React and Tauri cross into local SQLite and managed files. SQLite cannot roll back a
file operation, so interruption and restart must be part of the design.”

### Slide 3 — Containment came before feature work (10s)

“I removed or relabeled what the code could not defend: renderer credentials, restore,
broad destructive reset, and backup language for partial exports.”

### Slide 4 — Failure-aware write paths preserve recoverable state (13s)

“The supported v4-to-v5 migration uses one SQLx connection and `BEGIN IMMEDIATE`.
Managed documents use staging, transactional metadata, tombstones or quarantine, and
startup reconciliation. Those are path-specific protections, not global atomicity.”

### Slide 5 — Restore withdrawn / remediation in progress (12s)

“Restore stays disabled because the historical flow could change files before database
import succeeded. Current JSON and ZIP outputs are partial exports; the complete
recovery contract remains unimplemented.”

### Slide 6 — Local validation passed; public release evidence remains (20s)

“The pinned v1.10.4 local gate passed 439 frontend and 68 Rust tests plus lint, type,
coverage, Clippy, workflow, web, and Windows build checks. Ordinary CI requires
database readiness from an ephemeral executable but publishes evidence, not unsigned
binaries. Public final-SHA CI and a successful protected signed-release run remain
pending.”

### Slide 7 — Residual risk stays visible (8s)

“Recovery, credential rotation, public CI, protected signing, one documented optional
Rust dependency exception, informational Rust warnings, and independent assessment
remain explicit risks.”

### Slide 8 — What this demonstrates (6s)

“The pattern is simple: contain first, model partial failure, and match every claim to
dated evidence.”

## Five-minute version

### Slide 1 — Respectabullz: local-first product engineering under constraint (20s)

“Respectabullz v1.10.4 is a single-user Windows desktop application for breeder operations.
The stack is React, TypeScript, Tauri 2, Rust, and local SQLite. I am not presenting it
as an AI product or as proof of customer adoption. I am presenting a remediation case
study: how I inspected an inherited product surface, removed unsafe claims, and made
the remaining engineering evidence inspectable.”

### Slide 2 — Local-first raises the cost of silent failure (40s)

“Local-first is a product choice, not a shortcut. It gives the operator offline use
and direct control of records, but it also concentrates responsibility on one Windows
machine. The renderer crosses bounded native commands into SQLite and crosses
operation-specific Tauri file permissions into application-managed
photos and documents, and user-selected export locations. SQLite can protect database
changes; it cannot undo a file rename or deletion. That means the difficult design
question is not simply ‘did this function return success?’ It is ‘what durable state
exists after interruption, ambiguity, or restart, and can the next run reconcile it?’”

### Slide 3 — Containment came before feature work (45s)

“I started with containment. A renderer-side GitHub credential design was removed;
the replacement prepares a sanitized preview locally, copies only the reviewed draft,
and opens a fixed blank issue page without putting report data in the URL. Restore and
unverified clear/test-data controls were removed from the product surface. Existing
JSON and ZIP outputs were renamed partial exports because they omit application state
and cannot support a recovery claim. Production first launch now starts with an empty
database; deterministic sample seeding is development-only and refuses any existing user-created
application database. The important product decision was to reduce the promise before
adding more automation.”

### Slide 4 — Failure-aware write paths preserve recoverable state (65s)

“Two paths then received focused reliability work. First, fresh setup and the declared
schema-v4-to-v5 migration run on one Rust/SQLx connection using `BEGIN IMMEDIATE`, a
busy timeout, explicit schema checks, and a foreign-key check. Unsupported older
versions fail closed instead of guessing. Real-SQLite tests exercise rollback,
retries, and concurrency.

“Second, managed-document operations coordinate the database and filesystem through
recoverable states. Intake validates the dialog-granted source, stages and rechecks
the exact bytes, writes the document row, tags, and entity link in one SQL
transaction, then promotes the file. Delete uses a tombstone and quarantine instead
of equating immediate file removal with durable success. Startup reconciliation runs
under `BEGIN IMMEDIATE` and resolves staged, registered, tombstoned, and quarantined
states. Actual failures block operational routes behind a retry screen. The scan is
bounded at 10,000 entries, so truncation warns but is not described as exhaustive.”

“The renderer's generic database path is also constrained: Rust rejects stacked,
schema, transaction, extension, filesystem, and unsupported SQL and applies resource
limits. Sale creation, update, deletion, and interest conversion bypass generic writes
in favor of typed native transactions that keep sale and puppy state together.”

### Slide 5 — Restore withdrawn / remediation in progress (40s)

“Recovery is deliberately outside that claim. The historical restore implementation
could extract photos before its database import completed, and the export omitted
managed categories. That is a split-state failure mode, so restore is withdrawn. The
current partial ZIP writes directly to the exact file granted by the save dialog; it
is explicitly non-atomic and non-recoverable. The repository now contains a proposed
backup-format contract covering a consistent SQLite snapshot, complete inventory,
hashes, staging, a pre-restore snapshot, rollback, compatibility, and interruption
tests. None of that proposal is represented as implemented.”

### Slide 6 — Local validation passed; release evidence remains (55s)

“The historical v1.10.3 local checkpoint passed 354 of 354 frontend tests in 39
files and 39 of 39 Rust tests. Focused tests cover the new migration, document-state,
startup-gating, logging-ordering, redaction, and export boundaries. Coverage was 22.21
percent statements and lines, 62.73 percent branches, and 27.85 percent functions;
that meets the configured initial floors, but broad statement coverage remains low.
Those numbers describe the older tree, not v1.10.4.”

“The pinned v1.10.4 local gate passed 439 frontend tests in 50 files, 68 Rust tests,
lint, type checking, coverage ratchets, strict Clippy, workflow lint, web build, and a
Windows release-profile build. The lockfile has zero npm advisories and documents one
Rust exception for an unselected SQLx MySQL/RSA path; 20 informational warnings stay
visible. Ordinary CI requires database readiness from an ephemeral unsigned executable
and retains evidence only. A distributable installer requires a successful exact-
version-tag protected workflow with timestamped signature verification, checksums, and
npm/Rust SBOMs. No such release run is yet claimed.”

### Slide 7 — Residual risk stays visible (35s)

“The remaining gates are part of the deliverable. Any historically exposed credential
must be revoked or rotated outside the repository. Recovery and verified reset remain
unsupported. Public exact final-SHA Windows CI, protected signing, and clean-profile
upgrade evidence are open. The generic renderer database boundary is not per-record
authorization, and remaining mixed database/file workflows need continued path-by-path
review. There has been no independent penetration test or production adoption study.
Keeping those risks visible is how the case study avoids turning self-review into
assurance.”

### Slide 8 — What this demonstrates (10s)

“This project supports three capabilities I would bring to a product or reliability
engineering role: narrowing scope when evidence is weak, designing for durable state
after partial failure, and making every claim traceable to tests, documentation, and
an explicit residual-risk register.”

## Optional live evidence sequence

Use this sequence only after the exact final-SHA public Windows smoke gate passes:

1. Open the dedicated `com.respectabullz.demo` development build with its isolated
   synthetic application-data root.
2. Show one synthetic record workflow without exposing host paths. Do not imply that
   the stored Notifications preference dispatches operating-system notifications.
3. Show the restore control is absent and partial-export language is visible.
4. Trigger one safe, synthetic validation failure and show that success is not
   reported.
5. Close with `docs/case-study/TEST_EVIDENCE.md` at the exact final-SHA commit.

The deck already uses a live synthetic `com.respectabullz.demo` capture. If the final
hosted packaged gate has not passed, present the deck and repository evidence only;
do not substitute a development server for packaged Windows evidence.

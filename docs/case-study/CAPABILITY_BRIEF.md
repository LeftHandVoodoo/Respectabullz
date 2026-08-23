# Respectabullz — Employer Capability Brief

**Positioning:** supporting evidence for product and reliability engineering in a
local-first Windows desktop system. This is not an AI application, a production-
adoption claim, an independent audit, or evidence of completed backup/restore.

**Source version:** v1.10.4, locally validated 2026-08-22. Public final-commit CI and
protected signing evidence are pending. The v1.10.3 snapshot below is historical.

## Engineering problem

Respectabullz coordinates structured breeder records in local SQLite with managed
documents, photos, contracts, logs, and user-selected exports. The hard boundary is
that SQLite and the Windows filesystem do not share one transaction. A credible
remediation therefore had to reduce unsafe product promises, preserve recoverable
state across partial failures, and make every remaining claim traceable to evidence.

## Role-mapped evidence

| Capability | Evidence in this case study | Boundary |
| --- | --- | --- |
| Product judgment | Withdrew historical restore and unverified destructive-reset paths; relabeled incomplete outputs as partial exports | No supported restore, verified backup, or factory reset today |
| Reliability engineering | Routed fresh setup and schema-v4→v5 through one SQLx connection with `BEGIN IMMEDIATE`, foreign-key checks, rejection of unsupported versions, and real-SQLite failure tests | One declared migration path; final packaged Windows upgrade evidence pending |
| State-machine design | Added staged document intake, transactional metadata, tombstones/quarantine, canonical database-backed opens, and startup reconciliation | Path-specific coordination; not global database/filesystem atomicity; scan is bounded |
| Security and privacy | Removed the renderer credential/direct-API design; routed database access through bounded native commands; narrowed filesystem scope by operation; removed native renderer notifications; added local bug-report preview and source/build secret checks | Generic database access is not per-record authorization; historical external credential revocation cannot be proven here; no independent assessment |
| Sale integrity | Added purpose-specific native transactions for create/update/delete and interest conversion | Scoped to the sale lifecycle; other domains still need their own invariant tests |
| Quality systems | Added zero-finding npm audit, triaged Rust audit policy, evidence-only unsigned CI, and a protected signed-release path with signature/SBOM/checksum gates | Local v1.10.4 gates pass; public CI, signed artifact, and clean-profile proof are pending |
| Technical communication | Maintained a threat model, reliability contract, dated test evidence, dependency-risk ledger, ADRs, and explicit current limitations | Documentation is a claim boundary, not a substitute for runtime evidence |

## Evidence snapshot

- **v1.10.4 local validation:** 439/439 frontend tests in 50 files and 68/68 Rust
  tests passed with lint, type checking, coverage ratchets, strict Clippy, workflow
  lint, web build, and Windows `--no-bundle` build. Vitest 4/V8 measured 26.40%
  statements, 20.06% branches, 17.52% functions, and 27.74% lines.
- **Dependency state:** zero npm advisories; no unignored Rust vulnerability entry;
  one documented exception for the unselected SQLx MySQL/RSA path; 20 informational
  Rust warnings remain tracked.
- **Release state:** ordinary CI requires completed database initialization and
  reconciliation from an ephemeral unsigned executable and retains evidence only. The
  exact-version-tag protected signed-release workflow has not yet produced a verified
  distributable artifact.
- **Historical v1.10.3 checkpoint (2026-07-14):** 354/354 frontend tests in 39 files,
  39/39 Rust tests, 22.21% statement/line coverage, 62.73% branch coverage, and 27.85%
  function coverage. Its unsigned local NSIS artifact and checksum remain provenance
  for that older tree, not v1.10.4 assurance.

Test counts are scope indicators, not a reliability score. Exact commands, dates,
toolchain caveats, and missing gates live in [TEST_EVIDENCE.md](TEST_EVIDENCE.md).

## Decision principles demonstrated

1. **Contain before expanding.** Remove dangerous paths and overclaims before adding
   features.
2. **Design for durable state.** Reason about interruption, ambiguous commit results,
   restart, and reconciliation—not only happy-path return values.
3. **Fail closed where compatibility matters.** Reject unsupported schema versions
   instead of guessing.
4. **Separate evidence from assurance.** Local tests, scanning, and self-review are
   useful; they are not public CI, signing, independent assessment, or production use.
5. **Keep residual risk visible.** Recovery, credential rotation, final-SHA public CI,
   protected signing, clean-machine upgrade evidence, and purpose-specific review of
   remaining data/file workflows remain explicit work—not hidden footnotes.

## Best-fit discussion areas

Product engineering for desktop/local-first workflows; reliability and data
integrity; failure-aware SQLite/filesystem coordination; release evidence and supply-
chain hygiene; security-conscious product containment; and translating technical
risk into precise user-facing claims.

See the full [case study](CASE_STUDY.md), [reliability record](../RELIABILITY.md),
[threat model](../THREAT_MODEL.md), and [employer demo scripts](DEMO_SCRIPTS.md).

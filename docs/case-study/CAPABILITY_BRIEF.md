# Respectabullz — Employer Capability Brief

**Positioning:** supporting evidence for product and reliability engineering in a
local-first Windows desktop system. This is not an AI application, a production-
adoption claim, an independent audit, or evidence of completed backup/restore.

**Evidence version:** v1.10.3 local pre-release snapshot, 2026-07-14.

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
| Security and privacy | Removed the renderer credential/direct-API design; added local preview, redaction, fixed blank issue route, narrower capabilities, and source/build secret checks | Historical external credential revocation cannot be proven from the repository; no independent assessment |
| Quality systems | Passed the local exact-tree rehearsal across tests, lint, type checks, Rust format/Clippy, builds, packaging, scans, and SBOM generation; recorded the exact NSIS artifact and checksum | Installer is unsigned; exact final-SHA hosted smoke/public CI and published provenance remain pending |
| Technical communication | Maintained a threat model, reliability contract, dated test evidence, dependency-risk ledger, ADRs, and explicit current limitations | Documentation is a claim boundary, not a substitute for runtime evidence |

## Dated evidence snapshot

- Local pre-release checkpoint: **354/354 frontend tests in 39 files** and **39/39
  Rust tests**.
- Coverage: **22.21% statements/lines**, **62.73% branches**, and **27.85% functions**.
- Production npm graph: **0 dated findings**; **7 development-graph findings** remain
  triaged.
- Cargo audit reports **5 vulnerability entries remaining**.
- Focused evidence covers the declared migration, managed-document recovery states,
  startup gating, log ordering/redaction, and containment boundaries.
- The exact local NSIS installer is **29,413,927 bytes**, SHA-256
  **`3167be8a9a0b774a72bcc4b1af30fd00ac95e03215c4bc6dd4d79d74b020bd11`**, and
  unsigned. Local exact-tree gates passed; the exact final executable was not launched
  again against the non-isolated development profile. Hosted final-SHA smoke and a
  successful public CI URL remain pending.

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
5. **Keep residual risk visible.** Recovery, credential rotation, hosted final-SHA
   smoke/public CI, signing, clean-machine upgrade evidence, and broader filesystem
   review remain explicit work—not hidden footnotes.

## Best-fit discussion areas

Product engineering for desktop/local-first workflows; reliability and data
integrity; failure-aware SQLite/filesystem coordination; release evidence and supply-
chain hygiene; security-conscious product containment; and translating technical
risk into precise user-facing claims.

See the full [case study](CASE_STUDY.md), [reliability record](../RELIABILITY.md),
[threat model](../THREAT_MODEL.md), and [employer demo scripts](DEMO_SCRIPTS.md).

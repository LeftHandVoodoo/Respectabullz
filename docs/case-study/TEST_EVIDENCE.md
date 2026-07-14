# Test and Verification Evidence

Status: **Verified local baseline and integrated working-tree checks; CI configured, public run pending**
Baseline date: 2026-07-14
Baseline commit: `fd21363beae044f0649a1e03f3bb6bcc2249f970`

## Evidence boundary

This document preserves commands reproduced locally for one baseline commit and
separately labels later integrated working-tree checks. The working-tree results are
not commit-bound public CI evidence, and no untested behavior is represented as
reliable.

A test count is meaningful only with the exact command, commit, environment, scope,
and failure-path coverage. Historical repository documents that say “302 tests,”
“all findings resolved,” or “0 vulnerabilities” are not current evidence.

## Environment snapshot

The following tool versions were recorded on the Windows review machine on
2026-07-14:

| Tool | Version |
| --- | --- |
| Windows | `Microsoft Windows NT 10.0.26200.0` |
| PowerShell | `7.5.8` |
| Node.js | `v25.8.0` |
| npm | `11.11.0` |
| rustc | `1.91.0` |
| Cargo | `1.91.0` |

The project now requires Node 22.x and npm 10.x, with `.nvmrc` pinning Node 22.23.1 for
local use and CI. The review machine exercised Node 25/npm 11, so these local results
do not replace a pinned-toolchain CI run.

## Reproduced local checks

| Check | Exact command | Result |
| --- | --- | --- |
| ESLint | `npm run lint` | Pass |
| TypeScript | `npx tsc -p tsconfig.json --noEmit` | Pass |
| Vitest | `npm run test -- --run --reporter=basic` | Pass: 15 files, 290 tests |
| Coverage | See command below | Pass: configured report generated |
| npm advisories, all dependencies | `npm audit --json` | Findings: 3 critical, 9 high, 11 moderate, 1 low (24 total) |
| npm advisories, production dependencies | `npm audit --omit=dev --json` | Findings: 4 high, 6 moderate (10 total) |

Coverage was kept outside the repository:

```powershell
$reportDir = Join-Path $env:TEMP (
  'respectabullz-coverage-' + [guid]::NewGuid().ToString('N')
)

npx vitest --run --coverage `
  --coverage.reporter=text `
  --coverage.reportsDirectory $reportDir

$code = $LASTEXITCODE
if (Test-Path -LiteralPath $reportDir) {
  Remove-Item -LiteralPath $reportDir -Recurse -Force
}
exit $code
```

Configured report totals:

| Measure | Result |
| --- | ---: |
| Statements | 10.93% |
| Branches | 61.43% |
| Functions | 20.25% |
| Lines | 10.93% |

## Coverage caveat

The current Vitest configuration excludes `**/__tests__/**` but does not exclude all
`**/*.test.*` files. As a result, `src/lib/contractUtils.test.ts` is counted as source
at 100%, which distorts the overall percentage.

Treat 10.93% as the currently reproducible configured baseline, not a canonical
portfolio metric. Correct the include/exclude scope and rerun before publishing a
coverage badge or target.

Regardless of that configuration defect, the baseline reported 0% coverage for
critical paths including:

- `src/lib/db/migrations.ts`;
- `src/lib/db/init.ts`;
- `src/lib/db/documents.ts`; and
- `src/lib/documentUtils.ts`.

Repository tests did not reference the migration/document paths needed to prove
transactional upgrades or database/filesystem recovery behavior.

## What this baseline does not prove

The following gates were absent or not run as part of the recorded baseline:

- no required `.github` CI workflow;
- no branch-protection evidence;
- no dedicated `typecheck` or `test:ci` package script;
- no coverage threshold;
- no corrected canonical coverage scope;
- no Rust formatting, lint, or test result recorded here;
- no frontend production build result recorded here;
- no Windows Tauri/NSIS build or packaged smoke test;
- no clean-machine first launch, persistence, export, or upgrade test;
- no migration matrix from supported historical versions;
- no recovery, factory-reset, or cross-database/filesystem failpoint matrix;
- no automated secret scan, artifact scan, SBOM, or checksum evidence; and
- no dependency reachability/accepted-risk ledger.

The reviewed baseline's `npm run version:check` command was print-only. The remediation
working tree replaces it with a drift-enforcing comparison across nine version sources;
the final CI evidence must still record its result for the frozen commit.

## Post-baseline migration working tree

The remediation working tree moves fresh setup and the supported schema-v4→v5 path to
one Rust/SQLx connection using a per-connection busy timeout and `BEGIN IMMEDIATE`,
with explicit foreign-key checks.

| Check | Exact command | Result |
| --- | --- | --- |
| Rust migration tests | `cargo test --manifest-path src-tauri/Cargo.toml` | Pass: 7 tests |

The real-SQLite tests cover fresh setup, v4→v5, a no-op current-schema second run,
two-connection concurrent-start serialization, an injected failure with rollback and
retry, rejection of an unsupported baseline, and rejection of a foreign-key violation.
A final Windows Tauri build, packaged upgrade test, and public CI run are still
pending. This migration-only result does not prove global application FK enforcement
or every database/filesystem workflow.

## Post-baseline containment working tree

The remediation working tree removes the renderer token/direct-API path, creates a
sanitized user-reviewed clipboard draft, and opens only a fixed blank GitHub
Issues/new page with no report data in the URL. It also removes restore,
destructive-clear, and first-launch sample-data controls. Seeding remains a separate
development-only tool. A Rust command rejects release builds, opens one SQLite
connection, acquires `BEGIN IMMEDIATE`, rechecks that application tables are empty,
executes only allowlisted inserts, verifies foreign keys, and commits or rolls back;
it never clears an existing database. Central logging adds scoped key/value redaction and length limits before console,
memory, and disk output; these rules do not prove that every semantic personal detail
will be recognized.

The managed-document remediation keeps upload selection side-effect-free; applies a
100 MB limit and supported signature checks; stages create/delete file effects around
one-connection SQL transactions; uses canonical database-backed opens; and reconciles
staging, tombstone, registered, and quarantined-orphan state during startup under
`BEGIN IMMEDIATE`. The operational shell is gated until setup/reconciliation succeeds;
actual reconciliation failures show a blocking retry screen. Scan-limit truncation
warns and permits startup when no failure was recorded, so the result is explicitly
non-exhaustive. Ambiguous delete-commit outcomes preserve the tombstone for startup to
resolve from durable row state. This does not establish global atomicity for other file
workflows or adversarial parser safety.

The current external-path controls are deliberately narrower: the partial ZIP writes
directly to the exact dialog-granted target and is non-atomic; custom contract-folder
authority lasts only for the current session and persisted legacy paths are ignored.
Log clear/export serialize with pending disk writes. The CSP allows Tauri's local
`http://asset.localhost` image origin for `convertFileSrc` while connection sources
remain self-only. The SQL plugin preloads only `sqlite:respectabullz.db`; the renderer
retrieves that pool without load/close permission and retains select/execute authority
against it. These are implementation boundaries, not a query sandbox or general
filesystem/privacy guarantee.

| Check | Exact command | Result |
| --- | --- | --- |
| Focused containment tests | `npm run test -- --run src/lib/__tests__/github.test.ts src/components/bug-report/__tests__/BugReportDialog.test.tsx src/pages/__tests__/SettingsPage.containment.test.tsx` | Pass: 3 files, 9 tests (6 GitHub/reporting, 1 dialog, 2 settings/identity) |
| Current settings/first-launch containment | `npm run test -- --run src/pages/__tests__/SettingsPage.containment.test.tsx src/components/__tests__/FirstLaunchDialog.containment.test.tsx` | Pass: 2 files, 5 tests after partial-export, demo-identity, and legacy-data containment |
| Legacy browser-storage containment | `npm run test -- --run src/lib/db/__tests__/init.containment.test.ts src/lib/db/__tests__/legacyStorage.test.ts` | Pass: 2 files, 5 tests; detection is read-only, inspection errors fail closed, and SQLite setup is not called when legacy data exists |
| Partial ZIP fail-closed photo handling | `npm run test -- --run src/lib/__tests__/backupUtils.partialExport.test.ts` | Pass: 1 file, 4 tests; directory/read errors abort before destination selection, exact-path writes remain enforced, and metadata matches included files |
| Logging and seed-safety tests | `npm run test -- --run src/lib/__tests__/errorTracking.test.ts src/lib/db/__tests__/seedSafety.test.ts` | Pass: 2 files, 6 tests (3 logging, 3 seed-safety) |
| Fixed SQLite-pool boundary | `npm run test -- --run src/lib/db/__tests__/connection.test.ts scripts/__tests__/check-demo-data.test.mjs` | Pass: 2 files, 7 tests; covers fixed-pool retrieval/fail-closed startup, exact demo identity, and rejects alternate preload plus renderer load/close authority |
| Synthetic demo and SQL-boundary guard | `npm run check:demo-data` | Pass: production/demo preload and capabilities match the fixed-pool boundary |
| Local pre-release frontend checkpoint (source 1.10.3; not public CI) | `npm run test:ci` | Pass: 39 files, 354 tests |
| Local pre-release coverage checkpoint (source 1.10.3; not public CI) | `npm run test:coverage` | Pass: 22.21% statements/lines, 62.73% branches, 27.85% functions |
| ESLint | `npm run lint` | Pass |
| TypeScript | `npm run typecheck` | Pass |
| Frontend production build | `npm run build` | Pass |
| Local pre-release Rust checkpoint (source 1.10.3; not public CI) | `cargo test --manifest-path src-tauri/Cargo.toml --all-features --locked` | Pass: 39 tests |
| Synthetic Windows/Tauri demo | `npm run demo:dev`, then guarded **Seed Test Data** | Pass: one isolated `com.respectabullz.demo` transaction populated the fixture, dashboard/workflows rendered, and the Roaming/Local demo profiles were manually removed after capture |
| Synthetic customer packet | Export from the isolated demo, render all pages, inspect page sizes/content, and run `PacketDocument.layout.test.tsx` | Pass: 12-page PDF; portrait pages are US Letter, pedigree is intentionally landscape, and all pages were visually inspected; SHA-256 `66b3977f537d5102c26a55ea1d861d94e46ceadc3f9978f81f9cd526badbee1b` |
| Rust advisory evidence | `cargo audit --json` with pinned `cargo-audit 0.22.2` | Nonzero: 5 vulnerability entries after patching `bytes` and `time`; 17 unmaintained, 5 unsound, and 1 yanked warning; triaged in `DEPENDENCY_RISK.md` |

The final local NSIS build for this working tree produced
`Respectabullz_1.10.3_x64-setup.exe` at 29,413,927 bytes with SHA-256
`3167be8a9a0b774a72bcc4b1af30fd00ac95e03215c4bc6dd4d79d74b020bd11`.
Authenticode reported `NotSigned`. The release executable was 32,942,080 bytes with
SHA-256 `4b23378378504c47f205520bec77b7971accb3a67e583a06b2949d76d520cf44`
and was also unsigned. The exact installer, executable, and web bundle passed a
84-file token-material scan.

A local npm CycloneDX SBOM contained 700 components and had SHA-256
`2e6c1820ec3c6b0438578e3a54250b20efb9776a62c87794a4902eba83d42991`.
These files are local pre-release evidence, not published provenance. The final
packaged executable was intentionally not launched on the non-isolated development
profile; its liveness check remains assigned to the ephemeral hosted CI runner.

The coverage result is contextual evidence, not headline proof: broad statement/line
coverage remains low, while critical new migration/document/startup paths have focused
tests. The final pinned pass also ran Rust formatting, Clippy with warnings denied,
Rust tests, and the Windows installer build. These local results remain pre-release
evidence until a public workflow run exists for the final SHA.

A pinned Node 22.23.1/npm 10.9.8 local CI rehearsal passed the frontend/Rust
suites, lint/type/version/demo guards, web and NSIS builds, sentinel artifact scans,
production audit, history/current-source Gitleaks scans, workflow lint, and npm
CycloneDX SBOM generation. A native smoke caught a Tokio nested-runtime startup panic.
After correction, the rebuilt executable remained alive for eight seconds with empty
stderr. The attempted process-level `APPDATA` override did not isolate Tauri: the real
profile's SQLite sidecars and WebView state were opened, although the main database
mtime was unchanged. No second local packaged-production launch was attempted. A
separate development launch under the dedicated `com.respectabullz.demo` identity
successfully exercised the synthetic seed without opening the production profile.
The workflow now runs the
smoke only on its ephemeral hosted Windows runner. There is no public CI URL or release
tag.

## Dependency-result interpretation

The dated package-level decisions are in the
[Dependency Risk Ledger](DEPENDENCY_RISK.md). Advisory findings are current only for
the time and lockfile scanned. Counts do not
show whether a vulnerable path is reachable, whether an upgrade is safe, or whether
Rust dependencies are affected. Each finding needs:

- package and advisory identifier;
- development/production/runtime reachability;
- affected feature or artifact;
- upgrade or mitigation decision;
- regression-test plan; and
- dated acceptance owner when deferred.

Do not run a forced dependency upgrade and call the risk resolved without rebuilding
and retesting the relevant workflows.

## Configured CI and missing public evidence

The remediation tree defines `.github/workflows/ci.yml` for pushes and pull requests
to `master` plus manual dispatch. It pins Node through `.nvmrc` and Rust 1.91.0, then
configures:

1. locked install, version/demo-safety checks, ESLint, TypeScript, Vitest/JUnit,
   coverage enforcement, frontend build, and a built-artifact secret sentinel scan;
2. full npm advisory evidence plus a high-severity production-dependency gate;
3. Windows Rust formatting, Clippy, tests, Tauri installer build, packaged liveness
   smoke on an ephemeral hosted runner, compiled-artifact secret scan, npm CycloneDX SBOM, SHA-256 checksums,
   and retained installer evidence;
4. a full-history gitleaks scan; and
5. a pinned `cargo-audit` evidence job.

Weekly Dependabot review is configured for npm, Cargo, and GitHub Actions. Local
`actionlint` passed, but only a public final-SHA run can establish workflow execution.

Configuration is not run evidence. Before a portfolio or release claim, add the
successful final-SHA workflow URL and retained artifacts, confirm branch protection,
perform a clean-machine packaged smoke/upgrade test, publish the corrected-scope
coverage report and ratchet critical-path thresholds, and publish the generated npm
SBOM plus explicit signing status if distributed.
Markdown-link validation is still local rather than a configured workflow job.

## Evidence update template

Replace—not append to—the headline baseline when a later commit is promoted:

```text
Date:
Commit/tag:
Windows runner or machine:
Exact commands:
Results and test counts:
Coverage configuration and critical-module results:
Advisory scan and accepted-risk link:
Windows artifact/checksum/SBOM/signing status:
Clean-machine smoke result:
Known failures or waived gates:
```

Related: [Reliability](../RELIABILITY.md), [Security](../../SECURITY.md), and
[Threat model](../THREAT_MODEL.md).

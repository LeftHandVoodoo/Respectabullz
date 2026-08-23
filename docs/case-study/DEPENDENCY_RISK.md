# Dependency Risk Ledger

Status: **Dated self-review; not an independent supply-chain assessment**
Lockfiles reviewed: 2026-08-22
Owner: LeftHandVoodoo
Next review: 2026-09-22 or before the next distributed artifact

## JavaScript status

| Scope | Command | Result on 2026-08-22 |
| --- | --- | --- |
| Complete locked graph | `npm audit --json` | Pass: 0 findings across production and development dependencies |
| Reproducible install | `npm ci` with Node 22.23.1/npm 10.9.8 | Pass |

The remediation upgraded Vite, Vitest, React Router, PostCSS, Sharp, and their
companion packages. Narrow package overrides move inherited Nano ID, UUID, and
brace-expansion paths to patched releases without changing their public callers.
Regression tests cover the dependency-sensitive workbook, routing, build-secret,
photo, document, and application workflows.

The zero count is specific to the committed lockfile and the advisory database at
scan time. It is not a guarantee that no future advisory or non-package supply-chain
issue exists. CI now fails on any npm advisory instead of retaining a non-blocking
full-graph report.

## Rust status

Pinned `cargo-audit 0.22.2` was run against the 2026-08-22 lockfile. The project
policy exits successfully with no unignored vulnerability entries. It retains one
explicit, documented exception in `src-tauri/.cargo/audit.toml`:

| Dependency path | Advisory | Reachability and decision |
| --- | --- | --- |
| Unselected `sqlx-mysql` option → `rsa@0.9.9` | RUSTSEC-2023-0071; no patched `rsa` release is available | Respectabullz disables SQLx default features and enables SQLite only. `cargo tree -e all -i sqlx-mysql` returns no dependency path, so the affected RSA code is not compiled into the application. The exception must be removed if MySQL is enabled, SQLx/plugin features change, or a patched dependency path becomes available. |

The lockfile also moved the reachable XML parsers to `quick-xml@0.41.0`, removed the
unused notification chain, and updated patchable `anyhow`, `event-listener`, `rand`,
`tauri-utils`, `plist`, and Wayland scanner dependencies. Rust tests, formatting,
Clippy with warnings denied, and the Windows application build are required after
dependency changes.

Cargo audit still reports 20 allowed informational warnings (17 unmaintained, two
unsound, and one yanked) that are not treated as vulnerability-severity failures:

- unmaintained GTK3 bindings are Cargo.lock entries for Linux Tauri targets, while
  Respectabullz is built and distributed only for 64-bit Windows;
- the `glib` warning belongs to the unselected GTK/Linux path; `rand@0.7.3` is
  build-time-only through older HTML-selector/code-generation dependencies and has no
  compatible patched 0.7 release; and
- yanked `spin@0.9.8` is inherited through the maintained SQLx SQLite/flume path.

These entries remain visible in the JSON evidence and are reviewed on framework
updates. They are not described as a clean universal or cross-platform Rust graph.

## Gate policy

- Any npm advisory fails CI and the signed-release workflow.
- Any unignored Rust vulnerability fails CI and release. An exception requires exact
  feature/target evidence, a reason no safe upgrade exists, and a re-review trigger.
- Locked npm and Rust CycloneDX SBOMs are generated for Windows build evidence.
- CI builds an unsigned executable only for ephemeral smoke testing and never uploads
  it as an installer. Distribution artifacts come only from the signature-verifying
  release workflow.
- A forced dependency update is not remediation until affected tests, audits, lint,
  type checks, Clippy, and builds pass.

Related evidence: [TEST_EVIDENCE.md](TEST_EVIDENCE.md),
[Threat model](../THREAT_MODEL.md), and [Security policy](../../SECURITY.md).

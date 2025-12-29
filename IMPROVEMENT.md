# Improvement Scan Report

**Generated:** 2025-12-29
**Version:** 1.9.1
**Status:** All quality gates passing

---

## Summary

The codebase is in **good health** with all quality gates passing. However, there are **4 unused dependencies**, **10 TODO markers** in legacy code, **~45 console.log statements** in production code, and a **version mismatch** between .env and .env.example. The most actionable improvements focus on dependency cleanup, console log removal, and completing the legacy SQLite migration.

---

## Gate Results

| Gate | Command | Result | Details |
|------|---------|--------|---------|
| **lint** | `npm run lint` | Pass | No errors/warnings |
| **typecheck** | `npx tsc --noEmit` | Pass | Clean |
| **tests** | `npm run test -- --run` | Pass | 212 tests, 10 files |
| **build** | `npm run build` | Pass | Warning: 2 large chunks (>500KB) |

---

## Key Findings (Top 5)

1. **Unused dependencies** - 4 packages in package.json are not imported: `@prisma/client`, `@radix-ui/react-icons`, `@tanstack/react-table`, `react-big-calendar`

2. **Console statements in production code** - 45+ `console.log/error/warn` calls scattered across 15+ files in `src/`

3. **Legacy TODO markers** - 10 TODO comments in `src/lib/db/legacy.ts` indicating incomplete SQLite migration

4. **Version mismatch** - `.env` has `VITE_APP_VERSION="0.1.0"` but `.env.example` and `package.json` have `"1.9.1"`

5. **Low test coverage** - Pages/components have 0% coverage; only lib/db has partial coverage (~15% for db module overall)

---

## Improvement Backlog

### ~~IMP-001 | Dependency | Medium | High Impact | Low Risk | S | High Confidence~~ DONE

**Remove unused dependencies** - Completed 2025-12-29

- **Evidence:** `package.json:26-76` lists deps; `depcheck` reports 4 unused
- **Why it matters:** Reduces bundle size, install time, and attack surface
- **Fix outline:**
  - Run `npm uninstall @prisma/client @radix-ui/react-icons @tanstack/react-table react-big-calendar`
  - Remove `@types/react-big-calendar` from devDeps
  - Run build to verify no breakage
- **Tests/docs:** None required
- **Blast radius:** `package.json`, `package-lock.json`

---

### ~~IMP-002 | Maintainability | Low | Medium Impact | Low Risk | S | High Confidence~~ DONE

**Version consistency in .env** - Completed 2025-12-29

- **Evidence:** `.env:6` has `VITE_APP_VERSION="0.1.0"` vs `package.json:3` has `"1.9.1"`
- **Why it matters:** Version mismatch could cause confusion in bug reports/UI
- **Fix outline:**
  - Update `.env` line 6: `VITE_APP_VERSION="1.9.1"`
  - Consider using package.json version dynamically instead of duplicating
- **Tests/docs:** None
- **Blast radius:** `.env`

---

### ~~IMP-003 | Maintainability | Medium | Medium Impact | Low Risk | M | High Confidence~~ DONE

**Remove console.log statements from production code** - Completed 2025-12-29

- **Evidence:** 45+ occurrences in `src/components/dogs/DogFormDialog.tsx:142-162`, `src/lib/documentUtils.ts:230-255`, etc.
- **Why it matters:** Console noise degrades DevEx; debug logs shouldn't reach production
- **Fix outline:**
  - Replace debug `console.log` with structured logging via `src/lib/errorTracking.ts`
  - Keep `console.error` for true error paths or replace with error logger
  - Add eslint rule: `no-console: ["warn", { allow: ["error", "warn"] }]`
- **Tests/docs:** None required
- **Blast radius:** ~15 files in components/lib

---

### ~~IMP-004 | Reliability | Medium | Medium Impact | Medium Risk | M | High Confidence~~ DONE

**Add JSON.parse error handling** - Already implemented (verified 2025-12-29)

- **Evidence:** `src/lib/backupUtils.ts:166`, `src/components/litters/WhelpingChecklist.tsx:76`, `src/lib/db/health.ts:593`
- **Why it matters:** Malformed JSON will crash; no validation on parsed data
- **Fix outline:**
  - Wrap `JSON.parse` calls in try-catch
  - Add Zod schemas for runtime validation of parsed structures
  - Return default/error state on parse failure
- **Tests/docs:** Add tests for malformed input cases
- **Blast radius:** 5 files using JSON.parse

---

### IMP-005 | DevEx | Low | Medium Impact | Low Risk | M | Medium Confidence

**Add structured logging configuration**

- **Evidence:** `src/lib/errorTracking.ts` exists but components use raw `console.*`
- **Why it matters:** Centralized logging enables filtering, file output, and log levels
- **Fix outline:**
  - Create `import { logger } from '@/lib/errorTracking'` pattern
  - Replace `console.log` with `logger.debug()`, `console.error` with `logger.error()`
  - Configure log levels per environment
- **Tests/docs:** Update CONTRIBUTING.md with logging guidelines
- **Blast radius:** ~15 component files

---

### IMP-006 | Maintainability | Low | Low Impact | Low Risk | S | High Confidence

**Address type escapes (any usage)**

- **Evidence:** `src/pages/ReportsPage.tsx:779,874` uses `(props: any)`, `src/lib/db/migrate-from-localstorage.ts:38-61` bulk `any` interfaces
- **Why it matters:** `any` bypasses type safety; increases bug risk
- **Fix outline:**
  - For ReportsPage: Type the Recharts shape prop correctly (see Recharts types)
  - For migrate-from-localstorage: Keep as-is (legacy migration code, low priority)
- **Tests/docs:** None
- **Blast radius:** 2 files

---

### ~~IMP-007 | Maintainability | Low | Medium Impact | Low Risk | L | Medium Confidence~~ DONE

**Complete legacy.ts SQLite migration** - Completed 2025-12-29

- **Evidence:** `src/lib/db/legacy.ts:43-202` has 10 `TODO: Implement full SQLite version` comments
- **Why it matters:** Incomplete migration; functions may not behave as expected
- **Fix outline:**
  - Implement `getPacketData` fully (line 43)
  - Implement heat cycle prediction functions (lines 130-202)
  - Remove localStorage fallback paths
  - Add integration tests
- **Tests/docs:** Add tests for each migrated function
- **Blast radius:** `src/lib/db/legacy.ts`, potentially hooks that consume these

---

### IMP-008 | DevEx | Low | Low Impact | Low Risk | S | High Confidence

**Clean up build warnings**

- **Evidence:** Build output shows mixed static/dynamic import warnings for `connection.ts` and `utils.ts`
- **Why it matters:** Warnings indicate potential bundling issues; cleaner output aids CI
- **Fix outline:**
  - In `src/lib/db/legacy.ts`: Remove dynamic imports, use only static imports
  - Or: Convert all db module imports to dynamic if code-splitting is desired
- **Tests/docs:** None
- **Blast radius:** `src/lib/db/legacy.ts`, `src/lib/db/migrations.ts`

---

### IMP-009 | Maintainability | Low | Medium Impact | Medium Risk | L | Medium Confidence

**Split large files**

- **Evidence:** `src/lib/db/legacy.ts` (1495 lines), `src/lib/contractUtils.ts` (1327 lines), `src/pages/ExpensesPage.tsx` (1153 lines)
- **Why it matters:** Large files are harder to maintain, review, and test
- **Fix outline:**
  - Extract ExpensesPage table, form, and chart into separate components
  - Split contractUtils into template-processing and file-generation modules
  - Legacy.ts can wait until migration is complete
- **Tests/docs:** Ensure existing tests still pass
- **Blast radius:** 3+ files per split

---

### IMP-010 | DevEx | Low | Medium Impact | Low Risk | L | Medium Confidence

**Improve test coverage**

- **Evidence:** Coverage report shows 0% for pages, most components; only lib/db partially covered
- **Why it matters:** Low coverage means regressions can go undetected
- **Fix outline:**
  - Prioritize testing pages with complex logic: ExpensesPage, ReportsPage
  - Add integration tests for critical user flows
  - Target 60%+ statement coverage
- **Tests/docs:** N/A (this IS adding tests)
- **Blast radius:** `src/**/__tests__/`

---

### IMP-011 | Performance | Low | Medium Impact | Medium Risk | M | Medium Confidence

**Code-split large chunks**

- **Evidence:** Build output shows `ExpensesPage` (958KB), `vendor-pdf-renderer` (1.49MB) exceed 500KB
- **Why it matters:** Large initial bundles slow down app startup
- **Fix outline:**
  - Lazy-load PDF renderer only on DocumentViewer/PacketExport pages
  - Lazy-load ExpensesPage (already route-based, verify chunking)
  - Configure `build.rollupOptions.output.manualChunks` in vite.config
- **Tests/docs:** None
- **Blast radius:** `vite.config.ts`, pages using PDF

---

## Priority Summary

### Quick Wins (Size S, ~30 min each)
- **IMP-001:** Remove 4 unused dependencies
- **IMP-002:** Fix version mismatch in .env
- **IMP-006:** Type the Recharts shape props
- **IMP-008:** Clean up build warnings

### Medium Effort (Size M, ~half-day each)
- **IMP-003:** Remove ~45 console.log statements
- **IMP-004:** Add JSON.parse error handling
- **IMP-005:** Implement structured logging pattern
- **IMP-011:** Code-split large chunks

### Larger Efforts (Size L, multi-day)
- **IMP-007:** Complete legacy SQLite migration (10 TODOs)
- **IMP-009:** Split large files (3 files >1000 lines)
- **IMP-010:** Improve test coverage from ~15% to 60%+

---

## Notes

- **No blocking issues found** - all gates pass
- **No security vulnerabilities detected in code** - GitHub token in .env is gitignored and not committed
- **Prisma in devDeps** is intentional (used for schema reference only per README)

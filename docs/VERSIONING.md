# Versioning

Respectabullz follows [Semantic Versioning 2.0.0](https://semver.org/).

## Version Format

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Incompatible changes (database schema changes requiring migration, major UI overhauls)
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes and minor improvements

## Version Locations

`VERSION` is canonical. Release work must keep the following mirrors synchronized:

| File | Purpose |
|------|---------|
| `VERSION` | Canonical semantic version |
| `package.json` | npm package version |
| `package-lock.json` | Root lockfile version and root package entry |
| `src-tauri/Cargo.toml` | Rust crate version |
| `src-tauri/Cargo.lock` | Locked `respectabullz` package version |
| `src-tauri/tauri.conf.json` | Tauri app version |
| `src/lib/version.ts` | Generated frontend display mirror |
| `.env.example` | Frontend display-version example |

The bump helper updates all of these mirrors. The separate checker compares nine
version values because `package-lock.json` contains both a top-level version and a
root-package version.

## Updating Version

Use the version bump script:

```powershell
# Bump patch version (0.1.0 -> 0.1.1)
node scripts/bump-version.js patch

# Bump minor version (0.1.0 -> 0.2.0)
node scripts/bump-version.js minor

# Bump major version (0.1.0 -> 1.0.0)
node scripts/bump-version.js major

# Set specific version
node scripts/bump-version.js 1.2.3

# Check semantic-version validity and mirror consistency
npm run version:check
```

`npm run version:check` exits nonzero for an invalid canonical version, a missing
version source, or drift in any checked mirror.

## Release Checklist

1. **Update Version**
   ```powershell
   node scripts/bump-version.js [type]
   ```

2. **Update CHANGELOG.md**
   - Add new version section with date
   - List all changes under Added/Changed/Fixed/Removed

3. **Commit**
   ```powershell
   git add VERSION package.json package-lock.json src/lib/version.ts src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json .env.example CHANGELOG.md
   git commit -m "1.2.3 Release description"
   ```

4. **Validate the frozen source**
   ```powershell
   npm ci
   npm run version:check
   npm run lint
   npm run typecheck
   npm run test:ci
   npm run test:coverage
   npm run build
   cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
   cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features --locked -- -D warnings
   cargo test --manifest-path src-tauri/Cargo.toml --all-features --locked
   ```

5. **Prepare protected release inputs**

   Configure the protected GitHub `release` environment with
   `WINDOWS_CERTIFICATE_BASE64`, `WINDOWS_CERTIFICATE_PASSWORD`, and the
   `WINDOWS_TIMESTAMP_URL` repository variable. Do not place the PFX or password in the
   repository.

6. **Tag and run the signed release workflow**
   ```powershell
   git tag v1.2.3
   git push
   git push --tags
   ```

   The `Signed Windows Release` workflow is triggered only by a version tag and rejects
   any tag other than `v` plus the exact `VERSION` value. It is the only distribution
   path. It runs the complete version, demo-data, lint, type, frontend test/coverage,
   Rust format/Clippy/test, and dependency-audit gates; imports the certificate on the
   hosted runner; builds the NSIS bundle; verifies the expected timestamped
   Authenticode signature on every executable/installer; scans artifacts; generates
   npm and Rust CycloneDX SBOMs plus SHA-256 checksums; and removes temporary signing
   material.

7. **Create GitHub Release**
   - Exercise the verified signed installer and supported upgrade path with disposable data
   - Publish the workflow-generated checksums and both SBOMs
   - Link the successful release-workflow run and signature evidence
   - Upload only artifacts produced by that verified signed build
   - Copy the applicable changelog section and evidence links to release notes

Ordinary CI builds and starts an unsigned `--no-bundle` executable only on its
ephemeral Windows runner. It requires a versioned marker written after database
initialization and reconciliation, verifies process/error state, and uploads evidence,
not the executable or an unsigned installer. A local `npm run tauri:build` is
development output and must not be distributed as a verified release.

## Pre-release Versions

For testing releases:

```
1.0.0-alpha.1
1.0.0-beta.1
1.0.0-rc.1
```

## Current Version

**1.10.4** (2026-08-22) - Current source version

The version number above identifies the current source metadata; it is not by
itself release or assurance evidence. Current containment boundaries supersede the
historical summaries below:

- restore/import is withdrawn and no factory reset is exposed;
- ZIP and JSON exports are partial, not verified backups; the current ZIP writes
  directly to the exact selected target and is non-atomic;
- custom contract-folder authority is session-scoped and must be reselected after
  restart;
- legacy browser-storage payloads block startup unchanged; automatic import is
  withdrawn pending a transactional recovery design;
- sample-data tools require both a debug build and the exact isolated
  `com.respectabullz.demo` identity;
- renderer database access crosses bounded native commands, while sale lifecycle
  changes use purpose-specific transactions;
- native filesystem capabilities are operation-specific and exclude managed roots,
  hidden names, and nested paths from renderer mutation;
- the complete npm lockfile has zero dated advisories; Rust audit policy documents one
  exception for the unselected SQLx MySQL/RSA path and retains informational warnings;
- operating-system notifications are not dispatched in v1.10.4; and
- release distribution is signed-only through the protected release workflow, for
  which a successful signing run is not yet recorded;
- the app has no in-app updater; and
- current verification results and limitations are recorded in
  [TEST_EVIDENCE.md](case-study/TEST_EVIDENCE.md).

Version 1.10.4 contains the security-remediation patch: renderer database access is
bounded by Rust, sale mutations use typed transactions, native filesystem scope is
narrowed, renderer notification code is removed, dependency policy is updated, and
unsigned CI output cannot become a release artifact.

Version 1.10.3 contained the earlier portfolio-remediation containment release: unsafe
restore/reset surfaces are withdrawn, the supported migration and managed-document
paths are failure-aware, the frontend credential design is removed, Windows-aware CI
is defined, and a separately addressed development demo fixture is available.

Historical 1.10.2 release notes described selected file-write, rollback,
connection, validation, path, and logging changes. Those notes did not establish
global atomicity, complete mutation rollback, or recoverability.

---

**1.10.1** (2026-01-01)

Patch release - UX Improvements:
- Changed notifications in a legacy restore path that is now withdrawn
- Historically showed a limited failed-photo list
- PDF export now validates and warns about missing photos before generation
- Replaced console.error calls with structured logger in backupUtils.ts

---

## Release History

The entries below are historical release notes. They are retained for provenance,
not as current security, reliability, compatibility, or test assurance.

**1.10.0** (2026-01-01)

Minor release - Security Hardening:
- Security: Restricted assetProtocol.scope to app-specific directory only
- Security: Enabled Content Security Policy (CSP) in Tauri configuration
- Security: Restricted filesystem capabilities to app directories
- Security: Added filename validation to prevent path traversal attacks
- Data Integrity: Health schedule template JSON parse now throws on corruption
- Data Integrity: localStorage migration validates with zod schema before migration
- Data Integrity: Legacy export metadata received schema checks; this did not make
  restore complete or transactional, and restore is now withdrawn
- Data Integrity: The former photo restore path tracked some file failures; it is
  no longer supported
- Data Integrity: Contract file writes verify file existence after write
- Photo Handling: Switched to UUID v4 for photo and document filenames
- Photo Handling: Standardized photo URL path construction (forward slashes)
- State Management: Optimistic update handling with rollback in useUpdateLitter
- State Management: Try-catch with state rollback in WhelpingChecklist
- User Feedback: PDF worker initialization error handling with user-friendly message
- User Feedback: Toast notification when kennel logo fails to load during PDF export
- Added: validateImagesBeforeExport() function for pre-export image checking

**1.9.4** (2025-12-30)

Patch release - Test Coverage and Performance:
- Added 90 new tests for expense components (ExpensesFilters, ExpensesTable, ExpensesChart, ReportsPage)
- Implemented environment-based structured logging (VITE_LOG_LEVEL support)
- Lazy-load PDF renderer for improved initial load time
- Code deduplication in contract utilities (~180 lines removed)
- Fixed: New contact categories auto-assign unique color (fixes #3)

**1.9.3** (2025-12-29)

Patch release - Build Optimization:
- Fixed large chunk size warnings (ExpensesPage: 958KB → 20KB)
- Added coverage/ to ESLint ignores
- Removed unused exports from errorTracking, documentUtils, types

**1.9.2** (2025-12-29)

Patch release - Code Quality:
- Removed 4 unused packages reducing bundle size
- Removed ~40 debug console.log statements
- Implemented SQLite versions of legacy stubbed functions
- Fixed expense category capitalization consistency
- Added React Router v7 future flags

**1.9.1** (2025-12-29)

Patch release - Bug Reporting:
- Historical direct GitHub-reporting design; the current implementation is a
  credential-free, sanitized, user-reviewed clipboard draft that opens a fixed blank
  GitHub Issues/new page with no report data in the URL and does not submit
  automatically
- Expense export upgraded to native Excel (.xlsx) format
- Fixed expense export column misalignment

**1.9.0** (2025-12-24)

Minor release - Contact Enhancements:
- **Contact Company Name**: Added company name field to contacts
  - New optional field to capture company/business name for contacts
  - Displayed in contact list, detail panel, and form
  - Included in search functionality
  - Database migration v5 adds `company_name` column to contacts table
- **Contacts Column Sorting**: Added sortable columns to contacts table
  - Click column headers to sort by Name, Categories, or Location
  - Toggle between ascending (A-Z) and descending (Z-A) order
  - Sort indicator icons show current sort state

**1.8.1** (2025-12-24)

Patch release - Bundle size optimization:
- Reduced initial bundle from 4,291 kB to 320 kB (93% reduction)
- Implemented code splitting with React.lazy() for all pages
- Configured Vite manual chunks for vendor libraries

**1.8.0** (2025-12-24)

Minor release - Contacts Management System:
- **Contacts Management**: New dedicated section for managing business contacts
  - Full CRUD operations for contacts (create, read, update, delete)
  - Contact fields: name, primary/secondary phone, email, full address, notes
  - Social media integration: Facebook, Instagram, TikTok, Twitter/X, Website
  - Business card support via existing document management system
  - Multi-category tagging with many-to-many relationships
  - 5 predefined categories: Client, Shipping Company, Graphic Designer, Breeder, Vet
  - Custom category creation with user-defined colors
  - Search by name, email, phone, or city
  - Filter by one or more categories using MultiSelect
  - Database migration v4 with 3 new tables

**1.7.3** (2025-12-24)

Patch release - Bug fixes:
- Fixed heat cycle dog association display
- Fixed N+1 query problem in heat cycle fetching
- Fixed expense category filter scroll and duplicate issues

**1.7.1** (2025-12-24)

Patch release - Bug fixes:
- Removed in-app auto-updater due to code signing requirements
- Fixed missing "Breeding" expense category
- Fixed transport/expense sync duplicate issues
- Fixed date timezone bug causing dates to shift by one day

**1.6.0** (2025-12-10)

Minor release - Contract generation overhaul:
- **Contract Generation**: Complete update to match new contract template format
  - Updated JSON template (v2) with all sections from new contract document
  - Enhanced field replacement to support new template patterns
  - Added PDF generation capability using @react-pdf/renderer
  - Contract generation now produces both Word (.docx) and PDF (.pdf) formats by default
  - Updated contract form dialog to generate both formats simultaneously
  - All existing data fields maintained - no database changes required
  - Added comprehensive test suite for contract utility functions (13 tests)
- **Contract Generation Error**: Fixed "format is not a function" error when generating contracts from inquiries page
  - Resolved naming conflict where `format` parameter was shadowing the date-fns `format` function
  - Renamed parameter to `fileFormat` to allow proper date formatting

**1.5.3** (2025-12-07)

Patch release - Bug fixes and new features:

### New Features
- **Custom Contracts Directory**: Users can choose where completed contracts are saved
  - Native folder picker dialog for selecting custom save location
  - Defaults to app data directory if no custom location set
  - Historical behavior persisted the path across restarts; current generation ignores
    that legacy value and requires a fresh native folder grant each session
  - Integrated with Settings > Preferences > Contracts Save Location
- **Phone Number Auto-formatting**: All phone fields automatically format to (xxx) xxx-xxxx as users type
  - Real-time formatting with cursor position preservation
  - Reusable PhoneInput component with US format default
- **Breeder Settings Auto-population**: Historical default values for breeder name,
  city, and state; current shipped defaults are blank

### Bug Fixes
- Inquiries: Fixed client and puppy not being associated when creating or updating inquiries
- Inquiries: Fixed client and dog relations not being populated when retrieving inquiries
- Phone input: Fixed phone number input fields not populating/updating when typing
- Settings: Fixed breeder information form fields being reset while typing due to React Query refetches
- Contract generation: Improved breeder settings validation error message
- **Critical**: Added array bounds checking after INSERT operations to prevent crashes
- **Critical**: Fixed SQL `IS ?` syntax error in waitlist entry creation
- **High**: Added try-catch around JSON.parse calls to prevent crashes on corrupted data
- **High**: Added error toast for document upload failures
- **Medium**: Removed unreliable setTimeout delay in database initialization
- **Medium**: Added type guards for enum validation to prevent runtime errors
- **Low**: Added error logging to empty catch blocks for better debugging

**1.5.2** (2025-12-04)

**1.5.1** (2025-12-04)

Patch release - Bug fixes:
- Fixed PDF preview loading by aligning pdfjs-dist version and bundling worker locally
- PDF preview now works offline without internet connection
- Improved error handling and logging for PDF loading failures

**1.5.0** (2025-12-04)

Minor release - New features:
- PDF Preview Capabilities - In-app PDF viewing with page navigation and zoom controls
- Document Upload & Tagging System - Full document management for Dogs, Litters, and Expenses
- Help & Documentation section in Settings - Built-in user manual and how-to guide

**1.4.0** (2025-12-04)

Minor release - Enhanced features and improvements:
- Full column sorting on Expenses page - All columns are now sortable (date, category, dog, vendor, description, amount, tax deductible)
- Fixed litter form dialog scrolling - Added responsive scrolling for smaller screens
- Fixed expenses filter bug - Expenses without related dogs now shown correctly
- Fixed seed database failures - Multiple issues preventing successful seeding resolved
- Enhanced seed data completeness - Added financial records for all dogs in seed data

**1.3.0** (2025-12-04)

Minor release - Enhanced features and improvements:
- Enhanced seed data coverage - Comprehensive seed database function now includes all app areas
- Multi-select expense filters - Advanced filtering capabilities with multi-select categories and dogs
- Expense exclusion checkboxes - Temporarily exclude individual expenses from totals
- Fixed expenses filter bug - Expenses without related dogs now shown correctly
- Fixed seed database failures - Multiple issues preventing successful seeding resolved
- Fixed litter form dialog scrolling - Added responsive scrolling for smaller screens

**1.2.0** (2025-12-04)

Major release - Database migration and architecture improvements:
- SQLite Database Migration - Complete migration from localStorage to persistent SQLite database
- Database Architecture Refactoring - Split monolithic db.ts into maintainable domain modules
- Test Infrastructure - Comprehensive testing setup with Vitest (106 tests passing)
- First Launch Experience Enhancement - Database initialization progress feedback

**1.1.0** (2025-12-04)

Minor release - New features and improvements:
- Reusable dialog components (FormDialog, ConfirmDialog) to reduce code duplication
- Virtual scrolling for large lists using @tanstack/react-virtual
- Centralized error tracking service with file logging via Tauri
- Updated DogsPage, ClientsPage, and ExpensesPage with virtual table support

**1.0.2** (2025-12-04)

Patch release - Bug fixes:
- Customer packet PDF export now embeds stored/local photos
- Pedigree PDF visualization draws connector lines between generations

**1.0.1** (2025-12-04)

Patch release - Improvements and fixes:
- Historical first-launch sample-data option; the current production build exposes no
  sample-data control
- Windows NSIS installer configuration for easy end-user distribution
- Fixed all TypeScript compilation errors (98 errors resolved)

**1.0.0** (2025-12-03)

Major release - First stable version:
- Complete customer packet PDF export with professional branding
- Comprehensive dog management with pedigree tracking
- Full health and breeding management system
- Client management and sales pipeline
- Historical photo-management and export feature set; current exports are partial
- Historical "production-ready" wording, retained only as provenance and not as a
  current assurance claim

**0.9.2** (2025-12-03)

Bug fixes in this version:
- Added invalid date validation to `formatDate()` and `calculateAge()` utility functions to prevent runtime errors with corrupted date data

**0.9.1** (2025-12-03)

Bug fixes in this version:
- Fixed database date parsing for HeatCycle and HeatEvent fields
- Enhanced heat cycle CSV export with breeding and progesterone data
- Added missing relation populations in database functions

**0.9.0** (2025-12-03)

Major features in this version:
- Genetic testing and mating compatibility checking
- Visual pedigree display with 3-generation charts
- Registry status tracking and paperwork helpers
- Advanced breeding reports and analytics

**0.8.0** (2025-12-04)

Major features in this version:
- Puppy health schedule with auto-generated 8-week tasks
- Pregnancy and whelping management with checklists
- Waitlist and reservation system with deposit tracking
- Client communication logging with follow-up reminders
- Breeding planning enhancements with heat cycle predictions

## Version History

See [CHANGELOG.md](../CHANGELOG.md) for complete version history.

## Database Migrations

When changing the database schema:

1. Define the supported starting schema versions and the expected target version.
2. Implement the runtime migration in the Tauri/SQLite path. The Prisma schema is
   a reference and is not the runtime migration engine.
3. Keep schema creation and version transitions under the same owned database
   connection and transaction boundary.
4. Add real-SQLite tests for fresh creation, each supported upgrade, idempotent
   reopen, failure rollback and retry, unsupported baselines, foreign-key
   violations, and concurrent startup where applicable.
5. Document the migration and compatibility boundary in the changelog and release
   evidence.
6. Choose the semantic version bump based on user-visible compatibility; a schema
   change is not automatically a major version when a tested compatible migration
   is provided.

## Breaking Changes

Breaking changes require:

1. MAJOR version bump
2. Migration guide in changelog
3. Deprecation notices in previous release (if possible)


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

Version is tracked in multiple files and must stay synchronized:

| File | Purpose |
|------|---------|
| `src/lib/version.ts` | Single source of truth (exported constant) |
| `package.json` | npm package version |
| `src-tauri/tauri.conf.json` | Tauri app version |
| `src-tauri/Cargo.toml` | Rust crate version |

## Updating Version

Use the version bump script:

```bash
# Bump patch version (0.1.0 -> 0.1.1)
node scripts/bump-version.js patch

# Bump minor version (0.1.0 -> 0.2.0)
node scripts/bump-version.js minor

# Bump major version (0.1.0 -> 1.0.0)
node scripts/bump-version.js major

# Set specific version
node scripts/bump-version.js 1.2.3

# Check current version
node scripts/bump-version.js
```

## Release Checklist

1. **Update Version**
   ```bash
   node scripts/bump-version.js [type]
   ```

2. **Update CHANGELOG.md**
   - Add new version section with date
   - List all changes under Added/Changed/Fixed/Removed

3. **Commit**
   ```bash
   git add .
   git commit -m "1.2.3 Release description"
   ```

4. **Tag**
   ```bash
   git tag v1.2.3
   git push && git push --tags
   ```

5. **Build**
   ```bash
   npm run tauri:build
   ```

6. **Create GitHub Release**
   - Upload installers
   - Copy changelog section to release notes

## Pre-release Versions

For testing releases:

```
1.0.0-alpha.1
1.0.0-beta.1
1.0.0-rc.1
```

## Current Version

**1.9.3** (2025-12-29) - Current Release

Patch release - Build Optimization:
- Added company name field to contacts for storing business/company names
- Displayed in contact list, detail panel, and form
- Included in contact search functionality
- Database migration v5 adds `company_name` column to contacts table
- Added sortable columns (Name, Categories, Location) to contacts table

---

## Release History

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
  - Custom directory path persists across app restarts
  - Integrated with Settings > Preferences > Contracts Save Location
- **Phone Number Auto-formatting**: All phone fields automatically format to (xxx) xxx-xxxx as users type
  - Real-time formatting with cursor position preservation
  - Reusable PhoneInput component with US format default
- **Breeder Settings Auto-population**: Default values for breeder name, city, and state

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
- First-launch dialog allowing users to choose between empty database or sample data
- Windows NSIS installer configuration for easy end-user distribution
- Fixed all TypeScript compilation errors (98 errors resolved)

**1.0.0** (2025-12-03)

Major release - First stable version:
- Complete customer packet PDF export with professional branding
- Comprehensive dog management with pedigree tracking
- Full health and breeding management system
- Client management and sales pipeline
- Photo management and backup system
- All core features production-ready

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

1. Bump MINOR or MAJOR version
2. Create migration in `prisma/migrations/`
3. Document migration steps in changelog
4. Test migration with existing data

## Breaking Changes

Breaking changes require:

1. MAJOR version bump
2. Migration guide in changelog
3. Deprecation notices in previous release (if possible)


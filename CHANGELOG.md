# Changelog

All notable changes to Respectabullz will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.7.2] - 2025-12-24

### Fixed
- **Heat Cycle Dog Association**: Fixed heat cycles not displaying associated dog after creation
  - `getHeatCycles()` and `getHeatCycle()` now populate the `bitch` relation with dog data
  - Heat cycle list and detail views now correctly show the female dog's name
- **Heat Cycle Query Performance**: Fixed N+1 query problem in heat cycle fetching
  - Added `getDogBasic()` for lightweight dog lookups (no sire/dam/photos)
  - Added `getDogsByIds()` for batch fetching dogs in a single query
  - Reduced potential 251 queries down to 3 queries for 50 heat cycles
- **Expense Category Filter**: Fixed category filter not showing all available categories
  - Filter now includes: built-in categories + custom categories + any categories used in existing expenses
  - Ensures all categories (including custom ones added later) can be filtered
- **ESLint Warnings**: Resolved all 25 ESLint warnings to pass `--max-warnings 0`
  - Fixed unused `defaultCountry` parameter in `phone-input.tsx` (renamed to `_defaultCountry`)
  - Fixed unused `actionTypes` const in `use-toast.ts` (converted to inline type definition)
  - Fixed unused `error` catch variables in `notifications.ts` and `photoUtils.ts`
  - Updated ESLint config to disable `react-hooks/incompatible-library` (informational warning)
  - Updated ESLint config to allow standard shadcn/ui exports (`badgeVariants`, `buttonVariants`, etc.)
  - Disabled `react-refresh/only-export-components` for test files
- **Version Sync**: Fixed `src/lib/version.ts` showing `1.7.0` instead of `1.7.1`

### Added
- **Tests**: Added comprehensive tests for `parseLocalDate()` utility function

## [1.7.1] - 2025-12-24

### Removed
- **In-App Auto-Updater**: Temporarily removed due to code signing requirements
  - Feature requires signed binaries for secure updates
  - Will be re-added once code signing is configured for releases

### Fixed
- **Missing Expense Category**: Added missing "Breeding" category to expense options
  - "Breeding" category was documented but not implemented in the code
  - Now displays alongside other built-in categories (Food, Vet, Supplies, Registration, Transport, Marketing, Utilities, Misc)
  - Updated documentation to include Registration and Utilities categories
- **Transport/Expense Sync Bug**: Fixed duplicate transport records when creating transport with cost
  - Creating a transport with cost was calling `createExpense()` which auto-created a second transport
  - Added `skipTransportCreation` flag to prevent circular creation between transport and expense
  - Transport and Expenses pages now properly stay in sync without duplicates
- **Date Timezone Bug**: Fixed dates shifting by one day when editing records
  - HTML date inputs return strings like "2025-11-09" which were parsed as UTC midnight
  - In US timezones, this caused dates to display as the previous day
  - Added `parseLocalDate()` utility function that parses date strings as local time
  - Fixed all form dialogs: Transport, Expense, Dog, Litter, Sale, Contract, Health Records, Vaccinations, Weights, Heat Cycles, Genetic Tests, Client Interests, Waitlist, Puppy Health Tasks, and Registration
- **Heat Cycle Dog Association**: Fixed heat cycles not displaying associated dog after creation
  - `getHeatCycles()` and `getHeatCycle()` now populate the `bitch` relation with full dog data
  - Heat cycle list and detail views now correctly show the female dog's name

## [1.7.0] - 2025-12-23

### Added
- **Transport and Expense Tests**: Comprehensive test coverage for transport-expense relationship
  - Database operations tests for expenses CRUD (create, read, update, delete)
  - Database operations tests for transports CRUD
  - Tests for automatic expense creation when transport has cost
  - Tests for cascading delete (deleting transport removes linked expense)
  - Tests for expense filtering by dogId, category, and litterId
  - Component tests for DogTransportsList display and interactions

### Fixed
- **Transport Expense Linking**: Transport expenses added from Dog Financial page now appear on Transport page
  - When creating an expense with category "transport" and a related dog, a linked transport record is automatically created
  - Deleting a transport expense also removes the linked transport record
  - Query cache is properly invalidated to refresh the Transport page
- **Dog Detail Transport Tab**: Fixed transport tab showing placeholder text instead of actual transport records
  - Created new `DogTransportsList` component to display transport history for a specific dog
  - Shows transport date, mode, shipper info, route, tracking number, and cost
  - Added ability to add/edit/delete transport records directly from dog detail page
  - TransportFormDialog now supports `defaultDogId` prop to pre-select dog when adding from dog page
- **Version Sync**: Fixed version mismatch across VERSION file and Cargo.toml (now all 5 sources at 1.7.0)
- **ESLint Errors**: Fixed 5 ESLint errors
  - `no-constant-binary-expression` in utils.test.ts: Used variables instead of literal boolean expressions
  - `no-case-declarations` in migrations.ts: Wrapped case block in braces for proper lexical scoping
  - `prefer-const` in HelpSection.tsx: Changed `let` to `const` for non-reassigned variable
  - `setState-in-effect` in HelpSection.tsx: Pre-render markdown at module level to avoid synchronous setState in useEffect

## [1.6.2] - 2025-12-23

### Fixed
- **Transport Page**: Fixed dog name not displaying in transport list
  - Added JOIN query to fetch dog relation when retrieving transports
  - Transport records now properly show the associated dog's name
- **React Compiler Compatibility**: Fixed 27 ESLint errors for `react-hooks/static-components`
  - DocumentCard.tsx: Created `DocumentIcon` component to avoid component recreation during render
  - ExpensesPage.tsx: Extracted `SortIcon` to module-level component with explicit props
  - DogsPage.tsx: Extracted `SortIcon` to module-level component with explicit props
- **React Hook Dependencies**: Fixed exhaustive-deps warnings in ExpensesPage.tsx
  - Added missing `dogs` dependency to `filteredExpenses` useMemo
  - Wrapped `excludeAllExpenses` and `handleSort` in useCallback for stable references
  - Added `excludeAllExpenses` to `expenseColumns` useMemo dependency array
- **Unused Variables**: Fixed unused `error` variable warning in ExpenseFormDialog.tsx
  - Changed catch block to omit unused error parameter

## [1.6.1] - 2025-12-23

### Added
- **Fillable Contract Template Support**: New option to fill pre-made fillable Word templates
  - Added `fillFillableContract()` function that fills Word Content Controls (SDT fields)
  - Uses PizZip for direct XML manipulation of .docx files
  - Supports 155 fillable fields mapped to ContractData properties
  - Template mode toggle in Contract Form Dialog: "Generated" vs "Fillable"
  - Added `fillable_contract_2.docx` template to public folder
  - Hook updated with `templateMode` option ('generated' | 'fillable')

### Fixed
- **Fillable Contract Generation**: Fixed broken regex in `replaceSDTContent()` that prevented SDT element finding
  - Replaced incorrect negative lookahead pattern with proper matchAll approach
  - Now correctly locates the containing SDT element for field replacement
- **Contract JSON Template**: Fixed placeholder formatting in generated contract template
  - Added proper tab delimiters for date, buyer info, and breeder fields
  - Fixed birth date, sale terms, and notary section placeholders for consistent field filling

## [1.6.0] - 2025-12-10

### Changed
- **Contract Generation**: Complete overhaul to match new contract template format
  - Updated JSON template (v2) with all sections from new contract document
  - Enhanced field replacement to support new template patterns
  - Added PDF generation capability using @react-pdf/renderer
  - Contract generation now produces both Word (.docx) and PDF (.pdf) formats by default
  - Updated contract form dialog to generate both formats simultaneously
  - All existing data fields maintained - no database changes required
  - Added comprehensive test suite for contract utility functions (13 tests)

### Fixed
- **Contract Generation Error**: Fixed "format is not a function" error when generating contracts from inquiries page
  - Resolved naming conflict where `format` parameter in `generateContractFilename()` was shadowing the date-fns `format` function
  - Renamed parameter to `fileFormat` to allow proper date formatting

## [1.5.3] - 2025-12-07

### Added
- **Custom Contracts Directory**: Users can now choose where completed contracts are saved (Settings > Preferences > Contracts Save Location)
  - Native folder picker dialog for selecting custom save location
  - Defaults to app data directory if no custom location set
  - Custom directory path persists across app restarts
  - Tauri command for directory selection integrated with settings system
- Phone number auto-formatting: All phone number fields now automatically format to (xxx) xxx-xxxx as users type with real-time formatting
- PhoneInput component: Reusable phone input component with US format default and cursor position preservation
- Breeder settings auto-population: Breeder/Owner name, city, and state fields now auto-populate with default values (Johnny Bonilla, Martinsburg, WV)

### Fixed
- Inquiries: Fixed client and puppy not being associated when creating or updating inquiries
- Inquiries: Fixed client and dog relations not being populated when retrieving inquiries
- Phone input: Fixed phone number input fields not populating/updating when typing
- Settings: Fixed breeder information form fields being reset while typing due to React Query refetches
- Contract generation: Improved breeder settings validation and error message to clearly indicate which fields are required (Address Line 1 and Phone)
- **Critical: Array bounds checking** - Added bounds checking after INSERT operations in health.ts, breeding.ts, dogs.ts, and settings.ts to prevent crashes when database operations fail silently
- **Critical: SQL syntax error** - Fixed invalid `IS ?` SQL syntax in waitlist entry creation (sales.ts) that caused query failures for general waitlist entries
- **High: JSON parsing safety** - Added try-catch blocks around JSON.parse calls in backupUtils.ts and health.ts to prevent crashes on corrupted data
- **High: Document upload feedback** - Added user-facing error toast notification when document upload fails (previously only logged to console)
- **Medium: Race condition** - Removed unreliable 200ms setTimeout delay in database initialization (init.ts) - SQLite operations are already sequential via await
- **Medium: Type safety** - Added type guards for enum validation in dogs.ts to prevent invalid database values from causing runtime errors
- **Low: Error logging** - Added error logging to previously empty catch blocks in migrate-from-localstorage.ts for better debugging
- **Low: Code cleanup** - Removed unnecessary async/try-catch from FirstLaunchDialog.tsx handleLoadSampleData function

## [1.5.2] - 2025-12-04

### Changed
- Reports: Added drilldown on Expenses by Category pie slices to show expense list
- Reports: Made expense drilldown dialog scrollable and contained to viewport

## [1.5.1] - 2025-12-04

### Fixed
- **PDF Preview Loading** - Fixed PDF documents failing to load in document viewer
  - Aligned pdfjs-dist version (5.4.296) to match react-pdf's bundled dependency
  - PDF.js worker now bundled locally via Vite instead of relying on CDN
  - Ensures PDF preview works offline without internet connection
  - Improved error handling and logging for PDF loading failures
  - PDFs now load reliably using base64 data URLs in Tauri desktop environment

## [1.5.0] - 2025-12-04

### Added
- **PDF Preview Capabilities** - In-app PDF viewing with full controls
  - Full PDF document preview using react-pdf (PDF.js)
  - Page navigation (previous/next page buttons)
  - Zoom controls (zoom in/out from 50% to 300%)
  - Page counter showing current page and total pages
  - Text layer rendering for selectable text
  - Annotation layer rendering for PDF annotations
  - Responsive PDF viewer that fits dialog width
  - Uses base64 data URLs for reliable PDF loading in Tauri
  - PDF.js worker bundled locally via Vite for offline support

- **Document Upload & Tagging System** - Full document management for Dogs, Litters, and Expenses
  - Upload PDFs, Word documents (.doc, .docx), Excel spreadsheets (.xls, .xlsx), and images (jpg, png, gif, webp)
  - 13 predefined document tags: Invoice, Receipt, Contract, Health Certificate, Registration Papers, Vet Record, Vaccination Record, Genetic Test Results, Microchip Certificate, Photo/Image, Shipping/Transport, Insurance, Other
  - Create custom tags with color coding
  - Multi-tag support - attach multiple tags to any document
  - Documents can be linked to multiple entities (shared across Dogs, Litters, Expenses)
  - Tag-based filtering and search within document lists
  - Document viewer for images and PDFs with print functionality
  - PDF preview with page navigation and zoom controls
  - Open with system default application support for all file types
  - Document count badges showing attachment status
  - New "Documents" tab on Dog detail pages
  - New "Documents" section on Litter detail pages
  - Document attachment button on Expenses table with count indicator
  - Database migration (v3) creates document tables and seeds predefined tags
  - Complete API documentation for document management operations
  - Document utilities for file handling, validation, and MIME type detection

- **Help & Documentation section in Settings** - New Help section under Settings page providing access to complete user documentation
  - Tabbed interface with "User Manual" and "How-To Guide" tabs
  - Displays full USER_MANUAL.md and HOWTO.md content
  - Scrollable content area (600px height) for easy navigation
  - Basic markdown rendering supporting headers, bold, italic, code blocks, lists, and links
  - Loading state with spinner while content loads
  - Content bundled at build time using Vite's raw import feature
  - Table of contents anchor links with smooth scrolling navigation
  - Headers automatically generate URL-friendly IDs for anchor targeting
  - Clicking table of contents links smoothly scrolls to corresponding sections

### Fixed
- **Help section anchor link navigation** - Fixed table of contents links not scrolling to sections
  - Headers now generate proper IDs from their text content
  - Anchor links in table of contents properly navigate to target sections
  - Smooth scrolling behavior with proper offset for better visibility
  - Works correctly within Radix ScrollArea viewport containers

## [1.4.0] - 2025-12-04

### Added
- **Full column sorting on Expenses page** - All columns are now sortable (date, category, dog, vendor, description, amount, tax deductible)
  - Click any column header to sort ascending/descending
  - Sort indicators show current sort column and direction
  - Works with all filter combinations including multi-select categories

### Fixed
- **Litter form dialog scrolling** - Fixed issue where LitterFormDialog content was cut off on smaller screens, preventing users from accessing all form fields
  - Added `max-h-[90vh] overflow-y-auto` classes to DialogContent to enable vertical scrolling when content exceeds viewport height
  - Matches the responsive scrolling pattern used in other form dialogs (DogFormDialog, SaleFormDialog, ContractFormDialog, etc.)
- **Expenses filter bug** - Fixed issue where expenses without a related dog were incorrectly excluded when dog filters were applied
  - Expenses without a related dog are now always shown regardless of filter selection
- **Seed database failures** - Fixed multiple issues preventing successful database seeding
  - Fixed transport record NOT NULL constraint violation (dog_id must be provided)
  - Added expense_categories to database clearing function
  - Added comprehensive error logging to identify seed failures
  - Seed function now automatically clears existing data before seeding
- **Seed data completeness** - Added financial records (expenses) for all dogs in seed data
  - All adult dogs now have multiple expense records (vet, food, supplies, grooming)
  - All puppies have expense records (wellness exams, registration, supplies)
  - 50+ total expenses covering all categories and dogs

## [1.3.0] - 2025-12-04

### Added
- **Enhanced seed data coverage** - Comprehensive seed database function now includes all app areas
  - 3 custom expense categories (Training, Grooming, Insurance) with color coding
  - Expenses for all built-in categories (transport, vet, food, supplies, registration, marketing, utilities, misc)
  - 20+ expense records covering all categories and custom categories
  - Additional transport records (flight, ground, local pickup)
  - Additional heat cycles (4 total with detailed events)
  - Expanded genetic tests for all breeding dogs (full panels)
  - Expanded vaccination records for all dogs (adults and puppies)
  - Expanded medical records for multiple dogs (exams, tests, surgeries)
  - Expanded weight entries for multiple dogs (puppies and adults)
  - Expanded pedigree entries for multiple dogs (3 generations)
- **Multi-select expense filters** - Enhanced Expenses page with advanced filtering capabilities
  - Multi-select category filter allowing selection of multiple categories simultaneously
  - Multi-select dog filter to view expenses for specific dogs
  - Expense exclusion checkboxes to temporarily exclude individual expenses from totals
  - "Include All" / checkbox header to toggle all expenses at once
  - Active filter badges showing selected categories and dogs with click-to-remove
  - Reset Filters button to quickly clear all active filters
  - Calculated totals update dynamically based on included/excluded expenses
  - CSV export respects exclusions (only exports included expenses)
  - New `MultiSelect` reusable UI component for multi-value selection with search

### Fixed
- **Database initialization failure** - Fixed bug where SQL schema statements with leading comments were incorrectly filtered out during database initialization, causing "no such table: _schema_version" error on first launch
- **FirstLaunchDialog stuck on initializing** - Added missing `setIsInitializing(false)` call after successful database initialization

### Added
- **Comprehensive SQLite seed data** - Revamped `seedDatabase()` function to populate all database tables for testing
  - 6 adult dogs (studs and dams with full registration info)
  - 9 puppies across multiple litters with evaluations
  - 4 litters in different stages (weaning, ready to go, planned, completed)
  - 2 external studs with contact information
  - Heat cycles with detailed event tracking (progesterone tests, breeding dates)
  - Genetic tests, vaccinations, medical records, weight entries
  - 5 clients with sales, interests, waitlist entries, and communication logs
  - Expenses across all categories with transport records
  - Pedigree entries and health schedule templates
  - Breeder settings pre-configured

## [1.2.0] - 2025-12-04

### Added
- **SQLite Database Migration** - Complete migration from localStorage to persistent SQLite database
  - Added `tauri-plugin-sql` to Rust backend with SQLite support
  - Added `@tauri-apps/plugin-sql` frontend package
  - Created `src/lib/db/schema.sql` with complete database schema derived from Prisma schema
  - Created `src/lib/db/connection.ts` for SQLite connection management with connection pooling
  - Created `src/lib/db/migrations.ts` for schema versioning and future upgrades
  - Created `src/lib/db/utils.ts` for ID generation, date conversions, and type utilities
  - Database initialization runs automatically on app startup
  - Automatic migration from localStorage to SQLite preserves all existing data
  - Progress feedback during migration with stage-by-stage updates

- **Database Architecture Refactoring** - Split monolithic 6,377-line `db.ts` into maintainable domain modules
  - `src/lib/db/dogs.ts` - Dog, DogPhoto, PedigreeEntry CRUD operations
  - `src/lib/db/litters.ts` - Litter, LitterPhoto operations
  - `src/lib/db/health.ts` - Vaccinations, Weight Entries, Medical Records, Genetic Tests, Puppy Health Tasks
  - `src/lib/db/breeding.ts` - Heat Cycles, Heat Events, External Studs, Breeding Predictions
  - `src/lib/db/sales.ts` - Clients, Sales, Client Interests, Waitlist, Communication Logs
  - `src/lib/db/operations.ts` - Expenses, Transports, Communication Logs
  - `src/lib/db/settings.ts` - Settings, Breeder Settings management
  - `src/lib/db/dashboard.ts` - Dashboard Stats, Activity Feed, Financial Summary
  - `src/lib/db/index.ts` - Centralized re-exports for backwards compatibility
  - `src/lib/db/legacy.ts` - Compatibility stubs for functions pending full SQLite implementation
  - `src/lib/db/init.ts` - Database initialization and migration orchestration

- **LocalStorage to SQLite Migration Utility**
  - `src/lib/db/migrate-from-localstorage.ts` for one-time data migration
  - Preserves all existing data with proper ID and date conversions
  - Progress callback for UI feedback during migration
  - Automatic cleanup of localStorage after successful migration
  - Handles all entity types: dogs, litters, heat cycles, health records, sales, expenses, etc.

- **Test Infrastructure** - Comprehensive testing setup with Vitest
  - Configured Vitest with React Testing Library and jsdom environment
  - Added test mocks for Tauri APIs (plugin-sql, plugin-fs, plugin-dialog)
  - Created reusable test utilities with QueryClient and Router providers
  - Unit tests for utility functions (`src/lib/__tests__/utils.test.ts`, `src/lib/db/__tests__/utils.test.ts`)
  - Integration tests for database operations (`src/lib/db/__tests__/dogs.test.ts`, `src/lib/db/__tests__/breeding.test.ts`)
  - Component tests for UI components (`src/components/__tests__/Button.test.tsx`, `src/components/__tests__/Card.test.tsx`)
  - Test scripts: `npm test` (run once), `npm run test:ui` (watch mode), `npm run test:coverage` (coverage report)
  - All 106 tests passing

- **First Launch Experience Enhancement**
  - Updated `FirstLaunchDialog` to show database initialization progress
  - Visual feedback during SQLite setup and migration
  - Automatic detection of existing localStorage data for migration
  - Improved error handling and user feedback

### Changed
- Database operations now use SQLite instead of localStorage mock
- All database functions maintain backwards compatibility through re-exports
- `db.ts` now re-exports from new modular structure instead of containing implementation
- Database connection uses Tauri's plugin-sql API for native SQLite access
- Date handling standardized with ISO string conversions for SQLite compatibility

### Fixed
- Transport expenses linked to dogs now appear correctly on the dog detail page
  - Fixed issue where empty strings were being stored instead of NULL for relatedDogId
  - Normalized empty strings to NULL in createExpense and updateExpense functions
  - Updated getExpenses query to exclude empty strings when filtering by dogId
- Fixed timezone issues in date tests (all tests now passing)
- Fixed all TypeScript compilation errors (21 errors resolved, 0 remaining)
  - Fixed QueryResult type handling in connection utilities
  - Fixed `getDogGeneticTestSummary` return type to match component expectations (returns count objects instead of Record)
  - Fixed `HeatEventFormDialog` to use correct breeding recommendation properties (`isOptimal`, `daysUntilOptimal` instead of non-existent `daysToBreeding`, `ovulationStatus`)
  - Fixed `useConvertInterestToSale` hook to properly create sale before converting interest
  - Fixed `MatingCompatibilityResult` type to use `isCompatible` property instead of `compatible`
  - Fixed type access issues in `getPacketData` function for sales query results
  - Removed unused imports (`AlertCircle`, `getLitter`) and parameters across legacy functions
  - Added proper type annotations for query results to prevent array type inference issues

### Added
- Timeframe filtering for expenses pie chart in Expenses page
  - Dropdown selector with options: Last 7 Days, Last 30 Days, Last 90 Days, This Month, and Custom Range
  - Pie chart dynamically updates to show expenses only within selected timeframe
  - Custom date range dialog with start and end date inputs
  - Date range validation ensures start date is before end date
  - Edit button appears when custom date range is selected for easy modification
  - Selected date range displayed below chart header when custom timeframe is active
  - Empty state message shown when no expenses exist in selected timeframe
- Calendar visualization for heat cycles in the Heat Cycles page
  - Visual timeline showing heat cycles on calendar dates
  - Color-coded phases (Proestrus, Estrus, Diestrus, Anestrus)
  - Highlights fertile windows for optimal breeding timing
  - Shows "Bred" indicator for cycles that have been bred
  - Tooltips with cycle details on hover
  - Clickable dates navigate to cycle detail pages
  - Month navigation with summary of cycles in current month
  - Supports multiple overlapping cycles on the same date
- Recent activity feed on the dashboard showing latest vaccinations, litters, transports, expenses, and sales

## [1.1.0] - 2025-12-04

### Added
- Reusable dialog components to reduce code duplication
  - `FormDialog` - wrapper for form-based dialogs with standard header/footer
  - `ConfirmDialog` - simple yes/no confirmation dialogs
  - `FormDialogField` - helper for consistent form field styling
- Virtual scrolling for large lists using @tanstack/react-virtual
  - `VirtualTable` component for efficient rendering of large datasets
  - Auto-enables for lists > 50 items, falls back to standard table for small lists
  - Updated DogsPage, ClientsPage, and ExpensesPage to use VirtualTable
- Centralized error tracking service with file logging
  - `logger` API with debug/info/warn/error levels
  - Persists logs to `{appDataDir}/logs/respectabullz.log` via Tauri
  - Automatic log rotation when file exceeds 5MB
  - Global error handlers for uncaught errors and unhandled promise rejections
  - In-memory log buffer for quick access to recent entries
  - Export functions for viewing/downloading logs

### Fixed
- Customer packet PDF export now embeds stored/local photos instead of returning placeholder values
- Pedigree PDF visualization draws connector lines between generations for improved readability

## [1.0.2] - 2025-12-04

### Changed
- Set dark mode as the default theme for new installations

## [1.0.1] - 2025-12-04

### Fixed
- Fixed all TypeScript compilation errors (98 errors resolved)
  - Removed unused variables and imports across multiple components
  - Fixed type annotations in `createMedicalRecords` and `createExpenseRecordsForDog` helper functions
  - Fixed expense date parsing type safety in database initialization
  - Added proper return type annotations to prevent implicit `any[]` types
  - Fixed MedicalRecord type compatibility issues in seed data generation

### Added
- Windows NSIS installer configuration for easy end-user distribution
- First-launch dialog allowing users to choose between empty database or sample data on initial startup
- Audit report documenting project size, complexity, and senior/junior effort & cost estimates in `Audit_Results.md`

## [1.0.0] - 2025-12-03

### 🎉 First Stable Release

This marks the first stable production release of Respectabullz. All core features are production-ready and thoroughly tested.

### Added
- Seed test data now includes 4 generations of pedigree data (great-great-grandparents through breeding stock) for comprehensive pedigree testing
- All dogs in seed data now have complete medical history including:
  - Vaccination records (DHPP and Rabies for adults, puppy shots for puppies)
  - Medical records (annual exams, surgeries, checkups)
  - Weight tracking entries (multiple entries per dog showing growth/health over time)
  - Full 4-generation pedigree with all ancestors properly linked
  - Expense records linked to each dog's vaccinations and medical procedures (visible in Financial tab)
- Sortable columns in Expenses page - click Date or Amount column headers to sort (ascending/descending)
  - Date column defaults to descending (newest first)
  - Amount column defaults to descending (highest first)
  - Visual indicators show current sort column and direction
- Sortable columns in Dogs page - click Name, Sex, Age, or Status column headers to sort (ascending/descending)
  - Visual indicators show current sort column and direction
  - Age sorting uses date of birth (older dogs first when ascending)
- Customer Packet PDF Export - comprehensive printable packet for customers
  - Export from any dog detail page via "Export Packet" button
  - Configurable sections: select which information to include
  - Premium/luxury design with brand colors and professional typography
  - Cover page with dog photo, name, and kennel branding
  - Comprehensive dog information section with registration details
  - 4-generation pedigree chart (landscape, family tree style)
  - Health records: vaccinations, medical records, genetic tests (card-style)
  - Weight history with growth chart visualization
  - Financial section: invoice/receipt, payment history, deposit details
  - New owner care guide: feeding, grooming, training, vet care
  - Photo gallery with dog and parent photos
  - Professional headers/footers with kennel branding throughout
  - Native save dialog in Tauri, browser download fallback
- CSV export in Expenses page now prompts for save directory (Tauri) and shows confirmation dialog when saved
  - Uses native file save dialog in Tauri environment
  - Shows toast notification with file path on successful export
  - Falls back to browser download in non-Tauri environments
- Genetic test explanations in Genetics section - click on test name or result badge to view detailed explanation
  - Explains what each test means and what the result indicates
  - Includes breeding recommendations for each test type
  - Shows test details including date, lab, and certificate number
  - Covers all common genetic tests: DM, HUU, CMR1, EIC, vWD1, PRA-prcd, CDDY, CDPA, NCL, JHC, HSF4, MDR1
- Financial records tab on individual dog pages now displays expenses linked to that dog
  - Shows all expenses with relatedDogId matching the dog
  - Displays total expenses summary
  - Allows adding, editing, and deleting expenses directly from dog page
  - Expense form pre-fills with the dog when adding from dog detail page
- Enhanced Pedigree Chart with full implementation
  - Clickable navigation - click any dog in the pedigree to view their detail page
  - Tauri save dialog for pedigree export (with fallback for non-Tauri environments)
  - Generation toggle - switch between 3 and 4 generation views via dropdown
  - Improved traditional pedigree tree layout - vertical tree structure from bottom (subject) to top (ancestors)
  - Visual connecting lines between generations
  - Hover effects on clickable dog cards
  - Toast notifications for successful exports

### Fixed
- Fixed monthly expenses calculation on dashboard - now correctly filters expenses for current month only
  - Fixed date parsing in loadDb() to handle YYYY-MM-DD format dates without timezone conversion issues
  - Improved monthly expenses filter to use year/month comparison with robust date normalization
- Added current month expenses to seed data (daysAgo 0, 1, 2) so monthly expenses card shows non-zero values after seeding

### Added
- Seed database function to populate all entities with comprehensive dummy test data
  - Multiple heat cycles per dam with detailed heat event tracking
  - Active heat cycle currently in progress (proestrus phase) with ongoing event tracking
  - Comprehensive weight tracking history with multiple entries per dog showing growth over time
  - Extensive expense history across all categories (vet, food, supplies, transport, registration, marketing, utilities, misc)
  - Full 4-generation pedigree entries for all breeding stock and selected puppies
  - Puppy health tasks with mix of completed, due today, overdue, and upcoming tasks for testing task management features
- Unseed database function to remove seeded test data with corresponding UI button in Settings
- Seed database function now requires empty database - prevents accidental overwrite of existing data with validation check and confirmation dialog
- Customer Packet PDF Export - comprehensive printable packet for customers
  - Export from any dog detail page via "Export Packet" button
  - Configurable sections: select which information to include
  - Premium/luxury design with brand colors and professional typography
  - Cover page with dog photo, name, and kennel branding (Logo_Vintage.png)
  - Comprehensive dog information section with registration details
  - 4-generation pedigree chart (landscape, family tree style)
  - Health records: vaccinations, medical records, genetic tests (card-style)
  - Weight history with growth chart visualization
  - Financial section: invoice/receipt, payment history, deposit details
  - New owner care guide: feeding, grooming, training, vet care
  - Photo gallery with dog and parent photos
  - Professional headers/footers with kennel branding throughout
  - Native save dialog in Tauri, browser download fallback

### Fixed
- PDF export: Replaced emoji icons in care instructions section with text labels (F, G, E, V) for reliable PDF rendering
- PDF export: Fixed header layout to prevent text wrapping ("RESPECTABULLZ" breaking across lines)
- PDF export: Fixed blank page issue by adjusting header positioning and page padding
- PDF export: Fixed font loading issues by using Helvetica as reliable fallback font

### Changed
- PDF export: Updated brand text styling to match dashboard aesthetic with proper letter spacing
- PDF export: Added Logo_Vintage.png to cover page, headers, and thank you page for consistent branding

## [0.9.2] - 2025-12-03

### Fixed

- Added invalid date validation to `formatDate()` and `calculateAge()` utility functions to prevent runtime errors with corrupted date data

## [0.9.1] - 2025-12-03

### Fixed

- Fixed missing date parsing for HeatCycle fields (ovulationDate, optimalBreedingStart, optimalBreedingEnd, expectedDueDate, nextHeatEstimate) in database load function
- Fixed missing date parsing for HeatEvent date field in database load function
- Added geneticTests relation population in getDog() function
- Added healthTasks relation population in getLitter() function
- Enhanced heat cycle CSV export to include HeatEvent data (breeding sire, method, dates, progesterone tests, vet clinic)

## [0.9.0] - 2025-12-03

### Added

#### Priority 6: Reports & Analytics
- New "Breeding" tab in Reports page with breeding program insights
- Litters per year chart showing annual production over the past 5 years
- Litter financials table with income, expenses, and profit per litter
- Production by dam table showing litter count, puppy count, and average litter size
- Production by sire table showing breeding male performance metrics
- Export litter financial report to CSV

#### Priority 7: Genetic Testing & Compatibility
- Genetic test model to track health testing for dogs (DM, HUU, CMR1, EIC, vWD1, PRA-prcd, etc.)
- Genetic tests list with status badges (Clear, Carrier, Affected, Pending)
- Add/edit genetic test dialog with common test types pre-populated
- Dog genetic test summary showing counts by status
- Mating compatibility checker that analyzes genetic pairing risks
- Warnings for carrier x carrier, affected parents, and missing tests
- Genetics tab added to dog detail page

#### Priority 8: Visual Pedigree Display
- Pedigree chart component showing 3-generation family tree
- Visual display of ancestors with sex-coded colors (blue for male, pink for female)
- Ancestor cards showing name, registration number, color, and photo
- Full-screen expand mode for detailed viewing
- Export pedigree to text file format
- Pedigree tab added to dog detail page

#### Priority 9: Registry & Paperwork Helpers
- Registration status tracking on dogs (not_registered, pending, registered)
- Registration type field (full, limited)
- Registry name field (AKC, UKC, ABKC, etc.)
- Registration deadline tracking with visual alerts
- Registration status card on dog detail page with inline editing
- Litter registration export to text file with CSV format included
- Export button on litter detail page for registry paperwork

### Fixed

- Fixed TypeScript and ESLint errors across multiple components
- Fixed unused imports and variables in genetic testing, pedigree, and registry components
- Fixed Tauri v2 compatibility issues in photo utilities and backup functions
- Fixed React component creation during render warnings in PedigreeChart
- Fixed setState synchronization issues in WhelpingChecklist useEffect
- Fixed type safety issues with recharts callback props using eslint-disable comments
- Fixed unnecessary escape characters in string literals

## [0.8.0] - 2025-12-04

### Added

- Clickable "Total Dogs" card on dashboard that opens a dialog listing all dogs
- Clickable "Dogs in Heat" card on dashboard that opens a dialog listing dogs currently in heat
- Clickable "Upcoming Shots" card on dashboard that opens a dialog listing dogs with vaccinations due in the next 30 days
- Clickable "Due Dates" card on dashboard that opens a dialog listing litters with due dates in the next 30 days
- Clickable "Monthly Expenses" card on dashboard that navigates to the expenses page
- Clickable reminders in the dashboard Reminders card that open the appropriate dialogs (upcoming shots and due dates)
- Clicking a dog in any dashboard dialog navigates to that dog's detail page
- Export heat cycles to CSV from the Heat Cycles page with all relevant data fields
- Clicking a litter in the due dates dialog navigates to that litter's detail page

#### Priority 1: Puppy Health & Development Schedule
- Puppy health task system with auto-generated 8-week development schedule
- Health schedule template with configurable tasks (daily weights, deworming, vaccinations, vet checks, etc.)
- Auto-generate tasks when litter is marked as whelped based on whelp date
- Puppy health tasks list with overdue, upcoming, and completed sections
- Task completion tracking with progress indicators
- Per-puppy task assignment for individual health milestones
- Enhanced puppy weight tracking with growth monitoring
- Puppy evaluation system with categories (show_prospect, breeding_prospect, pet)
- Structure and temperament notes for puppy assessments
- Dashboard widget showing "Puppy Tasks Due This Week"
- Puppy health tasks tab on litter detail page

#### Priority 2: Pregnancy & Whelping Management
- Litter status pipeline with visual progress indicator (planned → bred → ultrasound_confirmed → xray_confirmed → whelped → weaning → ready_to_go → completed)
- Pregnancy confirmation tracking with ultrasound date, result, and puppy count estimates
- X-ray confirmation tracking with date and accurate puppy count
- Whelping preparation checklist with configurable items organized by timeline
- Checklist sections: 2 weeks before, 1 week before, and during whelping
- Progress tracking for whelping checklist completion
- Whelping event log for recording individual puppy births
- Litter status progress component displayed on litter detail page
- Whelping checklist automatically shown for litters approaching due date

#### Priority 3: Waitlist & Reservation Management
- WaitlistEntry model for tracking puppy reservations and deposits
- Pick order management with automatic position assignment
- Sex preference tracking (male, female, either)
- Color preference field for client requests
- Deposit tracking with amount, date, and status (pending, paid, refunded, applied_to_sale)
- Waitlist status tracking (waiting, matched, converted, withdrawn)
- Puppy assignment linking waitlist entries to specific dogs
- Waitlist form dialog for creating and editing entries
- Waitlist list component showing all entries for a litter
- Visual indicators for deposit status and pick order
- Reservation to sale conversion flow
- Waitlist tab on litter detail page

#### Priority 4: Client Communication Logging
- CommunicationLog model tracking all client interactions
- Communication types: phone, email, text, in-person, video call, social media
- Direction tracking (inbound from client, outbound to client)
- Communication timeline component showing chronological feed
- Follow-up reminder system with due dates
- Follow-up completion tracking
- Related litter linking for context
- Communication form dialog for quick entry
- Filter by type or date range
- Dashboard widget showing "Follow-ups Due This Week"
- Communication timeline tab on client detail page

#### Priority 5: Breeding Planning & Heat Cycle Enhancements
- Heat cycle prediction system based on historical data
- Average cycle length and interval calculations
- Predicted next heat date with confidence indicators (low, medium, high)
- Heat cycle prediction card component on dog detail page
- Dashboard card showing "Females Expected in Heat Soon"
- External stud database for tracking outside breeding partners
- External stud form with owner contact information
- Semen type tracking (fresh, chilled, frozen)
- Health testing notes for external studs
- Progesterone test logging with automatic breeding recommendations
- Breeding window calculations based on progesterone levels
- Breeding plan creation from heat cycle events
- Outside stud selection in breeding events

### Fixed

- Fixed `calculateAge` function not accounting for day of month, causing incorrect age calculations near birthdays
- Fixed potential null pointer exceptions in search filters on Inquiries and Sales pages when client or dog names are null
- Fixed search filter returning no results when client/dog relations are not populated

## [0.7.0] - 2025-12-03

### Added

- Photo management for dogs and litters
  - Profile photo upload for individual dogs with rounded avatar display
  - Photo picker dialog using Tauri's native file dialog
  - Photos stored in app's local data directory with unique filenames
  - Photo gallery for litters to document breeding over time
  - Caption support for litter photos with edit functionality
  - LitterPhoto model in database schema with sortOrder for ordering
  - Sire and dam profile photos displayed in litter detail page
  - Puppy profile photos in litter puppies table
  - Photo utilities module (photoUtils.ts) for file handling
  - useLitterPhotos hook for managing litter photo state
  - Full backup with photos (ZIP format)
  - Creates complete backup including database JSON and all photo files
  - ZIP archive with compression for efficient storage
  - Import/restore functionality extracts photos and database together
  - Backup info display showing photo count and total size
  - Maintains backward compatibility with JSON-only data exports

### Changed

- Enhanced dashboard hero banner text styling
  - Increased RESPECTABULLZ text size (text-4xl to text-7xl responsive scaling)
  - Reduced brown border thickness from 0.5px to 0.35px for subtler appearance
  - Smoothed border edges using blurred text-shadow effects for softer appearance
  - Added subtle upward arc curve to text string with center letters elevated
- DogFormDialog now includes profile photo upload UI with preview
- DogsPage displays profile photos in table avatars
- DogDetailPage shows larger profile photo in header (16x16 with border)
- LitterDetailPage redesigned with parent photos section and photo gallery

## [0.6.0] - 2025-12-03

### Changed

- Updated all fonts to use Techna Sans-Regular throughout the application
  - Added @font-face declaration for Techna Sans-Regular from local font file
  - Updated Tailwind font family configuration to use Techna Sans for all font families (sans, display, nav)
  - Removed Google Fonts import (Inter, Playfair Display, Outfit)
- Increased letter-spacing for bold text (b, strong, .font-bold, .font-semibold) to 0.08em for improved readability
- Added branded hero section to dashboard with logo and styled brand text
  - Displays Emblem Logo Transparent on the left with drop shadow
  - Styled "RESPECTABULLZ" text centered with R and Z slightly larger (1.15em)
  - Text uses Techna Sans font with cream color and brown border/stroke effect
  - Added drop shadows to both logo and brand text for depth
  - Professional gradient background using brand blue color
- Reorganized sidebar navigation into logical productivity-focused groups
  - Core Management: Dashboard, Dogs, Litters, Heat Cycles
  - Operations: Transport, Expenses
  - Business: Clients, Inquiries, Sales
  - Analytics: Reports
  - Visual separators between each group for better organization
  - Replaced placeholder "R" icon with Emblem Logo image in sidebar header
  - Removed text from sidebar header, centered emblem icon at 56x56px
  - Removed pulsing glow animation from sidebar emblem icon

## [0.5.1] - 2025-12-03

### Fixed

- Removed unused imports across 8 files causing TypeScript errors:
  - ErrorBoundary.tsx: Removed unused `React` import
  - Header.tsx: Removed unused `Separator` import
  - ContractFormDialog.tsx: Removed unused `Eye` import and `showPreview` state/handler
  - ContractPreview.tsx: Removed unused `formatPriceWords`, `formatSignatureDate` imports
  - useNotifications.ts: Removed unused `VaccinationRecord` type import
  - InquiriesPage.tsx: Removed unused `FileText`, `useDog` imports
  - ReportsPage.tsx: Removed unused `Dog` type import
- Fixed type errors in contractUtils.ts:
  - Fixed `AlignmentType` return type annotation using `typeof` pattern
  - Fixed string replacement type error with explicit `String()` conversion
  - Removed unsupported `orientation` property from docx page settings
  - Updated Tauri fs API from deprecated `writeBinaryFile` to `writeFile`

## [0.5.0] - 2025-12-02

### Added

- GUI Visual Enhancements for a more polished, professional appearance
  - Typography: Added Playfair Display (serif) for page titles and Outfit (sans-serif) for navigation
  - Animation system: Added glow-pulse, shimmer, scale-in, slide-up-fade, float, and icon-bounce keyframes
  - CSS utilities: glow effects, hover-lift, transition presets, staggered animation delays
  - Skeleton component with shimmer effect for loading states
  - Spinner component with animated loading indicator

### Changed

- Button component: Added glow effects on hover, active scale transitions
- Card component: Added hover lift effect with enhanced shadow
- Sidebar: Nav items have glow effects, animated indicators, staggered entrance, icon hover animations
- Table component: Row hover accent border, enhanced header typography
- Dialog component: Backdrop blur, smoother animations, rotate close button on hover
- Header component: Display font for page titles, animated notification badge
- Dashboard page: Staggered card animations, floating stat icons, skeleton loading state
- Dogs page: Skeleton table rows for loading state
- All page titles now use elegant serif display font

## [0.4.0] - 2025-12-02

### Added

- Contract Auto-Fill System for streamlined sales process
  - ContractFormDialog with multi-section form (Breeder, Buyer, Puppy, Sale Terms)
  - Auto-populates fields from client intake and dog records
  - Breeder settings section in Settings page (kennel name, address, phone, email, registration, etc.)
  - JSON-based contract template system using `docx` library for Word document generation
  - Price-to-words conversion for contract amounts
  - ContractPreview component with print support
  - Conversion flow: Inquiries → Contract Form → Sale Form
  - Template placeholder guide (contracts/CONTRACT_TEMPLATE_GUIDE.md)
  - Contracts automatically saved to `%APPDATA%/com.respectabullz.app/contracts/`
- useBreederSettings hook for managing breeder/kennel information
- useContract hook for document generation
- contractUtils.ts with document generation utilities
- BreederSettings and ContractData TypeScript interfaces
- Sire/Dam relations included in client interest queries for contract generation
- View Contract button in SaleFormDialog when contract path is set
- Alert UI component for notifications and warnings

### Changed

- InquiriesPage now shows ContractFormDialog before SaleFormDialog during conversion
- SaleFormDialog contract path field now includes open button and helper text
- Contract generation now renders from `contracts/contract_template_respectabullz.json` using the `docx` library for pixel-perfect output; removed the old docxtemplater implementation and unused dependencies
- Updated all documentation to reflect contract generation system

## [0.3.0] - 2025-12-02

### Added

- Notifications system with clickable bell icon in header
  - Shows overdue vaccinations, due soon vaccinations, and upcoming litters
  - Clickable notifications that navigate to relevant pages
  - Dynamic notification count badge
  - Popover dropdown with scrollable notification list

### Changed

- Changed vaccination status chart from pie chart to bar chart in Reports page
- Improved bar chart axis labels contrast using foreground color for better visibility in both light and dark modes
- Added double-click functionality to vaccination status bars - shows detailed list of vaccinations in each category (Up to Date, Due Soon, Overdue)
- Changed Dog Status Distribution from pie chart to bar chart with double-click functionality to view dogs by status (Active, Sold, Retired, Deceased)
- Enhanced sold dogs dialog to show sale date and customer name when double-clicking the "Sold" bar

### Added

- New Sales page showing all sales records
  - Table view with client, puppies, price, payment status, and shipping information
  - Search functionality by client or puppy name
  - Payment status filter (deposit only, partial, paid in full, refunded)
  - Stats cards showing total sales, total revenue, paid in full count, and pending payments
  - Edit and delete functionality for sales
  - Navigation link added to sidebar

### Fixed

- Fixed blank GUI issue when converting client interest to sale
  - SaleFormDialog now properly uses convertInterestToSale mutation instead of createSale when interestId is provided
  - Added error handling with try/catch to prevent crashes
  - Added validation for puppies array before submission
  - Improved state management to prevent race conditions when dialog closes
  - Added defensive checks for convertingInterest state before rendering dialog
  - convertInterestToSale now throws error instead of returning null when interest not found
  - Fixed Radix Select crash: SelectItem cannot have empty string value (transport selector now uses "none" as placeholder value)

## [0.2.0] - 2025-12-02

### Added

- Edit and delete buttons for all record types across the application
  - Expenses: Edit/delete buttons in expenses table with confirmation dialogs
  - Transport: Edit/delete buttons in transport records table with confirmation dialogs
  - Clients: Edit/delete buttons in client list + edit button in detail panel
  - Vaccinations: Edit/delete buttons with confirmation dialogs
  - Medical Records: Edit/delete buttons with confirmation dialogs
  - Weight Entries: Edit/delete buttons with confirmation dialogs
- updateWeightEntry function to database layer for editing weight records
- Client-Puppy Sales Tracking Enhancement - comprehensive sales pipeline management
  - New ClientInterest model for tracking client inquiries before sales
  - SalePuppy junction table supporting multiple puppies per sale
  - Interest status tracking (interested, contacted, scheduled_visit, converted, lost)
  - Contact method tracking (phone, email, website, social_media, referral, other)
  - Enhanced Sale model with shipping tracking (shippedDate, receivedDate, isLocalPickup)
  - Payment status tracking (deposit_only, partial, paid_in_full, refunded)
  - Warranty/health guarantee information field
  - Registration transfer date tracking
  - Transport record linking to sales
- New Inquiries page with table view, filters, and convert-to-sale functionality
- ClientInterestFormDialog for creating/editing client interests
- SaleFormDialog with multi-puppy support and enhanced shipping/payment fields
- Updated ClientsPage with tabbed view showing interests and enhanced sales display
- Automatic migration of existing single-puppy sales to new SalePuppy structure
- Inquiries navigation link in sidebar
- Quick action buttons in dashboard Quick Actions section (Add Dog, Add Litter, Start Heat Cycle, Log Expense, Add Transport, Record Vaccination)
- Breed dropdown with prefilled options (including American Bully) and custom breed option
- Version display in GUI (Header, Sidebar footer, and Settings page)
- Automatic expense creation when transport records include a cost
- Version bump script now updates `src/lib/version.ts` for GUI display
- Typical dosage dropdowns in vaccination form with vaccine-specific options
- Custom dosage option for vaccination records when standard doses don't apply
- Automatic next due date calculation based on vaccine type and dose (puppy vs adult)
- Custom vaccine type field when "Other" is selected in vaccination form
- Standard dog color dropdown with 25+ common colors
- Custom color option for dog records
- Add Puppy button on litter detail page to quickly add puppies to a litter
- Birth Litter dropdown in dog form to assign dogs/puppies to litters
- Comprehensive heat cycle tracking system based on veterinary best practices
  - Heat cycle phases (Proestrus, Estrus, Diestrus, Anestrus) with visual indicators
  - Progesterone test logging with automatic breeding recommendations
  - Real-time breeding window calculations (optimal breeding 1-3 days post-ovulation)
  - Expected whelp date calculation (63 days from ovulation)
  - Next heat prediction (~6.5 months from cycle start)
  - Event timeline with 16+ event types (bleeding, discharge, flagging, standing heat, breeding, etc.)
  - Quick action buttons for common events
  - Progesterone reference guide with veterinary-standard levels
  - Automatic phase detection based on cycle timeline
  - Breeding event tracking with sire selection and AI method options
  - Heat cycle detail page with progress visualization

### Changed

- Transport creation/update now automatically creates/updates linked expense records when cost is provided
- Vaccination form now uses dropdown selection for typical dosages instead of free text input
- Next due dates automatically calculated using veterinary best practices (puppy schedules: 1 month intervals, adult: 12 months)
- Dog color field changed from text input to dropdown with standard colors and custom option

## [0.1.3] - 2024-12-02

### Added

- Python script (`start_dev.py`) for starting the development server with cross-platform support

## [0.1.2] - 2024-12-02

### Added

- ESLint configuration for ESLint v9 with TypeScript and React support
- Related Litter field in Expense form dialog

### Fixed

- Type errors in HeatCyclesPage and LittersPage (incorrect type inference)
- Removed 10 unused imports/variables across multiple files
- Empty interface declarations in Input and Textarea components
- Changed `let` to `const` for non-reassigned variables in db.ts

## [0.1.1] - 2024-12-02

### Added

- Tauri application icons (icon.ico and icon.png) generated from logo
- Development helper scripts for running Tauri with proper PATH configuration
- Version bump script for maintaining consistent versioning across all files

### Fixed

- Missing dependency: Added @radix-ui/react-scroll-area package
- Tauri plugin configuration updated for Tauri 2.x compatibility
- Created capabilities file for Tauri 2.x permissions system
- Version bump script converted to ES modules for compatibility

## [0.1.0] - 2024-12-02

### Added

- Initial project setup with Tauri + React + TypeScript + Vite
- shadcn/ui component library with brand theme colors (Beige #fbf1e5, Brown #6e5e44, Blue #303845)
- SQLite database with Prisma ORM
- Full database schema with all entities:
  - Dog (with lineage tracking)
  - Litter
  - HeatCycle and HeatEvent
  - VaccinationRecord
  - WeightEntry
  - MedicalRecord
  - Transport
  - Expense
  - Client and Sale
  - PedigreeEntry
  - Settings
- App shell with sidebar navigation and theme toggle
- Dashboard with stats and reminders
- Dogs module:
  - List view with filters (status, sex)
  - Detail page with tabs (Health, Vaccinations, Weight, Breeding, Transport, Financial)
  - Add/Edit dog forms
- Litters module:
  - List view with status indicators
  - Detail page with puppy associations
  - Add/Edit litter forms
- Health tracking:
  - Vaccination records with due date tracking
  - Weight entries with chart visualization
  - Medical records with type categorization
- Heat cycle tracking:
  - List and calendar views
  - Heat event logging
- Transport module:
  - Full shipper information tracking
  - Route and cost tracking
- Expenses module:
  - Category-based tracking
  - Tax deductible flagging
  - CSV export
  - Charts and breakdowns
- Clients module:
  - Contact management
  - Sale/purchase history
- Reports page:
  - Financial analytics
  - Dog status distribution
  - Vaccination compliance
- Settings page:
  - Theme toggle (light/dark/system)
  - Weight unit preference (lbs/kg)
  - Notification settings
  - Database backup/restore
  - Clear data functionality
- React Query for data fetching and caching
- Toast notifications for user feedback
- Responsive design with mobile considerations
- Project logo added to repository and README


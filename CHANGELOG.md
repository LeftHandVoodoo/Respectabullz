# Changelog

All notable changes to Respectabullz will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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


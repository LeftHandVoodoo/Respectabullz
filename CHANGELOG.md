# Changelog

All notable changes to Respectabullz will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Version display in GUI (Header, Sidebar footer, and Settings page) - 12:30
- Automatic expense creation when transport records include a cost - 12:45
- Version bump script now updates `src/lib/version.ts` for GUI display - 12:50
- Typical dosage dropdowns in vaccination form with vaccine-specific options - 13:15
- Custom dosage option for vaccination records when standard doses don't apply - 13:20
- Automatic next due date calculation based on vaccine type and dose (puppy vs adult) - 13:35
- Custom vaccine type field when "Other" is selected in vaccination form - 13:40
- Standard dog color dropdown with 25+ common colors - 13:50
- Custom color option for dog records - 13:55

### Changed

- Transport creation/update now automatically creates/updates linked expense records when cost is provided - 12:45
- Vaccination form now uses dropdown selection for typical dosages instead of free text input - 13:20
- Next due dates automatically calculated using veterinary best practices (puppy schedules: 1 month intervals, adult: 12 months) - 13:35
- Dog color field changed from text input to dropdown with standard colors and custom option - 13:50

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


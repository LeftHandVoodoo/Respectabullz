# Changelog

All notable changes to Respectabullz will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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


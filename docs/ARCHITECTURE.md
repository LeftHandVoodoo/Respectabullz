# Respectabullz Architecture

**Version 1.9.1**

## Overview

Respectabullz is a desktop application for dog breeder management, built with a modern tech stack optimized for local-first operation on Windows.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Tauri Shell                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    React Frontend                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │   Pages     │  │ Components  │  │  State (Query)  │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  │         │                │                  │             │  │
│  │         └────────────────┼──────────────────┘             │  │
│  │                          ▼                                │  │
│  │              ┌─────────────────────┐                      │  │
│  │              │    Data Hooks       │                      │  │
│  │              │  (TanStack Query)   │                      │  │
│  │              └─────────────────────┘                      │  │
│  │                          │                                │  │
│  │                          ▼                                │  │
│  │              ┌─────────────────────┐                      │  │
│  │              │   Database Layer    │                      │  │
│  │              │  (lib/db/*.ts)      │                      │  │
│  │              │  Modular structure  │                      │  │
│  │              └─────────────────────┘                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Rust Backend                             │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │   Plugins   │  │  File I/O   │  │  Notifications  │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    SQLite Database                         │  │
│  │         (via tauri-plugin-sql with native SQLite)          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. Tauri Shell (src-tauri/)
- **Purpose**: Native OS integration, window management, system resources
- **Responsibilities**:
  - Application lifecycle management
  - Native file dialogs
  - System notifications
  - File system access
  - OS-level security

### 2. React Frontend (src/)
- **Purpose**: User interface and interaction
- **Responsibilities**:
  - Rendering UI components
  - Form handling and validation
  - Client-side routing
  - Theme management
  - User feedback (toasts, dialogs)

### 3. State Management (TanStack Query)
- **Purpose**: Server state synchronization and caching
- **Responsibilities**:
  - Data fetching and caching
  - Optimistic updates
  - Background refetching
  - Query invalidation

### 4. Database Layer (lib/db/)
- **Purpose**: Data persistence abstraction with modular architecture
- **Structure**:
  - `connection.ts` - SQLite connection management via tauri-plugin-sql
  - `migrations.ts` - Schema versioning and database initialization
  - `utils.ts` - ID generation, date/type conversions
  - `dogs.ts` - Dog, DogPhoto, PedigreeEntry operations
  - `litters.ts` - Litter, LitterPhoto operations
  - `health.ts` - Vaccinations, Weight, Medical, Genetic Tests, Puppy Health Tasks
  - `breeding.ts` - Heat Cycles, Heat Events, External Studs
  - `sales.ts` - Clients, Sales, Client Interests, Waitlist
  - `operations.ts` - Expenses, Transports, Communication Logs
  - `documents.ts` - Document Management, Tags, Entity Linking
  - `settings.ts` - Settings, Breeder Settings
  - `dashboard.ts` - Dashboard Stats, Activity Feed
  - `init.ts` - Database initialization and migration orchestration
  - `legacy.ts` - Compatibility stubs for functions pending full implementation
  - `index.ts` - Centralized re-exports for backwards compatibility
- **Responsibilities**:
  - CRUD operations for all entities
  - Data validation and type conversion
  - Relationship management
  - Automatic migration from localStorage to SQLite
  - Import/export functionality

### 5. SQLite Database (tauri-plugin-sql)
- **Purpose**: Persistent data storage with native SQLite
- **Responsibilities**:
  - Data integrity (foreign keys, constraints)
  - Transaction management
  - Index optimization
  - Automatic schema migrations
  - Data persistence across app restarts

## Directory Structure

```
respectabullz/
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md      # This file
│   ├── DATA_MODEL.md        # Database schema docs
│   └── API.md               # Internal API docs
├── prisma/
│   └── schema.prisma        # Database schema definition
├── public/                  # Static assets
├── src/
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI primitives (shadcn)
│   │   │   ├── form-dialog.tsx      # Reusable form dialog wrapper
│   │   │   ├── confirm-dialog.tsx   # Confirmation dialog component
│   │   │   └── virtual-table.tsx   # Virtualized table component
│   │   ├── layout/          # App shell components
│   │   ├── dogs/            # Dog-specific components
│   │   ├── litters/         # Litter components
│   │   ├── health/          # Health tracking components
│   │   ├── puppy-health/   # Puppy health task components
│   │   ├── waitlist/       # Waitlist and reservation components
│   │   ├── communication/  # Client communication logging
│   │   ├── breeding/       # Breeding planning and external studs
│   │   ├── genetics/       # Genetic testing and compatibility
│   │   ├── pedigree/      # Pedigree chart components
│   │   ├── registry/      # Registration tracking components
│   │   ├── packet/        # Customer packet PDF export components
│   │   │   ├── PacketExportDialog.tsx  # Export dialog with section selection
│   │   │   └── templates/              # PDF template components
│   │   │       ├── PacketDocument.tsx  # Main document orchestrator
│   │   │       ├── CoverPage.tsx       # Cover page template
│   │   │       ├── DogInfoSection.tsx  # Dog information section
│   │   │       ├── PedigreeSection.tsx # Pedigree chart (landscape)
│   │   │       ├── HealthSection.tsx   # Health records section
│   │   │       ├── WeightChartSection.tsx # Weight tracking section
│   │   │       ├── FinancialSection.tsx # Financial information section
│   │   │       ├── CareInstructionsSection.tsx # Care guide section
│   │   │       └── PhotoGallerySection.tsx # Photo gallery section
│   │   ├── heat-cycles/     # Heat cycle components
│   │   ├── transport/       # Transport components
│   │   ├── expenses/        # Expense components
│   │   ├── inquiries/       # Client interest/inquiry components
│   │   ├── sales/           # Sale form and contract components
│   │   ├── clients/         # Client components
│   │   └── contacts/        # Business contacts management
│   ├── hooks/               # Custom React hooks
│   │   ├── useDogs.ts       # Dog CRUD operations
│   │   ├── useLitters.ts    # Litter operations
│   │   ├── useHealth.ts     # Vaccinations, weights, medical
│   │   ├── usePuppyHealthTasks.ts # Puppy health task operations
│   │   ├── useWaitlist.ts  # Waitlist operations
│   │   ├── useCommunicationLogs.ts # Communication logging
│   │   ├── useExternalStuds.ts # External stud operations
│   │   ├── useGeneticTests.ts # Genetic test operations
│   │   └── pdfExport.ts        # PDF generation utilities and styles
│   │   ├── useHeatCycles.ts # Heat cycle operations
│   │   ├── useTransport.ts  # Transport operations
│   │   ├── useExpenses.ts   # Expense operations
│   │   ├── useClients.ts    # Client/sale operations
│   │   ├── useClientInterests.ts # Client interest/inquiry operations
│   │   ├── useBreederSettings.ts # Breeder/kennel settings
│   │   ├── useContract.ts   # Contract document generation
│   │   ├── useDashboard.ts  # Dashboard stats
│   │   ├── useContacts.ts   # Business contacts operations
│   │   └── useSettings.ts   # App settings
│   ├── lib/                 # Utilities and services
│   │   ├── db.ts            # Database client
│   │   ├── utils.ts         # Helper functions
│   │   ├── version.ts       # Version constant
│   │   ├── contractUtils.ts # Contract generation utilities
│   │   ├── photoUtils.ts    # Photo upload and display utilities
│   │   ├── backupUtils.ts   # Full backup with photos (ZIP)
│   │   ├── pdfExport.ts     # PDF generation utilities and styles
│   │   ├── errorTracking.ts # Centralized error logging service
│   │   └── notifications.ts # Notification utilities
│   ├── pages/               # Route page components
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Root component with routing
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles and theme
├── src-tauri/               # Rust/Tauri backend
│   ├── src/
│   │   ├── lib.rs           # Plugin initialization and Tauri commands (select_directory)
│   │   └── main.rs          # Entry point
│   ├── Cargo.toml           # Rust dependencies
│   └── tauri.conf.json      # Tauri configuration
└── [config files]           # Various configuration files
```

## Data Flow

### Read Operation
```
User Action → Page Component → Data Hook (useQuery)
                                    ↓
                              Check Cache
                                    ↓
                            Cache Hit? → Return Data
                                    ↓ No
                              db.ts function
                                    ↓
                              localStorage/SQLite
                                    ↓
                              Return Data → Update Cache → Render
```

### Write Operation
```
User Action → Form Submit → Data Hook (useMutation)
                                    ↓
                              db.ts function
                                    ↓
                              localStorage/SQLite
                                    ↓
                              Success → Invalidate Queries → Refetch → Render
                                    ↓
                              Show Toast Notification
```

## Key Design Decisions

### 1. Local-First Architecture
- All data stored locally in SQLite/localStorage
- No external network dependencies
- Instant response times
- Full offline capability

### 2. Component-Based UI
- shadcn/ui for consistent, accessible components
- Tailwind CSS for utility-first styling
- Radix UI primitives for complex interactions

### 3. Form Handling
- React Hook Form for form state management
- Zod for schema validation
- Consistent dialog-based forms across entities
- Multi-step forms for complex workflows (e.g., contract generation)

### 4. State Management
- TanStack Query for server state
- React Context for theme/settings
- No global state management library (kept simple)

### 5. Type Safety
- TypeScript throughout
- Prisma for type-safe database operations
- Shared types between frontend and database

## Security Considerations

### Data Protection
- All data stored locally on user's machine
- No data transmitted to external servers
- File paths stored instead of file contents (for attachments, photos, and documents)
- Photos stored in `{appDataDir}/photos/` with unique filenames
- Documents stored in `{appDataDir}/documents/` with unique filenames
- Contracts stored in `{appDataDir}/contracts/` by default, or in user-selected custom directory
- Full backups include all photos and documents in ZIP format for portability

### Input Validation
- Zod schemas validate all user input
- SQL injection prevented by Prisma's parameterized queries
- XSS prevented by React's default escaping

### Permissions
- Tauri plugins configured with minimal required permissions
- File system access scoped to app data directory

## Performance Considerations

### Caching
- TanStack Query caches all fetched data
- 5-minute stale time for data freshness
- Background refetching on window focus

### Lazy Loading & Code Splitting
- All pages except Dashboard use React.lazy() for code splitting
- Suspense boundary with skeleton loading fallback for smooth page transitions
- Vite manual chunks for vendor libraries:
  - `vendor-react`: React, ReactDOM, React Router (165 kB)
  - `vendor-radix`: All Radix UI components (164 kB)
  - `vendor-recharts`: Recharts library (411 kB, loaded only for Reports/Expenses)
  - `vendor-pdf-renderer`: @react-pdf/renderer (1,489 kB, loaded only when generating PDFs)
  - `vendor-pdf-viewer`: react-pdf and pdfjs-dist (462 kB, loaded only for document viewing)
- Initial bundle reduced from 4,291 kB to 320 kB (93% reduction)
- Virtual scrolling implemented for large lists using @tanstack/react-virtual

### Database Optimization
- Indexes on frequently queried fields
- Relationships normalized to prevent data duplication

## Deployment & Upgrades

### Installer Configuration
- **NSIS Installer**: Windows installer built with NSIS (Nullsoft Scriptable Install System)
- **Upgrade Support**: Installer automatically detects existing installations using identifier `com.respectabullz.app`
- **In-Place Upgrades**: Users can upgrade directly without uninstalling previous versions
- **Data Preservation**: All user data stored in `%APPDATA%/com.respectabullz.app/` is preserved during upgrades
  - Database files (SQLite)
  - Photos directory (`photos/`)
  - Documents directory (`documents/`)
  - Contracts directory (`contracts/` or user-selected custom directory)
  - Attachments directory
  - Backups directory
  - Settings and preferences

### Database Migrations
- **Automatic Migration**: Schema migrations run automatically on first launch after upgrade
- **Version Tracking**: Database schema version tracked in `_schema_version` table
- **Migration System**: Located in `src/lib/db/migrations.ts`
- **Backward Compatibility**: Migrations designed to preserve existing data

### Upgrade Process
1. User downloads new installer (e.g., `Respectabullz_1.4.0_x64-setup.exe`)
2. Installer detects existing installation
3. Application files updated in-place
4. User data in AppData directory remains untouched
5. On first launch, app checks schema version and runs migrations if needed
6. All data, photos, and settings preserved automatically

## Future Considerations

### Completed Improvements (as of 1.9.0)
- ✅ PDF generation for contracts (dual Word + PDF output since 1.6.0)
- ✅ PDF viewer with page navigation and zoom controls (since 1.5.0)
- ✅ Code splitting with 93% bundle size reduction (since 1.8.1)

### Planned Improvements
1. Full Prisma integration with Tauri IPC
2. Photo image optimization and thumbnail generation
3. Calendar integration with external calendars
4. Multi-device sync (optional cloud backup)
5. Contract template editor UI
6. Photo/document deletion cleanup (orphaned files)
7. Office document rendering in document viewer

### Scalability
- Current architecture supports ~10,000 dogs
- Virtual scrolling implemented for large lists (auto-enables for lists > 50 items)
- Consider SQLite WAL mode for concurrent access if needed


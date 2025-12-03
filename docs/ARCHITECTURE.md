# Respectabullz Architecture

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
│  │              │   (lib/db.ts)       │                      │  │
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
│  │              (via Prisma ORM / localStorage)               │  │
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

### 4. Database Layer (lib/db.ts)
- **Purpose**: Data persistence abstraction
- **Responsibilities**:
  - CRUD operations for all entities
  - Data validation
  - Relationship management
  - Import/export functionality

### 5. SQLite Database (Prisma)
- **Purpose**: Persistent data storage
- **Responsibilities**:
  - Data integrity (foreign keys)
  - Transaction management
  - Index optimization

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
│   │   ├── layout/          # App shell components
│   │   ├── dogs/            # Dog-specific components
│   │   ├── litters/         # Litter components
│   │   ├── health/          # Health tracking components
│   │   ├── puppy-health/   # Puppy health task components (v0.8.0)
│   │   ├── waitlist/       # Waitlist and reservation components (v0.8.0)
│   │   ├── communication/  # Client communication logging (v0.8.0)
│   │   ├── breeding/       # Breeding planning and external studs (v0.8.0)
│   │   ├── genetics/       # Genetic testing and compatibility (v0.9.0)
│   │   ├── pedigree/      # Pedigree chart components (v0.9.0)
│   │   ├── registry/      # Registration tracking components (v0.9.0)
│   │   ├── heat-cycles/     # Heat cycle components
│   │   ├── transport/       # Transport components
│   │   ├── expenses/        # Expense components
│   │   ├── inquiries/       # Client interest/inquiry components
│   │   ├── sales/           # Sale form and contract components
│   │   └── clients/         # Client components
│   ├── hooks/               # Custom React hooks
│   │   ├── useDogs.ts       # Dog CRUD operations
│   │   ├── useLitters.ts    # Litter operations
│   │   ├── useHealth.ts     # Vaccinations, weights, medical
│   │   ├── usePuppyHealthTasks.ts # Puppy health task operations (v0.8.0)
│   │   ├── useWaitlist.ts  # Waitlist operations (v0.8.0)
│   │   ├── useCommunicationLogs.ts # Communication logging (v0.8.0)
│   │   ├── useExternalStuds.ts # External stud operations (v0.8.0)
│   │   ├── useGeneticTests.ts # Genetic test operations (v0.9.0)
│   │   ├── useHeatCycles.ts # Heat cycle operations
│   │   ├── useTransport.ts  # Transport operations
│   │   ├── useExpenses.ts   # Expense operations
│   │   ├── useClients.ts    # Client/sale operations
│   │   ├── useClientInterests.ts # Client interest/inquiry operations
│   │   ├── useBreederSettings.ts # Breeder/kennel settings
│   │   ├── useContract.ts   # Contract document generation
│   │   ├── useDashboard.ts  # Dashboard stats
│   │   └── useSettings.ts   # App settings
│   ├── lib/                 # Utilities and services
│   │   ├── db.ts            # Database client
│   │   ├── utils.ts         # Helper functions
│   │   ├── contractUtils.ts # Contract generation utilities
│   │   ├── photoUtils.ts    # Photo upload and display utilities
│   │   ├── backupUtils.ts   # Full backup with photos (ZIP)
│   │   └── notifications.ts # Notification utilities
│   ├── pages/               # Route page components
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Root component with routing
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles and theme
├── src-tauri/               # Rust/Tauri backend
│   ├── src/
│   │   ├── lib.rs           # Plugin initialization
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
- File paths stored instead of file contents (for attachments and photos)
- Photos stored in app data directory with unique filenames
- Full backups include all photos in ZIP format for portability

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

### Lazy Loading
- Routes not code-split (app is small enough)
- Large lists should implement virtual scrolling (future)

### Database Optimization
- Indexes on frequently queried fields
- Relationships normalized to prevent data duplication

## Future Considerations

### Planned Improvements
1. Full Prisma integration with Tauri IPC
2. Photo image optimization and thumbnail generation
3. PDF generation for printable reports (contracts currently generate as Word documents)
4. Calendar integration with external calendars
5. Multi-device sync (optional cloud backup)
6. Contract template editor UI
7. Photo deletion cleanup (orphaned files)

### Scalability
- Current architecture supports ~10,000 dogs
- Beyond that, pagination and virtual scrolling needed
- Consider SQLite WAL mode for concurrent access


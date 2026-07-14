# CLAUDE.md - Respectabullz

> Breeder management desktop application for dog breeding operations.

**Version**: 1.10.3
**Repository**: <https://github.com/LeftHandVoodoo/Respectabullz>

---

## Project Overview

Respectabullz is a comprehensive desktop application for managing dog breeding operations. It provides tools for tracking dogs, litters, health records, clients, sales, expenses, and documents. Built as a native desktop app using Tauri with a React frontend and SQLite database.

**Type**: Desktop Application (Tauri)
**Target Platform**: Windows (NSIS installer)

---

## Tech Stack

| Layer | Technology |
| ------- | ------------ |
| **Desktop Runtime** | Tauri 2.x (Rust) |
| **Frontend** | React 18 + TypeScript |
| **Build Tool** | Vite 5.x |
| **Styling** | TailwindCSS + Radix UI |
| **State Management** | TanStack Query (React Query) |
| **Forms** | React Hook Form + Zod |
| **Database** | SQLite (via `tauri-plugin-sql`) |
| **Schema Management** | Prisma (schema reference only) |
| **Testing** | Vitest + React Testing Library |
| **Package Manager** | npm |

### Key Dependencies

- **UI Components**: Radix UI primitives (dialog, dropdown, tabs, etc.)
- **Charts**: Recharts
- **PDF Generation**: @react-pdf/renderer
- **PDF Viewing**: react-pdf + pdfjs-dist
- **Excel Export**: ExcelJS
- **Document Generation**: docx, jszip
- **Icons**: lucide-react
- **Date Handling**: date-fns

---

## Project Structure

```text
respectabullz/
├── src/                    # Frontend source code
│   ├── components/         # React components by domain
│   │   ├── breeding/       # Breeding-related components
│   │   ├── clients/        # Client management
│   │   ├── dogs/           # Dog profiles and management
│   │   ├── documents/      # Document upload/preview
│   │   ├── expenses/       # Financial tracking
│   │   ├── genetics/       # Genetic testing
│   │   ├── health/         # Health records
│   │   ├── heat-cycles/    # Heat cycle tracking
│   │   ├── litters/        # Litter management
│   │   ├── pedigree/       # Pedigree charts
│   │   ├── sales/          # Sales pipeline
│   │   ├── settings/       # App settings
│   │   ├── ui/             # Shared UI components (shadcn/ui style)
│   │   └── ...             # Other domain components
│   ├── hooks/              # Custom React hooks (data fetching)
│   ├── lib/                # Utility functions
│   ├── pages/              # Page components (routes)
│   └── types/              # TypeScript type definitions
├── src-tauri/              # Tauri/Rust backend
│   ├── src/                # Rust source code
│   ├── Cargo.toml          # Rust dependencies
│   ├── Cargo.lock          # Rust lockfile
│   └── tauri.conf.json     # Tauri configuration
├── prisma/                 # Prisma schema (reference only)
│   └── data/               # Default SQLite database location
├── public/                 # Static assets
├── docs/                   # Documentation
├── scripts/                # Build/utility scripts
├── contracts/              # Contract templates
└── coverage/               # Test coverage reports
```

### Key Directories

| Directory | Purpose |
| ----------- | --------- |
| `src/components/` | Domain-organized React components |
| `src/hooks/` | Data hooks (useClients, useDogs, useLitters, etc.) |
| `src/lib/` | Utilities (db.ts, utils.ts, contractUtils.ts) |
| `src/pages/` | Route page components |
| `src-tauri/` | Rust backend and Tauri config |
| `prisma/` | Database schema (SQLite) |
| `docs/` | User manual, API docs, architecture |

---

## Commands

### Development

```powershell
npm run dev          # Start Vite dev server (frontend only)
npm run tauri:dev    # Start Tauri dev mode (full app)
npm run preview      # Preview production build
```

### Build

```powershell
npm run build        # Build frontend (tsc + vite build)
npm run tauri:build  # Build complete Tauri app (NSIS installer)
```

### Testing

```powershell
npm run test         # Run Vitest tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage report
```

### Code Quality

```powershell
npm run lint         # ESLint check
```

### Database

```powershell
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
```

### Versioning

```powershell
npm run version:bump   # Bump version across all files
npm run version:check  # Check version consistency
```

---

## Conventions

### File Naming

- **Components**: PascalCase (`DogProfile.tsx`, `ClientList.tsx`)
- **Hooks**: camelCase with `use` prefix (`useDogs.ts`, `useClients.ts`)
- **Utilities**: camelCase (`utils.ts`, `contractUtils.ts`)
- **Tests**: Same name with `.test.tsx` suffix (`Button.test.tsx`)
- **Types**: PascalCase in `types/` directory

### Component Organization

- Domain components in `src/components/{domain}/`
- Shared UI primitives in `src/components/ui/`
- One component per file, named export preferred

### Path Aliases

```typescript
import { Button } from '@/components/ui/button';
import { useDogs } from '@/hooks/useDogs';
```

The `@/` alias maps to `./src/`.

### TypeScript

- Strict mode enabled
- No unused locals/parameters
- Target: ES2020

---

## Testing Framework

- **Framework**: Vitest
- **DOM Testing**: jsdom + React Testing Library
- **Location**: `src/**/__tests__/*.test.tsx`
- **Coverage**: V8 provider, reports in `coverage/`

Run tests before committing behavioral changes.

---

## Environment Variables

From `.env.example`:

```dotenv
# Database (Prisma schema reference only - not used at runtime)
DATABASE_URL="file:./data/respectabullz.db"

# App metadata
VITE_APP_NAME="Respectabullz"
VITE_APP_VERSION="1.10.3"

# Bug reports use a fixed support page; never add a repository token or destination
```

Note: The app uses SQLite via Tauri's SQL plugin at runtime. Prisma is only for schema management. Bug reporting sanitizes and previews a local draft, copies it only after approval, and opens a fixed blank GitHub Issues/new page with no report data in the URL; it does not submit through a credentialed API.

---

## Version Management

**Canonical Source**: `VERSION` file

**Version Locations** (must stay in sync):

| File | Field |
| ------ | ------- |
| `VERSION` | Entire file content |
| `package.json` | `version` |
| `src-tauri/Cargo.toml` | `version` |
| `src-tauri/Cargo.lock` | `respectabullz.version` |
| `src-tauri/tauri.conf.json` | `version` |

**Current Version**: 1.10.3

Use `npm run version:bump` to update all locations.

---

## Documentation

| Document | Purpose |
| ---------- | --------- |
| [README.md](README.md) | Project overview, features, setup |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |
| [SECURITY.md](SECURITY.md) | Security policy |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture |
| [docs/API.md](docs/API.md) | Internal API documentation |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Database schema reference |
| [docs/HOWTO.md](docs/HOWTO.md) | How-to guides |
| [docs/SETUP.md](docs/SETUP.md) | Development setup |
| [docs/USER_MANUAL.md](docs/USER_MANUAL.md) | End-user documentation |
| [docs/VERSIONING.md](docs/VERSIONING.md) | Version management guide |

---

## Database Schema

- **Engine**: SQLite
- **Runtime Access**: `tauri-plugin-sql` (Rust plugin)
- **Schema Management**: Prisma (generates types, not used at runtime)
- **Location**: `$APPDATA/com.respectabullz.app/` (production) or `prisma/data/` (dev)

### Key Tables

Dogs, Litters, Puppies, Clients, Sales, Health Records, Vaccinations, Expenses, Documents, Contacts, Heat Cycles, Waitlist, Communication Logs, Genetic Tests, Transport Records.

---

## Tauri Configuration

- **Identifier**: `com.respectabullz.app`
- **Window**: 1400x900 (min 1024x768)
- **Dev Server**: <http://localhost:1420>
- **Bundle Target**: NSIS (Windows installer)

### Tauri Plugins

- `tauri-plugin-fs` - File system access
- `tauri-plugin-dialog` - Native dialogs
- `tauri-plugin-notification` - System notifications
- `tauri-plugin-sql` - SQLite database

Broad shell-plugin access is removed. Narrow Rust commands handle canonical managed-
document opens and the fixed support-page destination.

---

## Windows notes

- Use native Windows PowerShell commands for development and Tauri packaging.
- Keep the repository's LF line-ending policy.
- Resolve Node, npm, Cargo, Rustup, and toolchains from the developer's normal `PATH`;
  do not hard-code a user profile or machine-specific toolchain directory.
- `npm run tauri:dev` is the supported full-development command.

---

## Important Notes

1. **Data Integrity**: Selected file writes and optimistic UI paths have rollback or compensation controls. Do not generalize those path-specific controls to all mutations or to database-plus-filesystem atomicity; see `docs/RELIABILITY.md`.

2. **Photo Storage**: Dog and litter photos stored in `$APPDATA/com.respectabullz.app/` with asset protocol access.

3. **PDF Libraries**: @react-pdf/renderer (~1.5MB) and pdfjs-dist are large dependencies. Vite config uses manual chunks to optimize loading.

4. **No Backend Server**: This is a local-first desktop app. The credential-free bug-report flow copies a reviewed draft and can open a fixed blank GitHub page in the user's browser; it keeps report data out of the URL and does not submit through an application API.

5. **Contract Templates**: JSON-based contract templates in `contracts/` directory. Generated documents saved to user-configured location.

---

## Definition of Done

Before marking work complete:

- [ ] Tests pass (`npm run test`)
- [ ] Lint passes (`npm run lint`)
- [ ] TypeScript compiles (`npm run build`)
- [ ] CHANGELOG.md updated (if meaningful change)
- [ ] Version fields synced (if version bumped)
- [ ] Relevant docs updated

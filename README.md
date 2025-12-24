<p align="center">

  <img src="assets/Logo_Vintage.png" alt="Project Logo" width="220">

</p>

# Respectabullz - Breeder Management Application

**Version 1.9.0** - Latest Release

A comprehensive desktop application for managing dog breeding operations, built with Tauri, React, TypeScript, and SQLite.

> **New in 1.9.0**: See [CHANGELOG.md](CHANGELOG.md) for the latest updates.

## Features

### Core Management
- **Dog Management**: Track individual dogs/puppies with full profiles, lineage, and status
- **Photo Management**: Upload and display profile photos for dogs with rounded avatars, plus photo galleries for litters
- **Litter Tracking**: Manage breeding litters with parent associations and puppy counts
- **Health Records**: Vaccinations, weights, and medical records with reminders
- **Heat Cycle Tracking**: Monitor breeding females' cycles with calendar views and predictions
- **Transport Management**: Track shipping/transport with shipper details and costs
- **Expense Tracking**: Comprehensive financial tracking with reports and CSV export

### Puppy & Breeding Management
- **Puppy Health Schedule**: Auto-generated 8-week development schedule with task tracking
- **Pregnancy & Whelping**: Litter status pipeline, pregnancy confirmation tracking, and whelping checklists
- **Waitlist & Reservations**: Track puppy reservations with pick order, deposits, and preferences
- **Client Communication**: Log all client interactions with follow-up reminders
- **Breeding Planning**: Heat cycle predictions, external stud database, and progesterone test logging

### Advanced Features
- **Genetic Testing**: Track health testing with mating compatibility warnings
- **Visual Pedigree**: 3-generation pedigree charts with export capabilities
- **Registry Helpers**: Registration status tracking and litter registration export
- **Reports & Analytics**: Breeding program insights, financials, and production metrics
- **Customer Packet PDF Export**: Comprehensive printable packet with dog info, pedigree, health records, photos, and care instructions
- **Document Management**: Upload and tag PDFs, Word docs, Excel files, and images with 13 predefined tags and custom tag support
- **PDF Preview**: In-app PDF viewing with page navigation, zoom controls, and text selection
- **Help & Documentation**: Built-in user manual and how-to guide accessible from Settings

### Business Features
- **Contacts Management**: Track business contacts (vets, breeders, shippers, graphic designers) with multi-category tagging, social media links, and search/filter
- **Client Management**: Track buyers and sales with contact information
- **Client Inquiries**: Track client interests and inquiries before sales conversion
- **Multi-Puppy Sales**: Support for selling multiple puppies in a single transaction
- **Sales Pipeline**: Track interest status, payment status, shipping, and delivery
- **Contract Generation**: Automated contract document generation from JSON template with auto-filled client, puppy, and breeder information
- **Custom Contracts Directory**: Choose where completed contracts are saved (Settings > Preferences > Contracts Save Location)
- **Full Backup System**: Export and import complete backups including database and all photos in ZIP format

### Getting Started Features
- **First-Launch Dialog**: On first startup, choose between starting with an empty database or loading sample data to explore features
- **Windows Installer**: NSIS installer for easy end-user distribution and installation

## Tech Stack

- **Desktop**: Tauri 2.x (Rust-based, lightweight)
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Database**: SQLite via Prisma ORM
- **Charts**: Recharts
- **State Management**: TanStack Query
- **Backup**: JSZip for ZIP archive creation

## Brand Colors

- Beige: `#fbf1e5` - Light mode background
- Brown: `#6e5e44` - Text, secondary accents
- Blue: `#303845` - Primary actions, dark mode base

## Getting Started

### For End Users

**No development tools required!** Simply download and install:

1. Download the latest release from the [Releases page](https://github.com/LeftHandVoodoo/Respectabullz/releases)
2. Run the installer (`Respectabullz_x.x.x_x64-setup.exe`)
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

**System Requirements:**
- Windows 10 (64-bit) or later
- 4 GB RAM
- 500 MB free storage

### For Developers

**Prerequisites:**
- Node.js 18+
- Rust (for Tauri)
- npm or yarn

**Installation:**

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Start development server
npm run dev
```

**Build for Production:**

```bash
# Build the Tauri application
npm run tauri:build
```

## Project Structure

```
respectabullz/
├── src-tauri/           # Tauri Rust backend
├── src/
│   ├── components/      # React components
│   │   ├── ui/          # shadcn components
│   │   ├── layout/      # App shell components
│   │   ├── dogs/        # Dog-related components
│   │   ├── litters/     # Litter components
│   │   ├── health/      # Health tracking components
│   │   ├── puppy-health/ # Puppy health task components
│   │   ├── waitlist/    # Waitlist and reservation components
│   │   ├── communication/ # Client communication logging
│   │   ├── breeding/    # Breeding planning and external studs
│   │   ├── genetics/    # Genetic testing and compatibility
│   │   ├── pedigree/   # Pedigree chart components
│   │   ├── registry/   # Registration tracking components
│   │   ├── inquiries/   # Client interest/inquiry components
│   │   ├── sales/       # Sale form components
│   │   └── ...
│   ├── hooks/           # React Query hooks
│   ├── lib/             # Utilities and database
│   ├── pages/           # Route pages
│   └── types/           # TypeScript types
├── prisma/
│   └── schema.prisma    # Database schema
└── public/              # Static assets
```

## Database Schema

The application uses a normalized SQLite database with the following main entities:

### Core Entities
- **Dog**: Individual dog profiles with lineage, profile photos, and genetic tests
- **Litter**: Breeding litter records with photo galleries, status tracking, and pregnancy confirmation
- **LitterPhoto**: Multiple photos per litter for documentation
- **HeatCycle/HeatEvent**: Female heat tracking with progesterone tests and breeding events
- **VaccinationRecord**: Vaccination history
- **WeightEntry**: Weight tracking
- **MedicalRecord**: General health records
- **Transport**: Shipping/transport logs
- **Expense**: Financial tracking
- **Client**: Customer information
- **ClientInterest**: Client inquiries and interest tracking
- **Sale**: Sales records with multi-puppy support
- **SalePuppy**: Junction table for puppies in sales
- **PedigreeEntry**: Deep lineage tracking

### Additional Entities
- **PuppyHealthTask**: 8-week puppy development schedule tasks
- **WaitlistEntry**: Puppy reservations with pick order and deposits
- **CommunicationLog**: Client interaction tracking with follow-ups
- **ExternalStud**: Outside breeding partner database
- **GeneticTest**: Health testing records with compatibility checking
- **HealthScheduleTemplate**: Configurable puppy health schedule templates
- **DogPhoto**: Photo gallery entries for dogs
- **Document**: Document files (PDFs, Word, Excel, images) with metadata
- **DocumentTag**: Tagging system for documents (13 predefined + custom tags)
- **DocumentTagLink**: Many-to-many relationship between documents and tags
- **DogDocument**: Links documents to dogs
- **LitterDocument**: Links documents to litters
- **ExpenseDocument**: Links documents to expenses

**File Storage**: 
- Photos are stored in `%APPDATA%/com.respectabullz.app/photos/` with unique filenames
- Documents are stored in `%APPDATA%/com.respectabullz.app/documents/` with unique filenames
- Contracts are stored in `%APPDATA%/com.respectabullz.app/contracts/` by default, or in a user-selected custom directory
- Database stores file paths, not binary data

## Development

```bash
# Run in development mode
npm run dev

# Run Tauri in development
npm run tauri:dev

# Check for lint errors
npm run lint

# Open Prisma Studio (database viewer)
npm run db:studio
```

### Testing

```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Documentation

- [User Manual](docs/USER_MANUAL.md) - Complete user guide for all features
- [Architecture](docs/ARCHITECTURE.md) - System design and structure
- [Data Model](docs/DATA_MODEL.md) - Database schema documentation
- [API Reference](docs/API.md) - Internal API documentation
- [Setup Guide](docs/SETUP.md) - Installation and configuration
- [Contributing](CONTRIBUTING.md) - Development guidelines
- [Changelog](CHANGELOG.md) - Version history

## License

Private - All rights reserved

## Author

LeftHandVoodoo


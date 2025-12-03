<p align="center">

  <img src="assets/Logo_Vintage.png" alt="Project Logo" width="220">

</p>

# Respectabullz - Breeder Management Application

A comprehensive desktop application for managing dog breeding operations, built with Tauri, React, TypeScript, and SQLite.

## Features

### Core Management
- **Dog Management**: Track individual dogs/puppies with full profiles, lineage, and status
- **Photo Management**: Upload and display profile photos for dogs with rounded avatars, plus photo galleries for litters
- **Litter Tracking**: Manage breeding litters with parent associations and puppy counts
- **Health Records**: Vaccinations, weights, and medical records with reminders
- **Heat Cycle Tracking**: Monitor breeding females' cycles with calendar views and predictions
- **Transport Management**: Track shipping/transport with shipper details and costs
- **Expense Tracking**: Comprehensive financial tracking with reports and CSV export

### Puppy & Breeding Management (v0.8.0)
- **Puppy Health Schedule**: Auto-generated 8-week development schedule with task tracking
- **Pregnancy & Whelping**: Litter status pipeline, pregnancy confirmation tracking, and whelping checklists
- **Waitlist & Reservations**: Track puppy reservations with pick order, deposits, and preferences
- **Client Communication**: Log all client interactions with follow-up reminders
- **Breeding Planning**: Heat cycle predictions, external stud database, and progesterone test logging

### Advanced Features (v0.9.0)
- **Genetic Testing**: Track health testing with mating compatibility warnings
- **Visual Pedigree**: 3-generation pedigree charts with export capabilities
- **Registry Helpers**: Registration status tracking and litter registration export
- **Reports & Analytics**: Breeding program insights, financials, and production metrics

### Business Features
- **Client Management**: Track buyers and sales with contact information
- **Client Inquiries**: Track client interests and inquiries before sales conversion
- **Multi-Puppy Sales**: Support for selling multiple puppies in a single transaction
- **Sales Pipeline**: Track interest status, payment status, shipping, and delivery
- **Contract Generation**: Automated contract document generation from JSON template with auto-filled client, puppy, and breeder information
- **Full Backup System**: Export and import complete backups including database and all photos in ZIP format

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

### Prerequisites

- Node.js 18+
- Rust (for Tauri)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Build for Production

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

### New Entities (v0.8.0 & v0.9.0)
- **PuppyHealthTask**: 8-week puppy development schedule tasks
- **WaitlistEntry**: Puppy reservations with pick order and deposits
- **CommunicationLog**: Client interaction tracking with follow-ups
- **ExternalStud**: Outside breeding partner database
- **GeneticTest**: Health testing records with compatibility checking
- **HealthScheduleTemplate**: Configurable puppy health schedule templates

**Photo Storage**: Photos are stored in `%APPDATA%/com.respectabullz.app/photos/` with unique filenames. Database stores file paths, not binary data.

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


<p align="center">

  <img src="assets/Logo_Vintage.png" alt="Project Logo" width="220">

</p>

# Respectabullz - Breeder Management Application

A comprehensive desktop application for managing dog breeding operations, built with Tauri, React, TypeScript, and SQLite.

## Features

- **Dog Management**: Track individual dogs/puppies with full profiles, lineage, and status
- **Litter Tracking**: Manage breeding litters with parent associations and puppy counts
- **Health Records**: Vaccinations, weights, and medical records with reminders
- **Heat Cycle Tracking**: Monitor breeding females' cycles with calendar views
- **Transport Management**: Track shipping/transport with shipper details and costs
- **Expense Tracking**: Comprehensive financial tracking with reports and CSV export
- **Client Management**: Track buyers and sales with contact information
- **Client Inquiries**: Track client interests and inquiries before sales conversion
- **Multi-Puppy Sales**: Support for selling multiple puppies in a single transaction
- **Sales Pipeline**: Track interest status, payment status, shipping, and delivery
- **Reports & Analytics**: Charts and insights for your breeding operation
- **Data Backup**: Export and import database backups

## Tech Stack

- **Desktop**: Tauri 2.x (Rust-based, lightweight)
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Database**: SQLite via Prisma ORM
- **Charts**: Recharts
- **State Management**: TanStack Query

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

- **Dog**: Individual dog profiles with lineage
- **Litter**: Breeding litter records
- **HeatCycle/HeatEvent**: Female heat tracking
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


# Respectabullz Setup Guide

## System Requirements

### Minimum Requirements

- **OS**: Windows 10 (64-bit) or later
- **RAM**: 4 GB
- **Storage**: 500 MB free space
- **Display**: 1024x768 resolution

### Development Requirements

- Node.js 18.x or higher
- Rust 1.70 or higher
- Visual Studio Build Tools 2019+ (Windows)
- Git

## Installation

### For Users (Pre-built)

1. Download the latest release from the Releases page
2. Run the installer (`Respectabullz_x.x.x_x64-setup.exe`)
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

### For Developers

#### 1. Install Prerequisites

**Node.js:**
```powershell
# Using winget
winget install OpenJS.NodeJS.LTS

# Or download from https://nodejs.org/
```

**Rust:**
```powershell
# Download and run rustup-init.exe from https://rustup.rs
# Or using winget:
winget install Rustlang.Rustup
```

**Visual Studio Build Tools:**
```powershell
winget install Microsoft.VisualStudio.2022.BuildTools
```

During VS Build Tools installation, select:
- "Desktop development with C++"
- Windows 10/11 SDK

#### 2. Clone Repository

```powershell
git clone <repository-url>
cd respectabullz
```

#### 3. Install Dependencies

```powershell
npm install
```

#### 4. Initialize Database

```powershell
# Generate Prisma client
npm run db:generate

# Create database with schema
npm run db:push
```

#### 5. Start Development

```powershell
# Web development (faster iteration)
npm run dev

# Full Tauri development
npm run tauri:dev
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Database location
DATABASE_URL="file:./data/respectabullz.db"

# App info
VITE_APP_NAME="Respectabullz"
VITE_APP_VERSION="0.1.0"
```

### Database Location

By default, the database is stored in:
- **Development**: `./prisma/data/respectabullz.db`
- **Production**: `%APPDATA%/com.respectabullz.app/data/`

### Data Directories

The app creates these directories automatically:
- `photos/` - Dog profile photos
- `attachments/` - Documents and files
- `backups/` - Database backups
- `contracts/` - Generated contract documents

## Build for Production

### Windows Installer

```powershell
npm run tauri:build
```

Output location: `src-tauri/target/release/bundle/`

Available formats:
- `.msi` - Windows Installer
- `.exe` - NSIS installer
- Portable `.exe`

### Build Configuration

Edit `src-tauri/tauri.conf.json` for:
- App name and version
- Window size and behavior
- Bundle settings
- Plugin permissions

## Troubleshooting

### Common Issues

**"Rust not found"**
```powershell
# Ensure Rust is in PATH
rustup show

# Reinstall if needed
rustup update
```

**"npm install fails"**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
Remove-Item -Recurse node_modules
npm install
```

**"Prisma generate fails"**
```powershell
# Ensure .env file exists with DATABASE_URL
# Regenerate client
npx prisma generate
```

**"Tauri build fails"**
```powershell
# Ensure VS Build Tools are installed
# Check Rust toolchain
rustup default stable
rustup update
```

### Logs

- **Development**: Console output in terminal
- **Production**: `%APPDATA%/com.respectabullz.app/logs/`

### Reset Application

To completely reset:

1. Close the application
2. Delete: `%APPDATA%/com.respectabullz.app/`
3. Restart the application

**Warning**: This deletes all data!

## Updating

### Development

```powershell
git pull
npm install
npm run db:generate
```

### Production

1. Download new installer
2. Run installer (it will update existing installation)
3. Data is preserved automatically

## Support

For issues:
1. Check this setup guide
2. Search existing GitHub issues
3. Open new issue with:
   - OS version
   - Error messages
   - Steps to reproduce


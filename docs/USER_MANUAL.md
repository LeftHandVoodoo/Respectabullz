# Respectabullz User Manual

**Version 1.0.0**  
**Last Updated: December 2025**  
**Version 1.0.0**

Welcome to Respectabullz, a comprehensive desktop application designed to help dog breeders manage their entire breeding operation from heat cycles to puppy sales.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Core Management](#core-management)
   - [Dogs](#dogs)
   - [Litters](#litters)
   - [Heat Cycles](#heat-cycles)
4. [Operations](#operations)
   - [Transport](#transport)
   - [Expenses](#expenses)
5. [Business Management](#business-management)
   - [Clients](#clients)
   - [Inquiries](#inquiries)
   - [Sales](#sales)
6. [Analytics & Reports](#analytics--reports)
7. [Settings & Backup](#settings--backup)
8. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### First Launch

When you first open Respectabullz, you'll see the **Dashboard** page. This is your command center, showing key metrics and reminders at a glance.

### Navigation

The application is organized into four main sections accessible from the left sidebar:

- **Core Management**: Dogs, Litters, Heat Cycles
- **Operations**: Transport, Expenses
- **Business**: Clients, Inquiries, Sales
- **Analytics**: Reports

Click any menu item to navigate to that section. The active page is highlighted in blue.

### Quick Actions

Many pages have an **"Add"** or **"New"** button in the top-right corner to quickly create new records. You can also click on existing items to view details and edit them.

---

## Dashboard Overview

The Dashboard provides an at-a-glance view of your breeding operation.

### Stat Cards

The dashboard displays key metrics:

- **Total Dogs**: Click to see a list of all dogs in your system
- **Dogs in Heat**: Active heat cycles (click to view details)
- **Upcoming Shots**: Vaccinations due in the next 30 days
- **Due Dates**: Pregnant females approaching their due dates
- **Monthly Expenses**: Total expenses for the current month (click to go to Expenses page)
- **Puppy Tasks**: Health tasks due this week for puppies
- **Follow-ups Due**: Client communication follow-ups scheduled for this week

### Reminders

Click any reminder card to:
- View the full list of items
- Navigate directly to the relevant detail page
- Take action on overdue items

### Best Practices

- Check the dashboard daily to stay on top of upcoming tasks
- Use the clickable cards to quickly navigate to areas needing attention
- Review "Follow-ups Due" weekly to maintain client relationships

---

## Core Management

### Dogs

The Dogs section is where you manage all individual dogs in your breeding program.

#### Adding a New Dog

1. Click **"Add Dog"** on the Dogs page
2. Fill in the required information:
   - **Name**: Dog's call name
   - **Sex**: Male or Female
   - **Breed**: Primary breed
   - **Date of Birth**: Used for age calculations
   - **Status**: Active, Retired, Deceased, or Sold
3. Optional fields:
   - **Registration Number**: AKC, UKC, etc.
   - **Color/Markings**: Physical description
   - **Sire/Dam**: Link to parents (must exist in system)
   - **Litter**: Link to birth litter
   - **Photo**: Upload a profile photo
4. Click **"Save"**

#### Dog Detail Page

Click any dog to view their complete profile with tabs:

- **Overview**: Basic information, registration status, photos
- **Health**: Vaccinations, weight tracking, medical records
- **Heat Cycles**: (Females only) All heat cycle history
- **Genetics**: Genetic test results and mating compatibility checker
- **Pedigree**: Visual 3-generation pedigree chart
- **Sales**: Sales history if the dog was sold

#### Managing Health Records

**Vaccinations:**
1. Go to the dog's detail page → **Health** tab
2. Click **"Add Vaccination"**
3. Select vaccine type, date, and next due date
4. The system will remind you when vaccinations are due

**Weight Tracking:**
1. In the **Health** tab, click **"Add Weight Entry"**
2. Enter date and weight
3. View weight chart to track growth trends

**Medical Records:**
1. Click **"Add Medical Record"** in the Health tab
2. Record vet visits, procedures, medications, etc.
3. Upload documents or photos if needed

#### Genetic Testing

1. Navigate to **Genetics** tab on a dog's detail page
2. Click **"Add Genetic Test"**
3. Select test type (DM, HUU, CMR1, etc.)
4. Enter result: Clear, Carrier, Affected, or Pending
5. Add test date, lab name, and certificate number
6. The system tracks all tests and warns about risky pairings

#### Mating Compatibility

Before breeding, check genetic compatibility:
1. Go to the **Genetics** tab
2. Use the **Mating Compatibility Checker**
3. Select a dam and sire
4. Review warnings about carrier x carrier pairings
5. See percentage risk of affected puppies

#### Registration Status

Track registration deadlines:
1. On the dog's detail page, find the **Registration Status** card
2. Click to edit status, registry, type, and deadline
3. The dashboard will remind you of upcoming deadlines

#### Customer Packet PDF Export

Generate a comprehensive printable packet for customers with all dog information:

1. Navigate to any dog's detail page
2. Click the **"Export Packet"** button (next to Edit button)
3. In the export dialog, select which sections to include:
   - **Dog Information**: Basic details, registration, health clearances
   - **Pedigree**: 4-generation family tree (select 2, 3, or 4 generations)
   - **Health Records**: Choose vaccinations, medical records, genetic tests
   - **Weight Chart**: Growth tracking visualization
   - **Photos**: Dog photos and parent photos
   - **Financial**: Invoice, receipt, payment history
   - **Care Instructions**: Feeding, grooming, training, vet care guide
   - **Registration**: AKC/registry information if applicable
4. Click **"Export PDF"**
5. Choose save location (Tauri) or download automatically (browser)

The generated PDF includes:
- **Cover Page**: Dog photo, name, kennel branding with Logo_Vintage.png
- **Professional Headers/Footers**: Branded throughout with logo and page numbers
- **Premium Design**: Brand colors, elegant typography, card-style layouts
- **Comprehensive Content**: All selected information formatted for printing

Perfect for:
- New puppy packets
- Registration paperwork
- Health record documentation
- Customer handouts

---

### Litters

Litters represent breeding events and their resulting puppies.

#### Creating a Litter

1. Click **"Add Litter"** on the Litters page
2. Required information:
   - **Dam**: Select the female
   - **Sire**: Select the male (or external stud)
   - **Breeding Date**: Date of breeding
   - **Due Date**: Estimated whelp date (auto-calculated)
3. Optional:
   - **Litter Code**: Auto-generated or custom
   - **Status**: Planned, Bred, Confirmed, Whelped, etc.
   - **Notes**: Breeding notes

#### Litter Status Pipeline

Track progress through stages:
- **Planned**: Future breeding
- **Bred**: Breeding completed
- **Ultrasound Confirmed**: Pregnancy confirmed
- **X-Ray Confirmed**: Puppy count confirmed
- **Whelped**: Puppies born
- **Weaning**: Puppies weaning
- **Ready to Go**: Puppies ready for new homes
- **Completed**: All puppies placed

#### Pregnancy Confirmation

1. On the litter detail page, update **Status** to "Ultrasound Confirmed" or "X-Ray Confirmed"
2. Enter confirmation dates and puppy counts
3. The system tracks these milestones

#### Whelping Checklist

Before whelping:
1. Go to litter detail page → **Whelping** tab
2. Review the **Whelping Checklist**
3. Check off items as you prepare:
   - Whelping box setup
   - Supplies stocked
   - Vet emergency contact ready
   - Puppy ID collars prepared
4. During whelping, record each puppy's birth time and weight

#### Adding Puppies to a Litter

1. On the litter detail page, go to **Puppies** tab
2. Click **"Add Puppy"**
3. Fill in:
   - **Name**: Puppy's call name
   - **Sex**: Male or Female
   - **Color/Markings**: Physical description
   - **Birth Weight**: Initial weight
   - **Birth Time**: Time of birth
   - **Photo**: Upload photo
4. Puppies are automatically linked to the litter

#### Puppy Health Schedule

The system auto-generates an 8-week health schedule:
1. When a litter is marked as "Whelped", tasks are created
2. View tasks in the **Puppy Health** tab
3. Tasks include:
   - Daily weight checks (Week 1)
   - Deworming (Weeks 2, 4, 6)
   - Vaccinations (Weeks 6, 8)
   - Vet checks (Weeks 5, 8)
   - Microchipping (Week 7)
4. Mark tasks as complete as you go
5. Dashboard shows tasks due this week

#### Waitlist & Reservations

Manage puppy reservations:
1. On litter detail page → **Waitlist** tab
2. Click **"Add to Waitlist"**
3. Select client and preferences:
   - **Pick Order**: Position in line
   - **Preference**: Male, Female, or Either
   - **Color Preference**: Optional
   - **Deposit**: Amount and date
4. When ready, convert waitlist entry to sale

#### Litter Photos

Document litters with photo galleries:
1. On litter detail page → **Photos** tab
2. Click **"Upload Photos"**
3. Select multiple images
4. Add captions to photos
5. Reorder photos by dragging

#### Litter Registration Export

Generate CSV for registry submission:
1. On litter detail page, find **"Export Registration"** button
2. Click to download CSV with:
   - Puppy names, sexes, microchip numbers
   - Sire and dam information
   - Whelp date
3. Use this file for registry paperwork

---

### Heat Cycles

Track breeding females' reproductive cycles.

#### Recording a Heat Cycle

1. Click **"Add Heat Cycle"** on Heat Cycles page
2. Select the **Female**
3. Enter **Start Date**: First day of bleeding
4. System auto-calculates:
   - Standing heat start (Day 9)
   - Standing heat end (Day 14)
   - Optimal breeding window (Days 12-14)
   - Ovulation estimate (Day 11)
5. Optional: Adjust dates based on observations

#### Heat Cycle Events

Record important events during the cycle:
1. On heat cycle detail page, click **"Add Event"**
2. Event types:
   - **Breeding**: Record breeding date, sire, method (natural/AI/chilled/frozen)
   - **Progesterone Test**: Log test value, date, and vet clinic
   - **Vet Visit**: General veterinary notes
   - **Notes**: Other observations
3. Multiple events can be recorded per cycle

#### Progesterone Testing

Track progesterone levels:
1. Add **Progesterone Test** events
2. Enter test value (ng/mL)
3. Record vet clinic name
4. System displays tests chronologically
5. Use to time breeding accurately

#### Heat Cycle Predictions

The system predicts future cycles:
1. Based on historical data, calculates average cycle length
2. Shows predicted next heat date
3. Confidence indicator based on data points available
4. View predictions on dog detail page or dashboard

#### Export Heat Cycles

Export cycle data to CSV:
1. On Heat Cycles page, click **"Export to CSV"**
2. File includes:
   - Cycle dates and phases
   - Breeding events (sire, method, dates)
   - Progesterone test results
   - Vet clinic information
3. Useful for record-keeping and analysis

---

## Operations

### Transport

Track shipping and transportation of dogs.

#### Adding a Transport Record

1. Click **"Add Transport"** on Transport page
2. Fill in:
   - **Dog**: Select dog being transported
   - **Date**: Shipping date
   - **Shipper**: Company name (e.g., "Delta Cargo")
   - **Tracking Number**: Airway bill or tracking code
   - **Cost**: Shipping cost
   - **Notes**: Special instructions or notes
3. Save to track shipping history

#### Use Cases

- Track puppies going to new homes
- Monitor stud dogs being shipped for breeding
- Record return shipments
- Track costs for expense reporting

---

### Expenses

Comprehensive financial tracking for your breeding operation.

#### Adding an Expense

1. Click **"Add Expense"** on Expenses page
2. Required fields:
   - **Date**: Expense date
   - **Amount**: Cost
   - **Category**: Food, Vet, Supplies, etc.
   - **Vendor**: Company or person
3. Optional:
   - **Description**: Details about the expense
   - **Related Dog**: Link to specific dog
   - **Related Litter**: Link to specific litter
   - **Tax Deductible**: Mark if tax-deductible
4. Save to track expenses

#### Expense Categories

- **Food**: Dog food, treats, supplements
- **Vet**: Veterinary services, medications
- **Supplies**: Leashes, crates, toys, etc.
- **Breeding**: Stud fees, AI costs, progesterone tests
- **Transport**: Shipping costs
- **Marketing**: Advertising, website, photos
- **Misc**: Other expenses

#### Expense Reports

View financial summaries:
1. Go to **Reports** page → **Financial** tab
2. See:
   - Total expenses by category
   - Monthly expense trends
   - Tax summary (deductible vs. non-deductible)
   - Expenses per dog or litter

#### Export Expenses

1. On Expenses page, click **"Export CSV"**
2. Download complete expense history
3. Use for tax preparation or accounting

---

## Business Management

### Clients

Manage customer information and relationships.

#### Adding a Client

1. Click **"Add Client"** on Clients page
2. Required:
   - **Name**: Client's full name
   - **Email**: Contact email
3. Optional:
   - **Phone**: Contact number
   - **Address**: Full address
   - **Notes**: Additional information
4. Save to create client record

#### Client Detail Page

View complete client information:
- **Contact Information**: All contact details
- **Sales History**: All purchases from you
- **Interests**: Inquiries and waitlist entries
- **Communication Log**: All interactions (see below)

#### Communication Logging

Track all client interactions:
1. On client detail page, find **Communication** section
2. Click **"Add Communication"**
3. Record:
   - **Date**: When interaction occurred
   - **Type**: Phone, Email, Text, In-Person, Video Call, Social Media
   - **Direction**: Inbound or Outbound
   - **Summary**: What was discussed
   - **Follow-up Needed**: Check if follow-up required
   - **Follow-up Date**: When to follow up
   - **Related Litter**: Link to relevant litter
4. Dashboard shows follow-ups due this week

#### Communication Timeline

View chronological feed of all communications:
- See all interactions in one place
- Filter by type or date range
- Never lose track of conversations
- Set reminders for follow-ups

---

### Inquiries

Track potential clients before they become sales.

#### Adding an Inquiry

1. Click **"Add Inquiry"** on Inquiries page
2. Select or create a **Client**
3. Fill in:
   - **Interest Date**: When they first contacted you
   - **Status**: New, Contacted, Interested, Not Interested, Converted
   - **Puppy Preference**: Male, Female, Either
   - **Color Preference**: Optional
   - **Notes**: Details about their interest
4. Save to track potential sales

#### Converting to Sale

When ready to sell:
1. On inquiry detail page, click **"Convert to Sale"**
2. System opens sale form pre-filled with:
   - Client information
   - Puppy preferences
3. Complete sale details and save
4. Inquiry status automatically updates to "Converted"

---

### Sales

Record puppy sales and track payment status.

#### Creating a Sale

1. Click **"Add Sale"** on Sales page
2. Select **Client**
3. Add **Puppies**:
   - Click **"Add Puppy"**
   - Select puppy from dropdown
   - Enter price for that puppy
   - Repeat for multiple puppies
4. Fill in:
   - **Sale Date**: Date of sale
   - **Total Price**: Sum of puppy prices
   - **Deposit Amount**: If deposit received
   - **Deposit Date**: When deposit paid
   - **Payment Status**: Deposit Only, Partial, Paid in Full, etc.
5. Optional:
   - **Shipping**: Select transport if shipping
   - **Warranty Info**: Health guarantee details
   - **Registration Transfer Date**: When registration transferred
   - **Contract Path**: Link to contract document
   - **Notes**: Additional sale notes

#### Payment Tracking

Update payment status as payments are received:
1. Edit the sale
2. Update **Payment Status**:
   - **Deposit Only**: Only deposit received
   - **Partial**: Some payment received
   - **Paid in Full**: Complete payment received
3. Update **Deposit Date** and amounts as needed

#### Shipping Tracking

If shipping a puppy:
1. Create a **Transport** record (see Transport section)
2. Link transport to the sale
3. Update **Shipped Date** on sale
4. Update **Received Date** when puppy arrives

#### Contract Generation

Generate sales contracts:
1. On sale detail page, click **"Generate Contract"**
2. System creates contract document with:
   - Buyer and seller information
   - Puppy details (name, registration, microchip)
   - Sale price and payment terms
   - Health guarantee
   - Registration transfer information
3. Contract is saved and can be printed or emailed

---

## Analytics & Reports

The Reports page provides insights into your breeding program.

### Financial Reports

**Tax Summary:**
- Total expenses by category
- Deductible vs. non-deductible breakdown
- Useful for tax preparation

**Monthly Trends:**
- View expense trends over time
- Identify seasonal patterns
- Plan for upcoming costs

### Breeding Reports

**Litters Per Year:**
- Bar chart showing annual production
- See breeding frequency trends
- Track program growth

**Litter Financials:**
- Income vs. expenses per litter
- Net profit/loss calculation
- Identify most profitable litters
- Export to CSV

**Production by Dam/Sire:**
- See which dogs produce the most puppies
- Average litter sizes
- Breeding performance metrics
- Useful for breeding decisions

### Health Reports

**Vaccination Compliance:**
- See which dogs are up-to-date
- Identify overdue vaccinations
- Track upcoming due dates

**Dog Status Distribution:**
- Visual breakdown of dog statuses
- See how many active, retired, sold, etc.
- Click bars to see dogs in each category

### Export Capabilities

Most reports can be exported to CSV:
1. Click **"Export CSV"** button on report
2. Download file for:
   - Further analysis in Excel
   - Sharing with partners
   - Record-keeping

---

## Settings & Backup

### Settings

Access settings from the sidebar (gear icon).

**Application Settings:**
- Theme preferences
- Notification settings
- Default values for forms

### Backup & Restore

**Creating a Backup:**
1. Go to **Settings** page
2. Click **"Create Backup"**
3. Choose save location
4. System creates ZIP file containing:
   - Complete database
   - All photos
5. Save backup in safe location (cloud storage recommended)

**Restoring from Backup:**
1. Go to **Settings** page
2. Click **"Restore Backup"**
3. Select backup ZIP file
4. System restores:
   - All database records
   - All photos
5. **Warning**: This will replace all current data

**Best Practices:**
- Create backups weekly or before major changes
- Store backups in multiple locations
- Test restore process periodically
- Keep backups for at least one year

---

## Tips & Best Practices

### General Tips

1. **Enter Data Promptly**: Record information as it happens for accuracy
2. **Use Photos**: Upload photos for dogs and litters - they're valuable for records
3. **Complete Profiles**: Fill in all available fields - you'll thank yourself later
4. **Regular Backups**: Set a reminder to backup weekly
5. **Check Dashboard Daily**: Stay on top of reminders and upcoming tasks

### Dog Management

1. **Link Parents**: Always link sire and dam - enables pedigree charts
2. **Track Health**: Record all vaccinations and medical records
3. **Genetic Testing**: Test breeding dogs before breeding
4. **Registration**: Track registration deadlines to avoid missing deadlines

### Litter Management

1. **Status Updates**: Update litter status as you progress through stages
2. **Puppy Health Tasks**: Complete tasks as puppies grow - system tracks everything
3. **Waitlist Early**: Start waitlist before puppies are born
4. **Photo Documentation**: Take photos at birth, weekly, and before go-home

### Heat Cycle Tracking

1. **Record Accurately**: Enter start dates precisely for better predictions
2. **Progesterone Testing**: Log all progesterone tests for breeding timing
3. **Record Events**: Document all breeding events and observations
4. **Review History**: Use cycle history to predict future cycles

### Financial Management

1. **Categorize Correctly**: Use appropriate expense categories for reporting
2. **Link Expenses**: Link expenses to dogs/litters when applicable
3. **Track Deposits**: Record deposits separately from full payments
4. **Regular Reviews**: Review financial reports monthly

### Client Relations

1. **Log Communications**: Record every client interaction
2. **Set Follow-ups**: Use follow-up reminders to stay in touch
3. **Track Inquiries**: Convert inquiries to sales systematically
4. **Generate Contracts**: Always generate contracts for sales

### Breeding Decisions

1. **Check Compatibility**: Use genetic compatibility checker before breeding
2. **Review Pedigrees**: Check pedigrees to avoid inbreeding
3. **Track Production**: Use production reports to evaluate breeding stock
4. **Plan Ahead**: Use heat cycle predictions to plan breedings

---

## Keyboard Shortcuts

- **Ctrl/Cmd + K**: Quick search (if implemented)
- **Escape**: Close dialogs
- **Enter**: Submit forms (when focused)

---

## Troubleshooting

### Photos Not Displaying

- Ensure photos are uploaded through the application (not copied manually)
- Check that photo files exist in the app data directory
- Try re-uploading the photo

### Data Not Saving

- Check for validation errors (red text under fields)
- Ensure required fields are filled
- Try refreshing the page

### Slow Performance

- Large photo files can slow the app
- Consider compressing photos before upload
- Regular backups help maintain performance

### Missing Features

- Check the version number in the sidebar footer
- Review CHANGELOG.md for recent additions
- Some features may require updating to latest version

---

## Support

For issues or questions:
1. Check this manual first
2. Review the CHANGELOG for recent changes
3. Check documentation files in the `docs/` folder

---

## Version History

- **v1.0.0**: First stable release - Customer packet PDF export, comprehensive dog management, all core features production-ready
- **v0.9.2**: Bug fixes and date validation improvements
- **v0.9.1**: Bug fixes and enhancements
- **v0.9.0**: Genetic testing, pedigree charts, registry helpers, reports
- **v0.8.0**: Puppy health schedules, whelping management, waitlist, communication logging

See [CHANGELOG.md](../CHANGELOG.md) for complete version history.

---

**Respectabullz User Manual v1.0.0**  
*Last Updated: December 2025*


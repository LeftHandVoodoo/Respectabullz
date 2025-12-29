# Respectabullz How-To Guide

**Version 1.9.1**
**Last Updated: December 29, 2025**

This guide provides step-by-step instructions for common breeding operation workflows. For detailed feature documentation, see [USER_MANUAL.md](USER_MANUAL.md).

---

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Adding Your Breeding Stock](#adding-your-breeding-stock)
3. [Recording a Heat Cycle](#recording-a-heat-cycle)
4. [Planning and Executing a Breeding](#planning-and-executing-a-breeding)
5. [Managing a Litter from Conception to Sale](#managing-a-litter-from-conception-to-sale)
6. [Tracking Puppy Health Tasks](#tracking-puppy-health-tasks)
7. [Managing Client Inquiries and Waitlist](#managing-client-inquiries-and-waitlist)
8. [Selling Puppies](#selling-puppies)
9. [Generating Contracts and Customer Packets](#generating-contracts-and-customer-packets)
10. [Tracking Expenses and Financials](#tracking-expenses-and-financials)
11. [Managing Client Relationships](#managing-client-relationships)
12. [Running Reports and Analytics](#running-reports-and-analytics)
13. [Backing Up Your Data](#backing-up-your-data)

---

## Initial Setup

### First-Time Setup Checklist

**Step 1: Configure Breeder Information**
1. Open **Settings** (gear icon in sidebar)
2. Go to **Breeder Information** section
3. Fill in required fields (*):
   - Breeder/Owner Name
   - Address Line 1
   - City
   - State
   - Phone
4. Fill in optional fields:
   - Kennel Name
   - Email
   - Kennel Registration
   - Kennel Prefix
5. Click **"Save Breeder Information"**

**Why:** This information is used in contracts and customer packets. Required for contract generation.

**Step 2: Set Preferences**
1. In **Settings** → **Preferences**:
   - Choose **Weight Unit** (lbs or kg)
   - Enable **Notifications** for reminders

**Step 3: Create Your First Backup**
1. Go to **Settings** → **Data Management**
2. Click **"Export Full Backup"**
3. Save to a safe location (cloud storage recommended)
4. **Set a reminder** to backup weekly

---

## Adding Your Breeding Stock

### Adding Your First Dog

**Scenario:** You have a breeding female named "Bella" that you want to add to the system.

**Steps:**
1. Go to **Dogs** page
2. Click **"Add Dog"** button
3. Fill in required fields:
   - **Name**: "Bella"
   - **Sex**: Female
   - **Breed**: "American Bully"
   - **Date of Birth**: Enter her birth date
   - **Status**: Active
4. Optional but recommended:
   - Upload a **Photo**
   - Add **Registration Number** if registered
   - Add **Color/Markings** description
5. Click **"Save"**

**Next Steps:**
- Add her sire and dam if you have them in the system
- Add genetic test results (see below)
- Record her heat cycles

### Adding Genetic Test Results

**Scenario:** You want to record genetic test results before breeding.

**Steps:**
1. Go to the dog's detail page (click on the dog)
2. Click **Genetics** tab
3. Click **"Add Genetic Test"**
4. Fill in:
   - **Test Type**: Select (e.g., "DM", "HUU", "CMR1")
   - **Result**: Clear, Carrier, Affected, or Pending
   - **Test Date**: When test was performed
   - **Lab Name**: Testing laboratory
   - **Certificate Number**: Optional
5. Click **"Save"**
6. Repeat for all genetic tests

**Tip:** Test breeding dogs before breeding. The system will warn you about risky pairings.

### Linking Parents (Building Pedigree)

**Scenario:** You want to link a puppy to its parents to build pedigree charts.

**Steps:**
1. Go to the dog's detail page
2. Click **Edit** button
3. In the form:
   - **Sire**: Select the father from dropdown (must exist in system)
   - **Dam**: Select the mother from dropdown (must exist in system)
   - **Litter**: Optionally link to birth litter
4. Click **"Save"**

**Result:** 
- Pedigree chart will automatically populate
- You can view 3-generation pedigree on the **Pedigree** tab
- Pedigree data is included in customer packet exports

---

## Recording a Heat Cycle

### Recording a New Heat Cycle

**Scenario:** Your female "Bella" started her heat cycle today.

**Steps:**
1. Go to **Heat Cycles** page
2. Click **"Add Heat Cycle"**
3. Select **Female**: "Bella"
4. Enter **Start Date**: Today's date (first day of bleeding)
5. System auto-calculates:
   - Standing heat start (Day 9)
   - Standing heat end (Day 14)
   - Optimal breeding window (Days 12-14)
   - Ovulation estimate (Day 11)
6. Click **"Save"**

**What Happens:**
- Cycle appears on dashboard
- Calendar view shows the cycle timeline
- System tracks cycle phases automatically

### Recording Progesterone Tests

**Scenario:** You took Bella for progesterone testing on Day 10.

**Steps:**
1. Go to **Heat Cycles** page
2. Click on Bella's active heat cycle
3. Click **"Add Event"**
4. Select **Event Type**: "Progesterone Test"
5. Fill in:
   - **Date**: Day 10
   - **Progesterone Value**: Enter value (e.g., "2.5 ng/mL")
   - **Vet Clinic**: Name of clinic
6. Click **"Save"**

**Tip:** Log all progesterone tests. The system displays them chronologically to help time breeding.

### Viewing Heat Cycle Calendar

**Scenario:** You want to see all heat cycles visually on a calendar.

**Steps:**
1. Go to **Heat Cycles** page
2. Click **"Calendar"** tab
3. View:
   - Color-coded phases (Proestrus, Estrus/Fertile, Diestrus)
   - Bred indicators (blue border)
   - Fertile windows highlighted
4. Click any date to view cycle details
5. Use arrows to navigate months

---

## Planning and Executing a Breeding

### Checking Genetic Compatibility

**Scenario:** You want to breed Bella with a male "Max" and check genetic compatibility first.

**Steps:**
1. Go to **Dogs** → Click on "Bella"
2. Click **Genetics** tab
3. Scroll to **Mating Compatibility Checker**
4. Select:
   - **Dam**: Bella (pre-selected)
   - **Sire**: Max
5. Click **"Check Compatibility"**
6. Review warnings:
   - Carrier x Carrier pairings show risk percentages
   - Clear x Carrier = safe
   - Clear x Clear = safe
7. Make informed breeding decision

### Recording a Breeding Event

**Scenario:** You bred Bella with Max on Day 12 of her heat cycle.

**Steps:**
1. Go to **Heat Cycles** page
2. Click on Bella's active heat cycle
3. Click **"Add Event"**
4. Select **Event Type**: "Breeding"
5. Fill in:
   - **Date**: Day 12
   - **Sire**: Select "Max" (or external stud)
   - **Method**: Natural, AI, Chilled Semen, or Frozen Semen
   - **Notes**: Any observations
6. Click **"Save"**

**Result:** Cycle is marked as "Bred" on calendar view.

### Using an External Stud

**Scenario:** You're breeding with a stud dog from another kennel.

**Steps:**
1. When creating a litter or recording breeding event:
   - In **Sire** field, select **"External Stud"**
2. If stud not in database:
   - Click **"Add External Stud"**
   - Fill in: Name, Breed, Registration, Owner info, Semen Type
   - Click **"Save"**
3. Select the external stud for the breeding

**Tip:** External studs are saved in your database for future use.

---

## Managing a Litter from Conception to Sale

### Creating a Litter Record

**Scenario:** Bella was bred with Max. Create a litter record.

**Steps:**
1. Go to **Litters** page
2. Click **"Add Litter"**
3. Fill in:
   - **Dam**: Select "Bella"
   - **Sire**: Select "Max" (or external stud)
   - **Breeding Date**: Date of breeding
   - **Due Date**: Auto-calculated (63 days), adjust if needed
   - **Status**: "Bred"
   - **Notes**: Breeding notes
4. Click **"Save"**

**Litter Code:** Auto-generated (e.g., "Bella-Max-2025-01")

### Confirming Pregnancy

**Scenario:** You had an ultrasound on Day 28 confirming pregnancy.

**Steps:**
1. Go to **Litters** page
2. Click on the litter
3. Click **Edit** button
4. Update **Status**: "Ultrasound Confirmed"
5. Optionally add confirmation date and notes
6. Click **"Save"**

**Later:** Update to "X-Ray Confirmed" when you get puppy count.

### Preparing for Whelping

**Scenario:** Due date is approaching. Prepare whelping checklist.

**Steps:**
1. Go to litter detail page
2. Click **Whelping** tab
3. Review **Whelping Checklist**:
   - Whelping box setup
   - Supplies stocked
   - Vet emergency contact ready
   - Puppy ID collars prepared
4. Check off items as you prepare
5. Review checklist again on whelping day

### Recording Whelping

**Scenario:** Puppies were born. Record each puppy.

**Steps:**
1. Go to litter detail page
2. Click **Edit** button
3. Update **Status**: "Whelped"
4. Enter **Whelp Date**: Date puppies were born
5. Enter **Total Born**: Number of puppies
6. Enter **Total Alive**: Number surviving
7. Click **"Save"**

**Result:** Puppy health schedule tasks are auto-generated.

**Next:** Add individual puppies (see below).

### Adding Puppies to a Litter

**Scenario:** Record each puppy's birth information.

**Steps:**
1. Go to litter detail page
2. Click **Puppies** tab
3. Click **"Add Puppy"**
4. Fill in for each puppy:
   - **Name**: Puppy's call name
   - **Sex**: Male or Female
   - **Color/Markings**: Description
   - **Birth Weight**: Initial weight
   - **Birth Time**: Time of birth (optional)
   - **Photo**: Upload photo
5. Click **"Save"**
6. Repeat for each puppy

**Tip:** Take photos at birth, weekly, and before go-home.

### Updating Litter Status

**As puppies grow, update litter status:**

1. **Weaning**: When puppies start weaning
2. **Ready to Go**: When puppies are ready for new homes
3. **Completed**: When all puppies are placed

**Steps:**
1. Go to litter detail page
2. Click **Edit**
3. Update **Status** dropdown
4. Click **"Save"**

---

## Tracking Puppy Health Tasks

### Viewing Puppy Health Schedule

**Scenario:** Litter was marked as "Whelped". View auto-generated tasks.

**Steps:**
1. Go to litter detail page
2. Click **Puppy Health** tab
3. View 8-week schedule:
   - **Week 1**: Daily weight checks
   - **Week 2**: Deworming
   - **Week 4**: Deworming
   - **Week 5**: Vet check
   - **Week 6**: Vaccination + Deworming
   - **Week 7**: Microchipping
   - **Week 8**: Final vaccination + Vet check

### Completing Tasks

**Scenario:** It's Week 2, time for deworming.

**Steps:**
1. Go to litter detail page → **Puppy Health** tab
2. Find "Week 2 - Deworming" task
3. Click checkbox to mark complete
4. Optionally add notes or date completed

**Dashboard:** Shows tasks due this week.

### Tracking Puppy Weights

**Scenario:** Record daily weights for Week 1.

**Steps:**
1. Go to individual puppy's detail page (click on puppy)
2. Click **Health** tab
3. Click **"Add Weight Entry"**
4. Enter:
   - **Date**: Today
   - **Weight**: Current weight
5. Click **"Save"**
6. Repeat daily for Week 1

**Result:** Weight chart shows growth trends.

---

## Managing Client Inquiries and Waitlist

### Recording a Client Inquiry

**Scenario:** Someone contacted you interested in a puppy.

**Steps:**
1. Go to **Inquiries** page
2. Click **"Add Inquiry"**
3. **Client**: Select existing or create new
4. Fill in:
   - **Interest Date**: When they contacted you
   - **Status**: "New"
   - **Puppy Preference**: Male, Female, or Either
   - **Color Preference**: Optional
   - **Notes**: Details about their interest
5. Click **"Save"**

**Next:** Log communication (see below).

### Adding to Waitlist

**Scenario:** Client wants to reserve a puppy from upcoming litter.

**Steps:**
1. Go to litter detail page
2. Click **Waitlist** tab
3. Click **"Add to Waitlist"**
4. Fill in:
   - **Client**: Select client
   - **Pick Order**: Position in line (1, 2, 3, etc.)
   - **Preference**: Male, Female, or Either
   - **Color Preference**: Optional
   - **Deposit Amount**: If deposit received
   - **Deposit Date**: When deposit paid
5. Click **"Save"**

**Tip:** Start waitlist before puppies are born.

### Converting Inquiry to Sale

**Scenario:** Client is ready to purchase. Convert inquiry to sale.

**Steps:**
1. Go to **Inquiries** page
2. Click on the inquiry
3. Click **"Convert to Sale"** button
4. Sale form opens pre-filled with:
   - Client information
   - Puppy preferences
5. Complete sale details (see Selling Puppies section)
6. Inquiry status automatically updates to "Converted"

---

## Selling Puppies

### Creating a Sale Record

**Scenario:** Client "John Smith" is buying a puppy "Buddy" for $2,500.

**Steps:**
1. Go to **Sales** page
2. Click **"Add Sale"**
3. **Client**: Select "John Smith"
4. **Add Puppies**:
   - Click **"Add Puppy"**
   - Select "Buddy" from dropdown
   - Enter **Price**: $2,500
5. Fill in sale details:
   - **Sale Date**: Today
   - **Total Price**: Auto-calculated
   - **Deposit Amount**: If deposit received
   - **Deposit Date**: When deposit paid
   - **Payment Status**: "Deposit Only", "Partial", or "Paid in Full"
6. Optional:
   - **Shipping**: Link transport record if shipping
   - **Warranty Info**: Health guarantee details
   - **Notes**: Sale notes
7. Click **"Save"**

**Result:** Puppy status automatically changes to "Sold".

### Updating Payment Status

**Scenario:** Client paid remaining balance.

**Steps:**
1. Go to **Sales** page
2. Click on the sale
3. Click **Edit** button
4. Update **Payment Status**: "Paid in Full"
5. Update amounts if needed
6. Click **"Save"**

### Tracking Shipping

**Scenario:** Shipping puppy via Delta Cargo.

**Steps:**
1. **Create Transport Record**:
   - Go to **Transport** page
   - Click **"Add Transport"**
   - Select dog: "Buddy"
   - Enter shipping details
   - Click **"Save"**
2. **Link to Sale**:
   - Go to sale detail page
   - Click **Edit**
   - Select **Transport** from dropdown
   - Update **Shipped Date**
   - Click **"Save"**
3. **When Puppy Arrives**:
   - Update **Received Date** on sale

---

## Generating Contracts and Customer Packets

### Generating a Sales Contract

**Scenario:** Generate contract for sale to John Smith.

**Steps:**
1. Go to **Sales** page
2. Click on the sale
3. Click **"Generate Contract"** button
4. Fill in contract details:
   - **Buyer Information**: Pre-filled from client
   - **Puppy Information**: Pre-filled from sale
   - **Sale Details**: Price, registration type, agreement date
   - **Sire and Dam**: Pre-filled if available
5. Click **"Generate Contract"**
6. Contract is saved and can be:
   - Printed for signatures
   - Emailed to client
   - Linked to sale record

**Note:** Breeder information must be configured in Settings first.

### Exporting Customer Packet PDF

**Scenario:** Create comprehensive packet for new puppy owner.

**Steps:**
1. Go to **Dogs** page
2. Click on the puppy (e.g., "Buddy")
3. Click **"Export Packet"** button
4. In export dialog, select sections:
   - ✅ **Dog Information**: Basic details, registration, health clearances
   - ✅ **Pedigree**: Select 2, 3, or 4 generations
   - ✅ **Health Records**: Choose vaccinations, medical records, genetic tests
   - ✅ **Weight Chart**: Growth tracking visualization
   - ✅ **Photos**: Dog photos and parent photos
   - ✅ **Financial**: Invoice, receipt, payment history
   - ✅ **Care Instructions**: Feeding, grooming, training, vet care guide
   - ✅ **Registration**: AKC/registry information
5. Click **"Export PDF"**
6. PDF is generated with:
   - Cover page with dog photo and kennel branding
   - Professional headers/footers
   - All selected information formatted for printing

**Use Cases:**
- New puppy packets
- Registration paperwork
- Health record documentation
- Customer handouts

---

## Tracking Expenses and Financials

### Recording an Expense

**Scenario:** Bought dog food for $150.

**Steps:**
1. Go to **Expenses** page
2. Click **"Add Expense"**
3. Fill in:
   - **Date**: Today
   - **Amount**: $150
   - **Category**: "Food"
   - **Vendor**: Store name
   - **Description**: "Premium dog food - 50lb bag"
4. Optional:
   - **Related Dog**: Link to specific dog
   - **Related Litter**: Link to specific litter
   - **Tax Deductible**: Check if applicable
5. Click **"Save"**

**Categories:**
- Food
- Vet
- Supplies
- Breeding
- Transport
- Marketing
- Misc

### Linking Expenses to Dogs/Litters

**Scenario:** Record vet expense for specific dog or litter.

**Steps:**
1. When creating expense:
   - **Related Dog**: Select dog from dropdown
   - OR **Related Litter**: Select litter from dropdown
2. This helps with:
   - Per-dog expense tracking
   - Litter profitability analysis
   - Tax reporting

### Exporting Expenses for Taxes

**Scenario:** Year-end tax preparation.

**Steps:**
1. Go to **Expenses** page
2. Click **"Export CSV"** button
3. CSV file includes:
   - All expenses with dates, amounts, categories
   - Tax deductible flag
   - Related dogs/litters
4. Open in Excel for:
   - Tax preparation
   - Accounting
   - Further analysis

---

## Managing Client Relationships

### Logging Client Communication

**Scenario:** Client called to ask about puppy availability.

**Steps:**
1. Go to **Clients** page
2. Click on the client
3. Scroll to **Communication** section
4. Click **"Add Communication"**
5. Fill in:
   - **Date**: Today
   - **Type**: Phone, Email, Text, In-Person, Video Call, Social Media
   - **Direction**: Inbound or Outbound
   - **Summary**: "Asked about availability of male puppies"
   - **Follow-up Needed**: Check if needed
   - **Follow-up Date**: When to follow up
   - **Related Litter**: Link if relevant
6. Click **"Save"**

**Result:** 
- Communication appears in timeline
- Dashboard shows follow-ups due this week

### Viewing Communication Timeline

**Steps:**
1. Go to client detail page
2. View **Communication Timeline**:
   - Chronological feed of all interactions
   - Filter by type or date range
   - See follow-up reminders

**Tip:** Log every client interaction. Never lose track of conversations.

### Completing Follow-ups

**Scenario:** Follow-up reminder appeared on dashboard.

**Steps:**
1. Click **"Follow-ups Due"** card on dashboard
2. View list of follow-ups
3. Click on communication entry
4. Complete follow-up:
   - Log new communication
   - Mark follow-up as complete
   - Set new follow-up if needed

---

## Running Reports and Analytics

### Viewing Financial Reports

**Scenario:** Review monthly expenses and tax summary.

**Steps:**
1. Go to **Reports** page
2. Click **Financial** tab
3. View:
   - **Summary Cards**: Total expenses, tax deductible, non-deductible
   - **Monthly Expenses Chart**: Trends over last 12 months
   - **Expenses by Category**: Pie chart breakdown
4. **Export**: Click "Export CSV" for further analysis

### Analyzing Breeding Performance

**Scenario:** See which dogs produce the most puppies.

**Steps:**
1. Go to **Reports** page
2. Click **Breeding** tab
3. View:
   - **Litters Per Year**: Annual production chart
   - **Litter Financials**: Income vs expenses per litter
   - **Production by Dam**: Breeding females performance
   - **Production by Sire**: Breeding males performance
4. **Export Litter Report**: Click "Export CSV" on Litter Financials

**Use:** Make informed breeding decisions based on data.

### Checking Health Compliance

**Scenario:** See which dogs need vaccinations.

**Steps:**
1. Go to **Reports** page
2. Click **Health** tab
3. View:
   - **Vaccination Compliance**: Up to date, due soon, overdue
   - **Vaccination Status Chart**: Visual breakdown
4. **Double-click bars** to see detailed lists
5. Take action on overdue items

### Analyzing Dog Status

**Scenario:** See breakdown of active, sold, retired dogs.

**Steps:**
1. Go to **Reports** page
2. Click **Dogs** tab
3. View:
   - **Summary Cards**: Total dogs, active, sold, litters
   - **Dog Status Distribution**: Bar chart
4. **Double-click bars** to see dogs in each category

---

## Backing Up Your Data

### Creating a Full Backup

**Scenario:** Weekly backup routine.

**Steps:**
1. Go to **Settings** → **Data Management**
2. Click **"Export Full Backup"**
3. System creates ZIP file containing:
   - Complete database
   - All photos
4. Choose save location
5. **Best Practice**: Save to cloud storage (Google Drive, Dropbox, OneDrive)
6. **Set reminder**: Backup weekly

**Backup File Shows:**
- Photo count
- Total size
- Creation date

### Restoring from Backup

**Scenario:** Restore data after computer issue.

**Steps:**
1. Go to **Settings** → **Data Management**
2. Click **"Restore Full Backup"**
3. Select backup ZIP file
4. **Warning**: This replaces all current data
5. Confirm restore
6. System restores:
   - All database records
   - All photos

**Tip:** Test restore process periodically to ensure backups work.

### Data-Only Backup (Quick Backup)

**Scenario:** Quick backup without photos.

**Steps:**
1. Go to **Settings** → **Data Management**
2. Click **"Export Data Only"**
3. JSON file created with all database records
4. Use for:
   - Quick backups
   - Transferring data between installations
   - Sharing data without photos

**Note:** Photos not included. Use full backup for complete protection.

---

## Quick Reference: Common Workflows

### Daily Routine
1. Check **Dashboard** for reminders
2. Complete **Puppy Tasks** due today
3. Log any **Client Communications**
4. Record **Expenses** as they occur

### Weekly Routine
1. Review **Follow-ups Due**
2. Update **Litter Status** as needed
3. Complete **Puppy Health Tasks**
4. **Backup** your data

### Monthly Routine
1. Review **Financial Reports**
2. Check **Vaccination Compliance**
3. Update **Heat Cycle** records
4. Review **Breeding Performance** reports

### Before Breeding
1. Check **Genetic Compatibility**
2. Review **Pedigrees** to avoid inbreeding
3. Record **Heat Cycle**
4. Log **Progesterone Tests**
5. Create **Litter** record when bred

### When Puppies Are Born
1. Update litter status to **"Whelped"**
2. Add each **Puppy** with birth info
3. Upload **Photos** at birth
4. Review **Puppy Health Schedule**
5. Start **Waitlist** if not already started

### When Selling Puppies
1. Convert **Inquiry** to **Sale** (if applicable)
2. Create **Sale** record
3. Generate **Contract**
4. Record **Payment** status
5. Create **Transport** record if shipping
6. Export **Customer Packet** PDF

---

## Troubleshooting Common Issues

### Can't Generate Contract
**Problem:** Contract generation fails or shows errors.

**Solution:**
1. Check **Settings** → **Breeder Information**
2. Ensure all required fields (*) are filled:
   - Breeder/Owner Name
   - Address Line 1
   - City
   - State
   - Phone
3. Save breeder information
4. Try generating contract again

### Puppy Health Tasks Not Showing
**Problem:** Tasks don't appear after marking litter as "Whelped".

**Solution:**
1. Ensure litter status is set to **"Whelped"**
2. Enter **Whelp Date**
3. Refresh the page
4. Tasks should appear in **Puppy Health** tab

### Photos Not Displaying
**Problem:** Photos show as broken or missing.

**Solution:**
1. Ensure photos were uploaded through the app (not copied manually)
2. Check that photo files exist in app data directory
3. Try re-uploading the photo
4. If using backup, ensure full backup was restored (not data-only)

### Dashboard Not Showing Reminders
**Problem:** Dashboard cards show zero or missing data.

**Solution:**
1. Ensure you have data entered:
   - Dogs with heat cycles
   - Vaccinations with due dates
   - Litters with due dates
   - Puppy health tasks
   - Client communications with follow-ups
2. Refresh the page
3. Check date ranges (some reminders are time-sensitive)

---

## Tips for Success

### Data Entry Best Practices
- **Enter data promptly**: Record information as it happens
- **Complete profiles**: Fill in all available fields
- **Link relationships**: Always link sire/dam for pedigrees
- **Use photos**: Upload photos for dogs and litters
- **Categorize expenses**: Use appropriate categories for reporting

### Workflow Optimization
- **Check dashboard daily**: Stay on top of reminders
- **Log communications**: Record every client interaction
- **Update statuses**: Keep litter and sale statuses current
- **Regular backups**: Set weekly backup reminder
- **Review reports**: Use analytics to make informed decisions

### Breeding Best Practices
- **Test before breeding**: Record genetic tests
- **Check compatibility**: Use mating compatibility checker
- **Review pedigrees**: Avoid inbreeding
- **Track cycles**: Record all heat cycles accurately
- **Document everything**: Photos, weights, health records

---

**Respectabullz How-To Guide v1.9.1**
*Last Updated: December 29, 2025*

For detailed feature documentation, see [USER_MANUAL.md](USER_MANUAL.md).  
For technical documentation, see [ARCHITECTURE.md](ARCHITECTURE.md) and [API.md](API.md).


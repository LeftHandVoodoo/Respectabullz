# Respectabullz Data Model

**Version 1.7.0**

## Overview

The database uses SQLite with a normalized relational schema, accessed via `tauri-plugin-sql`. All entities use timestamp-based IDs for primary keys and include audit timestamps. The database schema is defined in `src/lib/db/schema.sql` and managed through migrations in `src/lib/db/migrations.ts`.

**Migration Note**: As of version 1.2.0, the application automatically migrates data from localStorage to SQLite on first launch. All existing data is preserved during migration.

## Entity Relationship Diagram

```
                                    ┌─────────────┐
                                    │   Setting   │
                                    └─────────────┘
                                    
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    ┌──────────┐         ┌──────────┐         ┌──────────┐      │
│    │  Client  │◄────────┤   Sale   │         │   Dog    │      │
│    └────┬─────┘         └────┬─────┘         └────┬─────┘      │
│         │                    │                     │            │
│         │                    │                     │            │
│         │              ┌─────▼─────┐              │            │
│         │              │SalePuppy  │◄─────────────┘            │
│         │              └───────────┘                            │
│         │                    │                                  │
│         │              ┌──────▼──────┐                          │
│         └─────────────►ClientInterest│                          │
│                    └──────────────┘                            │
│                                                   │            │
│         ┌─────────────────────────────────────────┤            │
│         │                 │                       │            │
│         ▼                 ▼                       ▼            │
│    ┌──────────┐     ┌──────────┐           ┌──────────┐        │
│    │ Transport│     │  Litter  │◄──────────┤ DogPhoto │        │
│    └──────────┘     └────┬─────┘           └──────────┘        │
│         │                │                       │             │
│         ▼                │                       │             │
│    ┌──────────┐          │          ┌────────────┼─────────┐   │
│    │ Expense  │◄─────────┘          │            │         │   │
│    └──────────┘                     ▼            ▼         ▼   │
│                              ┌──────────┐ ┌──────────┐ ┌──────┐│
│                              │Vaccination│ │WeightEntry│ │Medical│
│                              └──────────┘ └──────────┘ └──────┘│
│                                     │                          │
│                              ┌──────────┐                      │
│                              │HeatCycle │                      │
│                              └────┬─────┘                      │
│                                   │                            │
│                              ┌──────────┐                      │
│                              │HeatEvent │                      │
│                              └──────────┘                      │
│                                                                │
│         ┌──────────────┐          ┌──────────────┐             │
│         │PedigreeEntry │          │  Attachment  │             │
│         └──────────────┘          └──────────────┘             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Additional Entities                                    │  │
│  │                                                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │PuppyHealthTask│  │WaitlistEntry│  │Communication │  │  │
│  │  └──────┬───────┘  └──────┬──────┘  │    Log        │  │  │
│  │         │                  │         └──────┬─────────┘  │  │
│  │         │                  │               │            │  │
│  │         ▼                  ▼               ▼            │  │
│  │    ┌──────────┐      ┌──────────┐   ┌──────────┐       │  │
│  │    │  Litter  │      │  Client  │   │  Client  │       │  │
│  │    └──────────┘      └──────────┘   └──────────┘       │  │
│  │                                                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ExternalStud  │  │GeneticTest  │  │HealthSchedule│  │  │
│  │  └──────────────┘  └──────┬──────┘  │  Template    │  │  │
│  │                           │         └──────────────┘  │  │
│  │                           │                           │  │
│  │                           ▼                           │  │
│  │                      ┌──────────┐                     │  │
│  │                      │   Dog    │                     │  │
│  │                      └──────────┘                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Entities

### Dog
The central entity representing individual dogs and puppies.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| name | String | Dog's name (required) |
| sex | String | 'M' or 'F' |
| breed | String | Breed name |
| registrationNumber | String? | AKC/UKC registration |
| dateOfBirth | DateTime? | Birth date |
| color | String? | Coat color |
| microchipNumber | String? | Microchip ID |
| status | String | 'active', 'sold', 'retired', 'deceased' |
| profilePhotoPath | String? | Filename of profile photo (stored in photos/) |
| notes | String? | Free-form notes |
| sireId | String? | FK to Dog (father) |
| damId | String? | FK to Dog (mother) |
| litterId | String? | FK to Litter (birth litter) |
| evaluationCategory | String? | 'show_prospect', 'breeding_prospect', or 'pet' |
| structureNotes | String? | Conformation notes |
| temperamentNotes | String? | Personality observations |
| registrationStatus | String? | 'not_registered', 'pending', or 'registered' |
| registrationType | String? | 'full' or 'limited' |
| registryName | String? | Registry name (AKC, UKC, ABKC, etc.) |
| registrationDeadline | DateTime? | Registration deadline |
| createdAt | DateTime | Record creation |
| updatedAt | DateTime | Last update |

**Relationships:**
- Self-referential: sire, dam (parents), offspring
- Belongs to: Litter (birth litter)
- Has many: VaccinationRecord, WeightEntry, MedicalRecord, HeatCycle, Transport, DogPhoto, PedigreeEntry, SalePuppy, ClientInterest, GeneticTest, PuppyHealthTask (as assigned puppy)

**Photo Storage:** `profilePhotoPath` stores just the filename (e.g., `"1733241234567-abc123.jpg"`). Full path is `%APPDATA%/com.respectabullz.app/photos/{filename}`.

### Litter
Represents a breeding event and resulting puppies.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| code | String (unique) | Litter code (e.g., "2025-01-ABC") |
| nickname | String? | Friendly name |
| sireId | String? | FK to Dog (father) |
| damId | String? | FK to Dog (mother) |
| breedingDate | DateTime? | Date of breeding |
| dueDate | DateTime? | Expected whelp date |
| whelpDate | DateTime? | Actual whelp date |
| totalBorn | Int? | Total puppies born |
| totalAlive | Int? | Puppies surviving |
| status | String? | Litter status (planned, bred, ultrasound_confirmed, xray_confirmed, whelped, weaning, ready_to_go, completed) |
| ultrasoundDate | DateTime? | Ultrasound confirmation date |
| ultrasoundResult | String? | 'pregnant', 'not_pregnant', or 'inconclusive' |
| ultrasoundPuppyCount | Int? | Estimated puppy count from ultrasound |
| xrayDate | DateTime? | X-ray confirmation date |
| xrayPuppyCount | Int? | Accurate puppy count from X-ray |
| whelpingChecklistState | String? | JSON string of whelping checklist completion state |
| notes | String? | Notes |
| createdAt | DateTime | Record creation |
| updatedAt | DateTime | Last update |

**Relationships:**
- Belongs to: Dog (sire), Dog (dam)
- Has many: Dog (puppies), Expense, LitterPhoto, PuppyHealthTask, WaitlistEntry

### LitterPhoto
Multiple photos per litter for documenting breeding and puppies over time.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| litterId | String | FK to Litter |
| filePath | String | Filename of photo (stored in photos/) |
| caption | String? | Optional photo caption |
| sortOrder | Int | Display order (default: 0) |
| uploadedAt | DateTime | Upload timestamp |

**Relationships:**
- Belongs to: Litter (cascade delete)

**Photo Storage:** `filePath` stores just the filename. Full path is `%APPDATA%/com.respectabullz.app/photos/{filename}`.

## Health Entities

### VaccinationRecord
Tracks vaccinations and shot schedules.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| dogId | String | FK to Dog |
| date | DateTime | Vaccination date |
| vaccineType | String | Type (DHPP, Rabies, etc.) |
| dose | String? | Dosage |
| lotNumber | String? | Vaccine lot number |
| vetClinic | String? | Administering clinic |
| nextDueDate | DateTime? | Next due date |
| notes | String? | Notes |
| createdAt | DateTime | Record creation |
| updatedAt | DateTime | Last update |

### WeightEntry
Tracks weight over time for growth monitoring.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| dogId | String | FK to Dog |
| date | DateTime | Weigh date |
| weightLbs | Float | Weight in pounds |
| notes | String? | Notes |
| createdAt | DateTime | Record creation |

### MedicalRecord
General health events and procedures.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| dogId | String | FK to Dog |
| date | DateTime | Event date |
| type | String | 'exam', 'surgery', 'test', 'medication', 'injury', 'other' |
| description | String | What happened |
| vetClinic | String? | Clinic name |
| attachmentPath | String? | Path to document |
| notes | String? | Notes |
| createdAt | DateTime | Record creation |
| updatedAt | DateTime | Last update |

## Breeding Entities

### HeatCycle
Tracks female heat cycles for breeding planning.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| bitchId | String | FK to Dog |
| startDate | DateTime | Cycle start |
| standingHeatStart | DateTime? | Standing heat start |
| standingHeatEnd | DateTime? | Standing heat end |
| endDate | DateTime? | Cycle end |
| notes | String? | Notes |
| createdAt | DateTime | Record creation |
| updatedAt | DateTime | Last update |

### HeatEvent
Detailed events within a heat cycle.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| heatCycleId | String | FK to HeatCycle |
| date | DateTime | Event date |
| type | String | 'bleeding', 'progesteroneTest', 'breeding', 'other' |
| value | String? | Test result value |
| notes | String? | Notes |
| createdAt | DateTime | Record creation |

## Logistics Entities

### Transport
Shipping and transport records. Can be linked to sales for tracking delivery.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| dogId | String | FK to Dog |
| date | DateTime | Transport date |
| mode | String | 'flight', 'ground', 'pickup', 'other' |
| shipperBusinessName | String? | Shipper company |
| contactName | String? | Contact person |
| phone | String? | Phone number |
| email | String? | Email address |
| originCity | String? | Origin city |
| originState | String? | Origin state |
| destinationCity | String? | Destination city |
| destinationState | String? | Destination state |
| trackingNumber | String? | Tracking number |
| cost | Float? | Transport cost |
| notes | String? | Notes |
| expenseId | String? | FK to Expense |
| createdAt | DateTime | Record creation |
| updatedAt | DateTime | Last update |

**Relationships:**
- Belongs to: Dog
- Has one: Expense (optional)
- Has one: Sale (optional, via Sale.transportId)

## Financial Entities

### Expense
Business expense tracking.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| date | DateTime | Expense date |
| amount | Float | Amount in dollars |
| category | String | Category (see below) |
| vendorName | String? | Vendor/payee |
| description | String? | What was purchased |
| paymentMethod | String? | How paid |
| isTaxDeductible | Boolean | Tax deductible? |
| receiptPath | String? | Path to receipt |
| notes | String? | Notes |
| relatedDogId | String? | FK to Dog |
| relatedLitterId | String? | FK to Litter |
| createdAt | DateTime | Record creation |
| updatedAt | DateTime | Last update |

**Categories:**
- `transport` - Shipping costs
- `vet` - Veterinary expenses
- `food` - Dog food and treats
- `supplies` - Equipment, kennels, etc.
- `registration` - AKC/UKC fees
- `marketing` - Advertising, website
- `utilities` - Facility costs
- `misc` - Other expenses

### Client
Buyer/customer information.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| name | String | Full name |
| phone | String? | Phone number |
| email | String? | Email address |
| addressLine1 | String? | Street address |
| addressLine2 | String? | Apt/Suite |
| city | String? | City |
| state | String? | State |
| postalCode | String? | ZIP code |
| notes | String? | Notes |
| createdAt | DateTime | Record creation |
| updatedAt | DateTime | Last update |

**Relationships:**
- Has many: Sale, ClientInterest

### Sale
Records of dog sales. Supports multiple puppies per sale via SalePuppy junction table.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| clientId | String | FK to Client |
| saleDate | DateTime | Sale date |
| price | Float | Total sale price |
| depositAmount | Float? | Deposit paid |
| depositDate | DateTime? | Deposit date |
| shippedDate | DateTime? | Date puppy was shipped |
| receivedDate | DateTime? | Date client received puppy |
| isLocalPickup | Boolean | Local pickup (no shipping) |
| paymentStatus | String | 'deposit_only', 'partial', 'paid_in_full', 'refunded' |
| warrantyInfo | String? | Warranty/health guarantee details |
| registrationTransferDate | DateTime? | Registration transfer date |
| transportId | String? | FK to Transport (optional) |
| contractPath | String? | Path to contract |
| notes | String? | Notes |
| createdAt | DateTime | Record creation |
| updatedAt | DateTime | Last update |

**Relationships:**
- Belongs to: Client
- Has many: SalePuppy (puppies in this sale), ClientInterest (converted interests)
- Has one: Transport (optional)

### SalePuppy
Junction table linking puppies to sales. Allows multiple puppies per sale.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| saleId | String | FK to Sale |
| dogId | String | FK to Dog |
| price | Float | Individual puppy price |
| createdAt | DateTime | Record creation |

**Relationships:**
- Belongs to: Sale, Dog
- Unique constraint: (saleId, dogId)

### ClientInterest
Tracks client inquiries and interests before sale conversion.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| clientId | String | FK to Client |
| dogId | String | FK to Dog (puppy interested in) |
| interestDate | DateTime | Date interest was expressed |
| contactMethod | String | 'phone', 'email', 'website', 'social_media', 'referral', 'other' |
| status | String | 'interested', 'contacted', 'scheduled_visit', 'converted', 'lost' |
| notes | String? | Notes about the interest |
| convertedToSaleId | String? | FK to Sale (if converted) |
| createdAt | DateTime | Record creation |
| updatedAt | DateTime | Last update |

**Relationships:**
- Belongs to: Client, Dog
- Has one: Sale (if converted)

## Pedigree Entities

### PedigreeEntry
Deep lineage tracking (4+ generations).

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| dogId | String | FK to Dog |
| generation | Int | Generation number (1=parents) |
| position | String | Position code (S, D, SS, SD, etc.) |
| ancestorName | String | Ancestor's name |
| ancestorRegistration | String? | Registration number |
| ancestorColor | String? | Color |
| ancestorBreed | String? | Breed |
| notes | String? | Notes |
| createdAt | DateTime | Record creation |

**Position Codes:**
- Generation 1: S (Sire), D (Dam)
- Generation 2: SS, SD, DS, DD
- Generation 3: SSS, SSD, SDS, SDD, DSS, DSD, DDS, DDD
- And so on...

## Supporting Entities

### DogPhoto
Multiple photos per dog (legacy model - currently using profilePhotoPath on Dog).

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| dogId | String | FK to Dog |
| filePath | String | Filename of photo (stored in photos/) |
| caption | String? | Photo caption |
| isPrimary | Boolean | Primary photo? |
| uploadedAt | DateTime | Upload timestamp |

**Note:** Currently, dogs use a single `profilePhotoPath` field. The `DogPhoto` model exists for future multi-photo support.

### Attachment
Generic file attachments.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| entityType | String | Entity type (dog, litter, etc.) |
| entityId | String | Entity ID |
| filePath | String | Path to file |
| fileName | String | Original filename |
| fileType | String? | MIME type |
| uploadedAt | DateTime | Upload timestamp |

### Setting
Application settings.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| key | String (unique) | Setting key |
| value | String | Setting value |
| updatedAt | DateTime | Last update |

## Additional Entities

### PuppyHealthTask
Tracks health and development tasks for puppies in a litter.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| litterId | String | FK to Litter |
| puppyId | String? | FK to Dog (optional, for per-puppy tasks) |
| taskType | String | Task type (daily_weight, deworming, vaccination, etc.) |
| taskName | String | Task name/description |
| dueDate | DateTime | When task is due |
| completedDate | DateTime? | Completion date (null if not completed) |
| notes | String? | Additional notes |
| createdAt | DateTime | Record creation |
| updatedAt | DateTime | Last update |

**Relationships:**
- Belongs to: Litter, Dog (optional)

### WaitlistEntry
Tracks puppy reservations and deposits.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| clientId | String | FK to Client |
| litterId | String? | FK to Litter (optional for general waitlist) |
| position | Int | Pick order position |
| preference | String | 'male', 'female', or 'either' |
| colorPreference | String? | Color preference |
| depositAmount | Float? | Deposit amount |
| depositDate | DateTime? | Deposit date |
| depositStatus | String | 'pending', 'paid', 'refunded', 'applied_to_sale' |
| status | String | 'waiting', 'matched', 'converted', 'withdrawn' |
| assignedPuppyId | String? | FK to Dog (when matched) |
| notes | String? | Notes |
| createdAt | DateTime | Record creation |
| updatedAt | DateTime | Last update |

**Relationships:**
- Belongs to: Client, Litter (optional), Dog (assignedPuppy)

### CommunicationLog
Tracks all client interactions.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| clientId | String | FK to Client |
| date | DateTime | Communication date |
| type | String | 'phone', 'email', 'text', 'in_person', 'video_call', 'social_media' |
| direction | String | 'inbound' or 'outbound' |
| summary | String | Summary of communication |
| followUpNeeded | Boolean | Whether follow-up is needed |
| followUpDate | DateTime? | Follow-up due date |
| followUpCompleted | Boolean | Whether follow-up was completed |
| relatedLitterId | String? | FK to Litter (if related) |
| notes | String? | Additional notes |
| createdAt | DateTime | Record creation |
| updatedAt | DateTime | Last update |

**Relationships:**
- Belongs to: Client, Litter (optional)

### ExternalStud
Database of outside breeding partners.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| name | String | Stud name |
| breed | String | Breed |
| registrationNumber | String? | Registration number |
| ownerName | String? | Owner name |
| ownerEmail | String? | Owner email |
| ownerPhone | String? | Owner phone |
| healthTestingNotes | String? | Health testing information |
| geneticTestResults | String? | JSON string of genetic test results |
| semenType | String? | 'fresh', 'chilled', or 'frozen' |
| notes | String? | Additional notes |
| createdAt | DateTime | Record creation |
| updatedAt | DateTime | Last update |

### GeneticTest
Health testing records for dogs.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| dogId | String | FK to Dog |
| testName | String | Test name (DM, HUU, CMR1, etc.) |
| result | String | 'clear', 'carrier', 'affected', or 'pending' |
| labName | String? | Testing lab name |
| testDate | DateTime | Test date |
| certificateNumber | String? | Certificate number |
| documentPath | String? | Path to test certificate PDF |
| notes | String? | Additional notes |
| createdAt | DateTime | Record creation |
| updatedAt | DateTime | Last update |

**Relationships:**
- Belongs to: Dog

### HealthScheduleTemplate
Configurable templates for puppy health schedules.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| name | String | Template name |
| items | String | JSON array of HealthScheduleTemplateItem |
| createdAt | DateTime | Record creation |
| updatedAt | DateTime | Last update |

**Note:** HealthScheduleTemplateItem defines taskType, taskName, daysFromBirth, isPerPuppy, and notes.

## Document Management Entities

### Document
Stores document files (PDFs, Word documents, Excel spreadsheets, images) with metadata.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| filename | String | Unique filename on disk (timestamp-random.ext) |
| originalName | String | Original filename provided by user |
| filePath | String | Relative path in app data dir (documents/filename) |
| mimeType | String | MIME type (application/pdf, image/jpeg, etc.) |
| fileSize | Int | File size in bytes |
| notes | String? | Optional notes about the document |
| uploadedAt | DateTime | Upload timestamp |
| updatedAt | DateTime | Last update timestamp |

**Relationships:**
- Has many: DocumentTagLink (many-to-many with DocumentTag)
- Has many: DogDocument (many-to-many with Dog)
- Has many: LitterDocument (many-to-many with Litter)
- Has many: ExpenseDocument (many-to-many with Expense)

**File Storage:** Documents are stored in `%APPDATA%/com.respectabullz.app/documents/` with unique filenames. Database stores file paths, not binary data.

**Supported File Types:**
- PDFs: `.pdf`
- Word Documents: `.doc`, `.docx`
- Excel Spreadsheets: `.xls`, `.xlsx`
- Images: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`

### DocumentTag
Tagging system for documents. Includes 13 predefined tags plus custom user-created tags.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| name | String (unique) | Tag name |
| color | String? | Hex color code for tag display |
| isCustom | Boolean | Whether tag is user-created (false for predefined) |
| createdAt | DateTime | Creation timestamp |

**Predefined Tags:**
- Invoice, Receipt, Contract, Health Certificate, Registration Papers
- Vet Record, Vaccination Record, Genetic Test Results, Microchip Certificate
- Photo/Image, Shipping/Transport, Insurance, Other

**Relationships:**
- Has many: DocumentTagLink (many-to-many with Document)

### DocumentTagLink
Junction table linking documents to tags (many-to-many relationship).

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| documentId | String | FK to Document |
| tagId | String | FK to DocumentTag |
| createdAt | DateTime | Link creation timestamp |

**Unique Constraint:** (documentId, tagId) - prevents duplicate tag assignments

### DogDocument
Junction table linking documents to dogs (many-to-many relationship).

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| dogId | String | FK to Dog |
| documentId | String | FK to Document |
| createdAt | DateTime | Link creation timestamp |

**Relationships:**
- Belongs to: Dog, Document (cascade delete)

**Unique Constraint:** (dogId, documentId) - prevents duplicate document attachments

### LitterDocument
Junction table linking documents to litters (many-to-many relationship).

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| litterId | String | FK to Litter |
| documentId | String | FK to Document |
| createdAt | DateTime | Link creation timestamp |

**Relationships:**
- Belongs to: Litter, Document (cascade delete)

**Unique Constraint:** (litterId, documentId) - prevents duplicate document attachments

### ExpenseDocument
Junction table linking documents to expenses (many-to-many relationship).

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| expenseId | String | FK to Expense |
| documentId | String | FK to Document |
| createdAt | DateTime | Link creation timestamp |

**Relationships:**
- Belongs to: Expense, Document (cascade delete)

**Unique Constraint:** (expenseId, documentId) - prevents duplicate document attachments

## Indexes

The following fields are indexed for query performance:

- `Dog.status` - For filtering active/sold/etc.
- `Dog.sex` - For filtering males/females
- `Dog.sireId`, `Dog.damId` - For lineage queries
- `Dog.litterId` - For litter associations
- `Dog.registrationStatus` - For registration tracking
- `Litter.code` - For litter lookup
- `Litter.status` - For litter status filtering
- `PuppyHealthTask.litterId` - For litter task queries
- `PuppyHealthTask.dueDate` - For task reminders
- `WaitlistEntry.litterId` - For litter waitlist queries
- `WaitlistEntry.status` - For waitlist filtering
- `CommunicationLog.clientId` - For client communication queries
- `CommunicationLog.followUpDate` - For follow-up reminders
- `VaccinationRecord.nextDueDate` - For reminder queries
- `Expense.date` - For date range queries
- `Expense.category` - For category filtering
- `DocumentTag.name` - For tag lookup
- `DocumentTagLink.documentId`, `DocumentTagLink.tagId` - For document-tag queries
- `DogDocument.dogId`, `DogDocument.documentId` - For dog document queries
- `LitterDocument.litterId`, `LitterDocument.documentId` - For litter document queries
- `ExpenseDocument.expenseId`, `ExpenseDocument.documentId` - For expense document queries

## Data Integrity Rules

1. **Cascade Deletes**: 
   - Deleting a Dog cascades to related records (vaccinations, weights, medical, heat cycles, transports, photos, pedigree, sale puppies, client interests, genetic tests, assigned puppy health tasks)
   - Deleting a Litter cascades to PuppyHealthTask and WaitlistEntry records
   - Deleting a Sale cascades to SalePuppy records
   - Deleting a Client cascades to ClientInterest, WaitlistEntry, and CommunicationLog records
   - Deleting a Document cascades to DocumentTagLink, DogDocument, LitterDocument, and ExpenseDocument records
   - Deleting a Dog cascades to DogDocument records
   - Deleting a Litter cascades to LitterDocument records
   - Deleting an Expense cascades to ExpenseDocument records
2. **Unique Constraints**: 
   - Litter.code must be unique
   - Setting.key must be unique
   - SalePuppy (saleId, dogId) must be unique (puppy can only be in sale once)
   - PedigreeEntry (dogId, generation, position) must be unique
   - DocumentTag.name must be unique
   - DocumentTagLink (documentId, tagId) must be unique
   - DogDocument (dogId, documentId) must be unique
   - LitterDocument (litterId, documentId) must be unique
   - ExpenseDocument (expenseId, documentId) must be unique
3. **Status Updates**: Creating a Sale with puppies automatically sets each Dog.status to 'sold'
4. **Interest Conversion**: Converting a ClientInterest to a Sale updates the interest status to 'converted' and links it to the sale


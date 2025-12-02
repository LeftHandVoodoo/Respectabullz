# Respectabullz Data Model

## Overview

The database uses SQLite with a normalized relational schema. All entities use CUID for primary keys and include audit timestamps.

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
| profilePhotoPath | String? | Path to profile photo |
| notes | String? | Free-form notes |
| sireId | String? | FK to Dog (father) |
| damId | String? | FK to Dog (mother) |
| litterId | String? | FK to Litter (birth litter) |
| createdAt | DateTime | Record creation |
| updatedAt | DateTime | Last update |

**Relationships:**
- Self-referential: sire, dam (parents), offspring
- Belongs to: Litter (birth litter)
- Has many: VaccinationRecord, WeightEntry, MedicalRecord, HeatCycle, Transport, DogPhoto, PedigreeEntry, SalePuppy, ClientInterest

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
| notes | String? | Notes |
| createdAt | DateTime | Record creation |
| updatedAt | DateTime | Last update |

**Relationships:**
- Belongs to: Dog (sire), Dog (dam)
- Has many: Dog (puppies), Expense

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
Multiple photos per dog.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| dogId | String | FK to Dog |
| filePath | String | Path to image |
| caption | String? | Photo caption |
| isPrimary | Boolean | Primary photo? |
| uploadedAt | DateTime | Upload timestamp |

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

## Indexes

The following fields are indexed for query performance:

- `Dog.status` - For filtering active/sold/etc.
- `Dog.sex` - For filtering males/females
- `Dog.sireId`, `Dog.damId` - For lineage queries
- `Dog.litterId` - For litter associations
- `Litter.code` - For litter lookup
- `VaccinationRecord.nextDueDate` - For reminder queries
- `Expense.date` - For date range queries
- `Expense.category` - For category filtering

## Data Integrity Rules

1. **Cascade Deletes**: 
   - Deleting a Dog cascades to related records (vaccinations, weights, medical, heat cycles, transports, photos, pedigree, sale puppies, client interests)
   - Deleting a Sale cascades to SalePuppy records
   - Deleting a Client cascades to ClientInterest records
2. **Unique Constraints**: 
   - Litter.code must be unique
   - Setting.key must be unique
   - SalePuppy (saleId, dogId) must be unique (puppy can only be in sale once)
   - PedigreeEntry (dogId, generation, position) must be unique
3. **Status Updates**: Creating a Sale with puppies automatically sets each Dog.status to 'sold'
4. **Interest Conversion**: Converting a ClientInterest to a Sale updates the interest status to 'converted' and links it to the sale


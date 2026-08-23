# Respectabullz Internal API Reference

**Version 1.10.4**

## Overview

This document describes the internal API provided by the database layer (`src/lib/db/`) and consumed by React hooks (`src/hooks/`).

The database layer has been refactored into modular domain-specific files:
- `src/lib/db/dogs.ts` - Dog operations
- `src/lib/db/litters.ts` - Litter operations
- `src/lib/db/health.ts` - Health records
- `src/lib/db/breeding.ts` - Breeding operations
- `src/lib/db/sales.ts` - Sales and client operations
- `src/lib/db/operations.ts` - Expenses and transports
- `src/lib/db/documents.ts` - Document management and tagging
- `src/lib/db/contacts.ts` - Contacts management
- `src/lib/db/settings.ts` - Settings management
- `src/lib/db/dashboard.ts` - Dashboard statistics
- `src/lib/db/index.ts` - Re-exports all functions for backwards compatibility

All functions are async and return Promises. The TypeScript database modules invoke a
validated native boundary backed by the single Rust-owned SQLx/`tauri-plugin-sql`
SQLite pool; the renderer cannot call the SQL plugin directly.

## Dog Operations

### getDogs
Retrieves all dogs.

```typescript
getDogs(): Promise<Dog[]>
```

**Returns:** Array of Dog objects without populated relations.

### getDog
Retrieves a single dog with all relations populated.

```typescript
getDog(id: string): Promise<Dog | null>
```

**Parameters:**
- `id`: Dog's unique identifier

**Returns:** Dog object with populated relations (sire, dam, birthLitter, vaccinations, weightEntries, medicalRecords, heatCycles, transports, photos) or null if not found.

### createDog
Creates a new dog.

```typescript
createDog(input: CreateDogInput): Promise<Dog>
```

**Parameters:**
- `input`: Dog data (see CreateDogInput type)

**Returns:** Created Dog object.

### updateDog
Updates an existing dog.

```typescript
updateDog(id: string, input: UpdateDogInput): Promise<Dog | null>
```

**Parameters:**
- `id`: Dog's unique identifier
- `input`: Partial dog data to update

**Returns:** Updated Dog object or null if not found.

### deleteDog
Deletes a dog and all related records.

```typescript
deleteDog(id: string): Promise<boolean>
```

**Parameters:**
- `id`: Dog's unique identifier

**Returns:** true if deleted, false if not found.

**Side Effects:** Cascades delete to vaccinations, weights, medical records, heat cycles, transports, and photos.

---

## Litter Operations

### getLitters
Retrieves all litters with parent dogs and puppy counts.

```typescript
getLitters(): Promise<Litter[]>
```

### getLitter
Retrieves a single litter with full relations.

```typescript
getLitter(id: string): Promise<Litter | null>
```

### createLitter
Creates a new litter.

```typescript
createLitter(input: CreateLitterInput): Promise<Litter>
```

### updateLitter
Updates an existing litter.

```typescript
updateLitter(id: string, input: UpdateLitterInput): Promise<Litter | null>
```

### deleteLitter
Deletes a litter (puppies are not deleted, just unlinked).

```typescript
deleteLitter(id: string): Promise<boolean>
```

---

## Vaccination Operations

### getVaccinations
Retrieves vaccinations, optionally filtered by dog.

```typescript
getVaccinations(dogId?: string): Promise<VaccinationRecord[]>
```

### createVaccination
Creates a vaccination record.

```typescript
createVaccination(input: Omit<VaccinationRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<VaccinationRecord>
```

### updateVaccination
Updates a vaccination record.

```typescript
updateVaccination(id: string, input: Partial<VaccinationRecord>): Promise<VaccinationRecord | null>
```

### deleteVaccination
Deletes a vaccination record.

```typescript
deleteVaccination(id: string): Promise<boolean>
```

---

## Weight Operations

### getWeightEntries
Retrieves weight entries, optionally filtered by dog.

```typescript
getWeightEntries(dogId?: string): Promise<WeightEntry[]>
```

**Note:** Results are sorted by date ascending.

### createWeightEntry
Creates a weight entry.

```typescript
createWeightEntry(input: Omit<WeightEntry, 'id' | 'createdAt'>): Promise<WeightEntry>
```

### deleteWeightEntry
Deletes a weight entry.

```typescript
deleteWeightEntry(id: string): Promise<boolean>
```

---

## Medical Record Operations

### getMedicalRecords
Retrieves medical records, optionally filtered by dog.

```typescript
getMedicalRecords(dogId?: string): Promise<MedicalRecord[]>
```

### createMedicalRecord
Creates a medical record.

```typescript
createMedicalRecord(input: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicalRecord>
```

### updateMedicalRecord
Updates a medical record.

```typescript
updateMedicalRecord(id: string, input: Partial<MedicalRecord>): Promise<MedicalRecord | null>
```

### deleteMedicalRecord
Deletes a medical record.

```typescript
deleteMedicalRecord(id: string): Promise<boolean>
```

---

## Heat Cycle Operations

### getHeatCycles
Retrieves heat cycles with events, optionally filtered by female.

```typescript
getHeatCycles(bitchId?: string): Promise<HeatCycle[]>
```

### createHeatCycle
Creates a heat cycle.

```typescript
createHeatCycle(input: Omit<HeatCycle, 'id' | 'createdAt' | 'updatedAt' | 'bitch' | 'events'>): Promise<HeatCycle>
```

### updateHeatCycle
Updates a heat cycle.

```typescript
updateHeatCycle(id: string, input: Partial<HeatCycle>): Promise<HeatCycle | null>
```

### deleteHeatCycle
Deletes a heat cycle and all its events.

```typescript
deleteHeatCycle(id: string): Promise<boolean>
```

---

## Transport Operations

### getTransports
Retrieves transports with dog info, optionally filtered.

```typescript
getTransports(dogId?: string): Promise<Transport[]>
```

### createTransport
Creates a transport record.

```typescript
createTransport(input: CreateTransportInput): Promise<Transport>
```

### updateTransport
Updates a transport record.

```typescript
updateTransport(id: string, input: UpdateTransportInput): Promise<Transport | null>
```

### deleteTransport
Deletes a transport record.

```typescript
deleteTransport(id: string): Promise<boolean>
```

---

## Expense Operations

### getExpenses
Retrieves expenses with optional filters.

```typescript
getExpenses(filters?: { dogId?: string; litterId?: string; category?: string }): Promise<Expense[]>
```

### createExpense
Creates an expense record.

```typescript
createExpense(input: CreateExpenseInput): Promise<Expense>
```

### updateExpense
Updates an expense record.

```typescript
updateExpense(id: string, input: UpdateExpenseInput): Promise<Expense | null>
```

### deleteExpense
Deletes an expense record.

```typescript
deleteExpense(id: string): Promise<boolean>
```

---

## Client Operations

### getClients
Retrieves all clients with their sales and interests.

```typescript
getClients(): Promise<Client[]>
```

**Returns:** Array of Client objects with populated sales (including puppies) and interests.

### getClient
Retrieves a single client with sales history and interests.

```typescript
getClient(id: string): Promise<Client | null>
```

**Returns:** Client object with populated sales (including puppies and transport) and interests, or null if not found.

### createClient
Creates a client.

```typescript
createClient(input: CreateClientInput): Promise<Client>
```

### updateClient
Updates a client.

```typescript
updateClient(id: string, input: UpdateClientInput): Promise<Client | null>
```

### deleteClient
Deletes a client.

```typescript
deleteClient(id: string): Promise<boolean>
```

---

## Contact Operations

### getContactCategories
Retrieves all contact categories (predefined and custom).

```typescript
getContactCategories(): Promise<ContactCategory[]>
```

**Returns:** Array of ContactCategory objects sorted by predefined status and name.

### getContactCategory
Retrieves a single contact category by ID.

```typescript
getContactCategory(id: string): Promise<ContactCategory | null>
```

### createContactCategory
Creates a new contact category.

```typescript
createContactCategory(input: CreateContactCategoryInput): Promise<ContactCategory>
```

**Parameters:**
- `input.name`: Category name (required)
- `input.color`: Optional hex color code
- `input.isPredefined`: Boolean (defaults to false)

### updateContactCategory
Updates a contact category.

```typescript
updateContactCategory(id: string, input: UpdateContactCategoryInput): Promise<ContactCategory | null>
```

### deleteContactCategory
Deletes a custom category (predefined categories cannot be deleted).

```typescript
deleteContactCategory(id: string): Promise<boolean>
```

**Returns:** true if deleted, false if category is predefined or not found.

### getContacts
Retrieves all contacts with their categories.

```typescript
getContacts(): Promise<ContactWithRelations[]>
```

**Returns:** Array of Contact objects with populated categories.

### getContact
Retrieves a single contact by ID with categories.

```typescript
getContact(id: string): Promise<ContactWithRelations | null>
```

### getContactsByCategory
Retrieves all contacts in a specific category.

```typescript
getContactsByCategory(categoryId: string): Promise<ContactWithRelations[]>
```

### createContact
Creates a new contact.

```typescript
createContact(input: CreateContactInput): Promise<ContactWithRelations>
```

**Parameters:**
- `input.name`: Contact name (required)
- `input.companyName`: Company or business name
- `input.phonePrimary`: Primary phone number
- `input.phoneSecondary`: Secondary phone number
- `input.email`: Email address
- `input.addressLine1`, `addressLine2`, `city`, `state`, `postalCode`: Address fields
- `input.facebook`, `instagram`, `tiktok`, `twitter`, `website`: Social media links
- `input.notes`: Notes
- `input.businessCardDocumentId`: Link to uploaded business card document
- `input.categoryIds`: Array of category IDs to assign

### updateContact
Updates a contact.

```typescript
updateContact(id: string, input: UpdateContactInput): Promise<ContactWithRelations | null>
```

### deleteContact
Deletes a contact.

```typescript
deleteContact(id: string): Promise<boolean>
```

### setContactCategories
Sets categories for a contact (replaces existing categories).

```typescript
setContactCategories(contactId: string, categoryIds: string[]): Promise<void>
```

### addCategoryToContact
Adds a category to a contact.

```typescript
addCategoryToContact(contactId: string, categoryId: string): Promise<void>
```

### removeCategoryFromContact
Removes a category from a contact.

```typescript
removeCategoryFromContact(contactId: string, categoryId: string): Promise<void>
```

### searchContacts
Searches contacts by name, company name, email, or phone.

```typescript
searchContacts(searchTerm: string): Promise<ContactWithRelations[]>
```

---

## Sale Operations

### getSales
Retrieves all sales with puppies, client, and transport info.

```typescript
getSales(): Promise<Sale[]>
```

**Returns:** Array of Sale objects with populated puppies, client, transport, and converted interests.

### getSale
Retrieves a single sale with full details.

```typescript
getSale(id: string): Promise<Sale | null>
```

**Returns:** Sale object with populated puppies, client, transport, and converted interests, or null if not found.

### createSale
Creates a sale record with multiple puppies.

```typescript
createSale(input: CreateSaleInput): Promise<Sale>
```

**Parameters:**
- `input.clientId`: Client ID
- `input.saleDate`: Sale date
- `input.price`: Total sale price
- `input.puppies`: Array of { dogId, price } objects
- Additional optional fields: depositAmount, depositDate, shippedDate, receivedDate, isLocalPickup, paymentStatus, warrantyInfo, registrationTransferDate, transportId, contractPath, notes

**Atomic side effects:**
- Creates SalePuppy records for each puppy
- Sets each puppy's status to 'sold'
- Rejects missing, duplicate, retired, deceased, or already-assigned dogs
- Commits the sale, assignments, statuses, and foreign-key verification together

### updateSale
Updates a sale record.

```typescript
updateSale(id: string, input: UpdateSaleInput): Promise<Sale | null>
```

**Parameters:**
- `id`: Sale ID
- `input`: Partial sale data, including optional `puppies` array to update puppy list

**Atomic side effects:** Replaces assignments and updates sold/active dog statuses in
one native transaction. Validation failure rolls back the full update.

### deleteSale
Deletes a sale record.

```typescript
deleteSale(id: string): Promise<boolean>
```

**Atomic side effects:**
- Deletes associated SalePuppy records
- Reverts each puppy's status to 'active'
- Clears convertedToSaleId from related ClientInterest records
- Restores converted waitlist entries and verifies foreign keys before commit

Individual add/remove/price helpers were removed because they split assignment and
dog-status writes. Call `updateSale` with the complete desired puppy list instead.

---

## Client Interest Operations

### getClientInterests
Retrieves all client interests with client, dog, and sale info.

```typescript
getClientInterests(): Promise<ClientInterest[]>
```

### getClientInterest
Retrieves a single client interest.

```typescript
getClientInterest(id: string): Promise<ClientInterest | null>
```

### getInterestsByClient
Retrieves all interests for a specific client.

```typescript
getInterestsByClient(clientId: string): Promise<ClientInterest[]>
```

### getInterestsByDog
Retrieves all interests for a specific dog/puppy.

```typescript
getInterestsByDog(dogId: string): Promise<ClientInterest[]>
```

### createClientInterest
Creates a new client interest record.

```typescript
createClientInterest(input: CreateClientInterestInput): Promise<ClientInterest>
```

**Parameters:**
- `input.clientId`: Client ID
- `input.dogId`: Dog/puppy ID
- `input.interestDate`: Date interest was expressed
- `input.contactMethod`: Contact method ('phone', 'email', 'website', 'social_media', 'referral', 'other')
- `input.status`: Status ('interested', 'contacted', 'scheduled_visit', 'converted', 'lost')
- `input.notes`: Optional notes

### updateClientInterest
Updates a client interest record.

```typescript
updateClientInterest(id: string, input: UpdateClientInterestInput): Promise<ClientInterest | null>
```

### deleteClientInterest
Deletes a client interest record.

```typescript
deleteClientInterest(id: string): Promise<boolean>
```

### convertInterestToSale
Converts a client interest to a sale.

```typescript
convertInterestToSale(interestId: string, saleInput: CreateSaleInput): Promise<{ sale: Sale; interest: ClientInterest } | null>
```

**Atomic side effects:**
- Creates a new Sale with SalePuppy records
- Updates the interest status to 'converted'
- Links the interest to the sale via convertedToSaleId
- Sets puppy statuses to 'sold'
- Rolls back the sale and interest update together on any failure

---

## Contract Generation Operations

### generateContractDocumentFromJson
Generates a Word document contract from JSON template and contract data.

```typescript
generateContractDocumentFromJson(contractData: ContractData): Promise<Blob>
```

**Parameters:**
- `contractData`: ContractData object containing breeder, buyer, puppy, and sale information

**Returns:** Blob of the generated Word document (.docx)

**Template:** Uses `contracts/contract_template_respectabullz.json` as the source template

**Storage:** Generated contracts are saved to:
- Default: `%APPDATA%/com.respectabullz.app/contracts/`
- Custom: Native-dialog-selected directory for the current app session

**Permission lifetime:** `useContract` reads the session-scoped destination from
`src/lib/contractDestination.ts`. The native grant does not survive restart, so the
folder must be reselected each launch. A persisted legacy `contractsDirectory` value
is ignored for generation; otherwise output uses the app-data default.

### fillFillableContract
Fills a pre-made fillable Word template with contract data by replacing Word Content Controls (SDT fields).

```typescript
fillFillableContract(contractData: ContractData, templateArrayBuffer: ArrayBuffer): Promise<Blob>
```

**Parameters:**
- `contractData`: ContractData object containing breeder, buyer, puppy, and sale information
- `templateArrayBuffer`: The fillable Word template file as an ArrayBuffer

**Returns:** Blob of the filled Word document (.docx)

**Template:** Uses Word Content Controls (SDT) with field aliases (Field_1, Field_3, etc.) that are mapped to ContractData properties

**Note:** This function directly manipulates the .docx XML structure using PizZip to find and replace SDT field content. The template must be a valid Word document with properly configured Content Controls.

### prepareTemplateData
Prepares contract data for template rendering.

```typescript
prepareTemplateData(contractData: ContractData): Record<string, string | number | boolean>
```

**Returns:** Object mapping template placeholders to values

### formatPriceWords
Converts a numeric price to words (e.g., 1500 -> "One Thousand Five Hundred Dollars and no cents").

```typescript
formatPriceWords(amount: number): string
```

### formatContractDate
Formats dates for contract display.

```typescript
formatContractDate(date: Date | string | undefined, formatType: 'long' | 'short'): string
```

**Returns:** 
- 'long': "December 2, 2025"
- 'short': "12/02/2025"

---

## Settings Operations

### getSetting
Retrieves a single setting by key.

```typescript
getSetting(key: string): Promise<string | null>
```

### setSetting
Creates or updates a setting.

```typescript
setSetting(key: string, value: string): Promise<Setting>
```

### getSettings
Retrieves all settings as a key-value object.

```typescript
getSettings(): Promise<Record<string, string>>
```

**Returns:** Object mapping setting keys to values

**Common Settings:**
- `theme`: "light" | "dark" | "system"
- `weightUnit`: "lbs" | "kg"
- `notificationsEnabled`: "true" | "false"
- `contractsDirectory`: Legacy persisted value; ignored by current contract generation
  because native folder authority is session-scoped
- `dataFolderPath`: Path to data folder (legacy, may be empty)

---

## Dashboard Operations

### getDashboardStats
Retrieves dashboard statistics.

```typescript
getDashboardStats(): Promise<DashboardStats>
```

**Returns:**
```typescript
{
  totalDogs: number;
  activeDogs: number;
  dogsInHeat: number;
  upcomingShots: number;      // Due in next 30 days
  upcomingDueDates: number;   // Litters due in next 30 days
  monthlyExpenses: number;    // Current month total
  recentActivity: ActivityItem[];
}
```

---

## Photo Operations

### Photo Utilities (`lib/photoUtils.ts`)

#### selectAndCopyImage
Selects and validates an image before copying it to the app's photos directory.

```typescript
selectAndCopyImage(): Promise<string | null>
```

**Returns:** Filename of the copied photo (e.g., `"1733241234567-abc123.jpg"`) or null if cancelled/failed.

**Storage:** Photos are saved to `%APPDATA%/com.respectabullz.app/photos/` with unique filenames.

**Limits:** Supported signatures only, maximum 20 MB per source image, bounded pixel
dimensions/frame count, and direct managed filenames.

#### getPhotoUrlAsync
Converts a validated managed photo filename to a scoped Tauri asset URL.

```typescript
getPhotoUrlAsync(filename: string | null | undefined): Promise<string | null>
```

**Returns:** Bounded cached asset URL or null if the filename/file is invalid.

#### getPhotoDataUrl
Reads and validates a managed photo for PDF embedding.

```typescript
getPhotoDataUrl(filename: string | null | undefined): Promise<{
  dataUrl: string;
  byteLength: number;
} | null>
```

The file must be a regular direct child of managed photo storage with a canonical
UUID-v4 or verified legacy filename. Metadata and bytes are each checked against the
8 MiB embedding cap, content validation is repeated after reading, and encoding is
chunked. Packet export wraps this helper in `createPdfPhotoLoader`, which reads each
distinct filename once and rejects more than 25 photos or more than 48 MiB total.

#### selectAndCopyMultipleImages
Selects multiple images and copies them to the photos directory.

```typescript
selectAndCopyMultipleImages(): Promise<string[]>
```

**Returns:** Array of filenames for the copied photos.

### Litter Photo Operations (`lib/db.ts`)

#### getLitterPhotos
Retrieves all photos for a litter.

```typescript
getLitterPhotos(litterId: string): Promise<LitterPhoto[]>
```

#### createLitterPhoto
Creates a new litter photo record.

```typescript
createLitterPhoto(input: Omit<LitterPhoto, 'id' | 'uploadedAt'>): Promise<LitterPhoto>
```

**Parameters:**
- `input.litterId`: Litter ID
- `input.filePath`: Photo filename (from `selectAndCopyImage`)
- `input.caption`: Optional caption

#### deleteLitterPhoto
Deletes a litter photo.

```typescript
deleteLitterPhoto(id: string): Promise<boolean>
```

**Side Effects:** Deletes the database row, then removes the managed file only when no
other row references it. A cleanup failure is reported and can leave an export-excluded
orphan because SQLite and the filesystem do not share a transaction.

---

## Partial Export and Withdrawn Recovery Operations

The public Settings UI currently exposes partial export only. Restore/import and
factory-reset controls are withdrawn while complete recovery verification is being
implemented. Removed entry points are named below so maintainers do not mistake old
documentation for a supported user workflow.

### exportDatabase
Serializes a defined subset of database records as JSON. It currently includes dogs,
litters, expenses, breeder settings, and per-dog vaccinations, medical records,
weight entries, and genetic tests.

```typescript
exportDatabase(): Promise<string>
```

**Returns:** A JSON string containing that subset.

**Limitations:** This function omits photos, managed documents, contract files,
communication logs, and other domains not named above. Its output is a partial
export, not a verified backup or round-trip recovery artifact.

### Removed legacy entry points

`importDatabase` and `clearDatabase` are no longer exported by the current database
module. There is no supported record import or factory-reset function. References to
those names in historical documentation must not be reintroduced as callable APIs.

---

## Partial ZIP Export (`lib/backupUtils.ts`)

### exportPartialDataWithPhotos
Creates a ZIP archive containing the partial JSON produced by `exportDatabase()` and
every enumerated top-level file found in the application-data `photos` directory.

```typescript
exportPartialDataWithPhotos(databaseJson: string): Promise<boolean>
```

**Parameters:**
- `databaseJson`: JSON string from `exportDatabase()`

**Returns:** true if ZIP file was saved successfully, false if the user cancelled.
Rejects before the save dialog if the photo directory cannot be enumerated or any
managed photo cannot be read. No unreadable photo is silently omitted from a reported
success, and `metadata.json.photoCount` is derived from the files actually added.

**ZIP Structure:**
```
respectabullz-partial-export-YYYY-MM-DD.zip
├── metadata.json      # Export version, date, photo count
├── database.json      # Partial database export
└── photos/
    ├── photo1.jpg
    ├── photo2.png
    └── ...
```

**Storage and interruption behavior:** The ZIP is written directly to the exact file
granted by the native save dialog. It does not use a sibling temporary file and atomic
rename because that sibling path is outside the dialog grant. An interrupted or failed
write can therefore leave an incomplete target. The application does not manage
retention, encryption, deletion, or cloud-provider lifecycle after export.

**Limitations:** Managed documents, generated contracts, logs, externally stored
files, and database domains omitted by `exportDatabase()` are not included. The ZIP
is therefore a non-recoverable partial export, not a complete, atomic, or verified
backup.

### getPartialExportInfo
Gets information about current photo storage.

```typescript
getPartialExportInfo(): Promise<{ photoCount: number; photosSize: number }>
```

Rejects if the managed photo inventory cannot be enumerated or completely read;
callers must not represent an inspection failure as an empty inventory.

**Returns:** Photo count and total size in bytes for the photo scope inspected by
the exporter. It does not describe the completeness of an export.

For the user-visible format, omissions, and recovery boundary, see
[BACKUP_FORMAT.md](BACKUP_FORMAT.md) and [RELIABILITY.md](RELIABILITY.md).

---

## React Hooks

Each entity has corresponding React hooks that wrap the database operations with TanStack Query.

### Pattern

```typescript
// Query hooks (read)
useEntities()           // List all
useEntity(id)           // Get one

// Mutation hooks (write)
useCreateEntity()       // Create
useUpdateEntity()       // Update
useDeleteEntity()       // Delete
```

### Available Hooks

| Entity | List | Get | Create | Update | Delete |
|--------|------|-----|--------|--------|--------|
| Dog | useDogs | useDog | useCreateDog | useUpdateDog | useDeleteDog |
| Litter | useLitters | useLitter | useCreateLitter | useUpdateLitter | useDeleteLitter |
| Vaccination | useVaccinations | - | useCreateVaccination | useUpdateVaccination | useDeleteVaccination |
| Weight | useWeightEntries | - | useCreateWeightEntry | - | useDeleteWeightEntry |
| Medical | useMedicalRecords | - | useCreateMedicalRecord | useUpdateMedicalRecord | useDeleteMedicalRecord |
| HeatCycle | useHeatCycles | - | useCreateHeatCycle | useUpdateHeatCycle | useDeleteHeatCycle |
| Transport | useTransports | - | useCreateTransport | useUpdateTransport | useDeleteTransport |
| Expense | useExpenses | - | useCreateExpense | useUpdateExpense | useDeleteExpense |
| Client | useClients | useClient | useCreateClient | useUpdateClient | useDeleteClient |
| Contact | useContacts | useContact | useCreateContact | useUpdateContact | useDeleteContact |
| ContactCategory | useContactCategories | - | useCreateContactCategory | useUpdateContactCategory | useDeleteContactCategory |
| ClientInterest | useClientInterests | - | useCreateClientInterest | useUpdateClientInterest | useDeleteClientInterest |
| Sale | useSales | - | useCreateSale | useUpdateSale | useDeleteSale |
| Dashboard | useDashboardStats | - | - | - | - |
| Settings | useSettings, useSetting | - | useUpdateSetting | - | - |
| BreederSettings | useBreederSettings | - | useBreederSettings (update) | - | - |
| Contract | - | - | useGenerateContract | - | - |
| LitterPhoto | useLitterPhotos | - | useCreateLitterPhoto | - | useDeleteLitterPhoto |
| PuppyHealthTask | usePuppyHealthTasks | - | useCreatePuppyHealthTask | useUpdatePuppyHealthTask | useDeletePuppyHealthTask |
| WaitlistEntry | useWaitlistEntries | - | useCreateWaitlistEntry | useUpdateWaitlistEntry | useDeleteWaitlistEntry |
| CommunicationLog | useCommunicationLogs | - | useCreateCommunicationLog | useUpdateCommunicationLog | useDeleteCommunicationLog |
| ExternalStud | useExternalStuds | - | useCreateExternalStud | useUpdateExternalStud | useDeleteExternalStud |
| GeneticTest | useGeneticTests | - | useCreateGeneticTest | useUpdateGeneticTest | useDeleteGeneticTest |
| PartialExport | usePartialExportInfo | - | useExportPartialDataWithPhotos | - | - |

### Mutation Hook Features

All mutation hooks include:
- Automatic cache invalidation
- Toast notifications on success/error
- Loading state via `isPending`
- Error handling

---

## Puppy Health Task Operations (v0.8.0)

### getPuppyHealthTasks
Retrieves puppy health tasks, optionally filtered by litter or puppy.

```typescript
getPuppyHealthTasks(litterId?: string, puppyId?: string): Promise<PuppyHealthTask[]>
```

### generatePuppyHealthTasks
Auto-generates health tasks for a litter based on whelp date and schedule template.

```typescript
generatePuppyHealthTasks(litterId: string, whelpDate: Date): Promise<PuppyHealthTask[]>
```

### completePuppyHealthTask
Marks a task as completed.

```typescript
completePuppyHealthTask(id: string): Promise<PuppyHealthTask | null>
```

### uncompletePuppyHealthTask
Marks a completed task as incomplete.

```typescript
uncompletePuppyHealthTask(id: string): Promise<PuppyHealthTask | null>
```

---

## Waitlist Operations (v0.8.0)

### getWaitlistEntries
Retrieves waitlist entries, optionally filtered by litter or client.

```typescript
getWaitlistEntries(litterId?: string, clientId?: string): Promise<WaitlistEntry[]>
```

### createWaitlistEntry
Creates a new waitlist entry with automatic position assignment.

```typescript
createWaitlistEntry(input: CreateWaitlistEntryInput): Promise<WaitlistEntry>
```

### convertWaitlistToSale
Converts a waitlist entry to a sale, applying deposit.

```typescript
convertWaitlistToSale(waitlistEntryId: string, saleInput: CreateSaleInput): Promise<{ sale: Sale; entry: WaitlistEntry } | null>
```

---

## Communication Log Operations (v0.8.0)

### getCommunicationLogs
Retrieves communication logs for a client.

```typescript
getCommunicationLogs(clientId: string): Promise<CommunicationLog[]>
```

### getFollowUpsDue
Retrieves all follow-ups due within the next week.

```typescript
getFollowUpsDue(): Promise<CommunicationLog[]>
```

### createCommunicationLog
Creates a new communication log entry.

```typescript
createCommunicationLog(input: CreateCommunicationLogInput): Promise<CommunicationLog>
```

### completeFollowUp
Marks a follow-up as completed.

```typescript
completeFollowUp(id: string): Promise<CommunicationLog | null>
```

---

## External Stud Operations

### getExternalStuds
Retrieves all external studs.

```typescript
getExternalStuds(): Promise<ExternalStud[]>
```

### getHeatCyclePrediction
Calculates predicted next heat date for a female based on historical data.

```typescript
getHeatCyclePrediction(dogId: string): Promise<HeatCyclePrediction | null>
```

**Returns:**
```typescript
{
  predictedNextHeat: Date | null;
  averageCycleLength: number;
  averageInterval: number;
  confidence: 'low' | 'medium' | 'high';
  dataPointCount: number;
}
```

---

## Genetic Test Operations

### getGeneticTests
Retrieves genetic tests, optionally filtered by dog.

```typescript
getGeneticTests(dogId?: string): Promise<GeneticTest[]>
```

### getMatingCompatibility
Analyzes genetic compatibility between two dogs.

```typescript
getMatingCompatibility(damId: string, sireId: string): Promise<MatingCompatibilityResult>
```

**Returns:**
```typescript
{
  compatible: boolean;
  risks: Array<{
    condition: string;
    risk: 'none' | 'low' | 'medium' | 'high';
    explanation: string;
  }>;
  warnings: string[];
}
```

---

## Report Operations

### getLittersPerYearReport
Generates litters per year report.

```typescript
getLittersPerYearReport(years?: number): Promise<ReportLittersPerYear[]>
```

### getLitterFinancialsReport
Generates financial report for litters.

```typescript
getLitterFinancialsReport(): Promise<ReportLitterFinancials[]>
```

### getProductionByDamReport
Generates production statistics by dam.

```typescript
getProductionByDamReport(): Promise<ReportProductionByParent[]>
```

### getProductionBySireReport
Generates production statistics by sire.

```typescript
getProductionBySireReport(): Promise<ReportProductionByParent[]>
```

---

## Pedigree Operations

### getPedigree
Retrieves pedigree data for a dog (up to 4 generations).

```typescript
getPedigree(dogId: string, generations?: number): Promise<PedigreeData>
```

**Returns:** Tree structure with ancestor information including name, registration, color, and photo paths.

---

## Customer Packet Operations (v1.0.1)

### getPacketData
Retrieves comprehensive data for generating a customer packet PDF export.

```typescript
getPacketData(dogId: string): Promise<PacketData | null>
```

**Parameters:**
- `dogId`: Dog's unique identifier

**Returns:** Comprehensive packet data including:
- Dog information with all relations
- Sire and dam with profile photos
- 4-generation pedigree ancestors
- Vaccination records
- Medical records
- Weight entries
- Genetic tests
- Dog photos (gallery)
- Sale and client information (if applicable)
- Breeder settings

**PacketData Structure:**
```typescript
{
  dog: Dog;
  sire: Dog | null;
  dam: Dog | null;
  pedigreeAncestors: Array<{
    generation: number;
    position: string;
    dog: Dog | null;
    name: string;
    registrationNumber: string | null;
    color: string | null;
  }>;
  vaccinations: VaccinationRecord[];
  medicalRecords: MedicalRecord[];
  weightEntries: WeightEntry[];
  geneticTests: GeneticTest[];
  dogPhotos: DogPhoto[];
  sirePhoto: string | null;  // Profile photo path
  damPhoto: string | null;   // Profile photo path
  sale: Sale | null;
  client: Client | null;
  expenses: Expense[];
  breederSettings: BreederSettings;
}
```

This function aggregates all data needed for the PDF export in a single call, optimizing performance and ensuring data consistency.

---

## Document Management Operations

### Document Tags

#### getDocumentTags
Retrieves all document tags (predefined and custom).

```typescript
getDocumentTags(): Promise<DocumentTag[]>
```

**Returns:** Array of DocumentTag objects sorted by custom status and name.

#### getDocumentTag
Retrieves a single document tag by ID.

```typescript
getDocumentTag(id: string): Promise<DocumentTag | null>
```

#### getDocumentTagByName
Retrieves a document tag by name.

```typescript
getDocumentTagByName(name: string): Promise<DocumentTag | null>
```

#### createDocumentTag
Creates a new custom document tag.

```typescript
createDocumentTag(input: CreateDocumentTagInput): Promise<DocumentTag>
```

**Parameters:**
- `input.name`: Tag name (required)
- `input.color`: Optional hex color code
- `input.isCustom`: Boolean (defaults to true for created tags)

#### deleteDocumentTag
Deletes a custom tag (predefined tags cannot be deleted).

```typescript
deleteDocumentTag(id: string): Promise<boolean>
```

**Returns:** true if deleted, false if tag is predefined or not found.

#### seedPredefinedTags
Seeds the database with predefined document tags (called during migration).

```typescript
seedPredefinedTags(tags: typeof PREDEFINED_DOCUMENT_TAGS): Promise<void>
```

### Documents

User-facing create, edit, and delete mutations cross the renderer/Rust boundary
through `src/lib/documentWorkflow.ts`. The Rust commands own one SQLx connection and
transaction and coordinate staged or quarantined files with record/tag/entity-link
changes. This is scoped compensation, not a claim that SQLite and the filesystem
share a transaction.

#### getDocuments
Retrieves all documents.

```typescript
getDocuments(): Promise<Document[]>
```

**Returns:** Array of Document objects ordered by upload date (newest first).

#### getDocument
Retrieves a single document by ID.

```typescript
getDocument(id: string): Promise<Document | null>
```

#### getDocumentWithRelations
Retrieves a document with all tags populated.

```typescript
getDocumentWithRelations(id: string): Promise<DocumentWithRelations | null>
```

**Returns:** Document with tags array populated.

#### createDocument
Stages and validates a selected source file, then creates the document record, tag
links, and one dog/litter/expense link through one Rust command.

```typescript
createDocument(input: CreateDocumentInput): Promise<Document>
```

**Parameters:**
- `input.sourcePath`: Native-dialog-selected source path
- `input.entityType`: `dog`, `litter`, or `expense`
- `input.entityId`: Existing entity ID to link
- `input.notes`: Optional notes
- `input.tagIds`: Tag IDs to link

**Validation and failure behavior:** Files are limited to 100 MB. The Rust command
checks allowlisted extensions and signatures for PDF, PNG, JPEG, GIF, WebP, OOXML ZIP,
and legacy OLE documents. Selection alone does not copy a permanent file. A failure
before commit rolls back rows and removes or reports staging residue.

#### updateDocument
Updates document notes and replaces tags in one Rust-owned database transaction.

```typescript
updateDocument(id: string, input: UpdateDocumentInput): Promise<Document | null>
```

**Parameters:**
- `input.notes`: Optional notes to update
- `input.tagIds`: Optional array of tag IDs (replaces existing tags)

#### deleteDocument
Moves the managed file to a recoverable tombstone, deletes database metadata/links in
one transaction, commits, then removes the tombstone.

```typescript
deleteDocument(id: string): Promise<DeleteDocumentResult>
```

**Returns:** `{ deleted, cleanupResidue? }`. If post-commit tombstone cleanup fails,
the committed delete remains explicit and the residue path is reported for startup
reconciliation. If the transaction fails, the row is preserved and the command tries
to restore the file; restoration failure is surfaced with recoverable residue.
If `COMMIT` was attempted but its result is ambiguous, the command does not guess or
restore the file: it preserves the tombstone and reports its residue so startup can
decide from durable database state.

#### setDocumentTags
Sets tags for a document (replaces existing tags).

```typescript
setDocumentTags(documentId: string, tagIds: string[]): Promise<void>
```

This wrapper invokes the one-transaction Rust tag replacement. Lower-level
`addTagToDocument` and `removeTagFromDocument` helpers remain available for legacy
callers but are not the demonstrated user-facing edit workflow.

#### addTagToDocument
Adds a tag to a document.

```typescript
addTagToDocument(documentId: string, tagId: string): Promise<void>
```

#### removeTagFromDocument
Removes a tag from a document.

```typescript
removeTagFromDocument(documentId: string, tagId: string): Promise<void>
```

### Entity-Document Linking

#### Dog Documents

##### getDocumentsForDog
Retrieves all documents linked to a dog.

```typescript
getDocumentsForDog(dogId: string): Promise<DocumentWithRelations[]>
```

**Returns:** Array of documents with tags populated.

##### linkDocumentToDog
Links a document to a dog.

```typescript
linkDocumentToDog(documentId: string, dogId: string): Promise<void>
```

##### unlinkDocumentFromDog
Unlinks a document from a dog.

```typescript
unlinkDocumentFromDog(documentId: string, dogId: string): Promise<void>
```

##### getDocumentCountForDog
Gets the count of documents attached to a dog.

```typescript
getDocumentCountForDog(dogId: string): Promise<number>
```

#### Litter Documents

##### getDocumentsForLitter
Retrieves all documents linked to a litter.

```typescript
getDocumentsForLitter(litterId: string): Promise<DocumentWithRelations[]>
```

##### linkDocumentToLitter
Links a document to a litter.

```typescript
linkDocumentToLitter(documentId: string, litterId: string): Promise<void>
```

##### unlinkDocumentFromLitter
Unlinks a document from a litter.

```typescript
unlinkDocumentFromLitter(documentId: string, litterId: string): Promise<void>
```

##### getDocumentCountForLitter
Gets the count of documents attached to a litter.

```typescript
getDocumentCountForLitter(litterId: string): Promise<number>
```

#### Expense Documents

##### getDocumentsForExpense
Retrieves all documents linked to an expense.

```typescript
getDocumentsForExpense(expenseId: string): Promise<DocumentWithRelations[]>
```

##### linkDocumentToExpense
Links a document to an expense.

```typescript
linkDocumentToExpense(documentId: string, expenseId: string): Promise<void>
```

##### unlinkDocumentFromExpense
Unlinks a document from an expense.

```typescript
unlinkDocumentFromExpense(documentId: string, expenseId: string): Promise<void>
```

##### getDocumentCountForExpense
Gets the count of documents attached to an expense.

```typescript
getDocumentCountForExpense(expenseId: string): Promise<number>
```

### Utility Functions

#### getDocumentsByTag
Retrieves all documents with a specific tag.

```typescript
getDocumentsByTag(tagId: string): Promise<DocumentWithRelations[]>
```

**Returns:** Array of documents with the specified tag, ordered by upload date.

---

## Document Utilities (`src/lib/documentUtils.ts`)

### File Selection

#### selectDocumentFile
Opens a file picker dialog for selecting a single document.

```typescript
selectDocumentFile(): Promise<string | null>
```

**Returns:** Selected file path or null if cancelled.

**Supported Formats:** PDF, Word (.doc, .docx), Excel (.xls, .xlsx), Images (jpg, png, gif, webp)

#### selectMultipleDocuments
Opens a file picker dialog for selecting multiple documents.

```typescript
selectMultipleDocuments(): Promise<string[]>
```

**Returns:** Array of selected file paths.

### Managed File Operations

#### selectDocumentForUpload
Selects and inspects a source file without modifying managed storage. Permanent copy
occurs only inside `createDocument` after the user confirms the upload.

```typescript
selectDocumentForUpload(): Promise<{
  sourcePath: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
} | null>
```

#### openDocumentWithSystem
Validates the stored filename, then invokes a Rust command that requires a matching
database record and canonicalizes the managed path before using the Windows default
application. The broad Tauri shell-open plugin permission is not used.

```typescript
openDocumentWithSystem(filename: string): Promise<boolean>
```

### Startup reconciliation

After database integrity setup, startup reconciliation acquires `BEGIN IMMEDIATE` to
serialize with managed-document writers. It removes uncommitted staging files,
restores tombstones when the database row survived, removes tombstones after a
committed delete, and quarantines unregistered files found in the managed final
directory. Actual file-operation failures block the operational UI and present a retry
path. Reaching the 10,000-entry scan limit logs a warning and allows startup when no
failure was recorded; that result is explicitly truncated and not exhaustive.

### File Information

#### getMimeType
Gets MIME type from filename.

```typescript
getMimeType(filename: string): string
```

#### formatFileSize
Formats file size in human-readable format.

```typescript
formatFileSize(bytes: number): string
```

**Returns:** Formatted string (e.g., "1.5 MB")

#### isSupportedFile
Checks if file type is supported.

```typescript
isSupportedFile(filename: string): boolean
```

#### isImageFile / isPdfFile / isWordFile / isExcelFile
Type checking functions for specific file types.

```typescript
isImageFile(filename: string): boolean
isPdfFile(filename: string): boolean
isWordFile(filename: string): boolean
isExcelFile(filename: string): boolean
```

### URL Generation

#### getDocumentUrl
Converts a stored document filename to a displayable URL (for images).

```typescript
getDocumentUrl(filename: string | null | undefined): Promise<string | null>
```

#### getDocumentBase64
Gets document as base64 data URL (for images).

```typescript
getDocumentBase64(filename: string): Promise<string | null>
```

**Returns:** Data URL string (e.g., "data:image/jpeg;base64,...")


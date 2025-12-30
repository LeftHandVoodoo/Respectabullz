# Respectabullz Internal API Reference

**Version 1.9.3**

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

All functions are async and return Promises. The API uses TypeScript for type safety. The database now uses SQLite via `tauri-plugin-sql` instead of localStorage.

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

**Side Effects:** 
- Creates SalePuppy records for each puppy
- Sets each puppy's status to 'sold'

### updateSale
Updates a sale record.

```typescript
updateSale(id: string, input: UpdateSaleInput): Promise<Sale | null>
```

**Parameters:**
- `id`: Sale ID
- `input`: Partial sale data, including optional `puppies` array to update puppy list

**Side Effects:** Updates SalePuppy records and dog statuses as needed.

### deleteSale
Deletes a sale record.

```typescript
deleteSale(id: string): Promise<boolean>
```

**Side Effects:** 
- Deletes associated SalePuppy records
- Reverts each puppy's status to 'active'
- Clears convertedToSaleId from related ClientInterest records

### addPuppyToSale
Adds a puppy to an existing sale.

```typescript
addPuppyToSale(saleId: string, dogId: string, price: number): Promise<SalePuppy | null>
```

### removePuppyFromSale
Removes a puppy from a sale.

```typescript
removePuppyFromSale(saleId: string, dogId: string): Promise<boolean>
```

**Side Effects:** Reverts the puppy's status to 'active'.

### updatePuppyPrice
Updates the price of a puppy within a sale.

```typescript
updatePuppyPrice(saleId: string, dogId: string, price: number): Promise<SalePuppy | null>
```

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

**Side Effects:**
- Creates a new Sale with SalePuppy records
- Updates the interest status to 'converted'
- Links the interest to the sale via convertedToSaleId
- Sets puppy statuses to 'sold'

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
- Custom: User-selected directory (if configured in Settings > Preferences > Contracts Save Location)

**Settings Integration:** The save location is controlled by the `contractsDirectory` setting, which can be set via Settings page or defaults to app data directory.

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
- `contractsDirectory`: Custom directory path for saving contracts (empty string uses default)
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
Selects an image file and copies it to the app's photos directory.

```typescript
selectAndCopyImage(): Promise<string | null>
```

**Returns:** Filename of the copied photo (e.g., `"1733241234567-abc123.jpg"`) or null if cancelled/failed.

**Storage:** Photos are saved to `%APPDATA%/com.respectabullz.app/photos/` with unique filenames.

#### getPhotoUrlAsync
Converts a photo filename to a displayable data URL.

```typescript
getPhotoUrlAsync(filename: string | null | undefined): Promise<string | null>
```

**Returns:** Base64 data URL (`data:image/jpeg;base64,...`) or null if file not found.

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

**Side Effects:** Photo file is not automatically deleted (stored separately).

---

## Backup Operations

### exportDatabase
Exports the entire database as JSON (data only, no photos).

```typescript
exportDatabase(): Promise<string>
```

**Returns:** JSON string of all database contents.

**Note:** This does not include photo files. Use `exportBackupWithPhotos` for complete backups.

### importDatabase
Imports a database backup (JSON format).

```typescript
importDatabase(data: string): Promise<boolean>
```

**Parameters:**
- `data`: JSON string from exportDatabase

**Returns:** true if successful, false if parsing failed.

**Note:** Photo files must be restored separately. Use `importBackupWithPhotos` for complete restore.

### clearDatabase
Deletes all data from the database.

```typescript
clearDatabase(): Promise<void>
```

**Warning:** This is irreversible! Does not delete photo files.

---

## Full Backup with Photos (`lib/backupUtils.ts`)

### exportBackupWithPhotos
Creates a ZIP archive containing database and all photos.

```typescript
exportBackupWithPhotos(databaseJson: string): Promise<boolean>
```

**Parameters:**
- `databaseJson`: JSON string from `exportDatabase()`

**Returns:** true if ZIP file was saved successfully, false if user cancelled.

**ZIP Structure:**
```
backup.zip
├── metadata.json      # Backup version, date, photo count
├── database.json      # Full database export
└── photos/
    ├── photo1.jpg
    ├── photo2.png
    └── ...
```

**Storage:** ZIP file is saved to user-selected location via file dialog.

### importBackupWithPhotos
Restores database and photos from a ZIP backup.

```typescript
importBackupWithPhotos(): Promise<{ success: boolean; databaseJson?: string; photoCount?: number; error?: string }>
```

**Returns:**
- `success`: true if restore completed
- `databaseJson`: Extracted database JSON (if successful)
- `photoCount`: Number of photos restored
- `error`: Error message if failed

**Side Effects:**
- Extracts all photos to `%APPDATA%/com.respectabullz.app/photos/`
- Database JSON must be imported separately using `importDatabase()`

### getBackupInfo
Gets information about current photo storage.

```typescript
getBackupInfo(): Promise<{ photoCount: number; photosSize: number }>
```

**Returns:** Photo count and total size in bytes.

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
| Backup | useBackupInfo | - | useExportBackupWithPhotos | - | - |

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
Creates a new document record.

```typescript
createDocument(input: CreateDocumentInput): Promise<Document>
```

**Parameters:**
- `input.filename`: Unique stored filename
- `input.originalName`: Original filename from user
- `input.filePath`: Relative path in app data directory
- `input.mimeType`: MIME type (e.g., "application/pdf")
- `input.fileSize`: File size in bytes
- `input.notes`: Optional notes
- `input.tagIds`: Optional array of tag IDs to link

**Returns:** Created Document object.

#### updateDocument
Updates document metadata (notes and tags).

```typescript
updateDocument(id: string, input: UpdateDocumentInput): Promise<Document | null>
```

**Parameters:**
- `input.notes`: Optional notes to update
- `input.tagIds`: Optional array of tag IDs (replaces existing tags)

#### deleteDocument
Deletes a document and its file from storage.

```typescript
deleteDocument(id: string): Promise<boolean>
```

**Side Effects:** 
- Deletes physical file from documents directory
- Cascades delete to all junction tables (dog_documents, litter_documents, expense_documents, document_tag_links)

#### setDocumentTags
Sets tags for a document (replaces existing tags).

```typescript
setDocumentTags(documentId: string, tagIds: string[]): Promise<void>
```

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

### File Operations

#### selectAndCopyDocument
Selects a file and copies it to the documents directory.

```typescript
selectAndCopyDocument(): Promise<{
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
} | null>
```

**Returns:** Object with document metadata or null if cancelled.

#### copyDocumentToDocsDir
Copies a file to the app's documents directory.

```typescript
copyDocumentToDocsDir(sourcePath: string): Promise<{ filename: string; fileSize: number } | null>
```

**Returns:** Object with generated filename and file size.

#### deleteDocumentFile
Deletes a document file from storage.

```typescript
deleteDocumentFile(filename: string): Promise<boolean>
```

#### openDocumentWithSystem
Opens a document with the system default application.

```typescript
openDocumentWithSystem(filename: string): Promise<boolean>
```

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


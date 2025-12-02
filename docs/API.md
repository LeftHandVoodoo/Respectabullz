# Respectabullz Internal API Reference

## Overview

This document describes the internal API provided by the database layer (`src/lib/db.ts`) and consumed by React hooks (`src/hooks/`).

All functions are async and return Promises. The API uses TypeScript for type safety.

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

**Template:** Uses `contacts/contract_template_respectabullz.json` as the source template

**Storage:** Generated contracts are saved to `%APPDATA%/com.respectabullz.app/contracts/`

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

## Backup Operations

### exportDatabase
Exports the entire database as JSON.

```typescript
exportDatabase(): Promise<string>
```

**Returns:** JSON string of all database contents.

### importDatabase
Imports a database backup.

```typescript
importDatabase(data: string): Promise<boolean>
```

**Parameters:**
- `data`: JSON string from exportDatabase

**Returns:** true if successful, false if parsing failed.

### clearDatabase
Deletes all data from the database.

```typescript
clearDatabase(): Promise<void>
```

**Warning:** This is irreversible!

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
| ClientInterest | useClientInterests | - | useCreateClientInterest | useUpdateClientInterest | useDeleteClientInterest |
| Sale | useSales | - | useCreateSale | useUpdateSale | useDeleteSale |
| Dashboard | useDashboardStats | - | - | - | - |
| Settings | useSettings, useSetting | - | useUpdateSetting | - | - |
| BreederSettings | useBreederSettings | - | useBreederSettings (update) | - | - |
| Contract | - | - | useGenerateContract | - | - |

### Mutation Hook Features

All mutation hooks include:
- Automatic cache invalidation
- Toast notifications on success/error
- Loading state via `isPending`
- Error handling


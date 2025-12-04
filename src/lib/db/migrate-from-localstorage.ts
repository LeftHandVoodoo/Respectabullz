// Migration utility for transferring data from localStorage to SQLite
// This runs once on first launch after the SQLite migration

import { execute, isDatabaseEmpty } from './connection';
import { dateToSql, boolToSql } from './utils';

// localStorage key used by the old db.ts
const STORAGE_KEY = 'respectabullz_db';

// Old database interface from localStorage
interface OldDatabase {
  dogs: OldDog[];
  litters: OldLitter[];
  heatCycles: OldHeatCycle[];
  heatEvents: OldHeatEvent[];
  vaccinations: OldVaccinationRecord[];
  weightEntries: OldWeightEntry[];
  medicalRecords: OldMedicalRecord[];
  transports: OldTransport[];
  expenses: OldExpense[];
  clients: OldClient[];
  sales: OldSale[];
  salePuppies: OldSalePuppy[];
  clientInterests: OldClientInterest[];
  pedigreeEntries: OldPedigreeEntry[];
  dogPhotos: OldDogPhoto[];
  litterPhotos: OldLitterPhoto[];
  settings: OldSetting[];
  puppyHealthTasks: OldPuppyHealthTask[];
  healthScheduleTemplates: OldHealthScheduleTemplate[];
  waitlistEntries: OldWaitlistEntry[];
  communicationLogs: OldCommunicationLog[];
  externalStuds: OldExternalStud[];
  geneticTests: OldGeneticTest[];
}

// Type definitions for old data (simplified, using any for dates since they could be strings or Date)
/* eslint-disable @typescript-eslint/no-explicit-any */
interface OldDog { id: string; name: string; sex: string; breed: string; registrationNumber?: string; dateOfBirth?: any; color?: string; microchipNumber?: string; status: string; profilePhotoPath?: string; notes?: string; sireId?: string; damId?: string; litterId?: string; evaluationCategory?: string; structureNotes?: string; temperamentNotes?: string; registrationStatus?: string; registrationType?: string; registryName?: string; registrationDeadline?: any; createdAt: any; updatedAt: any; }
interface OldLitter { id: string; code: string; nickname?: string; breedingDate?: any; dueDate?: any; whelpDate?: any; totalBorn?: number; totalAlive?: number; notes?: string; sireId?: string; damId?: string; status?: string; ultrasoundDate?: any; ultrasoundResult?: string; xrayDate?: any; xrayPuppyCount?: number; whelpingChecklistState?: string; createdAt: any; updatedAt: any; }
interface OldHeatCycle { id: string; bitchId: string; startDate: any; standingHeatStart?: any; standingHeatEnd?: any; ovulationDate?: any; optimalBreedingStart?: any; optimalBreedingEnd?: any; endDate?: any; expectedDueDate?: any; nextHeatEstimate?: any; notes?: string; createdAt: any; updatedAt: any; }
interface OldHeatEvent { id: string; heatCycleId: string; date: any; type: string; value?: string; sireId?: string; notes?: string; createdAt: any; }
interface OldVaccinationRecord { id: string; dogId: string; date: any; vaccineType: string; dose?: string; lotNumber?: string; vetClinic?: string; nextDueDate?: any; notes?: string; createdAt: any; updatedAt: any; }
interface OldWeightEntry { id: string; dogId: string; date: any; weightLbs: number; notes?: string; createdAt: any; }
interface OldMedicalRecord { id: string; dogId: string; date: any; type: string; description: string; vetClinic?: string; attachmentPath?: string; notes?: string; createdAt: any; updatedAt: any; }
interface OldTransport { id: string; dogId: string; date: any; mode: string; shipperBusinessName?: string; contactName?: string; phone?: string; email?: string; originCity?: string; originState?: string; destinationCity?: string; destinationState?: string; trackingNumber?: string; cost?: number; expenseId?: string; notes?: string; createdAt: any; updatedAt: any; }
interface OldExpense { id: string; date: any; amount: number; category: string; vendorName?: string; description?: string; paymentMethod?: string; isTaxDeductible?: boolean; receiptPath?: string; relatedDogId?: string; relatedLitterId?: string; notes?: string; createdAt: any; updatedAt: any; }
interface OldClient { id: string; name: string; phone?: string; email?: string; addressLine1?: string; addressLine2?: string; city?: string; state?: string; postalCode?: string; notes?: string; createdAt: any; updatedAt: any; }
interface OldSale { id: string; clientId: string; saleDate: any; price: number; depositAmount?: number; depositDate?: any; contractPath?: string; shippedDate?: any; receivedDate?: any; isLocalPickup?: boolean; paymentStatus?: string; warrantyInfo?: string; registrationTransferDate?: any; transportId?: string; notes?: string; createdAt: any; updatedAt: any; }
interface OldSalePuppy { id: string; saleId: string; dogId: string; price: number; createdAt: any; }
interface OldClientInterest { id: string; clientId: string; dogId: string; interestDate: any; contactMethod: string; status: string; convertedToSaleId?: string; notes?: string; createdAt: any; updatedAt: any; }
interface OldPedigreeEntry { id: string; dogId: string; generation: number; position: string; ancestorName: string; ancestorRegistration?: string; ancestorColor?: string; ancestorBreed?: string; notes?: string; createdAt: any; }
interface OldDogPhoto { id: string; dogId: string; filePath: string; caption?: string; isPrimary?: boolean; uploadedAt: any; }
interface OldLitterPhoto { id: string; litterId: string; filePath: string; caption?: string; sortOrder: number; uploadedAt: any; }
interface OldSetting { id: string; key: string; value: string; updatedAt: any; }
interface OldPuppyHealthTask { id: string; litterId: string; puppyId?: string; taskType: string; dueDate: any; completedDate?: any; notes?: string; createdAt: any; updatedAt: any; }
interface OldHealthScheduleTemplate { id: string; name: string; isDefault?: boolean; items: any; createdAt: any; updatedAt: any; }
interface OldWaitlistEntry { id: string; clientId: string; litterId?: string; position: number; preference?: string; colorPreference?: string; depositAmount?: number; depositDate?: any; status: string; assignedPuppyId?: string; notes?: string; createdAt: any; updatedAt: any; }
interface OldCommunicationLog { id: string; clientId: string; date: any; type: string; direction: string; summary?: string; followUpDate?: any; followUpCompleted?: boolean; notes?: string; createdAt: any; updatedAt: any; }
interface OldExternalStud { id: string; name: string; breed: string; registrationNumber?: string; ownerName?: string; ownerPhone?: string; ownerEmail?: string; notes?: string; createdAt: any; updatedAt: any; }
interface OldGeneticTest { id: string; dogId: string; testType: string; result: string; labName?: string; testDate?: any; certificatePath?: string; notes?: string; createdAt: any; updatedAt: any; }
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Convert a value to SQLite date string
 */
function toSqlDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return dateToSql(value);
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : dateToSql(d);
  }
  return null;
}

/**
 * Check if localStorage has data to migrate
 */
export function hasLocalStorageData(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const parsed = JSON.parse(stored) as OldDatabase;
    // Check if there's any actual data
    return (
      parsed.dogs?.length > 0 ||
      parsed.litters?.length > 0 ||
      parsed.clients?.length > 0 ||
      parsed.sales?.length > 0
    );
  } catch {
    return false;
  }
}

/**
 * Get the localStorage data
 */
function getLocalStorageData(): OldDatabase | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as OldDatabase;
  } catch {
    return null;
  }
}

/**
 * Clear localStorage after successful migration
 */
export function clearLocalStorageData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Migrate all data from localStorage to SQLite
 */
export async function migrateFromLocalStorage(
  onProgress?: (stage: string, current: number, total: number) => void
): Promise<{ success: boolean; error?: string; migrated: Record<string, number> }> {
  const reportProgress = (stage: string, current: number, total: number) => {
    if (onProgress) {
      onProgress(stage, current, total);
    }
  };
  // Check if there's data to migrate
  if (!hasLocalStorageData()) {
    return { success: true, migrated: {} };
  }
  
  // Check if SQLite already has data
  const dbEmpty = await isDatabaseEmpty();
  if (!dbEmpty) {
    console.log('[Migration] SQLite database already has data, skipping migration');
    return { success: true, migrated: {} };
  }
  
  const data = getLocalStorageData();
  if (!data) {
    return { success: false, error: 'Failed to read localStorage data', migrated: {} };
  }
  
  const migrated: Record<string, number> = {};
  
  try {
    console.log('[Migration] Starting migration from localStorage to SQLite...');
    
    // Migrate in dependency order
    
    // 1. Dogs (no dependencies)
    const dogs = data.dogs ?? [];
    reportProgress('dogs', 0, dogs.length);
    for (let i = 0; i < dogs.length; i++) {
      const dog = dogs[i];
      reportProgress('dogs', i + 1, dogs.length);
      await execute(
        `INSERT INTO dogs (id, name, sex, breed, registration_number, date_of_birth, color, microchip_number, status, profile_photo_path, notes, sire_id, dam_id, litter_id, evaluation_category, structure_notes, temperament_notes, registration_status, registration_type, registry_name, registration_deadline, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [dog.id, dog.name, dog.sex, dog.breed, dog.registrationNumber ?? null, toSqlDate(dog.dateOfBirth), dog.color ?? null, dog.microchipNumber ?? null, dog.status, dog.profilePhotoPath ?? null, dog.notes ?? null, dog.sireId ?? null, dog.damId ?? null, dog.litterId ?? null, dog.evaluationCategory ?? null, dog.structureNotes ?? null, dog.temperamentNotes ?? null, dog.registrationStatus ?? null, dog.registrationType ?? null, dog.registryName ?? null, toSqlDate(dog.registrationDeadline), toSqlDate(dog.createdAt), toSqlDate(dog.updatedAt)]
      );
    }
    migrated.dogs = data.dogs?.length ?? 0;
    
    // 2. Litters (depends on dogs for sire/dam)
    const litters = data.litters ?? [];
    reportProgress('litters', 0, litters.length);
    for (let i = 0; i < litters.length; i++) {
      const litter = litters[i];
      reportProgress('litters', i + 1, litters.length);
      await execute(
        `INSERT INTO litters (id, code, nickname, breeding_date, due_date, whelp_date, total_born, total_alive, notes, sire_id, dam_id, status, ultrasound_date, ultrasound_result, xray_date, xray_puppy_count, whelping_checklist_state, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [litter.id, litter.code, litter.nickname ?? null, toSqlDate(litter.breedingDate), toSqlDate(litter.dueDate), toSqlDate(litter.whelpDate), litter.totalBorn ?? null, litter.totalAlive ?? null, litter.notes ?? null, litter.sireId ?? null, litter.damId ?? null, litter.status ?? null, toSqlDate(litter.ultrasoundDate), litter.ultrasoundResult ?? null, toSqlDate(litter.xrayDate), litter.xrayPuppyCount ?? null, litter.whelpingChecklistState ?? null, toSqlDate(litter.createdAt), toSqlDate(litter.updatedAt)]
      );
    }
    migrated.litters = data.litters?.length ?? 0;
    
    // 3. Heat cycles
    const heatCycles = data.heatCycles ?? [];
    reportProgress('heatCycles', 0, heatCycles.length);
    for (let i = 0; i < heatCycles.length; i++) {
      const cycle = heatCycles[i];
      reportProgress('heatCycles', i + 1, heatCycles.length);
      await execute(
        `INSERT INTO heat_cycles (id, bitch_id, start_date, standing_heat_start, standing_heat_end, ovulation_date, optimal_breeding_start, optimal_breeding_end, end_date, expected_due_date, next_heat_estimate, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [cycle.id, cycle.bitchId, toSqlDate(cycle.startDate), toSqlDate(cycle.standingHeatStart), toSqlDate(cycle.standingHeatEnd), toSqlDate(cycle.ovulationDate), toSqlDate(cycle.optimalBreedingStart), toSqlDate(cycle.optimalBreedingEnd), toSqlDate(cycle.endDate), toSqlDate(cycle.expectedDueDate), toSqlDate(cycle.nextHeatEstimate), cycle.notes ?? null, toSqlDate(cycle.createdAt), toSqlDate(cycle.updatedAt)]
      );
    }
    migrated.heatCycles = data.heatCycles?.length ?? 0;
    
    // 4. Heat events
    for (const event of data.heatEvents ?? []) {
      await execute(
        `INSERT INTO heat_events (id, heat_cycle_id, date, type, value, sire_id, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [event.id, event.heatCycleId, toSqlDate(event.date), event.type, event.value ?? null, event.sireId ?? null, event.notes ?? null, toSqlDate(event.createdAt)]
      );
    }
    migrated.heatEvents = data.heatEvents?.length ?? 0;
    
    // 5. Vaccinations
    for (const vax of data.vaccinations ?? []) {
      await execute(
        `INSERT INTO vaccination_records (id, dog_id, date, vaccine_type, dose, lot_number, vet_clinic, next_due_date, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [vax.id, vax.dogId, toSqlDate(vax.date), vax.vaccineType, vax.dose ?? null, vax.lotNumber ?? null, vax.vetClinic ?? null, toSqlDate(vax.nextDueDate), vax.notes ?? null, toSqlDate(vax.createdAt), toSqlDate(vax.updatedAt)]
      );
    }
    migrated.vaccinations = data.vaccinations?.length ?? 0;
    
    // 6. Weight entries
    for (const entry of data.weightEntries ?? []) {
      await execute(
        `INSERT INTO weight_entries (id, dog_id, date, weight_lbs, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [entry.id, entry.dogId, toSqlDate(entry.date), entry.weightLbs, entry.notes ?? null, toSqlDate(entry.createdAt)]
      );
    }
    migrated.weightEntries = data.weightEntries?.length ?? 0;
    
    // 7. Medical records
    for (const record of data.medicalRecords ?? []) {
      await execute(
        `INSERT INTO medical_records (id, dog_id, date, type, description, vet_clinic, attachment_path, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [record.id, record.dogId, toSqlDate(record.date), record.type, record.description, record.vetClinic ?? null, record.attachmentPath ?? null, record.notes ?? null, toSqlDate(record.createdAt), toSqlDate(record.updatedAt)]
      );
    }
    migrated.medicalRecords = data.medicalRecords?.length ?? 0;
    
    // 8. Genetic tests
    for (const test of data.geneticTests ?? []) {
      await execute(
        `INSERT INTO genetic_tests (id, dog_id, test_date, test_type, result, lab_name, certificate_path, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [test.id, test.dogId, toSqlDate(test.testDate), test.testType, test.result, test.labName ?? null, test.certificatePath ?? null, test.notes ?? null, toSqlDate(test.createdAt), toSqlDate(test.updatedAt)]
      );
    }
    migrated.geneticTests = data.geneticTests?.length ?? 0;
    
    // 9. Clients
    for (const client of data.clients ?? []) {
      await execute(
        `INSERT INTO clients (id, name, phone, email, address_line1, address_line2, city, state, postal_code, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [client.id, client.name, client.phone ?? null, client.email ?? null, client.addressLine1 ?? null, client.addressLine2 ?? null, client.city ?? null, client.state ?? null, client.postalCode ?? null, client.notes ?? null, toSqlDate(client.createdAt), toSqlDate(client.updatedAt)]
      );
    }
    migrated.clients = data.clients?.length ?? 0;
    
    // 10. Expenses (before transports due to FK)
    for (const expense of data.expenses ?? []) {
      await execute(
        `INSERT INTO expenses (id, date, amount, category, vendor_name, description, payment_method, is_tax_deductible, receipt_path, related_dog_id, related_litter_id, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [expense.id, toSqlDate(expense.date), expense.amount, expense.category, expense.vendorName ?? null, expense.description ?? null, expense.paymentMethod ?? null, boolToSql(expense.isTaxDeductible ?? false), expense.receiptPath ?? null, expense.relatedDogId ?? null, expense.relatedLitterId ?? null, expense.notes ?? null, toSqlDate(expense.createdAt), toSqlDate(expense.updatedAt)]
      );
    }
    migrated.expenses = data.expenses?.length ?? 0;
    
    // 11. Transports
    for (const transport of data.transports ?? []) {
      await execute(
        `INSERT INTO transports (id, dog_id, date, mode, shipper_business_name, contact_name, phone, email, origin_city, origin_state, destination_city, destination_state, tracking_number, cost, expense_id, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [transport.id, transport.dogId, toSqlDate(transport.date), transport.mode, transport.shipperBusinessName ?? null, transport.contactName ?? null, transport.phone ?? null, transport.email ?? null, transport.originCity ?? null, transport.originState ?? null, transport.destinationCity ?? null, transport.destinationState ?? null, transport.trackingNumber ?? null, transport.cost ?? null, transport.expenseId ?? null, transport.notes ?? null, toSqlDate(transport.createdAt), toSqlDate(transport.updatedAt)]
      );
    }
    migrated.transports = data.transports?.length ?? 0;
    
    // 12. Sales
    for (const sale of data.sales ?? []) {
      await execute(
        `INSERT INTO sales (id, client_id, sale_date, price, deposit_amount, deposit_date, contract_path, shipped_date, received_date, is_local_pickup, payment_status, warranty_info, registration_transfer_date, transport_id, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [sale.id, sale.clientId, toSqlDate(sale.saleDate), sale.price, sale.depositAmount ?? null, toSqlDate(sale.depositDate), sale.contractPath ?? null, toSqlDate(sale.shippedDate), toSqlDate(sale.receivedDate), boolToSql(sale.isLocalPickup ?? false), sale.paymentStatus ?? 'deposit_only', sale.warrantyInfo ?? null, toSqlDate(sale.registrationTransferDate), sale.transportId ?? null, sale.notes ?? null, toSqlDate(sale.createdAt), toSqlDate(sale.updatedAt)]
      );
    }
    migrated.sales = data.sales?.length ?? 0;
    
    // 13. Sale puppies
    for (const sp of data.salePuppies ?? []) {
      await execute(
        `INSERT INTO sale_puppies (id, sale_id, dog_id, price, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [sp.id, sp.saleId, sp.dogId, sp.price, toSqlDate(sp.createdAt)]
      );
    }
    migrated.salePuppies = data.salePuppies?.length ?? 0;
    
    // 14. Client interests
    for (const interest of data.clientInterests ?? []) {
      await execute(
        `INSERT INTO client_interests (id, client_id, dog_id, interest_date, contact_method, status, converted_to_sale_id, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [interest.id, interest.clientId, interest.dogId, toSqlDate(interest.interestDate), interest.contactMethod, interest.status, interest.convertedToSaleId ?? null, interest.notes ?? null, toSqlDate(interest.createdAt), toSqlDate(interest.updatedAt)]
      );
    }
    migrated.clientInterests = data.clientInterests?.length ?? 0;
    
    // 15. Waitlist entries
    for (const entry of data.waitlistEntries ?? []) {
      await execute(
        `INSERT INTO waitlist_entries (id, client_id, litter_id, position, sex_preference, color_preference, deposit_amount, deposit_date, status, matched_puppy_id, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [entry.id, entry.clientId, entry.litterId ?? null, entry.position, entry.preference ?? null, entry.colorPreference ?? null, entry.depositAmount ?? null, toSqlDate(entry.depositDate), entry.status, entry.assignedPuppyId ?? null, entry.notes ?? null, toSqlDate(entry.createdAt), toSqlDate(entry.updatedAt)]
      );
    }
    migrated.waitlistEntries = data.waitlistEntries?.length ?? 0;
    
    // 16. Communication logs
    for (const log of data.communicationLogs ?? []) {
      await execute(
        `INSERT INTO communication_logs (id, client_id, date, type, direction, subject, follow_up_date, follow_up_completed, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [log.id, log.clientId, toSqlDate(log.date), log.type, log.direction, log.summary ?? null, toSqlDate(log.followUpDate), boolToSql(log.followUpCompleted ?? false), log.notes ?? null, toSqlDate(log.createdAt), toSqlDate(log.updatedAt)]
      );
    }
    migrated.communicationLogs = data.communicationLogs?.length ?? 0;
    
    // 17. Pedigree entries
    for (const entry of data.pedigreeEntries ?? []) {
      await execute(
        `INSERT INTO pedigree_entries (id, dog_id, generation, position, ancestor_name, ancestor_registration, ancestor_color, ancestor_breed, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [entry.id, entry.dogId, entry.generation, entry.position, entry.ancestorName, entry.ancestorRegistration ?? null, entry.ancestorColor ?? null, entry.ancestorBreed ?? null, entry.notes ?? null, toSqlDate(entry.createdAt)]
      );
    }
    migrated.pedigreeEntries = data.pedigreeEntries?.length ?? 0;
    
    // 18. Dog photos
    for (const photo of data.dogPhotos ?? []) {
      await execute(
        `INSERT INTO dog_photos (id, dog_id, file_path, caption, is_primary, uploaded_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [photo.id, photo.dogId, photo.filePath, photo.caption ?? null, boolToSql(photo.isPrimary ?? false), toSqlDate(photo.uploadedAt)]
      );
    }
    migrated.dogPhotos = data.dogPhotos?.length ?? 0;
    
    // 19. Litter photos
    for (const photo of data.litterPhotos ?? []) {
      await execute(
        `INSERT INTO litter_photos (id, litter_id, file_path, caption, sort_order, uploaded_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [photo.id, photo.litterId, photo.filePath, photo.caption ?? null, photo.sortOrder, toSqlDate(photo.uploadedAt)]
      );
    }
    migrated.litterPhotos = data.litterPhotos?.length ?? 0;
    
    // 20. Settings
    for (const setting of data.settings ?? []) {
      await execute(
        `INSERT INTO settings (id, key, value, updated_at)
         VALUES (?, ?, ?, ?)`,
        [setting.id, setting.key, setting.value, toSqlDate(setting.updatedAt)]
      );
    }
    migrated.settings = data.settings?.length ?? 0;
    
    // 21. Puppy health tasks
    for (const task of data.puppyHealthTasks ?? []) {
      await execute(
        `INSERT INTO puppy_health_tasks (id, litter_id, puppy_id, task_type, due_date, completed_date, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [task.id, task.litterId, task.puppyId ?? null, task.taskType, toSqlDate(task.dueDate), toSqlDate(task.completedDate), task.notes ?? null, toSqlDate(task.createdAt), toSqlDate(task.updatedAt)]
      );
    }
    migrated.puppyHealthTasks = data.puppyHealthTasks?.length ?? 0;
    
    // 22. Health schedule templates
    for (const template of data.healthScheduleTemplates ?? []) {
      await execute(
        `INSERT INTO health_schedule_templates (id, name, is_default, items, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [template.id, template.name, boolToSql(template.isDefault ?? false), typeof template.items === 'string' ? template.items : JSON.stringify(template.items), toSqlDate(template.createdAt), toSqlDate(template.updatedAt)]
      );
    }
    migrated.healthScheduleTemplates = data.healthScheduleTemplates?.length ?? 0;
    
    // 23. External studs
    for (const stud of data.externalStuds ?? []) {
      await execute(
        `INSERT INTO external_studs (id, name, breed, registration_number, owner_name, owner_phone, owner_email, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [stud.id, stud.name, stud.breed, stud.registrationNumber ?? null, stud.ownerName ?? null, stud.ownerPhone ?? null, stud.ownerEmail ?? null, stud.notes ?? null, toSqlDate(stud.createdAt), toSqlDate(stud.updatedAt)]
      );
    }
    migrated.externalStuds = data.externalStuds?.length ?? 0;
    
    console.log('[Migration] Migration completed successfully:', migrated);
    return { success: true, migrated };
    
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      migrated 
    };
  }
}


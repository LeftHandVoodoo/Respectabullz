// Database client wrapper for Prisma
// This module handles database initialization and provides typed access

import type {
  Dog,
  Litter,
  HeatCycle,
  HeatEvent,
  VaccinationRecord,
  WeightEntry,
  MedicalRecord,
  MedicalRecordType,
  Transport,
  Expense,
  Client,
  Sale,
  SalePuppy,
  ClientInterest,
  PedigreeEntry,
  DogPhoto,
  LitterPhoto,
  Setting,
  PuppyHealthTask,
  HealthScheduleTemplate,
  HealthScheduleTemplateItem,
  WaitlistEntry,
  CommunicationLog,
  ExternalStud,
  HeatCyclePrediction,
  GeneticTest,
  MatingCompatibilityResult,
  MatingWarning,
  ActivityItem,
  CreateGeneticTestInput,
  UpdateGeneticTestInput,
  CreateDogInput,
  UpdateDogInput,
  CreateLitterInput,
  UpdateLitterInput,
  CreateLitterPhotoInput,
  UpdateLitterPhotoInput,
  CreateClientInput,
  UpdateClientInput,
  CreateExpenseInput,
  UpdateExpenseInput,
  CreateTransportInput,
  UpdateTransportInput,
  CreateSaleInput,
  UpdateSaleInput,
  CreateClientInterestInput,
  UpdateClientInterestInput,
  CreatePuppyHealthTaskInput,
  UpdatePuppyHealthTaskInput,
  CreateWaitlistEntryInput,
  UpdateWaitlistEntryInput,
  CreateCommunicationLogInput,
  UpdateCommunicationLogInput,
  CreateExternalStudInput,
  UpdateExternalStudInput,
  DashboardStats,
  PacketData,
  BreederSettings,
} from '@/types';

// Since we're in a Tauri environment, we'll use a mock database
// that stores data in localStorage for development, with the real
// Prisma client used in production with proper IPC

const STORAGE_KEY = 'respectabullz_db';

interface Database {
  dogs: Dog[];
  litters: Litter[];
  heatCycles: HeatCycle[];
  heatEvents: HeatEvent[];
  vaccinations: VaccinationRecord[];
  weightEntries: WeightEntry[];
  medicalRecords: MedicalRecord[];
  transports: Transport[];
  expenses: Expense[];
  clients: Client[];
  sales: Sale[];
  salePuppies: SalePuppy[];
  clientInterests: ClientInterest[];
  pedigreeEntries: PedigreeEntry[];
  dogPhotos: DogPhoto[];
  litterPhotos: LitterPhoto[];
  settings: Setting[];
  puppyHealthTasks: PuppyHealthTask[];
  healthScheduleTemplates: HealthScheduleTemplate[];
  waitlistEntries: WaitlistEntry[];
  communicationLogs: CommunicationLog[];
  externalStuds: ExternalStud[];
  geneticTests: GeneticTest[];
}

const emptyDb: Database = {
  dogs: [],
  litters: [],
  heatCycles: [],
  heatEvents: [],
  vaccinations: [],
  weightEntries: [],
  medicalRecords: [],
  transports: [],
  expenses: [],
  clients: [],
  sales: [],
  salePuppies: [],
  clientInterests: [],
  pedigreeEntries: [],
  dogPhotos: [],
  litterPhotos: [],
  settings: [],
  puppyHealthTasks: [],
  healthScheduleTemplates: [],
  waitlistEntries: [],
  communicationLogs: [],
  externalStuds: [],
  geneticTests: [],
};

// Helper to generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Load database from localStorage
function loadDb(): Database {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // Migration: Convert old sales with dogId to new SalePuppy structure
      let needsMigration = false;
      const migratedSalePuppies: SalePuppy[] = parsed.salePuppies || [];
      
      if (parsed.sales && parsed.sales.length > 0) {
        for (const sale of parsed.sales) {
          // Check if this sale has the old dogId field and no corresponding SalePuppy
          if (sale.dogId && !migratedSalePuppies.some((sp: SalePuppy) => sp.saleId === sale.id && sp.dogId === sale.dogId)) {
            // Create a SalePuppy entry for this old sale
            migratedSalePuppies.push({
              id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              saleId: sale.id,
              dogId: sale.dogId,
              price: sale.price,
              createdAt: sale.createdAt || new Date().toISOString(),
            });
            needsMigration = true;
          }
        }
      }
      
      // Convert date strings back to Date objects
      const db: Database = {
        ...emptyDb,
        ...parsed,
        dogs: (parsed.dogs || []).map((d: Dog) => ({
          ...d,
          dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : null,
          registrationDeadline: d.registrationDeadline ? new Date(d.registrationDeadline) : null,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt),
        })),
        litters: (parsed.litters || []).map((l: Litter) => ({
          ...l,
          breedingDate: l.breedingDate ? new Date(l.breedingDate) : null,
          dueDate: l.dueDate ? new Date(l.dueDate) : null,
          whelpDate: l.whelpDate ? new Date(l.whelpDate) : null,
          ultrasoundDate: l.ultrasoundDate ? new Date(l.ultrasoundDate) : null,
          xrayDate: l.xrayDate ? new Date(l.xrayDate) : null,
          createdAt: new Date(l.createdAt),
          updatedAt: new Date(l.updatedAt),
        })),
        heatCycles: (parsed.heatCycles || []).map((h: HeatCycle) => ({
          ...h,
          startDate: new Date(h.startDate),
          standingHeatStart: h.standingHeatStart ? new Date(h.standingHeatStart) : null,
          standingHeatEnd: h.standingHeatEnd ? new Date(h.standingHeatEnd) : null,
          ovulationDate: h.ovulationDate ? new Date(h.ovulationDate) : null,
          optimalBreedingStart: h.optimalBreedingStart ? new Date(h.optimalBreedingStart) : null,
          optimalBreedingEnd: h.optimalBreedingEnd ? new Date(h.optimalBreedingEnd) : null,
          endDate: h.endDate ? new Date(h.endDate) : null,
          expectedDueDate: h.expectedDueDate ? new Date(h.expectedDueDate) : null,
          nextHeatEstimate: h.nextHeatEstimate ? new Date(h.nextHeatEstimate) : null,
          createdAt: new Date(h.createdAt),
          updatedAt: new Date(h.updatedAt),
        })),
        heatEvents: (parsed.heatEvents || []).map((e: HeatEvent) => ({
          ...e,
          date: new Date(e.date),
          createdAt: new Date(e.createdAt),
        })),
        vaccinations: (parsed.vaccinations || []).map((v: VaccinationRecord) => ({
          ...v,
          date: new Date(v.date),
          nextDueDate: v.nextDueDate ? new Date(v.nextDueDate) : null,
          createdAt: new Date(v.createdAt),
          updatedAt: new Date(v.updatedAt),
        })),
        weightEntries: (parsed.weightEntries || []).map((w: WeightEntry) => ({
          ...w,
          date: new Date(w.date),
          createdAt: new Date(w.createdAt),
        })),
        medicalRecords: (parsed.medicalRecords || []).map((m: MedicalRecord) => ({
          ...m,
          date: new Date(m.date),
          createdAt: new Date(m.createdAt),
          updatedAt: new Date(m.updatedAt),
        })),
        transports: (parsed.transports || []).map((t: Transport) => ({
          ...t,
          date: new Date(t.date),
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
        })),
        expenses: (parsed.expenses || []).map((e: Expense | { date: string | Date; createdAt: string | Date; updatedAt: string | Date; [key: string]: unknown }) => {
          // Parse date properly to avoid timezone issues
          let expenseDate: Date;
          const dateValue = e.date;
          if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            // Handle YYYY-MM-DD format manually to avoid timezone issues
            const [year, month, day] = dateValue.split('-').map(Number);
            expenseDate = new Date(year, month - 1, day);
          } else {
            expenseDate = new Date(dateValue);
          }
          return {
            ...e,
            date: expenseDate,
            createdAt: new Date(e.createdAt),
            updatedAt: new Date(e.updatedAt),
          };
        }),
        clients: (parsed.clients || []).map((c: Client) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        })),
        sales: (parsed.sales || []).map((s: Sale) => ({
          ...s,
          saleDate: new Date(s.saleDate),
          depositDate: s.depositDate ? new Date(s.depositDate) : null,
          shippedDate: s.shippedDate ? new Date(s.shippedDate) : null,
          receivedDate: s.receivedDate ? new Date(s.receivedDate) : null,
          registrationTransferDate: s.registrationTransferDate ? new Date(s.registrationTransferDate) : null,
          isLocalPickup: s.isLocalPickup ?? false,
          paymentStatus: s.paymentStatus ?? 'deposit_only',
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        })),
        salePuppies: migratedSalePuppies.map((sp: SalePuppy) => ({
          ...sp,
          createdAt: new Date(sp.createdAt),
        })),
        clientInterests: (parsed.clientInterests || []).map((ci: ClientInterest) => ({
          ...ci,
          interestDate: new Date(ci.interestDate),
          createdAt: new Date(ci.createdAt),
          updatedAt: new Date(ci.updatedAt),
        })),
        puppyHealthTasks: (parsed.puppyHealthTasks || []).map((t: PuppyHealthTask) => ({
          ...t,
          dueDate: new Date(t.dueDate),
          completedDate: t.completedDate ? new Date(t.completedDate) : null,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
        })),
        healthScheduleTemplates: (parsed.healthScheduleTemplates || []).map((t: HealthScheduleTemplate) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
        })),
        waitlistEntries: (parsed.waitlistEntries || []).map((w: WaitlistEntry) => ({
          ...w,
          depositDate: w.depositDate ? new Date(w.depositDate) : null,
          createdAt: new Date(w.createdAt),
          updatedAt: new Date(w.updatedAt),
        })),
        communicationLogs: (parsed.communicationLogs || []).map((c: CommunicationLog) => ({
          ...c,
          date: new Date(c.date),
          followUpDate: c.followUpDate ? new Date(c.followUpDate) : null,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        })),
        externalStuds: (parsed.externalStuds || []).map((s: ExternalStud) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        })),
        geneticTests: (parsed.geneticTests || []).map((g: GeneticTest) => ({
          ...g,
          testDate: g.testDate ? new Date(g.testDate) : null,
          createdAt: new Date(g.createdAt),
          updatedAt: new Date(g.updatedAt),
        })),
      };
      
      // Save migrated data if migration occurred
      if (needsMigration) {
        saveDb(db);
        console.log('Database migration: Converted old sales to SalePuppy structure');
      }
      
      return db;
    }
  } catch (error) {
    console.error('Failed to load database:', error);
  }
  return emptyDb;
}

// Save database to localStorage
function saveDb(db: Database): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (error) {
    console.error('Failed to save database:', error);
  }
}

// ============================================
// DOG OPERATIONS
// ============================================

export async function getDogs(): Promise<Dog[]> {
  const db = loadDb();
  return db.dogs;
}

export async function getDog(id: string): Promise<Dog | null> {
  const db = loadDb();
  const dog = db.dogs.find(d => d.id === id);
  if (!dog) return null;
  
  // Populate relations
  return {
    ...dog,
    sire: dog.sireId ? db.dogs.find(d => d.id === dog.sireId) || null : null,
    dam: dog.damId ? db.dogs.find(d => d.id === dog.damId) || null : null,
    birthLitter: dog.litterId ? db.litters.find(l => l.id === dog.litterId) || null : null,
    vaccinations: db.vaccinations.filter(v => v.dogId === id),
    weightEntries: db.weightEntries.filter(w => w.dogId === id),
    medicalRecords: db.medicalRecords.filter(m => m.dogId === id),
    heatCycles: db.heatCycles.filter(h => h.bitchId === id),
    transports: db.transports.filter(t => t.dogId === id),
    photos: db.dogPhotos.filter(p => p.dogId === id),
    geneticTests: db.geneticTests.filter(g => g.dogId === id),
  };
}

export async function createDog(input: CreateDogInput): Promise<Dog> {
  const db = loadDb();
  const now = new Date();
  const dog: Dog = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  db.dogs.push(dog);
  saveDb(db);
  return dog;
}

export async function updateDog(id: string, input: UpdateDogInput): Promise<Dog | null> {
  const db = loadDb();
  const index = db.dogs.findIndex(d => d.id === id);
  if (index === -1) return null;
  
  db.dogs[index] = {
    ...db.dogs[index],
    ...input,
    updatedAt: new Date(),
  };
  saveDb(db);
  return db.dogs[index];
}

export async function deleteDog(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.dogs.findIndex(d => d.id === id);
  if (index === -1) return false;
  
  db.dogs.splice(index, 1);
  // Clean up related records
  db.vaccinations = db.vaccinations.filter(v => v.dogId !== id);
  db.weightEntries = db.weightEntries.filter(w => w.dogId !== id);
  db.medicalRecords = db.medicalRecords.filter(m => m.dogId !== id);
  db.heatCycles = db.heatCycles.filter(h => h.bitchId !== id);
  db.transports = db.transports.filter(t => t.dogId !== id);
  db.dogPhotos = db.dogPhotos.filter(p => p.dogId !== id);
  
  saveDb(db);
  return true;
}

// ============================================
// LITTER OPERATIONS
// ============================================

export async function getLitters(): Promise<Litter[]> {
  const db = loadDb();
  return db.litters.map(l => ({
    ...l,
    sire: l.sireId ? db.dogs.find(d => d.id === l.sireId) || null : null,
    dam: l.damId ? db.dogs.find(d => d.id === l.damId) || null : null,
    puppies: db.dogs.filter(d => d.litterId === l.id),
  }));
}

export async function getLitter(id: string): Promise<Litter | null> {
  const db = loadDb();
  const litter = db.litters.find(l => l.id === id);
  if (!litter) return null;
  
  return {
    ...litter,
    sire: litter.sireId ? db.dogs.find(d => d.id === litter.sireId) || null : null,
    dam: litter.damId ? db.dogs.find(d => d.id === litter.damId) || null : null,
    puppies: db.dogs.filter(d => d.litterId === id),
    expenses: db.expenses.filter(e => e.relatedLitterId === id),
    photos: db.litterPhotos.filter(p => p.litterId === id).sort((a, b) => a.sortOrder - b.sortOrder),
    healthTasks: db.puppyHealthTasks.filter(t => t.litterId === id),
  };
}

export async function createLitter(input: CreateLitterInput): Promise<Litter> {
  const db = loadDb();
  const now = new Date();
  const litter: Litter = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  db.litters.push(litter);
  saveDb(db);
  return litter;
}

export async function updateLitter(id: string, input: UpdateLitterInput): Promise<Litter | null> {
  const db = loadDb();
  const index = db.litters.findIndex(l => l.id === id);
  if (index === -1) return null;
  
  db.litters[index] = {
    ...db.litters[index],
    ...input,
    updatedAt: new Date(),
  };
  saveDb(db);
  return db.litters[index];
}

export async function deleteLitter(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.litters.findIndex(l => l.id === id);
  if (index === -1) return false;
  
  db.litters.splice(index, 1);
  // Update dogs that were in this litter
  db.dogs = db.dogs.map(d => d.litterId === id ? { ...d, litterId: null } : d);
  // Delete associated litter photos
  db.litterPhotos = db.litterPhotos.filter(p => p.litterId !== id);
  
  saveDb(db);
  return true;
}

// ============================================
// VACCINATION OPERATIONS
// ============================================

export async function getVaccinations(dogId?: string): Promise<VaccinationRecord[]> {
  const db = loadDb();
  const vaccinations = dogId 
    ? db.vaccinations.filter(v => v.dogId === dogId)
    : db.vaccinations;
  
  // Include dog relation
  return vaccinations.map(v => {
    const dog = db.dogs.find(d => d.id === v.dogId);
    return {
      ...v,
      dog: dog || undefined,
    };
  });
}

export async function createVaccination(input: Omit<VaccinationRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<VaccinationRecord> {
  const db = loadDb();
  const now = new Date();
  const vaccination: VaccinationRecord = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  db.vaccinations.push(vaccination);
  saveDb(db);
  return vaccination;
}

export async function updateVaccination(id: string, input: Partial<VaccinationRecord>): Promise<VaccinationRecord | null> {
  const db = loadDb();
  const index = db.vaccinations.findIndex(v => v.id === id);
  if (index === -1) return null;
  
  db.vaccinations[index] = {
    ...db.vaccinations[index],
    ...input,
    updatedAt: new Date(),
  };
  saveDb(db);
  return db.vaccinations[index];
}

export async function deleteVaccination(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.vaccinations.findIndex(v => v.id === id);
  if (index === -1) return false;
  
  db.vaccinations.splice(index, 1);
  saveDb(db);
  return true;
}

// ============================================
// WEIGHT OPERATIONS
// ============================================

export async function getWeightEntries(dogId?: string): Promise<WeightEntry[]> {
  const db = loadDb();
  if (dogId) {
    return db.weightEntries.filter(w => w.dogId === dogId).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }
  return db.weightEntries;
}

export async function createWeightEntry(input: Omit<WeightEntry, 'id' | 'createdAt'>): Promise<WeightEntry> {
  const db = loadDb();
  const weightEntry: WeightEntry = {
    ...input,
    id: generateId(),
    createdAt: new Date(),
  };
  db.weightEntries.push(weightEntry);
  saveDb(db);
  return weightEntry;
}

export async function updateWeightEntry(id: string, input: Partial<WeightEntry>): Promise<WeightEntry | null> {
  const db = loadDb();
  const index = db.weightEntries.findIndex(w => w.id === id);
  if (index === -1) return null;
  
  db.weightEntries[index] = {
    ...db.weightEntries[index],
    ...input,
  };
  saveDb(db);
  return db.weightEntries[index];
}

export async function deleteWeightEntry(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.weightEntries.findIndex(w => w.id === id);
  if (index === -1) return false;
  
  db.weightEntries.splice(index, 1);
  saveDb(db);
  return true;
}

// ============================================
// MEDICAL RECORD OPERATIONS
// ============================================

export async function getMedicalRecords(dogId?: string): Promise<MedicalRecord[]> {
  const db = loadDb();
  if (dogId) {
    return db.medicalRecords.filter(m => m.dogId === dogId);
  }
  return db.medicalRecords;
}

export async function createMedicalRecord(input: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicalRecord> {
  const db = loadDb();
  const now = new Date();
  const record: MedicalRecord = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  db.medicalRecords.push(record);
  saveDb(db);
  return record;
}

export async function updateMedicalRecord(id: string, input: Partial<MedicalRecord>): Promise<MedicalRecord | null> {
  const db = loadDb();
  const index = db.medicalRecords.findIndex(m => m.id === id);
  if (index === -1) return null;
  
  db.medicalRecords[index] = {
    ...db.medicalRecords[index],
    ...input,
    updatedAt: new Date(),
  };
  saveDb(db);
  return db.medicalRecords[index];
}

export async function deleteMedicalRecord(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.medicalRecords.findIndex(m => m.id === id);
  if (index === -1) return false;
  
  db.medicalRecords.splice(index, 1);
  saveDb(db);
  return true;
}

// ============================================
// HEAT CYCLE OPERATIONS
// ============================================

export async function getHeatCycles(bitchId?: string): Promise<HeatCycle[]> {
  const db = loadDb();
  const cycles = bitchId 
    ? db.heatCycles.filter(h => h.bitchId === bitchId)
    : db.heatCycles;
  
  return cycles.map(c => ({
    ...c,
    bitch: db.dogs.find(d => d.id === c.bitchId),
    events: db.heatEvents.filter(e => e.heatCycleId === c.id),
  }));
}

export async function createHeatCycle(input: Omit<HeatCycle, 'id' | 'createdAt' | 'updatedAt' | 'bitch' | 'events'>): Promise<HeatCycle> {
  const db = loadDb();
  const now = new Date();
  const cycle: HeatCycle = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  db.heatCycles.push(cycle);
  saveDb(db);
  return cycle;
}

export async function updateHeatCycle(id: string, input: Partial<HeatCycle>): Promise<HeatCycle | null> {
  const db = loadDb();
  const index = db.heatCycles.findIndex(h => h.id === id);
  if (index === -1) return null;
  
  db.heatCycles[index] = {
    ...db.heatCycles[index],
    ...input,
    updatedAt: new Date(),
  };
  saveDb(db);
  return db.heatCycles[index];
}

export async function deleteHeatCycle(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.heatCycles.findIndex(h => h.id === id);
  if (index === -1) return false;
  
  db.heatCycles.splice(index, 1);
  db.heatEvents = db.heatEvents.filter(e => e.heatCycleId !== id);
  saveDb(db);
  return true;
}

export async function getHeatCycle(id: string): Promise<HeatCycle | null> {
  const db = loadDb();
  const cycle = db.heatCycles.find(h => h.id === id);
  if (!cycle) return null;
  
  return {
    ...cycle,
    bitch: db.dogs.find(d => d.id === cycle.bitchId),
    events: db.heatEvents
      .filter(e => e.heatCycleId === id)
      .map(e => ({
        ...e,
        sire: e.sireId ? db.dogs.find(d => d.id === e.sireId) || null : null,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  };
}

// ============================================
// HEAT EVENT OPERATIONS
// ============================================

export async function getHeatEvents(heatCycleId: string): Promise<HeatEvent[]> {
  const db = loadDb();
  return db.heatEvents
    .filter(e => e.heatCycleId === heatCycleId)
    .map(e => ({
      ...e,
      sire: e.sireId ? db.dogs.find(d => d.id === e.sireId) || null : null,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function createHeatEvent(input: Omit<HeatEvent, 'id' | 'createdAt' | 'heatCycle' | 'sire'>): Promise<HeatEvent> {
  const db = loadDb();
  const now = new Date();
  const event: HeatEvent = {
    ...input,
    id: generateId(),
    createdAt: now,
  };
  db.heatEvents.push(event);
  
  // Auto-update heat cycle based on event type
  const cycleIndex = db.heatCycles.findIndex(c => c.id === input.heatCycleId);
  if (cycleIndex !== -1) {
    const cycle = db.heatCycles[cycleIndex];
    const eventDate = new Date(input.date);
    
    // Update cycle fields based on event type
    if (input.type === 'standing' && !cycle.standingHeatStart) {
      cycle.standingHeatStart = eventDate;
    }
    if (input.type === 'end_receptive' && !cycle.standingHeatEnd) {
      cycle.standingHeatEnd = eventDate;
    }
    if (input.type === 'ovulation') {
      cycle.ovulationDate = eventDate;
      // Calculate optimal breeding window (1-3 days after ovulation for best results)
      cycle.optimalBreedingStart = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000); // +1 day
      cycle.optimalBreedingEnd = new Date(eventDate.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days
      // Expected due date is 63 days from ovulation
      cycle.expectedDueDate = new Date(eventDate.getTime() + 63 * 24 * 60 * 60 * 1000);
    }
    if (input.type === 'cycle_end') {
      cycle.endDate = eventDate;
      cycle.currentPhase = 'anestrus';
      // Calculate cycle length
      if (cycle.startDate) {
        cycle.cycleLength = Math.round((eventDate.getTime() - new Date(cycle.startDate).getTime()) / (24 * 60 * 60 * 1000));
      }
      // Predict next heat (average 6-7 months, use 6.5 months = 195 days)
      cycle.nextHeatEstimate = new Date(new Date(cycle.startDate).getTime() + 195 * 24 * 60 * 60 * 1000);
    }
    if (input.type === 'breeding_natural' || input.type === 'breeding_ai' || input.type === 'breeding_surgical') {
      cycle.isBred = true;
    }
    
    // Update current phase based on timeline
    if (!cycle.endDate) {
      const daysSinceStart = Math.round((now.getTime() - new Date(cycle.startDate).getTime()) / (24 * 60 * 60 * 1000));
      if (cycle.standingHeatEnd) {
        cycle.currentPhase = 'diestrus';
      } else if (cycle.standingHeatStart) {
        cycle.currentPhase = 'estrus';
      } else if (daysSinceStart <= 9) {
        cycle.currentPhase = 'proestrus';
      } else {
        cycle.currentPhase = 'estrus';
      }
    }
    
    cycle.updatedAt = now;
    db.heatCycles[cycleIndex] = cycle;
  }
  
  saveDb(db);
  return event;
}

export async function updateHeatEvent(id: string, input: Partial<HeatEvent>): Promise<HeatEvent | null> {
  const db = loadDb();
  const index = db.heatEvents.findIndex(e => e.id === id);
  if (index === -1) return null;
  
  db.heatEvents[index] = {
    ...db.heatEvents[index],
    ...input,
  };
  saveDb(db);
  return db.heatEvents[index];
}

export async function deleteHeatEvent(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.heatEvents.findIndex(e => e.id === id);
  if (index === -1) return false;
  
  db.heatEvents.splice(index, 1);
  saveDb(db);
  return true;
}

// Helper function to calculate breeding recommendations based on progesterone
export function getBreedingRecommendation(progesteroneLevel: number): {
  phase: string;
  recommendation: string;
  daysToBreeding: string;
  ovulationStatus: string;
} {
  // Progesterone levels in ng/mL (veterinary standard)
  if (progesteroneLevel < 1.0) {
    return {
      phase: 'Proestrus (early)',
      recommendation: 'Too early for breeding. Continue monitoring.',
      daysToBreeding: '4-7 days',
      ovulationStatus: 'Not yet',
    };
  } else if (progesteroneLevel >= 1.0 && progesteroneLevel < 2.0) {
    return {
      phase: 'Proestrus (late)',
      recommendation: 'LH surge approaching. Test again in 24-48 hours.',
      daysToBreeding: '3-5 days',
      ovulationStatus: 'LH surge imminent',
    };
  } else if (progesteroneLevel >= 2.0 && progesteroneLevel < 3.0) {
    return {
      phase: 'LH Surge',
      recommendation: 'LH surge detected! Ovulation in ~48 hours.',
      daysToBreeding: '2-4 days',
      ovulationStatus: 'LH surge occurring',
    };
  } else if (progesteroneLevel >= 3.0 && progesteroneLevel < 5.0) {
    return {
      phase: 'Pre-ovulation',
      recommendation: 'Ovulation imminent or occurring. Prepare for breeding.',
      daysToBreeding: '1-3 days',
      ovulationStatus: 'Ovulating',
    };
  } else if (progesteroneLevel >= 5.0 && progesteroneLevel < 8.0) {
    return {
      phase: 'Post-ovulation (optimal)',
      recommendation: 'OPTIMAL BREEDING TIME! Breed now or within 24-48 hours.',
      daysToBreeding: 'NOW',
      ovulationStatus: 'Ovulated - eggs maturing',
    };
  } else if (progesteroneLevel >= 8.0 && progesteroneLevel < 15.0) {
    return {
      phase: 'Post-ovulation (good)',
      recommendation: 'Good breeding window. Breed within 24 hours if not already done.',
      daysToBreeding: 'NOW - urgent',
      ovulationStatus: 'Ovulated - eggs mature',
    };
  } else if (progesteroneLevel >= 15.0 && progesteroneLevel < 25.0) {
    return {
      phase: 'Late estrus',
      recommendation: 'Breeding window closing. Last chance for breeding.',
      daysToBreeding: 'Closing',
      ovulationStatus: 'Eggs aging',
    };
  } else {
    return {
      phase: 'Diestrus',
      recommendation: 'Breeding window closed. Wait for next cycle.',
      daysToBreeding: 'Passed',
      ovulationStatus: 'Eggs no longer viable',
    };
  }
}

// ============================================
// TRANSPORT OPERATIONS
// ============================================

export async function getTransports(dogId?: string): Promise<Transport[]> {
  const db = loadDb();
  const transports = dogId 
    ? db.transports.filter(t => t.dogId === dogId)
    : db.transports;
  
  return transports.map(t => ({
    ...t,
    dog: db.dogs.find(d => d.id === t.dogId),
    expense: t.expenseId ? db.expenses.find(e => e.id === t.expenseId) || null : null,
  }));
}

export async function createTransport(input: CreateTransportInput): Promise<Transport> {
  const db = loadDb();
  const now = new Date();
  
  // If cost is provided, create an expense automatically
  let expenseId: string | null = null;
  if (input.cost && input.cost > 0) {
    const expense: Expense = {
      id: generateId(),
      date: input.date,
      amount: input.cost,
      category: 'transport',
      vendorName: input.shipperBusinessName || null,
      description: `Transport: ${input.mode}${input.originCity && input.destinationCity ? ` (${input.originCity} → ${input.destinationCity})` : ''}`,
      paymentMethod: null,
      isTaxDeductible: true,
      receiptPath: null,
      notes: input.notes || null,
      relatedDogId: input.dogId || null,
      relatedLitterId: null,
      createdAt: now,
      updatedAt: now,
    };
    db.expenses.push(expense);
    expenseId = expense.id;
  }
  
  const transport: Transport = {
    ...input,
    id: generateId(),
    expenseId,
    createdAt: now,
    updatedAt: now,
  };
  db.transports.push(transport);
  saveDb(db);
  return transport;
}

export async function updateTransport(id: string, input: UpdateTransportInput): Promise<Transport | null> {
  const db = loadDb();
  const index = db.transports.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  const existingTransport = db.transports[index];
  let expenseId = existingTransport.expenseId;
  
  // If cost is provided and changed, update or create expense
  if (input.cost !== undefined && input.cost !== existingTransport.cost) {
    if (input.cost && input.cost > 0) {
      // Update existing expense or create new one
      if (expenseId) {
        const expenseIndex = db.expenses.findIndex(e => e.id === expenseId);
        if (expenseIndex !== -1) {
          db.expenses[expenseIndex] = {
            ...db.expenses[expenseIndex],
            amount: input.cost,
            date: input.date || existingTransport.date,
            vendorName: input.shipperBusinessName || existingTransport.shipperBusinessName || null,
            description: `Transport: ${input.mode || existingTransport.mode}${input.originCity && input.destinationCity ? ` (${input.originCity} → ${input.destinationCity})` : existingTransport.originCity && existingTransport.destinationCity ? ` (${existingTransport.originCity} → ${existingTransport.destinationCity})` : ''}`,
            updatedAt: new Date(),
          };
        }
      } else {
        // Create new expense
        const now = new Date();
        const expense: Expense = {
          id: generateId(),
          date: input.date || existingTransport.date,
          amount: input.cost,
          category: 'transport',
          vendorName: input.shipperBusinessName || existingTransport.shipperBusinessName || null,
          description: `Transport: ${input.mode || existingTransport.mode}${input.originCity && input.destinationCity ? ` (${input.originCity} → ${input.destinationCity})` : existingTransport.originCity && existingTransport.destinationCity ? ` (${existingTransport.originCity} → ${existingTransport.destinationCity})` : ''}`,
          paymentMethod: null,
          isTaxDeductible: true,
          receiptPath: null,
          notes: input.notes !== undefined ? input.notes : existingTransport.notes || null,
          relatedDogId: input.dogId || existingTransport.dogId || null,
          relatedLitterId: null,
          createdAt: now,
          updatedAt: now,
        };
        db.expenses.push(expense);
        expenseId = expense.id;
      }
    } else if (expenseId) {
      // Remove expense if cost is set to 0 or null
      const expenseIndex = db.expenses.findIndex(e => e.id === expenseId);
      if (expenseIndex !== -1) {
        db.expenses.splice(expenseIndex, 1);
      }
      expenseId = null;
    }
  }
  
  db.transports[index] = {
    ...db.transports[index],
    ...input,
    expenseId,
    updatedAt: new Date(),
  };
  saveDb(db);
  return db.transports[index];
}

export async function deleteTransport(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.transports.findIndex(t => t.id === id);
  if (index === -1) return false;
  
  db.transports.splice(index, 1);
  saveDb(db);
  return true;
}

// ============================================
// EXPENSE OPERATIONS
// ============================================

export async function getExpenses(filters?: { dogId?: string; litterId?: string; category?: string }): Promise<Expense[]> {
  const db = loadDb();
  let expenses = db.expenses;
  
  if (filters?.dogId) {
    expenses = expenses.filter(e => e.relatedDogId === filters.dogId);
  }
  if (filters?.litterId) {
    expenses = expenses.filter(e => e.relatedLitterId === filters.litterId);
  }
  if (filters?.category) {
    expenses = expenses.filter(e => e.category === filters.category);
  }
  
  return expenses.map(e => ({
    ...e,
    relatedDog: e.relatedDogId ? db.dogs.find(d => d.id === e.relatedDogId) || null : null,
    relatedLitter: e.relatedLitterId ? db.litters.find(l => l.id === e.relatedLitterId) || null : null,
  }));
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const db = loadDb();
  const now = new Date();
  const expense: Expense = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  db.expenses.push(expense);
  saveDb(db);
  return expense;
}

export async function updateExpense(id: string, input: UpdateExpenseInput): Promise<Expense | null> {
  const db = loadDb();
  const index = db.expenses.findIndex(e => e.id === id);
  if (index === -1) return null;
  
  db.expenses[index] = {
    ...db.expenses[index],
    ...input,
    updatedAt: new Date(),
  };
  saveDb(db);
  return db.expenses[index];
}

export async function deleteExpense(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.expenses.findIndex(e => e.id === id);
  if (index === -1) return false;
  
  db.expenses.splice(index, 1);
  saveDb(db);
  return true;
}

// ============================================
// CLIENT OPERATIONS
// ============================================

export async function getClients(): Promise<Client[]> {
  const db = loadDb();
  return db.clients.map(c => ({
    ...c,
    sales: db.sales.filter(s => s.clientId === c.id).map(s => ({
      ...s,
      puppies: db.salePuppies.filter(sp => sp.saleId === s.id).map(sp => ({
        ...sp,
        dog: db.dogs.find(d => d.id === sp.dogId),
      })),
    })),
    interests: db.clientInterests.filter(ci => ci.clientId === c.id),
  }));
}

export async function getClient(id: string): Promise<Client | null> {
  const db = loadDb();
  const client = db.clients.find(c => c.id === id);
  if (!client) return null;
  
  return {
    ...client,
    sales: db.sales.filter(s => s.clientId === id).map(s => ({
      ...s,
      puppies: db.salePuppies.filter(sp => sp.saleId === s.id).map(sp => ({
        ...sp,
        dog: db.dogs.find(d => d.id === sp.dogId),
      })),
      transport: s.transportId ? db.transports.find(t => t.id === s.transportId) || null : null,
    })),
    interests: db.clientInterests.filter(ci => ci.clientId === id).map(ci => ({
      ...ci,
      dog: db.dogs.find(d => d.id === ci.dogId),
      convertedToSale: ci.convertedToSaleId ? db.sales.find(s => s.id === ci.convertedToSaleId) || null : null,
    })),
  };
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  const db = loadDb();
  const now = new Date();
  const client: Client = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  db.clients.push(client);
  saveDb(db);
  return client;
}

export async function updateClient(id: string, input: UpdateClientInput): Promise<Client | null> {
  const db = loadDb();
  const index = db.clients.findIndex(c => c.id === id);
  if (index === -1) return null;
  
  db.clients[index] = {
    ...db.clients[index],
    ...input,
    updatedAt: new Date(),
  };
  saveDb(db);
  return db.clients[index];
}

export async function deleteClient(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.clients.findIndex(c => c.id === id);
  if (index === -1) return false;
  
  // Also delete related interests
  db.clientInterests = db.clientInterests.filter(ci => ci.clientId !== id);
  
  db.clients.splice(index, 1);
  saveDb(db);
  return true;
}

// ============================================
// CLIENT INTEREST OPERATIONS
// ============================================

export async function getClientInterests(): Promise<ClientInterest[]> {
  const db = loadDb();
  return db.clientInterests.map(ci => {
    const dog = db.dogs.find(d => d.id === ci.dogId);
    // Include sire and dam for contract generation
    const dogWithParents = dog ? {
      ...dog,
      sire: dog.sireId ? db.dogs.find(d => d.id === dog.sireId) || null : null,
      dam: dog.damId ? db.dogs.find(d => d.id === dog.damId) || null : null,
    } : undefined;
    
    return {
      ...ci,
      client: db.clients.find(c => c.id === ci.clientId),
      dog: dogWithParents,
      convertedToSale: ci.convertedToSaleId ? db.sales.find(s => s.id === ci.convertedToSaleId) || null : null,
    };
  });
}

export async function getClientInterest(id: string): Promise<ClientInterest | null> {
  const db = loadDb();
  const interest = db.clientInterests.find(ci => ci.id === id);
  if (!interest) return null;
  
  const dog = db.dogs.find(d => d.id === interest.dogId);
  // Include sire and dam for contract generation
  const dogWithParents = dog ? {
    ...dog,
    sire: dog.sireId ? db.dogs.find(d => d.id === dog.sireId) || null : null,
    dam: dog.damId ? db.dogs.find(d => d.id === dog.damId) || null : null,
  } : undefined;
  
  return {
    ...interest,
    client: db.clients.find(c => c.id === interest.clientId),
    dog: dogWithParents,
    convertedToSale: interest.convertedToSaleId ? db.sales.find(s => s.id === interest.convertedToSaleId) || null : null,
  };
}

export async function getInterestsByClient(clientId: string): Promise<ClientInterest[]> {
  const db = loadDb();
  return db.clientInterests
    .filter(ci => ci.clientId === clientId)
    .map(ci => ({
      ...ci,
      dog: db.dogs.find(d => d.id === ci.dogId),
      convertedToSale: ci.convertedToSaleId ? db.sales.find(s => s.id === ci.convertedToSaleId) || null : null,
    }));
}

export async function getInterestsByDog(dogId: string): Promise<ClientInterest[]> {
  const db = loadDb();
  return db.clientInterests
    .filter(ci => ci.dogId === dogId)
    .map(ci => ({
      ...ci,
      client: db.clients.find(c => c.id === ci.clientId),
      convertedToSale: ci.convertedToSaleId ? db.sales.find(s => s.id === ci.convertedToSaleId) || null : null,
    }));
}

export async function createClientInterest(input: CreateClientInterestInput): Promise<ClientInterest> {
  const db = loadDb();
  const now = new Date();
  const interest: ClientInterest = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  db.clientInterests.push(interest);
  saveDb(db);
  return interest;
}

export async function updateClientInterest(id: string, input: UpdateClientInterestInput): Promise<ClientInterest | null> {
  const db = loadDb();
  const index = db.clientInterests.findIndex(ci => ci.id === id);
  if (index === -1) return null;
  
  db.clientInterests[index] = {
    ...db.clientInterests[index],
    ...input,
    updatedAt: new Date(),
  };
  saveDb(db);
  return db.clientInterests[index];
}

export async function deleteClientInterest(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.clientInterests.findIndex(ci => ci.id === id);
  if (index === -1) return false;
  
  db.clientInterests.splice(index, 1);
  saveDb(db);
  return true;
}

// Convert an interest to a sale - marks interest as converted and creates sale
export async function convertInterestToSale(
  interestId: string, 
  saleInput: CreateSaleInput
): Promise<{ sale: Sale; interest: ClientInterest }> {
  const db = loadDb();
  const interestIndex = db.clientInterests.findIndex(ci => ci.id === interestId);
  if (interestIndex === -1) {
    throw new Error(`Interest with id ${interestId} not found`);
  }
  
  const interest = db.clientInterests[interestIndex];
  
  // Create the sale
  const now = new Date();
  const sale: Sale = {
    id: generateId(),
    clientId: saleInput.clientId,
    saleDate: saleInput.saleDate,
    price: saleInput.price,
    depositAmount: saleInput.depositAmount ?? null,
    depositDate: saleInput.depositDate ?? null,
    contractPath: saleInput.contractPath ?? null,
    notes: saleInput.notes ?? null,
    shippedDate: saleInput.shippedDate ?? null,
    receivedDate: saleInput.receivedDate ?? null,
    isLocalPickup: saleInput.isLocalPickup ?? false,
    paymentStatus: saleInput.paymentStatus ?? 'deposit_only',
    warrantyInfo: saleInput.warrantyInfo ?? null,
    registrationTransferDate: saleInput.registrationTransferDate ?? null,
    transportId: saleInput.transportId ?? null,
    createdAt: now,
    updatedAt: now,
  };
  db.sales.push(sale);
  
  // Create SalePuppy entries for each puppy
  for (const puppy of saleInput.puppies) {
    const salePuppy: SalePuppy = {
      id: generateId(),
      saleId: sale.id,
      dogId: puppy.dogId,
      price: puppy.price,
      createdAt: now,
    };
    db.salePuppies.push(salePuppy);
    
    // Update dog status to sold
    const dogIndex = db.dogs.findIndex(d => d.id === puppy.dogId);
    if (dogIndex !== -1) {
      db.dogs[dogIndex].status = 'sold';
      db.dogs[dogIndex].updatedAt = now;
    }
  }
  
  // Update the interest to mark as converted
  db.clientInterests[interestIndex] = {
    ...interest,
    status: 'converted',
    convertedToSaleId: sale.id,
    updatedAt: now,
  };
  
  saveDb(db);
  
  return {
    sale,
    interest: db.clientInterests[interestIndex],
  };
}

// ============================================
// SALE OPERATIONS
// ============================================

export async function getSales(): Promise<Sale[]> {
  const db = loadDb();
  return db.sales.map(s => ({
    ...s,
    client: db.clients.find(c => c.id === s.clientId),
    puppies: db.salePuppies.filter(sp => sp.saleId === s.id).map(sp => ({
      ...sp,
      dog: db.dogs.find(d => d.id === sp.dogId),
    })),
    transport: s.transportId ? db.transports.find(t => t.id === s.transportId) || null : null,
    convertedInterests: db.clientInterests.filter(ci => ci.convertedToSaleId === s.id),
  }));
}

export async function getSale(id: string): Promise<Sale | null> {
  const db = loadDb();
  const sale = db.sales.find(s => s.id === id);
  if (!sale) return null;
  
  return {
    ...sale,
    client: db.clients.find(c => c.id === sale.clientId),
    puppies: db.salePuppies.filter(sp => sp.saleId === id).map(sp => ({
      ...sp,
      dog: db.dogs.find(d => d.id === sp.dogId),
    })),
    transport: sale.transportId ? db.transports.find(t => t.id === sale.transportId) || null : null,
    convertedInterests: db.clientInterests.filter(ci => ci.convertedToSaleId === id),
  };
}

export async function createSale(input: CreateSaleInput): Promise<Sale> {
  const db = loadDb();
  const now = new Date();
  
  const sale: Sale = {
    id: generateId(),
    clientId: input.clientId,
    saleDate: input.saleDate,
    price: input.price,
    depositAmount: input.depositAmount ?? null,
    depositDate: input.depositDate ?? null,
    contractPath: input.contractPath ?? null,
    notes: input.notes ?? null,
    shippedDate: input.shippedDate ?? null,
    receivedDate: input.receivedDate ?? null,
    isLocalPickup: input.isLocalPickup ?? false,
    paymentStatus: input.paymentStatus ?? 'deposit_only',
    warrantyInfo: input.warrantyInfo ?? null,
    registrationTransferDate: input.registrationTransferDate ?? null,
    transportId: input.transportId ?? null,
    createdAt: now,
    updatedAt: now,
  };
  db.sales.push(sale);
  
  // Create SalePuppy entries for each puppy
  for (const puppy of input.puppies) {
    const salePuppy: SalePuppy = {
      id: generateId(),
      saleId: sale.id,
      dogId: puppy.dogId,
      price: puppy.price,
      createdAt: now,
    };
    db.salePuppies.push(salePuppy);
    
    // Update dog status to sold
    const dogIndex = db.dogs.findIndex(d => d.id === puppy.dogId);
    if (dogIndex !== -1) {
      db.dogs[dogIndex].status = 'sold';
      db.dogs[dogIndex].updatedAt = now;
    }
  }
  
  saveDb(db);
  return sale;
}

export async function updateSale(id: string, input: UpdateSaleInput): Promise<Sale | null> {
  const db = loadDb();
  const index = db.sales.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  const now = new Date();
  const existingSale = db.sales[index];
  
  // Update sale fields (excluding puppies)
  const { puppies: newPuppies, ...saleFields } = input;
  db.sales[index] = {
    ...existingSale,
    ...saleFields,
    updatedAt: now,
  };
  
  // Handle puppies update if provided
  if (newPuppies !== undefined) {
    // Get existing puppies for this sale
    const existingPuppyDogIds = db.salePuppies
      .filter(sp => sp.saleId === id)
      .map(sp => sp.dogId);
    
    const newPuppyDogIds = newPuppies.map(p => p.dogId);
    
    // Remove puppies that are no longer in the sale
    const removedDogIds = existingPuppyDogIds.filter(dogId => !newPuppyDogIds.includes(dogId));
    for (const dogId of removedDogIds) {
      // Remove SalePuppy entry
      const spIndex = db.salePuppies.findIndex(sp => sp.saleId === id && sp.dogId === dogId);
      if (spIndex !== -1) {
        db.salePuppies.splice(spIndex, 1);
      }
      // Revert dog status
      const dogIndex = db.dogs.findIndex(d => d.id === dogId);
      if (dogIndex !== -1) {
        db.dogs[dogIndex].status = 'active';
        db.dogs[dogIndex].updatedAt = now;
      }
    }
    
    // Add or update puppies
    for (const puppy of newPuppies) {
      const existingSpIndex = db.salePuppies.findIndex(sp => sp.saleId === id && sp.dogId === puppy.dogId);
      
      if (existingSpIndex !== -1) {
        // Update price if puppy already exists
        db.salePuppies[existingSpIndex].price = puppy.price;
      } else {
        // Add new SalePuppy entry
        const salePuppy: SalePuppy = {
          id: generateId(),
          saleId: id,
          dogId: puppy.dogId,
          price: puppy.price,
          createdAt: now,
        };
        db.salePuppies.push(salePuppy);
        
        // Update dog status to sold
        const dogIndex = db.dogs.findIndex(d => d.id === puppy.dogId);
        if (dogIndex !== -1) {
          db.dogs[dogIndex].status = 'sold';
          db.dogs[dogIndex].updatedAt = now;
        }
      }
    }
  }
  
  saveDb(db);
  return db.sales[index];
}

export async function deleteSale(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.sales.findIndex(s => s.id === id);
  if (index === -1) return false;
  
  const now = new Date();
  
  // Revert dog statuses for all puppies in this sale
  const salePuppies = db.salePuppies.filter(sp => sp.saleId === id);
  for (const sp of salePuppies) {
    const dogIndex = db.dogs.findIndex(d => d.id === sp.dogId);
    if (dogIndex !== -1) {
      db.dogs[dogIndex].status = 'active';
      db.dogs[dogIndex].updatedAt = now;
    }
  }
  
  // Remove SalePuppy entries
  db.salePuppies = db.salePuppies.filter(sp => sp.saleId !== id);
  
  // Clear convertedToSaleId from any interests pointing to this sale
  for (let i = 0; i < db.clientInterests.length; i++) {
    if (db.clientInterests[i].convertedToSaleId === id) {
      db.clientInterests[i].convertedToSaleId = null;
      db.clientInterests[i].status = 'interested'; // Reset status
      db.clientInterests[i].updatedAt = now;
    }
  }
  
  db.sales.splice(index, 1);
  saveDb(db);
  return true;
}

// ============================================
// SALE PUPPY OPERATIONS
// ============================================

export async function addPuppyToSale(saleId: string, dogId: string, price: number): Promise<SalePuppy | null> {
  const db = loadDb();
  
  // Check if sale exists
  const sale = db.sales.find(s => s.id === saleId);
  if (!sale) return null;
  
  // Check if puppy is already in this sale
  const existing = db.salePuppies.find(sp => sp.saleId === saleId && sp.dogId === dogId);
  if (existing) return existing;
  
  const now = new Date();
  const salePuppy: SalePuppy = {
    id: generateId(),
    saleId,
    dogId,
    price,
    createdAt: now,
  };
  db.salePuppies.push(salePuppy);
  
  // Update dog status to sold
  const dogIndex = db.dogs.findIndex(d => d.id === dogId);
  if (dogIndex !== -1) {
    db.dogs[dogIndex].status = 'sold';
    db.dogs[dogIndex].updatedAt = now;
  }
  
  saveDb(db);
  return salePuppy;
}

export async function removePuppyFromSale(saleId: string, dogId: string): Promise<boolean> {
  const db = loadDb();
  
  const index = db.salePuppies.findIndex(sp => sp.saleId === saleId && sp.dogId === dogId);
  if (index === -1) return false;
  
  db.salePuppies.splice(index, 1);
  
  // Revert dog status
  const now = new Date();
  const dogIndex = db.dogs.findIndex(d => d.id === dogId);
  if (dogIndex !== -1) {
    db.dogs[dogIndex].status = 'active';
    db.dogs[dogIndex].updatedAt = now;
  }
  
  saveDb(db);
  return true;
}

export async function updatePuppyPrice(saleId: string, dogId: string, price: number): Promise<SalePuppy | null> {
  const db = loadDb();
  
  const index = db.salePuppies.findIndex(sp => sp.saleId === saleId && sp.dogId === dogId);
  if (index === -1) return null;
  
  db.salePuppies[index].price = price;
  saveDb(db);
  return db.salePuppies[index];
}

// ============================================
// SETTINGS OPERATIONS
// ============================================

export async function getSetting(key: string): Promise<string | null> {
  const db = loadDb();
  const setting = db.settings.find(s => s.key === key);
  return setting?.value || null;
}

export async function setSetting(key: string, value: string): Promise<Setting> {
  const db = loadDb();
  const index = db.settings.findIndex(s => s.key === key);
  const now = new Date();
  
  if (index === -1) {
    const setting: Setting = {
      id: generateId(),
      key,
      value,
      updatedAt: now,
    };
    db.settings.push(setting);
    saveDb(db);
    return setting;
  }
  
  db.settings[index].value = value;
  db.settings[index].updatedAt = now;
  saveDb(db);
  return db.settings[index];
}

export async function getSettings(): Promise<Record<string, string>> {
  const db = loadDb();
  return db.settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string>);
}

// ============================================
// DASHBOARD STATISTICS
// ============================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = loadDb();
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const lineItemCurrencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const toDate = (value: Date | string | null | undefined): Date | null => {
    if (!value) return null;
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatCategoryLabel = (value: string | null | undefined): string => {
    if (!value) {
      return 'General';
    }
    return value
      .toString()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Count active dogs
  const activeDogs = db.dogs.filter(d => d.status === 'active').length;
  
  // Count dogs in heat (heat cycles without end date)
  const dogsInHeat = db.heatCycles.filter(h => !h.endDate).length;
  
  // Count upcoming shots (next 30 days)
  const upcomingShots = db.vaccinations.filter(v => 
    v.nextDueDate && 
    new Date(v.nextDueDate) <= thirtyDaysFromNow &&
    new Date(v.nextDueDate) >= now
  ).length;
  
  // Count upcoming due dates (litters)
  const upcomingDueDates = db.litters.filter(l =>
    l.dueDate &&
    !l.whelpDate &&
    new Date(l.dueDate) <= thirtyDaysFromNow &&
    new Date(l.dueDate) >= now
  ).length;
  
  // Monthly expenses (current month only)
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Helper function to normalize expense date
  const normalizeExpenseDate = (date: Date | string | unknown): Date | null => {
    if (!date) return null;
    
    // If already a Date object, use it directly
    if (date instanceof Date) {
      return isNaN(date.getTime()) ? null : date;
    }
    
    // If it's a string, parse it
    if (typeof date === 'string') {
      // Handle YYYY-MM-DD format manually to avoid timezone issues
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-').map(Number);
        const parsed = new Date(year, month - 1, day);
        return isNaN(parsed.getTime()) ? null : parsed;
      }
      // Handle ISO format
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    // Try to convert to Date
    try {
      const parsed = new Date(date as any);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  };
  
  const monthlyExpenses = db.expenses
    .filter(e => {
      const expenseDate = normalizeExpenseDate(e.date);
      if (!expenseDate) return false;
      
      // Compare year and month directly
      const expenseYear = expenseDate.getFullYear();
      const expenseMonth = expenseDate.getMonth();
      return expenseYear === currentYear && expenseMonth === currentMonth;
    })
    .reduce((sum, e) => sum + e.amount, 0);
  
  // Count incomplete puppy health tasks due this week
  const puppyTasksDueThisWeek = db.puppyHealthTasks.filter(t =>
    !t.completedDate &&
    new Date(t.dueDate) <= sevenDaysFromNow &&
    new Date(t.dueDate) >= now
  ).length;
  
  // Count follow-ups due this week
  const followUpsDue = db.communicationLogs.filter(l =>
    l.followUpNeeded &&
    !l.followUpCompleted &&
    l.followUpDate &&
    new Date(l.followUpDate) <= sevenDaysFromNow
  ).length;

  const dogMap = new Map(db.dogs.map(dog => [dog.id, dog]));
  const clientMap = new Map(db.clients.map(client => [client.id, client]));
  const activities: ActivityItem[] = [];

  const addActivity = (activity: ActivityItem | null | undefined) => {
    if (!activity) {
      return;
    }
    activities.push(activity);
  };

  db.vaccinations.forEach((record) => {
    const date = toDate(record.date) || toDate(record.createdAt);
    if (!date) return;
    const dog = dogMap.get(record.dogId);
    addActivity({
      id: `vaccination-${record.id}`,
      type: 'vaccination',
      description: `${record.vaccineType || 'Vaccination'} recorded${dog ? ` for ${dog.name}` : ''}`,
      date,
      relatedDogId: dog?.id,
      relatedDogName: dog?.name,
    });
  });

  db.litters.forEach((litter) => {
    const eventDate = toDate(litter.whelpDate) || toDate(litter.breedingDate) || toDate(litter.createdAt);
    if (!eventDate) return;
    const sire = litter.sireId ? dogMap.get(litter.sireId) : null;
    const dam = litter.damId ? dogMap.get(litter.damId) : null;
    const puppyCount = litter.totalAlive ?? litter.puppies?.length ?? 0;
    const description = litter.whelpDate
      ? `${litter.code || 'Litter'} whelped (${puppyCount} puppy${puppyCount === 1 ? '' : 'ies'})`
      : `${litter.code || 'Litter'} planned (${sire?.name || 'Unknown sire'} × ${dam?.name || 'Unknown dam'})`;
    addActivity({
      id: `litter-${litter.id}`,
      type: 'litter',
      description,
      date: eventDate,
    });
  });

  db.transports.forEach((transport) => {
    const date = toDate(transport.date) || toDate(transport.createdAt);
    if (!date) return;
    const dog = dogMap.get(transport.dogId);
    const mode = transport.mode ? transport.mode.replace(/_/g, ' ').toUpperCase() : 'TRANSPORT';
    addActivity({
      id: `transport-${transport.id}`,
      type: 'transport',
      description: `${mode} transport${dog ? ` for ${dog.name}` : ''}`,
      date,
      relatedDogId: dog?.id,
      relatedDogName: dog?.name,
    });
  });

  db.expenses.forEach((expense) => {
    const date = toDate(expense.date) || toDate(expense.createdAt);
    if (!date) return;
    const dog = expense.relatedDogId ? dogMap.get(expense.relatedDogId) : null;
    const label = formatCategoryLabel(expense.category);
    const amount = lineItemCurrencyFormatter.format(expense.amount);
    addActivity({
      id: `expense-${expense.id}`,
      type: 'expense',
      description: `${label} expense of ${amount}${dog ? ` for ${dog.name}` : ''}`,
      date,
      relatedDogId: dog?.id,
      relatedDogName: dog?.name,
    });
  });

  db.sales.forEach((sale) => {
    const date = toDate(sale.saleDate) || toDate(sale.createdAt);
    if (!date) return;
    const clientName = clientMap.get(sale.clientId)?.name || 'Unknown client';
    const puppies = db.salePuppies.filter(sp => sp.saleId === sale.id);
    const puppyNames = puppies
      .map(sp => dogMap.get(sp.dogId)?.name)
      .filter(Boolean)
      .join(', ');
    const puppyCount = puppies.length;
    const description = puppyCount > 0
      ? `Sold ${puppyCount} puppy${puppyCount === 1 ? '' : 'ies'} to ${clientName}${puppyNames ? ` (${puppyNames})` : ''}`
      : `Sale recorded for ${clientName}`;
    addActivity({
      id: `sale-${sale.id}`,
      type: 'sale',
      description,
      date,
      relatedDogId: puppyCount === 1 ? puppies[0].dogId : undefined,
      relatedDogName: puppyCount === 1 ? dogMap.get(puppies[0].dogId)?.name : undefined,
    });
  });

  const recentActivity = activities
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 12);
  
  return {
    totalDogs: db.dogs.length,
    activeDogs,
    dogsInHeat,
    upcomingShots,
    upcomingDueDates,
    monthlyExpenses,
    puppyTasksDueThisWeek,
    followUpsDue,
    recentActivity,
  };
}

// ============================================
// LITTER PHOTO OPERATIONS
// ============================================

export async function getLitterPhotos(litterId: string): Promise<LitterPhoto[]> {
  const db = loadDb();
  return db.litterPhotos
    .filter(p => p.litterId === litterId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getLitterPhoto(id: string): Promise<LitterPhoto | null> {
  const db = loadDb();
  const photo = db.litterPhotos.find(p => p.id === id);
  return photo || null;
}

export async function createLitterPhoto(input: CreateLitterPhotoInput): Promise<LitterPhoto> {
  const db = loadDb();
  
  // Determine sort order (put new photo at the end)
  const existingPhotos = db.litterPhotos.filter(p => p.litterId === input.litterId);
  const maxSortOrder = existingPhotos.length > 0 
    ? Math.max(...existingPhotos.map(p => p.sortOrder)) 
    : -1;
  
  const photo: LitterPhoto = {
    id: generateId(),
    litterId: input.litterId,
    filePath: input.filePath,
    caption: input.caption ?? null,
    sortOrder: input.sortOrder ?? maxSortOrder + 1,
    uploadedAt: new Date(),
  };
  db.litterPhotos.push(photo);
  saveDb(db);
  return photo;
}

export async function updateLitterPhoto(id: string, input: UpdateLitterPhotoInput): Promise<LitterPhoto | null> {
  const db = loadDb();
  const index = db.litterPhotos.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  db.litterPhotos[index] = {
    ...db.litterPhotos[index],
    ...input,
  };
  saveDb(db);
  return db.litterPhotos[index];
}

export async function deleteLitterPhoto(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.litterPhotos.findIndex(p => p.id === id);
  if (index === -1) return false;
  
  db.litterPhotos.splice(index, 1);
  saveDb(db);
  return true;
}

export async function reorderLitterPhotos(litterId: string, photoIds: string[]): Promise<void> {
  const db = loadDb();
  
  // Update sort order based on the provided order
  photoIds.forEach((photoId, index) => {
    const photoIndex = db.litterPhotos.findIndex(p => p.id === photoId && p.litterId === litterId);
    if (photoIndex !== -1) {
      db.litterPhotos[photoIndex].sortOrder = index;
    }
  });
  
  saveDb(db);
}

// ============================================
// PUPPY HEALTH TASK OPERATIONS
// ============================================

export async function getPuppyHealthTasks(litterId?: string, puppyId?: string): Promise<PuppyHealthTask[]> {
  const db = loadDb();
  let tasks = db.puppyHealthTasks;
  
  if (litterId) {
    tasks = tasks.filter(t => t.litterId === litterId);
  }
  if (puppyId) {
    tasks = tasks.filter(t => t.puppyId === puppyId || t.puppyId === null);
  }
  
  // Include relations
  return tasks.map(t => ({
    ...t,
    litter: db.litters.find(l => l.id === t.litterId),
    puppy: t.puppyId ? db.dogs.find(d => d.id === t.puppyId) || null : null,
  })).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export async function getPuppyHealthTask(id: string): Promise<PuppyHealthTask | null> {
  const db = loadDb();
  const task = db.puppyHealthTasks.find(t => t.id === id);
  if (!task) return null;
  
  return {
    ...task,
    litter: db.litters.find(l => l.id === task.litterId),
    puppy: task.puppyId ? db.dogs.find(d => d.id === task.puppyId) || null : null,
  };
}

export async function createPuppyHealthTask(input: CreatePuppyHealthTaskInput): Promise<PuppyHealthTask> {
  const db = loadDb();
  const now = new Date();
  const task: PuppyHealthTask = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  db.puppyHealthTasks.push(task);
  saveDb(db);
  return task;
}

export async function updatePuppyHealthTask(id: string, input: UpdatePuppyHealthTaskInput): Promise<PuppyHealthTask | null> {
  const db = loadDb();
  const index = db.puppyHealthTasks.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  db.puppyHealthTasks[index] = {
    ...db.puppyHealthTasks[index],
    ...input,
    updatedAt: new Date(),
  };
  saveDb(db);
  return db.puppyHealthTasks[index];
}

export async function deletePuppyHealthTask(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.puppyHealthTasks.findIndex(t => t.id === id);
  if (index === -1) return false;
  
  db.puppyHealthTasks.splice(index, 1);
  saveDb(db);
  return true;
}

export async function completePuppyHealthTask(id: string, notes?: string): Promise<PuppyHealthTask | null> {
  const db = loadDb();
  const index = db.puppyHealthTasks.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  db.puppyHealthTasks[index] = {
    ...db.puppyHealthTasks[index],
    completedDate: new Date(),
    notes: notes || db.puppyHealthTasks[index].notes,
    updatedAt: new Date(),
  };
  saveDb(db);
  return db.puppyHealthTasks[index];
}

export async function uncompletePuppyHealthTask(id: string): Promise<PuppyHealthTask | null> {
  const db = loadDb();
  const index = db.puppyHealthTasks.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  db.puppyHealthTasks[index] = {
    ...db.puppyHealthTasks[index],
    completedDate: null,
    updatedAt: new Date(),
  };
  saveDb(db);
  return db.puppyHealthTasks[index];
}

// Delete all tasks for a litter
export async function deletePuppyHealthTasksForLitter(litterId: string): Promise<void> {
  const db = loadDb();
  db.puppyHealthTasks = db.puppyHealthTasks.filter(t => t.litterId !== litterId);
  saveDb(db);
}

// ============================================
// HEALTH SCHEDULE TEMPLATE OPERATIONS
// ============================================

// Default template for 8-week puppy schedule
const DEFAULT_HEALTH_SCHEDULE_ITEMS: HealthScheduleTemplateItem[] = [
  { taskType: 'daily_weight', taskName: 'Daily Weight Check (Week 1)', daysFromBirth: 1, isPerPuppy: false, notes: 'Weigh puppies twice daily for first week' },
  { taskType: 'dewclaw_removal', taskName: 'Dewclaw Removal', daysFromBirth: 3, isPerPuppy: false, notes: 'If applicable - days 3-5' },
  { taskType: 'daily_weight', taskName: 'Weekly Weight Check', daysFromBirth: 7, isPerPuppy: true, notes: 'Record individual puppy weights' },
  { taskType: 'deworming', taskName: 'Deworming #1', daysFromBirth: 14, isPerPuppy: false, notes: 'Pyrantel pamoate' },
  { taskType: 'eyes_opening', taskName: 'Eyes Opening Check', daysFromBirth: 14, isPerPuppy: true, notes: 'Eyes typically open days 10-14' },
  { taskType: 'ears_opening', taskName: 'Ears Opening Check', daysFromBirth: 21, isPerPuppy: true, notes: 'Ears typically open around day 21' },
  { taskType: 'first_solid_food', taskName: 'First Solid Food Introduction', daysFromBirth: 21, isPerPuppy: false, notes: 'Start weaning process' },
  { taskType: 'deworming', taskName: 'Deworming #2', daysFromBirth: 28, isPerPuppy: false, notes: 'Pyrantel pamoate' },
  { taskType: 'daily_weight', taskName: 'Weekly Weight Check (Week 4)', daysFromBirth: 28, isPerPuppy: true },
  { taskType: 'nail_trim', taskName: 'Nail Trim', daysFromBirth: 28, isPerPuppy: false, notes: 'First nail trim' },
  { taskType: 'vet_check', taskName: 'Vet Wellness Check #1', daysFromBirth: 35, isPerPuppy: true, notes: 'General health check' },
  { taskType: 'deworming', taskName: 'Deworming #3', daysFromBirth: 42, isPerPuppy: false, notes: 'Pyrantel pamoate' },
  { taskType: 'vaccination', taskName: 'First Vaccination (DHPP)', daysFromBirth: 42, isPerPuppy: true, notes: '6 weeks - Distemper, Hepatitis, Parainfluenza, Parvovirus' },
  { taskType: 'microchipping', taskName: 'Microchipping', daysFromBirth: 49, isPerPuppy: true, notes: 'Record microchip numbers' },
  { taskType: 'temperament_test', taskName: 'Temperament Testing', daysFromBirth: 49, isPerPuppy: true, notes: 'Volhard or similar assessment' },
  { taskType: 'vet_check', taskName: 'Final Vet Check', daysFromBirth: 56, isPerPuppy: true, notes: 'Pre-placement wellness check' },
  { taskType: 'vaccination', taskName: 'Second Vaccination (DHPP)', daysFromBirth: 56, isPerPuppy: true, notes: '8 weeks - Ready for go-home' },
];

export async function getHealthScheduleTemplates(): Promise<HealthScheduleTemplate[]> {
  const db = loadDb();
  return db.healthScheduleTemplates;
}

export async function getHealthScheduleTemplate(id: string): Promise<HealthScheduleTemplate | null> {
  const db = loadDb();
  return db.healthScheduleTemplates.find(t => t.id === id) || null;
}

export async function getDefaultHealthScheduleTemplate(): Promise<HealthScheduleTemplate> {
  const db = loadDb();
  let defaultTemplate = db.healthScheduleTemplates.find(t => t.isDefault);
  
  if (!defaultTemplate) {
    // Create the default template if it doesn't exist
    const now = new Date();
    defaultTemplate = {
      id: generateId(),
      name: 'Standard 8-Week Schedule',
      description: 'Default puppy health and development schedule from birth to 8 weeks',
      items: DEFAULT_HEALTH_SCHEDULE_ITEMS,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    };
    db.healthScheduleTemplates.push(defaultTemplate);
    saveDb(db);
  }
  
  return defaultTemplate;
}

export async function createHealthScheduleTemplate(input: Omit<HealthScheduleTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<HealthScheduleTemplate> {
  const db = loadDb();
  const now = new Date();
  
  // If this is being set as default, unset other defaults
  if (input.isDefault) {
    db.healthScheduleTemplates.forEach(t => { t.isDefault = false; });
  }
  
  const template: HealthScheduleTemplate = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  db.healthScheduleTemplates.push(template);
  saveDb(db);
  return template;
}

export async function updateHealthScheduleTemplate(id: string, input: Partial<HealthScheduleTemplate>): Promise<HealthScheduleTemplate | null> {
  const db = loadDb();
  const index = db.healthScheduleTemplates.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  // If this is being set as default, unset other defaults
  if (input.isDefault) {
    db.healthScheduleTemplates.forEach(t => { t.isDefault = false; });
  }
  
  db.healthScheduleTemplates[index] = {
    ...db.healthScheduleTemplates[index],
    ...input,
    updatedAt: new Date(),
  };
  saveDb(db);
  return db.healthScheduleTemplates[index];
}

export async function deleteHealthScheduleTemplate(id: string): Promise<boolean> {
  const db = loadDb();
  const template = db.healthScheduleTemplates.find(t => t.id === id);
  if (!template || template.isDefault) return false; // Can't delete default template
  
  const index = db.healthScheduleTemplates.findIndex(t => t.id === id);
  db.healthScheduleTemplates.splice(index, 1);
  saveDb(db);
  return true;
}

// Generate puppy health tasks for a litter from a template
export async function generatePuppyHealthTasksForLitter(
  litterId: string, 
  whelpDate: Date, 
  templateId?: string
): Promise<PuppyHealthTask[]> {
  const db = loadDb();
  const litter = db.litters.find(l => l.id === litterId);
  if (!litter) throw new Error('Litter not found');
  
  // Get template (use default if not specified)
  let template: HealthScheduleTemplate;
  if (templateId) {
    const found = db.healthScheduleTemplates.find(t => t.id === templateId);
    if (!found) throw new Error('Template not found');
    template = found;
  } else {
    template = await getDefaultHealthScheduleTemplate();
  }
  
  // Get puppies in this litter
  const puppies = db.dogs.filter(d => d.litterId === litterId);
  
  const now = new Date();
  const tasks: PuppyHealthTask[] = [];
  
  for (const item of template.items) {
    const dueDate = new Date(whelpDate.getTime() + item.daysFromBirth * 24 * 60 * 60 * 1000);
    
    if (item.isPerPuppy && puppies.length > 0) {
      // Create one task per puppy
      for (const puppy of puppies) {
        const task: PuppyHealthTask = {
          id: generateId(),
          litterId,
          puppyId: puppy.id,
          taskType: item.taskType,
          taskName: `${item.taskName} - ${puppy.name}`,
          dueDate,
          completedDate: null,
          notes: item.notes || null,
          createdAt: now,
          updatedAt: now,
        };
        tasks.push(task);
        db.puppyHealthTasks.push(task);
      }
    } else {
      // Create one task for the whole litter
      const task: PuppyHealthTask = {
        id: generateId(),
        litterId,
        puppyId: null,
        taskType: item.taskType,
        taskName: item.taskName,
        dueDate,
        completedDate: null,
        notes: item.notes || null,
        createdAt: now,
        updatedAt: now,
      };
      tasks.push(task);
      db.puppyHealthTasks.push(task);
    }
  }
  
  saveDb(db);
  return tasks;
}

// Get tasks due this week across all litters
export async function getPuppyHealthTasksDueThisWeek(): Promise<PuppyHealthTask[]> {
  const db = loadDb();
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return db.puppyHealthTasks
    .filter(t => 
      !t.completedDate &&
      new Date(t.dueDate) <= sevenDaysFromNow &&
      new Date(t.dueDate) >= now
    )
    .map(t => ({
      ...t,
      litter: db.litters.find(l => l.id === t.litterId),
      puppy: t.puppyId ? db.dogs.find(d => d.id === t.puppyId) || null : null,
    }))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

// Get overdue tasks
export async function getOverduePuppyHealthTasks(): Promise<PuppyHealthTask[]> {
  const db = loadDb();
  const now = new Date();
  
  return db.puppyHealthTasks
    .filter(t => 
      !t.completedDate &&
      new Date(t.dueDate) < now
    )
    .map(t => ({
      ...t,
      litter: db.litters.find(l => l.id === t.litterId),
      puppy: t.puppyId ? db.dogs.find(d => d.id === t.puppyId) || null : null,
    }))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

// ============================================
// WAITLIST ENTRY OPERATIONS
// ============================================

export async function getWaitlistEntries(litterId?: string): Promise<WaitlistEntry[]> {
  const db = loadDb();
  let entries = db.waitlistEntries;
  
  if (litterId) {
    entries = entries.filter(w => w.litterId === litterId);
  }
  
  // Include relations and sort by position
  return entries
    .map(w => ({
      ...w,
      client: db.clients.find(c => c.id === w.clientId),
      litter: w.litterId ? db.litters.find(l => l.id === w.litterId) || null : null,
      assignedPuppy: w.assignedPuppyId ? db.dogs.find(d => d.id === w.assignedPuppyId) || null : null,
    }))
    .sort((a, b) => a.position - b.position);
}

export async function getGeneralWaitlist(): Promise<WaitlistEntry[]> {
  const db = loadDb();
  return db.waitlistEntries
    .filter(w => !w.litterId)
    .map(w => ({
      ...w,
      client: db.clients.find(c => c.id === w.clientId),
      litter: null,
      assignedPuppy: w.assignedPuppyId ? db.dogs.find(d => d.id === w.assignedPuppyId) || null : null,
    }))
    .sort((a, b) => a.position - b.position);
}

export async function getWaitlistEntry(id: string): Promise<WaitlistEntry | null> {
  const db = loadDb();
  const entry = db.waitlistEntries.find(w => w.id === id);
  if (!entry) return null;
  
  return {
    ...entry,
    client: db.clients.find(c => c.id === entry.clientId),
    litter: entry.litterId ? db.litters.find(l => l.id === entry.litterId) || null : null,
    assignedPuppy: entry.assignedPuppyId ? db.dogs.find(d => d.id === entry.assignedPuppyId) || null : null,
  };
}

export async function getWaitlistEntriesByClient(clientId: string): Promise<WaitlistEntry[]> {
  const db = loadDb();
  return db.waitlistEntries
    .filter(w => w.clientId === clientId)
    .map(w => ({
      ...w,
      client: db.clients.find(c => c.id === w.clientId),
      litter: w.litterId ? db.litters.find(l => l.id === w.litterId) || null : null,
      assignedPuppy: w.assignedPuppyId ? db.dogs.find(d => d.id === w.assignedPuppyId) || null : null,
    }))
    .sort((a, b) => a.position - b.position);
}

export async function createWaitlistEntry(input: CreateWaitlistEntryInput): Promise<WaitlistEntry> {
  const db = loadDb();
  const now = new Date();
  
  // Determine position (next available in the list)
  const existingEntries = db.waitlistEntries.filter(w => 
    w.litterId === input.litterId && w.status === 'waiting'
  );
  const maxPosition = existingEntries.length > 0 
    ? Math.max(...existingEntries.map(e => e.position))
    : 0;
  
  const entry: WaitlistEntry = {
    ...input,
    id: generateId(),
    position: input.position || maxPosition + 1,
    depositStatus: input.depositStatus || 'pending',
    status: input.status || 'waiting',
    createdAt: now,
    updatedAt: now,
  };
  
  db.waitlistEntries.push(entry);
  saveDb(db);
  return entry;
}

export async function updateWaitlistEntry(id: string, input: UpdateWaitlistEntryInput): Promise<WaitlistEntry | null> {
  const db = loadDb();
  const index = db.waitlistEntries.findIndex(w => w.id === id);
  if (index === -1) return null;
  
  db.waitlistEntries[index] = {
    ...db.waitlistEntries[index],
    ...input,
    updatedAt: new Date(),
  };
  saveDb(db);
  return db.waitlistEntries[index];
}

export async function deleteWaitlistEntry(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.waitlistEntries.findIndex(w => w.id === id);
  if (index === -1) return false;
  
  db.waitlistEntries.splice(index, 1);
  saveDb(db);
  return true;
}

export async function reorderWaitlist(litterId: string | null, entryIds: string[]): Promise<void> {
  const db = loadDb();
  
  entryIds.forEach((entryId, index) => {
    const entryIndex = db.waitlistEntries.findIndex(w => 
      w.id === entryId && w.litterId === litterId
    );
    if (entryIndex !== -1) {
      db.waitlistEntries[entryIndex].position = index + 1;
      db.waitlistEntries[entryIndex].updatedAt = new Date();
    }
  });
  
  saveDb(db);
}

export async function matchPuppyToWaitlist(entryId: string, puppyId: string): Promise<WaitlistEntry | null> {
  const db = loadDb();
  const index = db.waitlistEntries.findIndex(w => w.id === entryId);
  if (index === -1) return null;
  
  db.waitlistEntries[index] = {
    ...db.waitlistEntries[index],
    assignedPuppyId: puppyId,
    status: 'matched',
    updatedAt: new Date(),
  };
  saveDb(db);
  return db.waitlistEntries[index];
}

export async function convertWaitlistToSale(entryId: string, _saleId: string): Promise<WaitlistEntry | null> {
  const db = loadDb();
  const index = db.waitlistEntries.findIndex(w => w.id === entryId);
  if (index === -1) return null;
  
  db.waitlistEntries[index] = {
    ...db.waitlistEntries[index],
    status: 'converted',
    depositStatus: 'applied_to_sale',
    updatedAt: new Date(),
  };
  saveDb(db);
  return db.waitlistEntries[index];
}

// ============================================
// COMMUNICATION LOG OPERATIONS
// ============================================

export async function getCommunicationLogs(clientId?: string): Promise<CommunicationLog[]> {
  const db = loadDb();
  let logs = db.communicationLogs;
  
  if (clientId) {
    logs = logs.filter(l => l.clientId === clientId);
  }
  
  // Include relations and sort by date (most recent first)
  return logs
    .map(l => ({
      ...l,
      client: db.clients.find(c => c.id === l.clientId),
      relatedLitter: l.relatedLitterId ? db.litters.find(lit => lit.id === l.relatedLitterId) || null : null,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getCommunicationLog(id: string): Promise<CommunicationLog | null> {
  const db = loadDb();
  const log = db.communicationLogs.find(l => l.id === id);
  if (!log) return null;
  
  return {
    ...log,
    client: db.clients.find(c => c.id === log.clientId),
    relatedLitter: log.relatedLitterId ? db.litters.find(l => l.id === log.relatedLitterId) || null : null,
  };
}

export async function getFollowUpsDue(): Promise<CommunicationLog[]> {
  const db = loadDb();
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return db.communicationLogs
    .filter(l => 
      l.followUpNeeded && 
      !l.followUpCompleted &&
      l.followUpDate &&
      new Date(l.followUpDate) <= sevenDaysFromNow
    )
    .map(l => ({
      ...l,
      client: db.clients.find(c => c.id === l.clientId),
      relatedLitter: l.relatedLitterId ? db.litters.find(lit => lit.id === l.relatedLitterId) || null : null,
    }))
    .sort((a, b) => 
      new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime()
    );
}

export async function getOverdueFollowUps(): Promise<CommunicationLog[]> {
  const db = loadDb();
  const now = new Date();
  
  return db.communicationLogs
    .filter(l => 
      l.followUpNeeded && 
      !l.followUpCompleted &&
      l.followUpDate &&
      new Date(l.followUpDate) < now
    )
    .map(l => ({
      ...l,
      client: db.clients.find(c => c.id === l.clientId),
      relatedLitter: l.relatedLitterId ? db.litters.find(lit => lit.id === l.relatedLitterId) || null : null,
    }))
    .sort((a, b) => 
      new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime()
    );
}

export async function createCommunicationLog(input: CreateCommunicationLogInput): Promise<CommunicationLog> {
  const db = loadDb();
  const now = new Date();
  
  const log: CommunicationLog = {
    ...input,
    id: generateId(),
    followUpCompleted: input.followUpCompleted || false,
    createdAt: now,
    updatedAt: now,
  };
  
  db.communicationLogs.push(log);
  saveDb(db);
  return log;
}

export async function updateCommunicationLog(id: string, input: UpdateCommunicationLogInput): Promise<CommunicationLog | null> {
  const db = loadDb();
  const index = db.communicationLogs.findIndex(l => l.id === id);
  if (index === -1) return null;
  
  db.communicationLogs[index] = {
    ...db.communicationLogs[index],
    ...input,
    updatedAt: new Date(),
  };
  saveDb(db);
  return db.communicationLogs[index];
}

export async function deleteCommunicationLog(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.communicationLogs.findIndex(l => l.id === id);
  if (index === -1) return false;
  
  db.communicationLogs.splice(index, 1);
  saveDb(db);
  return true;
}

export async function completeFollowUp(id: string): Promise<CommunicationLog | null> {
  const db = loadDb();
  const index = db.communicationLogs.findIndex(l => l.id === id);
  if (index === -1) return null;
  
  db.communicationLogs[index] = {
    ...db.communicationLogs[index],
    followUpCompleted: true,
    updatedAt: new Date(),
  };
  saveDb(db);
  return db.communicationLogs[index];
}

// ============================================
// EXTERNAL STUD OPERATIONS
// ============================================

export async function getExternalStuds(): Promise<ExternalStud[]> {
  const db = loadDb();
  return db.externalStuds.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getExternalStud(id: string): Promise<ExternalStud | null> {
  const db = loadDb();
  return db.externalStuds.find(s => s.id === id) || null;
}

export async function createExternalStud(input: CreateExternalStudInput): Promise<ExternalStud> {
  const db = loadDb();
  const now = new Date();
  
  const stud: ExternalStud = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  
  db.externalStuds.push(stud);
  saveDb(db);
  return stud;
}

export async function updateExternalStud(id: string, input: UpdateExternalStudInput): Promise<ExternalStud | null> {
  const db = loadDb();
  const index = db.externalStuds.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  db.externalStuds[index] = {
    ...db.externalStuds[index],
    ...input,
    updatedAt: new Date(),
  };
  saveDb(db);
  return db.externalStuds[index];
}

export async function deleteExternalStud(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.externalStuds.findIndex(s => s.id === id);
  if (index === -1) return false;
  
  db.externalStuds.splice(index, 1);
  saveDb(db);
  return true;
}

// ============================================
// HEAT CYCLE PREDICTIONS
// ============================================

export async function getHeatCyclePrediction(dogId: string): Promise<HeatCyclePrediction> {
  const db = loadDb();
  
  // Get completed heat cycles for this dog
  const cycles = db.heatCycles
    .filter(h => h.bitchId === dogId && h.endDate)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  
  const dataPointCount = cycles.length;
  
  if (dataPointCount === 0) {
    return {
      dogId,
      averageCycleLength: null,
      averageIntervalDays: null,
      predictedNextHeat: null,
      confidence: 'low',
      dataPointCount: 0,
    };
  }
  
  // Calculate average cycle length
  const cycleLengths = cycles
    .filter(c => c.cycleLength && c.cycleLength > 0)
    .map(c => c.cycleLength!);
  
  const averageCycleLength = cycleLengths.length > 0
    ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
    : null;
  
  // Calculate average interval between cycles
  const intervals: number[] = [];
  for (let i = 1; i < cycles.length; i++) {
    const prevEnd = cycles[i - 1].endDate ? new Date(cycles[i - 1].endDate!) : null;
    const currStart = new Date(cycles[i].startDate);
    if (prevEnd) {
      const intervalDays = Math.round((currStart.getTime() - prevEnd.getTime()) / (1000 * 60 * 60 * 24));
      intervals.push(intervalDays);
    }
  }
  
  const averageIntervalDays = intervals.length > 0
    ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
    : null;
  
  // Predict next heat
  let predictedNextHeat: Date | null = null;
  const lastCycle = cycles[cycles.length - 1];
  
  if (lastCycle.endDate) {
    // Use average interval if available, otherwise default to 6 months (180 days)
    const daysToAdd = averageIntervalDays || 180;
    predictedNextHeat = new Date(new Date(lastCycle.endDate).getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  }
  
  // Determine confidence based on data points
  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (dataPointCount >= 3) {
    confidence = 'high';
  } else if (dataPointCount >= 2) {
    confidence = 'medium';
  }
  
  return {
    dogId,
    averageCycleLength,
    averageIntervalDays,
    predictedNextHeat,
    confidence,
    dataPointCount,
  };
}

// Get females expected in heat soon
export async function getFemalesExpectingHeatSoon(days: number = 30): Promise<Array<{dog: Dog; prediction: HeatCyclePrediction}>> {
  const db = loadDb();
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  const females = db.dogs.filter(d => d.sex === 'F' && d.status === 'active');
  const results: Array<{dog: Dog; prediction: HeatCyclePrediction}> = [];
  
  for (const female of females) {
    const prediction = await getHeatCyclePrediction(female.id);
    if (prediction.predictedNextHeat && 
        prediction.predictedNextHeat >= now && 
        prediction.predictedNextHeat <= futureDate) {
      results.push({ dog: female, prediction });
    }
  }
  
  return results.sort((a, b) => 
    (a.prediction.predictedNextHeat?.getTime() || 0) - (b.prediction.predictedNextHeat?.getTime() || 0)
  );
}

// ============================================
// GENETIC TEST OPERATIONS
// ============================================

export async function getGeneticTests(dogId?: string): Promise<GeneticTest[]> {
  const db = loadDb();
  let tests = db.geneticTests;
  
  if (dogId) {
    tests = tests.filter(t => t.dogId === dogId);
  }
  
  return tests.map(t => ({
    ...t,
    dog: db.dogs.find(d => d.id === t.dogId),
  })).sort((a, b) => a.testName.localeCompare(b.testName));
}

export async function getGeneticTest(id: string): Promise<GeneticTest | null> {
  const db = loadDb();
  const test = db.geneticTests.find(t => t.id === id);
  if (!test) return null;
  
  return {
    ...test,
    dog: db.dogs.find(d => d.id === test.dogId),
  };
}

export async function createGeneticTest(input: CreateGeneticTestInput): Promise<GeneticTest> {
  const db = loadDb();
  const now = new Date();
  
  const test: GeneticTest = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  
  db.geneticTests.push(test);
  saveDb(db);
  return test;
}

export async function updateGeneticTest(id: string, input: UpdateGeneticTestInput): Promise<GeneticTest | null> {
  const db = loadDb();
  const index = db.geneticTests.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  db.geneticTests[index] = {
    ...db.geneticTests[index],
    ...input,
    updatedAt: new Date(),
  };
  saveDb(db);
  return db.geneticTests[index];
}

export async function deleteGeneticTest(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.geneticTests.findIndex(t => t.id === id);
  if (index === -1) return false;
  
  db.geneticTests.splice(index, 1);
  saveDb(db);
  return true;
}

// Get genetic test summary for a dog
export async function getDogGeneticTestSummary(dogId: string): Promise<{
  tests: GeneticTest[];
  clearCount: number;
  carrierCount: number;
  affectedCount: number;
  pendingCount: number;
  hasRiskyTests: boolean;
}> {
  const db = loadDb();
  const tests = db.geneticTests.filter(t => t.dogId === dogId);
  
  return {
    tests,
    clearCount: tests.filter(t => t.result === 'clear').length,
    carrierCount: tests.filter(t => t.result === 'carrier').length,
    affectedCount: tests.filter(t => t.result === 'affected').length,
    pendingCount: tests.filter(t => t.result === 'pending').length,
    hasRiskyTests: tests.some(t => t.result === 'affected' || t.result === 'carrier'),
  };
}

// Check mating compatibility between two dogs
export async function checkMatingCompatibility(damId: string, sireId: string): Promise<MatingCompatibilityResult> {
  const db = loadDb();
  
  const damTests = db.geneticTests.filter(t => t.dogId === damId);
  const sireTests = db.geneticTests.filter(t => t.dogId === sireId);
  
  const warnings: MatingWarning[] = [];
  
  // Get all unique test types from both dogs
  const allTestTypes = new Set([
    ...damTests.map(t => t.testName),
    ...sireTests.map(t => t.testName),
  ]);
  
  for (const testName of allTestTypes) {
    const damTest = damTests.find(t => t.testName === testName);
    const sireTest = sireTests.find(t => t.testName === testName);
    
    const damStatus = damTest?.result || null;
    const sireStatus = sireTest?.result || null;
    
    // If one dog is missing the test
    if (!damTest || !sireTest) {
      if (damTest?.result === 'carrier' || damTest?.result === 'affected' ||
          sireTest?.result === 'carrier' || sireTest?.result === 'affected') {
        warnings.push({
          testName,
          severity: 'medium',
          message: `${testName}: One parent has ${damTest?.result || sireTest?.result} status but other parent is untested`,
          damStatus,
          sireStatus,
        });
      }
      continue;
    }
    
    // Check for problematic combinations
    if (damStatus === 'affected' || sireStatus === 'affected') {
      warnings.push({
        testName,
        severity: 'high',
        message: `${testName}: One parent is AFFECTED - not recommended for breeding`,
        damStatus,
        sireStatus,
      });
    } else if (damStatus === 'carrier' && sireStatus === 'carrier') {
      warnings.push({
        testName,
        severity: 'high',
        message: `${testName}: Both parents are CARRIERS - 25% risk of affected puppies`,
        damStatus,
        sireStatus,
      });
    } else if ((damStatus === 'carrier' && sireStatus === 'clear') ||
               (damStatus === 'clear' && sireStatus === 'carrier')) {
      warnings.push({
        testName,
        severity: 'low',
        message: `${testName}: One parent is carrier - puppies may be carriers but not affected`,
        damStatus,
        sireStatus,
      });
    }
  }
  
  // Determine overall compatibility
  const hasHighSeverity = warnings.some(w => w.severity === 'high');
  const hasMediumSeverity = warnings.some(w => w.severity === 'medium');
  
  let summary: string;
  if (hasHighSeverity) {
    summary = 'NOT RECOMMENDED: This pairing has significant genetic risks.';
  } else if (hasMediumSeverity) {
    summary = 'CAUTION: Complete genetic testing recommended before breeding.';
  } else if (warnings.length > 0) {
    summary = 'ACCEPTABLE: Minor considerations noted. Safe to proceed with breeding.';
  } else {
    summary = 'COMPATIBLE: No genetic concerns identified.';
  }
  
  return {
    isCompatible: !hasHighSeverity,
    warnings: warnings.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }),
    summary,
  };
}

// Common genetic test list for quick-add
export const COMMON_GENETIC_TESTS = [
  { name: 'DM', fullName: 'Degenerative Myelopathy', type: 'DM' as const },
  { name: 'HUU', fullName: 'Hyperuricosuria', type: 'HUU' as const },
  { name: 'CMR1', fullName: 'Canine Multifocal Retinopathy 1', type: 'CMR1' as const },
  { name: 'EIC', fullName: 'Exercise Induced Collapse', type: 'EIC' as const },
  { name: 'vWD1', fullName: 'Von Willebrand Disease Type 1', type: 'vWD1' as const },
  { name: 'PRA-prcd', fullName: 'Progressive Retinal Atrophy (prcd)', type: 'PRA-prcd' as const },
  { name: 'CDDY', fullName: 'Chondrodystrophy', type: 'CDDY' as const },
  { name: 'CDPA', fullName: 'Chondrodysplasia', type: 'CDPA' as const },
  { name: 'NCL', fullName: 'Neuronal Ceroid Lipofuscinosis', type: 'NCL' as const },
  { name: 'JHC', fullName: 'Juvenile Hereditary Cataracts', type: 'JHC' as const },
  { name: 'HSF4', fullName: 'Hereditary Cataracts', type: 'HSF4' as const },
  { name: 'MDR1', fullName: 'Multi-Drug Resistance 1', type: 'MDR1' as const },
] as const;

// ============================================
// BACKUP & EXPORT
// ============================================

export async function exportDatabase(): Promise<string> {
  const db = loadDb();
  return JSON.stringify(db, null, 2);
}

export async function importDatabase(data: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    return true;
  } catch (error) {
    console.error('Failed to import database:', error);
    return false;
  }
}

export async function clearDatabase(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
}

export async function unseedDatabase(): Promise<void> {
  // Unseed is the same as clear - removes all data including seeded test data
  localStorage.removeItem(STORAGE_KEY);
}

// ============================================
// CUSTOMER PACKET DATA
// ============================================

/**
 * Get all data needed to generate a customer packet PDF for a dog.
 * This includes dog info, pedigree, health records, financial data, and breeder info.
 */
export async function getPacketData(dogId: string): Promise<PacketData | null> {
  const db = loadDb();
  const dog = db.dogs.find(d => d.id === dogId);
  if (!dog) return null;
  
  // Get sire and dam
  const sire = dog.sireId ? db.dogs.find(d => d.id === dog.sireId) || null : null;
  const dam = dog.damId ? db.dogs.find(d => d.id === dog.damId) || null : null;
  
  // Build pedigree ancestors up to 4 generations
  const pedigreeAncestors: PacketData['pedigreeAncestors'] = [];
  
  // Helper to add ancestors recursively
  const addAncestors = (parent: Dog | null, generation: number, positionPrefix: string) => {
    if (!parent || generation > 4) return;
    
    // Get sire of this parent (paternal)
    const parentSire = parent.sireId ? db.dogs.find(d => d.id === parent.sireId) || null : null;
    const parentDam = parent.damId ? db.dogs.find(d => d.id === parent.damId) || null : null;
    
    if (parentSire) {
      pedigreeAncestors.push({
        generation,
        position: positionPrefix + 'S',
        dog: parentSire,
        name: parentSire.name,
        registrationNumber: parentSire.registrationNumber || null,
        color: parentSire.color || null,
      });
      addAncestors(parentSire, generation + 1, positionPrefix + 'S');
    }
    
    if (parentDam) {
      pedigreeAncestors.push({
        generation,
        position: positionPrefix + 'D',
        dog: parentDam,
        name: parentDam.name,
        registrationNumber: parentDam.registrationNumber || null,
        color: parentDam.color || null,
      });
      addAncestors(parentDam, generation + 1, positionPrefix + 'D');
    }
  };
  
  // Start building pedigree from generation 2 (grandparents)
  if (sire) {
    addAncestors(sire, 2, 'S'); // Sire's side: SS = paternal grandfather, SD = paternal grandmother
  }
  if (dam) {
    addAncestors(dam, 2, 'D'); // Dam's side: DS = maternal grandfather, DD = maternal grandmother
  }
  
  // Get health records
  const vaccinations = db.vaccinations.filter(v => v.dogId === dogId);
  const medicalRecords = db.medicalRecords.filter(m => m.dogId === dogId);
  const weightEntries = db.weightEntries.filter(w => w.dogId === dogId);
  const geneticTests = db.geneticTests.filter(g => g.dogId === dogId);
  
  // Get photos
  const dogPhotos = db.dogPhotos.filter(p => p.dogId === dogId);
  const sirePhoto = sire?.profilePhotoPath || null;
  const damPhoto = dam?.profilePhotoPath || null;
  
  // Get sale and client info - find sale that includes this dog
  const salePuppy = db.salePuppies.find(sp => sp.dogId === dogId);
  let sale: Sale | null = null;
  let client: Client | null = null;
  
  if (salePuppy) {
    const saleRecord = db.sales.find(s => s.id === salePuppy.saleId);
    if (saleRecord) {
      sale = {
        ...saleRecord,
        client: db.clients.find(c => c.id === saleRecord.clientId),
        puppies: db.salePuppies.filter(sp => sp.saleId === saleRecord.id).map(sp => ({
          ...sp,
          dog: db.dogs.find(d => d.id === sp.dogId),
        })),
        transport: saleRecord.transportId ? db.transports.find(t => t.id === saleRecord.transportId) || null : null,
        convertedInterests: db.clientInterests.filter(ci => ci.convertedToSaleId === saleRecord.id),
      };
      client = sale.client || null;
    }
  }
  
  // Get expenses related to this dog
  const expenses = db.expenses.filter(e => e.relatedDogId === dogId);
  
  // Get breeder settings
  const settings = db.settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string>);
  
  const breederSettings: BreederSettings = {
    kennelName: settings['breeder.kennelName'] || 'Respectabullz',
    breederName: settings['breeder.breederName'] || '',
    addressLine1: settings['breeder.addressLine1'] || '',
    addressLine2: settings['breeder.addressLine2'] || '',
    city: settings['breeder.city'] || '',
    state: settings['breeder.state'] || '',
    postalCode: settings['breeder.postalCode'] || '',
    phone: settings['breeder.phone'] || '',
    email: settings['breeder.email'] || '',
    kennelRegistration: settings['breeder.kennelRegistration'] || '',
    kennelPrefix: settings['breeder.kennelPrefix'] || '',
    county: settings['breeder.county'] || '',
  };
  
  return {
    dog: {
      ...dog,
      sire,
      dam,
      birthLitter: dog.litterId ? db.litters.find(l => l.id === dog.litterId) || null : null,
      vaccinations,
      weightEntries,
      medicalRecords,
      geneticTests,
    },
    sire,
    dam,
    pedigreeAncestors,
    vaccinations,
    medicalRecords,
    weightEntries,
    geneticTests,
    dogPhotos,
    sirePhoto,
    damPhoto,
    sale,
    client,
    expenses,
    breederSettings,
  };
}

// ============================================
// SEED DATA FOR TESTING
// ============================================

export async function seedDatabase(): Promise<void> {
  // Check if database already has data
  const existingDb = loadDb();
  const hasData = 
    existingDb.dogs.length > 0 ||
    existingDb.litters.length > 0 ||
    existingDb.clients.length > 0 ||
    existingDb.sales.length > 0 ||
    existingDb.expenses.length > 0 ||
    existingDb.heatCycles.length > 0;
  
  if (hasData) {
    throw new Error('Cannot seed test data: Database already contains data. Please clear the database first.');
  }
  
  const db = emptyDb;
  const now = new Date();
  
  // Helper functions
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const daysFromNow = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  // ============================================
  // BREEDING STOCK DOGS
  // ============================================
  
  // ============================================
  // GENERATION 4 (Great-Great-Grandparents) - 16 dogs
  // ============================================
  const gggs1Id = generateId(); // Sire1's paternal great-grandsire's sire
  const gggd1Id = generateId();
  const gggs2Id = generateId();
  const gggd2Id = generateId();
  const gggs3Id = generateId();
  const gggd3Id = generateId();
  const gggs4Id = generateId();
  const gggd4Id = generateId();
  const gggs5Id = generateId();
  const gggd5Id = generateId();
  const gggs6Id = generateId();
  const gggd6Id = generateId();
  const gggs7Id = generateId();
  const gggd7Id = generateId();
  const gggs8Id = generateId();
  const gggd8Id = generateId();

  // ============================================
  // GENERATION 3 (Great-Grandparents) - 8 dogs
  // ============================================
  const ggs1Id = generateId(); // Sire1's paternal grandsire's sire
  const ggd1Id = generateId();
  const ggs2Id = generateId(); // Sire1's paternal grandsire's dam
  const ggd2Id = generateId();
  const ggs3Id = generateId(); // Sire1's paternal granddam's sire
  const ggd3Id = generateId();
  const ggs4Id = generateId(); // Sire1's paternal granddam's dam
  const ggd4Id = generateId();
  const ggs5Id = generateId(); // Sire1's maternal grandsire's sire
  const ggd5Id = generateId();
  const ggs6Id = generateId(); // Sire1's maternal grandsire's dam
  const ggd6Id = generateId();
  const ggs7Id = generateId(); // Sire1's maternal granddam's sire
  const ggd7Id = generateId();
  const ggs8Id = generateId(); // Sire1's maternal granddam's dam
  const ggd8Id = generateId();

  // ============================================
  // GENERATION 2 (Grandparents) - 4 dogs for Sire1
  // ============================================
  const pgs1Id = generateId(); // Sire1's paternal grandsire
  const pgd1Id = generateId(); // Sire1's paternal granddam
  const mgs1Id = generateId(); // Sire1's maternal grandsire
  const mgd1Id = generateId(); // Sire1's maternal granddam

  // Grandparents for Sire2, Dam1, Dam2, Dam3 (sharing some ancestors)
  const pgs2Id = generateId(); // Sire2's paternal grandsire
  const pgd2Id = generateId(); // Sire2's paternal granddam
  const mgs2Id = generateId(); // Sire2's maternal grandsire
  const mgd2Id = generateId(); // Sire2's maternal granddam

  const pgs3Id = generateId(); // Dam1's paternal grandsire
  const pgd3Id = generateId(); // Dam1's paternal granddam
  const mgs3Id = generateId(); // Dam1's maternal grandsire
  const mgd3Id = generateId(); // Dam1's maternal granddam

  const pgs4Id = generateId(); // Dam2's paternal grandsire
  const pgd4Id = generateId(); // Dam2's paternal granddam
  const mgs4Id = generateId(); // Dam2's maternal grandsire
  const mgd4Id = generateId(); // Dam2's maternal granddam

  const pgs5Id = generateId(); // Dam3's paternal grandsire
  const pgd5Id = generateId(); // Dam3's paternal granddam
  const mgs5Id = generateId(); // Dam3's maternal grandsire
  const mgd5Id = generateId(); // Dam3's maternal granddam

  // ============================================
  // GENERATION 0.5 (Parents of Breeding Stock)
  // ============================================
  const sire1SireId = generateId();
  const sire1DamId = generateId();
  const sire2SireId = generateId();
  const sire2DamId = generateId();
  const dam1SireId = generateId();
  const dam1DamId = generateId();
  const dam2SireId = generateId();
  const dam2DamId = generateId();
  const dam3SireId = generateId();
  const dam3DamId = generateId();

  // ============================================
  // GENERATION 0 (Breeding Stock)
  // ============================================
  const sire1Id = generateId();
  const sire2Id = generateId();
  const dam1Id = generateId();
  const dam2Id = generateId();
  const dam3Id = generateId();
  
  db.dogs = [
    // Generation 4 - Great-Great-Grandparents (16 dogs)
    {
      id: gggs1Id, name: 'Thunder\'s Foundation', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-GGG001', dateOfBirth: daysAgo(3650), color: 'Blue',
      microchipNumber: '982000123400001', status: 'retired', createdAt: daysAgo(3600), updatedAt: daysAgo(3600),
    },
    {
      id: gggd1Id, name: 'Storm\'s Legacy', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-GGG002', dateOfBirth: daysAgo(3650), color: 'Fawn',
      microchipNumber: '982000123400002', status: 'retired', createdAt: daysAgo(3600), updatedAt: daysAgo(3600),
    },
    {
      id: gggs2Id, name: 'Royal\'s Pride', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-GGG003', dateOfBirth: daysAgo(3650), color: 'Tricolor',
      microchipNumber: '982000123400003', status: 'retired', createdAt: daysAgo(3600), updatedAt: daysAgo(3600),
    },
    {
      id: gggd2Id, name: 'Diamond\'s Crown', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-GGG004', dateOfBirth: daysAgo(3650), color: 'Lilac',
      microchipNumber: '982000123400004', status: 'retired', createdAt: daysAgo(3600), updatedAt: daysAgo(3600),
    },
    {
      id: gggs3Id, name: 'Champion\'s Bloodline', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-GGG005', dateOfBirth: daysAgo(3650), color: 'Blue Fawn',
      microchipNumber: '982000123400005', status: 'retired', createdAt: daysAgo(3600), updatedAt: daysAgo(3600),
    },
    {
      id: gggd3Id, name: 'Elite\'s Heritage', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-GGG006', dateOfBirth: daysAgo(3650), color: 'Chocolate',
      microchipNumber: '982000123400006', status: 'retired', createdAt: daysAgo(3600), updatedAt: daysAgo(3600),
    },
    {
      id: gggs4Id, name: 'Legend\'s Dynasty', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-GGG007', dateOfBirth: daysAgo(3650), color: 'Red',
      microchipNumber: '982000123400007', status: 'retired', createdAt: daysAgo(3600), updatedAt: daysAgo(3600),
    },
    {
      id: gggd4Id, name: 'Noble\'s Lineage', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-GGG008', dateOfBirth: daysAgo(3650), color: 'Blue',
      microchipNumber: '982000123400008', status: 'retired', createdAt: daysAgo(3600), updatedAt: daysAgo(3600),
    },
    {
      id: gggs5Id, name: 'Majestic\'s Origin', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-GGG009', dateOfBirth: daysAgo(3650), color: 'Tricolor',
      microchipNumber: '982000123400009', status: 'retired', createdAt: daysAgo(3600), updatedAt: daysAgo(3600),
    },
    {
      id: gggd5Id, name: 'Prestige\'s Ancestry', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-GGG010', dateOfBirth: daysAgo(3650), color: 'Lilac',
      microchipNumber: '982000123400010', status: 'retired', createdAt: daysAgo(3600), updatedAt: daysAgo(3600),
    },
    {
      id: gggs6Id, name: 'Supreme\'s Foundation', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-GGG011', dateOfBirth: daysAgo(3650), color: 'Blue Fawn',
      microchipNumber: '982000123400011', status: 'retired', createdAt: daysAgo(3600), updatedAt: daysAgo(3600),
    },
    {
      id: gggd6Id, name: 'Excellence\'s Legacy', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-GGG012', dateOfBirth: daysAgo(3650), color: 'Chocolate',
      microchipNumber: '982000123400012', status: 'retired', createdAt: daysAgo(3600), updatedAt: daysAgo(3600),
    },
    {
      id: gggs7Id, name: 'Grandeur\'s Bloodline', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-GGG013', dateOfBirth: daysAgo(3650), color: 'Red',
      microchipNumber: '982000123400013', status: 'retired', createdAt: daysAgo(3600), updatedAt: daysAgo(3600),
    },
    {
      id: gggd7Id, name: 'Splendor\'s Heritage', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-GGG014', dateOfBirth: daysAgo(3650), color: 'Blue',
      microchipNumber: '982000123400014', status: 'retired', createdAt: daysAgo(3600), updatedAt: daysAgo(3600),
    },
    {
      id: gggs8Id, name: 'Magnificence\'s Origin', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-GGG015', dateOfBirth: daysAgo(3650), color: 'Tricolor',
      microchipNumber: '982000123400015', status: 'retired', createdAt: daysAgo(3600), updatedAt: daysAgo(3600),
    },
    {
      id: gggd8Id, name: 'Brilliance\'s Ancestry', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-GGG016', dateOfBirth: daysAgo(3650), color: 'Lilac',
      microchipNumber: '982000123400016', status: 'retired', createdAt: daysAgo(3600), updatedAt: daysAgo(3600),
    },

    // Generation 3 - Great-Grandparents (8 dogs for Sire1's line)
    {
      id: ggs1Id, name: 'Thunder\'s Grandsire', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-GG001', dateOfBirth: daysAgo(3285), color: 'Blue Fawn',
      microchipNumber: '982000123400101', status: 'retired', sireId: gggs1Id, damId: gggd1Id,
      createdAt: daysAgo(3200), updatedAt: daysAgo(3200),
    },
    {
      id: ggd1Id, name: 'Storm\'s Granddam', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-GG002', dateOfBirth: daysAgo(3285), color: 'Fawn',
      microchipNumber: '982000123400102', status: 'retired', sireId: gggs2Id, damId: gggd2Id,
      createdAt: daysAgo(3200), updatedAt: daysAgo(3200),
    },
    {
      id: ggs2Id, name: 'Royal\'s Grandsire', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-GG003', dateOfBirth: daysAgo(3285), color: 'Tricolor',
      microchipNumber: '982000123400103', status: 'retired', sireId: gggs3Id, damId: gggd3Id,
      createdAt: daysAgo(3200), updatedAt: daysAgo(3200),
    },
    {
      id: ggd2Id, name: 'Diamond\'s Granddam', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-GG004', dateOfBirth: daysAgo(3285), color: 'Lilac',
      microchipNumber: '982000123400104', status: 'retired', sireId: gggs4Id, damId: gggd4Id,
      createdAt: daysAgo(3200), updatedAt: daysAgo(3200),
    },
    {
      id: ggs3Id, name: 'Champion\'s Grandsire', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-GG005', dateOfBirth: daysAgo(3285), color: 'Blue Fawn',
      microchipNumber: '982000123400105', status: 'retired', sireId: gggs5Id, damId: gggd5Id,
      createdAt: daysAgo(3200), updatedAt: daysAgo(3200),
    },
    {
      id: ggd3Id, name: 'Elite\'s Granddam', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-GG006', dateOfBirth: daysAgo(3285), color: 'Chocolate',
      microchipNumber: '982000123400106', status: 'retired', sireId: gggs6Id, damId: gggd6Id,
      createdAt: daysAgo(3200), updatedAt: daysAgo(3200),
    },
    {
      id: ggs4Id, name: 'Legend\'s Grandsire', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-GG007', dateOfBirth: daysAgo(3285), color: 'Red',
      microchipNumber: '982000123400107', status: 'retired', sireId: gggs7Id, damId: gggd7Id,
      createdAt: daysAgo(3200), updatedAt: daysAgo(3200),
    },
    {
      id: ggd4Id, name: 'Noble\'s Granddam', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-GG008', dateOfBirth: daysAgo(3285), color: 'Blue',
      microchipNumber: '982000123400108', status: 'retired', sireId: gggs8Id, damId: gggd8Id,
      createdAt: daysAgo(3200), updatedAt: daysAgo(3200),
    },

    // Generation 2 - Grandparents (for Sire1)
    {
      id: pgs1Id, name: 'Thunder\'s Paternal Grandsire', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-G001', dateOfBirth: daysAgo(2555), color: 'Blue Fawn',
      microchipNumber: '982000123401001', status: 'retired', sireId: ggs1Id, damId: ggd1Id,
      createdAt: daysAgo(2500), updatedAt: daysAgo(2500),
    },
    {
      id: pgd1Id, name: 'Thunder\'s Paternal Granddam', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-G002', dateOfBirth: daysAgo(2555), color: 'Fawn',
      microchipNumber: '982000123401002', status: 'retired', sireId: ggs2Id, damId: ggd2Id,
      createdAt: daysAgo(2500), updatedAt: daysAgo(2500),
    },
    {
      id: mgs1Id, name: 'Thunder\'s Maternal Grandsire', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-G003', dateOfBirth: daysAgo(2555), color: 'Tricolor',
      microchipNumber: '982000123401003', status: 'retired', sireId: ggs3Id, damId: ggd3Id,
      createdAt: daysAgo(2500), updatedAt: daysAgo(2500),
    },
    {
      id: mgd1Id, name: 'Thunder\'s Maternal Granddam', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-G004', dateOfBirth: daysAgo(2555), color: 'Lilac',
      microchipNumber: '982000123401004', status: 'retired', sireId: ggs4Id, damId: ggd4Id,
      createdAt: daysAgo(2500), updatedAt: daysAgo(2500),
    },

    // Grandparents for Sire2
    {
      id: pgs2Id, name: 'Royal\'s Paternal Grandsire', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-G005', dateOfBirth: daysAgo(2555), color: 'Blue',
      microchipNumber: '982000123401005', status: 'retired', sireId: ggs1Id, damId: ggd2Id, // Shared ancestors
      createdAt: daysAgo(2500), updatedAt: daysAgo(2500),
    },
    {
      id: pgd2Id, name: 'Royal\'s Paternal Granddam', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-G006', dateOfBirth: daysAgo(2555), color: 'Chocolate',
      microchipNumber: '982000123401006', status: 'retired', sireId: ggs3Id, damId: ggd4Id,
      createdAt: daysAgo(2500), updatedAt: daysAgo(2500),
    },
    {
      id: mgs2Id, name: 'Royal\'s Maternal Grandsire', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-G007', dateOfBirth: daysAgo(2555), color: 'Red',
      microchipNumber: '982000123401007', status: 'retired', sireId: ggs5Id, damId: ggd6Id,
      createdAt: daysAgo(2500), updatedAt: daysAgo(2500),
    },
    {
      id: mgd2Id, name: 'Royal\'s Maternal Granddam', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-G008', dateOfBirth: daysAgo(2555), color: 'Blue Fawn',
      microchipNumber: '982000123401008', status: 'retired', sireId: ggs7Id, damId: ggd8Id,
      createdAt: daysAgo(2500), updatedAt: daysAgo(2500),
    },

    // Grandparents for Dam1
    {
      id: pgs3Id, name: 'Bella\'s Paternal Grandsire', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-G009', dateOfBirth: daysAgo(2555), color: 'Tricolor',
      microchipNumber: '982000123401009', status: 'retired', sireId: ggs2Id, damId: ggd1Id,
      createdAt: daysAgo(2500), updatedAt: daysAgo(2500),
    },
    {
      id: pgd3Id, name: 'Bella\'s Paternal Granddam', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-G010', dateOfBirth: daysAgo(2555), color: 'Lilac',
      microchipNumber: '982000123401010', status: 'retired', sireId: ggs4Id, damId: ggd3Id,
      createdAt: daysAgo(2500), updatedAt: daysAgo(2500),
    },
    {
      id: mgs3Id, name: 'Bella\'s Maternal Grandsire', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-G011', dateOfBirth: daysAgo(2555), color: 'Chocolate',
      microchipNumber: '982000123401011', status: 'retired', sireId: ggs6Id, damId: ggd5Id,
      createdAt: daysAgo(2500), updatedAt: daysAgo(2500),
    },
    {
      id: mgd3Id, name: 'Bella\'s Maternal Granddam', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-G012', dateOfBirth: daysAgo(2555), color: 'Blue',
      microchipNumber: '982000123401012', status: 'retired', sireId: ggs8Id, damId: ggd7Id,
      createdAt: daysAgo(2500), updatedAt: daysAgo(2500),
    },

    // Grandparents for Dam2
    {
      id: pgs4Id, name: 'Diamond\'s Paternal Grandsire', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-G013', dateOfBirth: daysAgo(2555), color: 'Blue Fawn',
      microchipNumber: '982000123401013', status: 'retired', sireId: ggs1Id, damId: ggd3Id,
      createdAt: daysAgo(2500), updatedAt: daysAgo(2500),
    },
    {
      id: pgd4Id, name: 'Diamond\'s Paternal Granddam', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-G014', dateOfBirth: daysAgo(2555), color: 'Red',
      microchipNumber: '982000123401014', status: 'retired', sireId: ggs5Id, damId: ggd7Id,
      createdAt: daysAgo(2500), updatedAt: daysAgo(2500),
    },
    {
      id: mgs4Id, name: 'Diamond\'s Maternal Grandsire', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-G015', dateOfBirth: daysAgo(2555), color: 'Tricolor',
      microchipNumber: '982000123401015', status: 'retired', sireId: ggs3Id, damId: ggd6Id,
      createdAt: daysAgo(2500), updatedAt: daysAgo(2500),
    },
    {
      id: mgd4Id, name: 'Diamond\'s Maternal Granddam', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-G016', dateOfBirth: daysAgo(2555), color: 'Lilac',
      microchipNumber: '982000123401016', status: 'retired', sireId: ggs7Id, damId: ggd8Id,
      createdAt: daysAgo(2500), updatedAt: daysAgo(2500),
    },

    // Grandparents for Dam3
    {
      id: pgs5Id, name: 'Ruby\'s Paternal Grandsire', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-G017', dateOfBirth: daysAgo(2555), color: 'Chocolate',
      microchipNumber: '982000123401017', status: 'retired', sireId: ggs2Id, damId: ggd4Id,
      createdAt: daysAgo(2500), updatedAt: daysAgo(2500),
    },
    {
      id: pgd5Id, name: 'Ruby\'s Paternal Granddam', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-G018', dateOfBirth: daysAgo(2555), color: 'Blue',
      microchipNumber: '982000123401018', status: 'retired', sireId: ggs6Id, damId: ggd8Id,
      createdAt: daysAgo(2500), updatedAt: daysAgo(2500),
    },
    {
      id: mgs5Id, name: 'Ruby\'s Maternal Grandsire', sex: 'M', breed: 'American Bully',
      registrationNumber: 'ABKC-G019', dateOfBirth: daysAgo(2555), color: 'Red',
      microchipNumber: '982000123401019', status: 'retired', sireId: ggs4Id, damId: ggd2Id,
      createdAt: daysAgo(2500), updatedAt: daysAgo(2500),
    },
    {
      id: mgd5Id, name: 'Ruby\'s Maternal Granddam', sex: 'F', breed: 'American Bully',
      registrationNumber: 'ABKC-G020', dateOfBirth: daysAgo(2555), color: 'Blue Fawn',
      microchipNumber: '982000123401020', status: 'retired', sireId: ggs8Id, damId: ggd1Id,
      createdAt: daysAgo(2500), updatedAt: daysAgo(2500),
    },

    // Generation 0.5 - Parents of Breeding Stock
    // Sire1's parents
    {
      id: sire1SireId,
      name: 'Thunder\'s Sire',
      sex: 'M',
      breed: 'American Bully',
      registrationNumber: 'ABKC-P001',
      dateOfBirth: daysAgo(2190), // 6 years old
      color: 'Blue Fawn',
      microchipNumber: '982000123450001',
      status: 'retired',
      sireId: pgs1Id,
      damId: pgd1Id,
      createdAt: daysAgo(2100),
      updatedAt: daysAgo(2100),
    },
    {
      id: sire1DamId,
      name: 'Thunder\'s Dam',
      sex: 'F',
      breed: 'American Bully',
      registrationNumber: 'ABKC-P002',
      dateOfBirth: daysAgo(2190), // 6 years old
      color: 'Fawn',
      microchipNumber: '982000123450002',
      status: 'retired',
      sireId: mgs1Id,
      damId: mgd1Id,
      createdAt: daysAgo(2100),
      updatedAt: daysAgo(2100),
    },
    // Sire2's parents
    {
      id: sire2SireId,
      name: 'Royal\'s Sire',
      sex: 'M',
      breed: 'American Bully',
      registrationNumber: 'ABKC-P003',
      dateOfBirth: daysAgo(2190), // 6 years old
      color: 'Tricolor',
      microchipNumber: '982000123450003',
      status: 'retired',
      sireId: pgs2Id,
      damId: pgd2Id,
      createdAt: daysAgo(2100),
      updatedAt: daysAgo(2100),
    },
    {
      id: sire2DamId,
      name: 'Royal\'s Dam',
      sex: 'F',
      breed: 'American Bully',
      registrationNumber: 'ABKC-P004',
      dateOfBirth: daysAgo(2190), // 6 years old
      color: 'Lilac',
      microchipNumber: '982000123450004',
      status: 'retired',
      sireId: mgs2Id,
      damId: mgd2Id,
      createdAt: daysAgo(2100),
      updatedAt: daysAgo(2100),
    },
    // Dam1's parents
    {
      id: dam1SireId,
      name: 'Bella\'s Sire',
      sex: 'M',
      breed: 'American Bully',
      registrationNumber: 'ABKC-P005',
      dateOfBirth: daysAgo(2190), // 6 years old
      color: 'Chocolate',
      microchipNumber: '982000123450005',
      status: 'retired',
      sireId: pgs3Id,
      damId: pgd3Id,
      createdAt: daysAgo(2100),
      updatedAt: daysAgo(2100),
    },
    {
      id: dam1DamId,
      name: 'Bella\'s Dam',
      sex: 'F',
      breed: 'American Bully',
      registrationNumber: 'ABKC-P006',
      dateOfBirth: daysAgo(2190), // 6 years old
      color: 'Blue',
      microchipNumber: '982000123450006',
      status: 'retired',
      sireId: mgs3Id,
      damId: mgd3Id,
      createdAt: daysAgo(2100),
      updatedAt: daysAgo(2100),
    },
    // Dam2's parents
    {
      id: dam2SireId,
      name: 'Diamond\'s Sire',
      sex: 'M',
      breed: 'American Bully',
      registrationNumber: 'ABKC-P007',
      dateOfBirth: daysAgo(2190), // 6 years old
      color: 'Lilac',
      microchipNumber: '982000123450007',
      status: 'retired',
      sireId: pgs4Id,
      damId: pgd4Id,
      createdAt: daysAgo(2100),
      updatedAt: daysAgo(2100),
    },
    {
      id: dam2DamId,
      name: 'Diamond\'s Dam',
      sex: 'F',
      breed: 'American Bully',
      registrationNumber: 'ABKC-P008',
      dateOfBirth: daysAgo(2190), // 6 years old
      color: 'Tricolor',
      microchipNumber: '982000123450008',
      status: 'retired',
      sireId: mgs4Id,
      damId: mgd4Id,
      createdAt: daysAgo(2100),
      updatedAt: daysAgo(2100),
    },
    // Dam3's parents
    {
      id: dam3SireId,
      name: 'Ruby\'s Sire',
      sex: 'M',
      breed: 'American Bully',
      registrationNumber: 'ABKC-P009',
      dateOfBirth: daysAgo(2190), // 6 years old
      color: 'Red',
      microchipNumber: '982000123450009',
      status: 'retired',
      sireId: pgs5Id,
      damId: pgd5Id,
      createdAt: daysAgo(2100),
      updatedAt: daysAgo(2100),
    },
    {
      id: dam3DamId,
      name: 'Ruby\'s Dam',
      sex: 'F',
      breed: 'American Bully',
      registrationNumber: 'ABKC-P010',
      dateOfBirth: daysAgo(2190), // 6 years old
      color: 'Blue Fawn',
      microchipNumber: '982000123450010',
      status: 'retired',
      sireId: mgs5Id,
      damId: mgd5Id,
      createdAt: daysAgo(2100),
      updatedAt: daysAgo(2100),
    },

    // Generation 0 - Breeding Stock (Sires and Dams)
    {
      id: sire1Id,
      name: 'Champion Thunder\'s Legacy',
      sex: 'M',
      breed: 'American Bully',
      registrationNumber: 'ABKC-12345',
      dateOfBirth: daysAgo(1825), // 5 years old
      color: 'Blue Fawn',
      microchipNumber: '982000123456789',
      status: 'active',
      sireId: sire1SireId,
      damId: sire1DamId,
      notes: 'Excellent structure, proven sire. Multiple champions in pedigree.',
      createdAt: daysAgo(1800),
      updatedAt: daysAgo(30),
    },
    {
      id: sire2Id,
      name: 'Royal Blue\'s Titan',
      sex: 'M',
      breed: 'American Bully',
      registrationNumber: 'ABKC-12346',
      dateOfBirth: daysAgo(1460), // 4 years old
      color: 'Tricolor',
      microchipNumber: '982000123456790',
      status: 'active',
      sireId: sire2SireId,
      damId: sire2DamId,
      notes: 'Strong genetics, great temperament.',
      createdAt: daysAgo(1400),
      updatedAt: daysAgo(15),
    },
    {
      id: dam1Id,
      name: 'Bella\'s Pride',
      sex: 'F',
      breed: 'American Bully',
      registrationNumber: 'ABKC-12347',
      dateOfBirth: daysAgo(1095), // 3 years old
      color: 'Chocolate',
      microchipNumber: '982000123456791',
      status: 'active',
      sireId: dam1SireId,
      damId: dam1DamId,
      notes: 'Excellent mother, great producer.',
      createdAt: daysAgo(1000),
      updatedAt: daysAgo(10),
    },
    {
      id: dam2Id,
      name: 'Diamond\'s Grace',
      sex: 'F',
      breed: 'American Bully',
      registrationNumber: 'ABKC-12348',
      dateOfBirth: daysAgo(1460), // 4 years old
      color: 'Lilac',
      microchipNumber: '982000123456792',
      status: 'active',
      sireId: dam2SireId,
      damId: dam2DamId,
      notes: 'Proven dam, excellent health.',
      createdAt: daysAgo(1400),
      updatedAt: daysAgo(20),
    },
    {
      id: dam3Id,
      name: 'Ruby\'s Elegance',
      sex: 'F',
      breed: 'American Bully',
      registrationNumber: 'ABKC-12349',
      dateOfBirth: daysAgo(730), // 2 years old
      color: 'Red',
      microchipNumber: '982000123456793',
      status: 'active',
      sireId: dam3SireId,
      damId: dam3DamId,
      notes: 'Young female, first breeding planned.',
      createdAt: daysAgo(600),
      updatedAt: daysAgo(5),
    },
  ];
  
  // ============================================
  // LITTERS
  // ============================================
  
  const litter1Id = generateId();
  const litter2Id = generateId();
  
  db.litters = [
    {
      id: litter1Id,
      code: 'T-B-2024-A',
      nickname: 'Thunder x Bella Litter',
      breedingDate: daysAgo(120),
      dueDate: daysAgo(57), // 63 days gestation (120-63=57) ✓
      whelpDate: daysAgo(55), // Whelped 2 days early
      totalBorn: 8,
      totalAlive: 8,
      status: 'weaning',
      sireId: sire1Id,
      damId: dam1Id,
      ultrasoundDate: daysAgo(90),
      ultrasoundResult: 'pregnant',
      ultrasoundPuppyCount: 8,
      xrayDate: daysAgo(50),
      xrayPuppyCount: 8,
      notes: 'Excellent litter, all healthy puppies.',
      createdAt: daysAgo(125),
      updatedAt: daysAgo(1),
    },
    {
      id: litter2Id,
      code: 'R-D-2024-B',
      nickname: 'Royal x Diamond Litter',
      breedingDate: daysAgo(73), // Fixed: 73 days ago, so due date 63 days later = 10 days ago
      dueDate: daysAgo(10), // 63 days gestation (73-63=10) ✓
      whelpDate: daysAgo(10), // Whelped on due date
      totalBorn: 6,
      totalAlive: 6,
      status: 'whelped',
      sireId: sire2Id,
      damId: dam2Id,
      ultrasoundDate: daysAgo(58), // ~15 days after breeding
      ultrasoundResult: 'pregnant',
      ultrasoundPuppyCount: 6,
      notes: 'Beautiful litter, strong puppies.',
      createdAt: daysAgo(78),
      updatedAt: daysAgo(1),
    },
  ];
  
  // ============================================
  // PUPPIES
  // ============================================
  
  const puppyNames1 = ['Thunder Jr', 'Bella\'s Boy', 'Storm', 'Lightning', 'Thunder\'s Girl', 'Bella\'s Princess', 'Thunder\'s Prince', 'Bella\'s Star'];
  const puppyNames2 = ['Royal\'s Legacy', 'Diamond\'s Gem', 'Royal\'s Crown', 'Diamond\'s Jewel', 'Royal\'s Pride', 'Diamond\'s Shine'];
  
  const puppies1 = puppyNames1.map((name, idx) => ({
    id: generateId(),
    name,
    sex: (idx < 4 ? 'M' : 'F') as 'M' | 'F',
    breed: 'American Bully',
    dateOfBirth: daysAgo(55),
    color: ['Blue Fawn', 'Chocolate', 'Blue', 'Tricolor', 'Chocolate', 'Blue Fawn', 'Tricolor', 'Chocolate'][idx],
    microchipNumber: `98200012345${7000 + idx}`,
    status: (idx < 2 ? 'sold' : 'active') as 'active' | 'sold' | 'retired' | 'deceased',
    litterId: litter1Id,
    sireId: sire1Id,
    damId: dam1Id,
    evaluationCategory: (idx === 0 ? 'show_prospect' : idx === 1 ? 'breeding_prospect' : 'pet') as 'show_prospect' | 'breeding_prospect' | 'pet' | null,
    structureNotes: idx === 0 ? 'Excellent structure, show quality' : null,
    temperamentNotes: idx === 0 ? 'Confident, friendly' : null,
    registrationStatus: (idx < 2 ? 'registered' : 'pending') as 'not_registered' | 'pending' | 'registered' | null,
    registrationType: (idx < 2 ? 'full' : 'limited') as 'full' | 'limited' | null,
    createdAt: daysAgo(55),
    updatedAt: daysAgo(1),
  }));
  
  const puppies2 = puppyNames2.map((name, idx) => ({
    id: generateId(),
    name,
    sex: (idx < 3 ? 'M' : 'F') as 'M' | 'F',
    breed: 'American Bully',
    dateOfBirth: daysAgo(10),
    color: ['Tricolor', 'Lilac', 'Tricolor', 'Lilac', 'Tricolor', 'Lilac'][idx],
    microchipNumber: `98200012345${8000 + idx}`,
    status: 'active' as 'active' | 'sold' | 'retired' | 'deceased',
    litterId: litter2Id,
    sireId: sire2Id,
    damId: dam2Id,
    evaluationCategory: (idx === 0 ? 'show_prospect' : 'pet') as 'show_prospect' | 'breeding_prospect' | 'pet' | null,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(1),
  }));
  
  db.dogs.push(...puppies1, ...puppies2);
  
  // ============================================
  // HEAT CYCLES (Historical cycles for each dam)
  // ============================================
  
  // Dam 1 - Multiple historical cycles
  const dam1Cycle1Id = generateId();
  const dam1Cycle2Id = generateId();
  const dam1Cycle3Id = generateId();
  const dam1Cycle4Id = generateId();
  
  // Dam 2 - Multiple historical cycles
  const dam2Cycle1Id = generateId();
  const dam2Cycle2Id = generateId();
  const dam2Cycle3Id = generateId();
  
  // Dam 3 - First cycle
  const dam3Cycle1Id = generateId();
  
  // Dam 1 - Active cycle (currently in progress)
  const dam1ActiveCycleId = generateId();
  
  db.heatCycles = [
    // Dam 1 - Current cycle (bred)
    {
      id: dam1Cycle1Id,
      bitchId: dam1Id,
      startDate: daysAgo(180),
      standingHeatStart: daysAgo(172),
      standingHeatEnd: daysAgo(165),
      ovulationDate: daysAgo(170),
      optimalBreedingStart: daysAgo(168),
      optimalBreedingEnd: daysAgo(163),
      endDate: daysAgo(120),
      expectedDueDate: daysAgo(57),
      nextHeatEstimate: daysFromNow(30),
      cycleLength: 21,
      currentPhase: 'diestrus',
      isBred: true,
      notes: 'Bred to Thunder\'s Legacy - successful breeding',
      createdAt: daysAgo(180),
      updatedAt: daysAgo(120),
    },
    // Dam 1 - Previous cycle (not bred)
    {
      id: dam1Cycle2Id,
      bitchId: dam1Id,
      startDate: daysAgo(360),
      standingHeatStart: daysAgo(352),
      standingHeatEnd: daysAgo(345),
      ovulationDate: daysAgo(350),
      optimalBreedingStart: daysAgo(348),
      optimalBreedingEnd: daysAgo(343),
      endDate: daysAgo(300),
      nextHeatEstimate: daysAgo(180),
      cycleLength: 22,
      currentPhase: 'anestrus',
      isBred: false,
      notes: 'Not bred - waiting for next cycle',
      createdAt: daysAgo(360),
      updatedAt: daysAgo(300),
    },
    // Dam 1 - Earlier cycle (bred)
    {
      id: dam1Cycle3Id,
      bitchId: dam1Id,
      startDate: daysAgo(540),
      standingHeatStart: daysAgo(532),
      standingHeatEnd: daysAgo(525),
      ovulationDate: daysAgo(530),
      optimalBreedingStart: daysAgo(528),
      optimalBreedingEnd: daysAgo(523),
      endDate: daysAgo(480),
      expectedDueDate: daysAgo(417),
      nextHeatEstimate: daysAgo(360),
      cycleLength: 20,
      currentPhase: 'anestrus',
      isBred: true,
      notes: 'Previous successful breeding',
      createdAt: daysAgo(540),
      updatedAt: daysAgo(480),
    },
    // Dam 1 - First recorded cycle
    {
      id: dam1Cycle4Id,
      bitchId: dam1Id,
      startDate: daysAgo(720),
      standingHeatStart: daysAgo(712),
      standingHeatEnd: daysAgo(705),
      ovulationDate: daysAgo(710),
      optimalBreedingStart: daysAgo(708),
      optimalBreedingEnd: daysAgo(703),
      endDate: daysAgo(660),
      nextHeatEstimate: daysAgo(540),
      cycleLength: 21,
      currentPhase: 'anestrus',
      isBred: false,
      notes: 'First heat cycle recorded',
      createdAt: daysAgo(720),
      updatedAt: daysAgo(660),
    },
    // Dam 2 - Current cycle (bred)
    {
      id: dam2Cycle1Id,
      bitchId: dam2Id,
      startDate: daysAgo(133), // Fixed: Adjusted to match litter breeding date
      standingHeatStart: daysAgo(125),
      standingHeatEnd: daysAgo(118),
      ovulationDate: daysAgo(123),
      optimalBreedingStart: daysAgo(121),
      optimalBreedingEnd: daysAgo(116),
      endDate: daysAgo(73), // Cycle ended when breeding occurred
      expectedDueDate: daysAgo(10), // 63 days from ovulation (123-63=60, but using breeding date: 73-63=10)
      nextHeatEstimate: daysFromNow(120),
      cycleLength: 20,
      currentPhase: 'diestrus',
      isBred: true,
      notes: 'Bred to Royal Blue\'s Titan',
      createdAt: daysAgo(133),
      updatedAt: daysAgo(73),
    },
    // Dam 2 - Previous cycle (not bred)
    {
      id: dam2Cycle2Id,
      bitchId: dam2Id,
      startDate: daysAgo(285),
      standingHeatStart: daysAgo(277),
      standingHeatEnd: daysAgo(270),
      ovulationDate: daysAgo(275),
      optimalBreedingStart: daysAgo(273),
      optimalBreedingEnd: daysAgo(268),
      endDate: daysAgo(225),
      nextHeatEstimate: daysAgo(105),
      cycleLength: 19,
      currentPhase: 'anestrus',
      isBred: false,
      notes: 'Rest cycle',
      createdAt: daysAgo(285),
      updatedAt: daysAgo(225),
    },
    // Dam 2 - Earlier cycle (bred)
    {
      id: dam2Cycle3Id,
      bitchId: dam2Id,
      startDate: daysAgo(465),
      standingHeatStart: daysAgo(457),
      standingHeatEnd: daysAgo(450),
      ovulationDate: daysAgo(455),
      optimalBreedingStart: daysAgo(453),
      optimalBreedingEnd: daysAgo(448),
      endDate: daysAgo(405),
      expectedDueDate: daysAgo(342),
      nextHeatEstimate: daysAgo(285),
      cycleLength: 21,
      currentPhase: 'anestrus',
      isBred: true,
      notes: 'Previous successful breeding',
      createdAt: daysAgo(465),
      updatedAt: daysAgo(405),
    },
    // Dam 3 - First cycle (not bred)
    {
      id: dam3Cycle1Id,
      bitchId: dam3Id,
      startDate: daysAgo(30),
      standingHeatStart: daysAgo(22),
      standingHeatEnd: daysAgo(15),
      ovulationDate: daysAgo(20),
      optimalBreedingStart: daysAgo(18),
      optimalBreedingEnd: daysAgo(13),
      endDate: daysAgo(5),
      nextHeatEstimate: daysFromNow(150),
      cycleLength: 19,
      currentPhase: 'anestrus',
      isBred: false,
      notes: 'First heat cycle - not bred, waiting for maturity',
      createdAt: daysAgo(30),
      updatedAt: daysAgo(5),
    },
    // Dam 1 - Active heat cycle (currently in progress)
    {
      id: dam1ActiveCycleId,
      bitchId: dam1Id,
      startDate: daysAgo(8),
      standingHeatStart: null,
      standingHeatEnd: null,
      ovulationDate: null,
      optimalBreedingStart: null,
      optimalBreedingEnd: null,
      endDate: null,
      expectedDueDate: null,
      nextHeatEstimate: null,
      cycleLength: null,
      currentPhase: 'proestrus',
      isBred: false,
      notes: 'Active heat cycle - currently in proestrus, monitoring for breeding window',
      createdAt: daysAgo(8),
      updatedAt: daysAgo(1),
    },
  ];
  
  // ============================================
  // HEAT EVENTS (Detailed tracking for each cycle)
  // ============================================
  
  db.heatEvents = [
    // Dam 1 Cycle 1 - Current breeding cycle
    {
      id: generateId(),
      heatCycleId: dam1Cycle1Id,
      date: daysAgo(180),
      time: '08:00',
      type: 'bleeding_start',
      notes: 'First day of bleeding observed - proestrus begins',
      createdAt: daysAgo(180),
    },
    {
      id: generateId(),
      heatCycleId: dam1Cycle1Id,
      date: daysAgo(178),
      time: '10:00',
      type: 'vulva_swelling',
      notes: 'Vulva swelling becoming noticeable',
      createdAt: daysAgo(178),
    },
    {
      id: generateId(),
      heatCycleId: dam1Cycle1Id,
      date: daysAgo(175),
      time: '14:30',
      type: 'bleeding_heavy',
      notes: 'Heavy bleeding phase',
      createdAt: daysAgo(175),
    },
    {
      id: generateId(),
      heatCycleId: dam1Cycle1Id,
      date: daysAgo(173),
      time: '09:00',
      type: 'progesterone_test',
      value: '2.5',
      unit: 'ng/mL',
      vetClinic: 'Animal Hospital',
      notes: 'Baseline progesterone - not ready',
      createdAt: daysAgo(173),
    },
    {
      id: generateId(),
      heatCycleId: dam1Cycle1Id,
      date: daysAgo(172),
      time: '14:00',
      type: 'standing',
      notes: 'Standing heat confirmed - receptive to male',
      createdAt: daysAgo(172),
    },
    {
      id: generateId(),
      heatCycleId: dam1Cycle1Id,
      date: daysAgo(171),
      time: '11:00',
      type: 'discharge_straw',
      notes: 'Straw-colored discharge - estrus indicator',
      createdAt: daysAgo(171),
    },
    {
      id: generateId(),
      heatCycleId: dam1Cycle1Id,
      date: daysAgo(170),
      time: '09:00',
      type: 'progesterone_test',
      value: '8.5',
      unit: 'ng/mL',
      vetClinic: 'Animal Hospital',
      notes: 'Ovulation confirmed - optimal breeding window',
      createdAt: daysAgo(170),
    },
    {
      id: generateId(),
      heatCycleId: dam1Cycle1Id,
      date: daysAgo(169),
      time: '10:00',
      type: 'lh_surge',
      notes: 'LH surge detected',
      createdAt: daysAgo(169),
    },
    {
      id: generateId(),
      heatCycleId: dam1Cycle1Id,
      date: daysAgo(168),
      time: '16:00',
      type: 'breeding_natural',
      sireId: sire1Id,
      breedingMethod: 'natural',
      notes: 'First natural breeding - successful tie',
      createdAt: daysAgo(168),
    },
    {
      id: generateId(),
      heatCycleId: dam1Cycle1Id,
      date: daysAgo(166),
      time: '15:00',
      type: 'breeding_natural',
      sireId: sire1Id,
      breedingMethod: 'natural',
      notes: 'Second natural breeding - successful tie',
      createdAt: daysAgo(166),
    },
    {
      id: generateId(),
      heatCycleId: dam1Cycle1Id,
      date: daysAgo(165),
      time: '18:00',
      type: 'end_receptive',
      notes: 'No longer receptive to male',
      createdAt: daysAgo(165),
    },
    {
      id: generateId(),
      heatCycleId: dam1Cycle1Id,
      date: daysAgo(120),
      time: '10:00',
      type: 'cycle_end',
      notes: 'Cycle ended - entering diestrus',
      createdAt: daysAgo(120),
    },
    // Dam 1 Cycle 2 - Previous cycle
    {
      id: generateId(),
      heatCycleId: dam1Cycle2Id,
      date: daysAgo(360),
      time: '07:30',
      type: 'bleeding_start',
      notes: 'Cycle start',
      createdAt: daysAgo(360),
    },
    {
      id: generateId(),
      heatCycleId: dam1Cycle2Id,
      date: daysAgo(352),
      time: '13:00',
      type: 'standing',
      notes: 'Standing heat',
      createdAt: daysAgo(352),
    },
    {
      id: generateId(),
      heatCycleId: dam1Cycle2Id,
      date: daysAgo(350),
      time: '09:00',
      type: 'progesterone_test',
      value: '7.2',
      unit: 'ng/mL',
      vetClinic: 'Animal Hospital',
      notes: 'Progesterone test',
      createdAt: daysAgo(350),
    },
    // Dam 2 Cycle 1 - Current breeding cycle (adjusted dates)
    {
      id: generateId(),
      heatCycleId: dam2Cycle1Id,
      date: daysAgo(133),
      time: '08:30',
      type: 'bleeding_start',
      notes: 'Cycle start',
      createdAt: daysAgo(133),
    },
    {
      id: generateId(),
      heatCycleId: dam2Cycle1Id,
      date: daysAgo(128),
      type: 'vulva_swelling',
      notes: 'Swelling observed',
      createdAt: daysAgo(128),
    },
    {
      id: generateId(),
      heatCycleId: dam2Cycle1Id,
      date: daysAgo(125),
      time: '15:00',
      type: 'standing',
      notes: 'Standing heat confirmed',
      createdAt: daysAgo(125),
    },
    {
      id: generateId(),
      heatCycleId: dam2Cycle1Id,
      date: daysAgo(123),
      time: '10:00',
      type: 'progesterone_test',
      value: '9.1',
      unit: 'ng/mL',
      vetClinic: 'Animal Hospital',
      notes: 'Ovulation confirmed',
      createdAt: daysAgo(123),
    },
    {
      id: generateId(),
      heatCycleId: dam2Cycle1Id,
      date: daysAgo(121),
      time: '17:00',
      type: 'breeding_ai',
      sireId: sire2Id,
      breedingMethod: 'AI fresh',
      notes: 'AI breeding with fresh semen',
      createdAt: daysAgo(121),
    },
    {
      id: generateId(),
      heatCycleId: dam2Cycle1Id,
      date: daysAgo(119),
      time: '17:00',
      type: 'breeding_ai',
      sireId: sire2Id,
      breedingMethod: 'AI fresh',
      notes: 'Second AI breeding',
      createdAt: daysAgo(119),
    },
    {
      id: generateId(),
      heatCycleId: dam2Cycle1Id,
      date: daysAgo(118),
      time: '19:00',
      type: 'end_receptive',
      notes: 'Receptivity ended',
      createdAt: daysAgo(118),
    },
    // Dam 3 Cycle 1 - First cycle
    {
      id: generateId(),
      heatCycleId: dam3Cycle1Id,
      date: daysAgo(30),
      time: '09:00',
      type: 'bleeding_start',
      notes: 'First heat cycle - monitoring closely',
      createdAt: daysAgo(30),
    },
    {
      id: generateId(),
      heatCycleId: dam3Cycle1Id,
      date: daysAgo(25),
      type: 'vulva_swelling',
      notes: 'Swelling noted',
      createdAt: daysAgo(25),
    },
    {
      id: generateId(),
      heatCycleId: dam3Cycle1Id,
      date: daysAgo(22),
      time: '14:00',
      type: 'standing',
      notes: 'Standing heat - not breeding this cycle',
      createdAt: daysAgo(22),
    },
    {
      id: generateId(),
      heatCycleId: dam3Cycle1Id,
      date: daysAgo(20),
      time: '10:00',
      type: 'progesterone_test',
      value: '6.8',
      unit: 'ng/mL',
      vetClinic: 'Animal Hospital',
      notes: 'Progesterone test for records',
      createdAt: daysAgo(20),
    },
    {
      id: generateId(),
      heatCycleId: dam3Cycle1Id,
      date: daysAgo(15),
      time: '16:00',
      type: 'end_receptive',
      notes: 'Cycle ending',
      createdAt: daysAgo(15),
    },
    // Dam 1 - Active cycle events (currently in progress)
    {
      id: generateId(),
      heatCycleId: dam1ActiveCycleId,
      date: daysAgo(8),
      time: '07:30',
      type: 'bleeding_start',
      notes: 'Bleeding started - proestrus phase begins',
      createdAt: daysAgo(8),
    },
    {
      id: generateId(),
      heatCycleId: dam1ActiveCycleId,
      date: daysAgo(6),
      time: '10:00',
      type: 'vulva_swelling',
      notes: 'Vulva swelling becoming noticeable',
      createdAt: daysAgo(6),
    },
    {
      id: generateId(),
      heatCycleId: dam1ActiveCycleId,
      date: daysAgo(4),
      time: '14:00',
      type: 'bleeding_heavy',
      notes: 'Heavy bleeding phase - monitoring closely',
      createdAt: daysAgo(4),
    },
    {
      id: generateId(),
      heatCycleId: dam1ActiveCycleId,
      date: daysAgo(2),
      time: '09:00',
      type: 'bleeding_light',
      notes: 'Bleeding lightening - approaching estrus',
      createdAt: daysAgo(2),
    },
    {
      id: generateId(),
      heatCycleId: dam1ActiveCycleId,
      date: daysAgo(1),
      time: '11:00',
      type: 'vulva_swelling',
      notes: 'Significant swelling - preparing for standing heat',
      createdAt: daysAgo(1),
    },
  ];
  
  // ============================================
  // VACCINATIONS
  // ============================================
  
  // Helper function to create vaccination records for a dog
  const createVaccinationRecords = (dogId: string, ageYears: number, isPuppy: boolean = false) => {
    const records = [];
    if (isPuppy) {
      // Puppy vaccination schedule
      records.push({
        id: generateId(),
        dogId,
        date: daysAgo(40),
        vaccineType: 'DHPP',
        dose: '0.5 mL',
        lotNumber: `LOT-2024-${Math.floor(Math.random() * 1000)}`,
        vetClinic: 'Animal Hospital',
        nextDueDate: daysFromNow(15),
        notes: 'First puppy shot',
        createdAt: daysAgo(40),
        updatedAt: daysAgo(40),
      });
    } else {
      // Adult vaccination schedule - annual DHPP and 3-year rabies
      const lastDHPP = ageYears > 1 ? daysAgo(90 + Math.floor(Math.random() * 180)) : daysAgo(90);
      const lastRabies = ageYears > 1 ? daysAgo(365 + Math.floor(Math.random() * 730)) : daysAgo(365);
      const daysSinceRabies = Math.floor((now.getTime() - lastRabies.getTime()) / (1000 * 60 * 60 * 24));
      const nextRabiesDue = daysFromNow(Math.max(0, 1095 - daysSinceRabies));
      
      records.push({
        id: generateId(),
        dogId,
        date: lastDHPP,
        vaccineType: 'DHPP',
        dose: '1 mL',
        lotNumber: `LOT-2024-${Math.floor(Math.random() * 1000)}`,
        vetClinic: 'Animal Hospital',
        nextDueDate: daysFromNow(275),
        notes: 'Annual vaccination',
        createdAt: lastDHPP,
        updatedAt: lastDHPP,
      });
      
      if (ageYears >= 1) {
        records.push({
          id: generateId(),
          dogId,
          date: lastRabies,
          vaccineType: 'Rabies',
          dose: '1 mL',
          lotNumber: `LOT-2024-${Math.floor(Math.random() * 1000)}`,
          vetClinic: 'Animal Hospital',
          nextDueDate: nextRabiesDue,
          notes: '3-year rabies',
          createdAt: lastRabies,
          updatedAt: lastRabies,
        });
      }
    }
    return records;
  };

  // Helper function to create medical records for a dog
  const createMedicalRecords = (dogId: string, ageYears: number, isPuppy: boolean = false, isRetired: boolean = false): MedicalRecord[] => {
    const records: MedicalRecord[] = [];
    
    if (isRetired) {
      // Retired/older dogs - historical records
      records.push({
        id: generateId(),
        dogId,
        date: daysAgo(365 * ageYears - 180),
        type: 'exam' as MedicalRecordType,
        description: 'Annual health checkup',
        vetClinic: 'Animal Hospital',
        notes: 'Good health for age',
        createdAt: daysAgo(365 * ageYears - 180),
        updatedAt: daysAgo(365 * ageYears - 180),
      });
    } else if (isPuppy) {
      // Puppy medical records
      records.push({
        id: generateId(),
        dogId,
        date: daysAgo(50),
        type: 'exam' as MedicalRecordType,
        description: 'First puppy exam',
        vetClinic: 'Animal Hospital',
        notes: 'Healthy puppy, all clear',
        createdAt: daysAgo(50),
        updatedAt: daysAgo(50),
      });
    } else {
      // Active adult dogs - more recent records
      records.push({
        id: generateId(),
        dogId,
        date: daysAgo(180),
        type: 'exam' as MedicalRecordType,
        description: 'Annual health checkup',
        vetClinic: 'Animal Hospital',
        notes: 'All clear, excellent health',
        createdAt: daysAgo(180),
        updatedAt: daysAgo(180),
      });
      
      if (ageYears >= 2) {
        records.push({
          id: generateId(),
          dogId,
          date: daysAgo(365),
          type: 'exam' as MedicalRecordType,
          description: 'Annual health checkup',
          vetClinic: 'Animal Hospital',
          notes: 'Routine checkup, healthy',
          createdAt: daysAgo(365),
          updatedAt: daysAgo(365),
        });
      }
    }
    
    return records;
  };

  // Create vaccinations for all dogs
  db.vaccinations = [
    // Breeding stock
    ...createVaccinationRecords(sire1Id, 5),
    ...createVaccinationRecords(sire2Id, 4),
    ...createVaccinationRecords(dam1Id, 3),
    ...createVaccinationRecords(dam2Id, 4),
    ...createVaccinationRecords(dam3Id, 2),
    
    // Parents of breeding stock
    ...createVaccinationRecords(sire1SireId, 6),
    ...createVaccinationRecords(sire1DamId, 6),
    ...createVaccinationRecords(sire2SireId, 6),
    ...createVaccinationRecords(sire2DamId, 6),
    ...createVaccinationRecords(dam1SireId, 6),
    ...createVaccinationRecords(dam1DamId, 6),
    ...createVaccinationRecords(dam2SireId, 6),
    ...createVaccinationRecords(dam2DamId, 6),
    ...createVaccinationRecords(dam3SireId, 6),
    ...createVaccinationRecords(dam3DamId, 6),
    
    // Grandparents
    ...createVaccinationRecords(pgs1Id, 7),
    ...createVaccinationRecords(pgd1Id, 7),
    ...createVaccinationRecords(mgs1Id, 7),
    ...createVaccinationRecords(mgd1Id, 7),
    ...createVaccinationRecords(pgs2Id, 7),
    ...createVaccinationRecords(pgd2Id, 7),
    ...createVaccinationRecords(mgs2Id, 7),
    ...createVaccinationRecords(mgd2Id, 7),
    ...createVaccinationRecords(pgs3Id, 7),
    ...createVaccinationRecords(pgd3Id, 7),
    ...createVaccinationRecords(mgs3Id, 7),
    ...createVaccinationRecords(mgd3Id, 7),
    ...createVaccinationRecords(pgs4Id, 7),
    ...createVaccinationRecords(pgd4Id, 7),
    ...createVaccinationRecords(mgs4Id, 7),
    ...createVaccinationRecords(mgd4Id, 7),
    ...createVaccinationRecords(pgs5Id, 7),
    ...createVaccinationRecords(pgd5Id, 7),
    ...createVaccinationRecords(mgs5Id, 7),
    ...createVaccinationRecords(mgd5Id, 7),
    
    // Great-grandparents
    ...createVaccinationRecords(ggs1Id, 9),
    ...createVaccinationRecords(ggd1Id, 9),
    ...createVaccinationRecords(ggs2Id, 9),
    ...createVaccinationRecords(ggd2Id, 9),
    ...createVaccinationRecords(ggs3Id, 9),
    ...createVaccinationRecords(ggd3Id, 9),
    ...createVaccinationRecords(ggs4Id, 9),
    ...createVaccinationRecords(ggd4Id, 9),
    ...createVaccinationRecords(ggs5Id, 9),
    ...createVaccinationRecords(ggd5Id, 9),
    ...createVaccinationRecords(ggs6Id, 9),
    ...createVaccinationRecords(ggd6Id, 9),
    ...createVaccinationRecords(ggs7Id, 9),
    ...createVaccinationRecords(ggd7Id, 9),
    ...createVaccinationRecords(ggs8Id, 9),
    ...createVaccinationRecords(ggd8Id, 9),
    
    // Great-great-grandparents (older dogs, may have fewer records)
    ...createVaccinationRecords(gggs1Id, 10),
    ...createVaccinationRecords(gggd1Id, 10),
    ...createVaccinationRecords(gggs2Id, 10),
    ...createVaccinationRecords(gggd2Id, 10),
    ...createVaccinationRecords(gggs3Id, 10),
    ...createVaccinationRecords(gggd3Id, 10),
    ...createVaccinationRecords(gggs4Id, 10),
    ...createVaccinationRecords(gggd4Id, 10),
    ...createVaccinationRecords(gggs5Id, 10),
    ...createVaccinationRecords(gggd5Id, 10),
    ...createVaccinationRecords(gggs6Id, 10),
    ...createVaccinationRecords(gggd6Id, 10),
    ...createVaccinationRecords(gggs7Id, 10),
    ...createVaccinationRecords(gggd7Id, 10),
    ...createVaccinationRecords(gggs8Id, 10),
    ...createVaccinationRecords(gggd8Id, 10),
    
    // Puppies
    ...createVaccinationRecords(puppies1[0].id, 0, true),
    ...createVaccinationRecords(puppies1[1].id, 0, true),
    ...createVaccinationRecords(puppies1[2].id, 0, true),
    ...createVaccinationRecords(puppies1[3].id, 0, true),
    ...createVaccinationRecords(puppies1[4].id, 0, true),
    ...createVaccinationRecords(puppies1[5].id, 0, true),
    ...createVaccinationRecords(puppies1[6].id, 0, true),
    ...createVaccinationRecords(puppies1[7].id, 0, true),
    ...createVaccinationRecords(puppies2[0].id, 0, true),
    ...createVaccinationRecords(puppies2[1].id, 0, true),
    ...createVaccinationRecords(puppies2[2].id, 0, true),
    ...createVaccinationRecords(puppies2[3].id, 0, true),
    ...createVaccinationRecords(puppies2[4].id, 0, true),
    ...createVaccinationRecords(puppies2[5].id, 0, true),
  ];
  
  // ============================================
  // WEIGHT ENTRIES (Multiple entries per dog showing growth/health tracking)
  // ============================================
  
  // Helper function to create weight entries for adult dogs
  const createWeightEntries = (dogId: string, baseWeight: number, ageYears: number, isRetired: boolean = false) => {
    const entries = [];
    if (isRetired) {
      // Retired dogs - historical weight entries
      entries.push({
        id: generateId(),
        dogId,
        date: daysAgo(365 * ageYears - 180),
        weightLbs: baseWeight + (Math.random() * 2 - 1),
        notes: 'Historical weight record',
        createdAt: daysAgo(365 * ageYears - 180),
      });
    } else {
      // Active dogs - recent weight tracking
      entries.push({
        id: generateId(),
        dogId,
        date: daysAgo(365),
        weightLbs: baseWeight - 1,
        notes: 'Annual checkup weight',
        createdAt: daysAgo(365),
      });
      entries.push({
        id: generateId(),
        dogId,
        date: daysAgo(180),
        weightLbs: baseWeight - 0.5,
        notes: 'Mid-year weight check',
        createdAt: daysAgo(180),
      });
      entries.push({
        id: generateId(),
        dogId,
        date: daysAgo(90),
        weightLbs: baseWeight,
        notes: 'Quarterly weight check',
        createdAt: daysAgo(90),
      });
      entries.push({
        id: generateId(),
        dogId,
        date: daysAgo(30),
        weightLbs: baseWeight + (Math.random() * 0.5 - 0.25),
        notes: 'Monthly weight check',
        createdAt: daysAgo(30),
      });
      entries.push({
        id: generateId(),
        dogId,
        date: daysAgo(7),
        weightLbs: baseWeight + (Math.random() * 0.3 - 0.15),
        notes: 'Current weight',
        createdAt: daysAgo(7),
      });
    }
    return entries;
  };
  
  db.weightEntries = [
    // Sire 1 - Weight tracking over time
    {
      id: generateId(),
      dogId: sire1Id,
      date: daysAgo(365),
      weightLbs: 82.0,
      notes: 'Annual checkup weight',
      createdAt: daysAgo(365),
    },
    {
      id: generateId(),
      dogId: sire1Id,
      date: daysAgo(180),
      weightLbs: 84.2,
      notes: 'Pre-breeding weight',
      createdAt: daysAgo(180),
    },
    {
      id: generateId(),
      dogId: sire1Id,
      date: daysAgo(90),
      weightLbs: 85.0,
      notes: 'Mid-year check',
      createdAt: daysAgo(90),
    },
    {
      id: generateId(),
      dogId: sire1Id,
      date: daysAgo(30),
      weightLbs: 85.3,
      notes: 'Monthly check',
      createdAt: daysAgo(30),
    },
    {
      id: generateId(),
      dogId: sire1Id,
      date: daysAgo(7),
      weightLbs: 85.5,
      notes: 'Current weight - healthy',
      createdAt: daysAgo(7),
    },
    // Sire 2 - Weight tracking
    {
      id: generateId(),
      dogId: sire2Id,
      date: daysAgo(365),
      weightLbs: 78.5,
      notes: 'Annual checkup',
      createdAt: daysAgo(365),
    },
    {
      id: generateId(),
      dogId: sire2Id,
      date: daysAgo(180),
      weightLbs: 79.2,
      notes: 'Weight check',
      createdAt: daysAgo(180),
    },
    {
      id: generateId(),
      dogId: sire2Id,
      date: daysAgo(90),
      weightLbs: 79.8,
      notes: 'Mid-year check',
      createdAt: daysAgo(90),
    },
    {
      id: generateId(),
      dogId: sire2Id,
      date: daysAgo(7),
      weightLbs: 80.1,
      notes: 'Current weight',
      createdAt: daysAgo(7),
    },
    // Dam 1 - Weight tracking including pregnancy
    {
      id: generateId(),
      dogId: dam1Id,
      date: daysAgo(365),
      weightLbs: 62.0,
      notes: 'Baseline weight',
      createdAt: daysAgo(365),
    },
    {
      id: generateId(),
      dogId: dam1Id,
      date: daysAgo(180),
      weightLbs: 63.5,
      notes: 'Pre-breeding weight',
      createdAt: daysAgo(180),
    },
    {
      id: generateId(),
      dogId: dam1Id,
      date: daysAgo(120),
      weightLbs: 65.8,
      notes: 'Early pregnancy weight gain',
      createdAt: daysAgo(120),
    },
    {
      id: generateId(),
      dogId: dam1Id,
      date: daysAgo(60),
      weightLbs: 72.5,
      notes: 'Late pregnancy weight',
      createdAt: daysAgo(60),
    },
    {
      id: generateId(),
      dogId: dam1Id,
      date: daysAgo(55),
      weightLbs: 68.2,
      notes: 'Post-whelping weight',
      createdAt: daysAgo(55),
    },
    {
      id: generateId(),
      dogId: dam1Id,
      date: daysAgo(30),
      weightLbs: 66.0,
      notes: 'Recovery weight',
      createdAt: daysAgo(30),
    },
    {
      id: generateId(),
      dogId: dam1Id,
      date: daysAgo(7),
      weightLbs: 65.2,
      notes: 'Current weight - back to normal',
      createdAt: daysAgo(7),
    },
    // Dam 2 - Weight tracking
    {
      id: generateId(),
      dogId: dam2Id,
      date: daysAgo(365),
      weightLbs: 58.5,
      notes: 'Annual checkup',
      createdAt: daysAgo(365),
    },
    {
      id: generateId(),
      dogId: dam2Id,
      date: daysAgo(180),
      weightLbs: 59.2,
      notes: 'Weight check',
      createdAt: daysAgo(180),
    },
    {
      id: generateId(),
      dogId: dam2Id,
      date: daysAgo(105),
      weightLbs: 60.0,
      notes: 'Pre-breeding weight',
      createdAt: daysAgo(105),
    },
    {
      id: generateId(),
      dogId: dam2Id,
      date: daysAgo(45),
      weightLbs: 67.8,
      notes: 'Late pregnancy weight',
      createdAt: daysAgo(45),
    },
    {
      id: generateId(),
      dogId: dam2Id,
      date: daysAgo(10),
      weightLbs: 63.5,
      notes: 'Post-whelping weight',
      createdAt: daysAgo(10),
    },
    {
      id: generateId(),
      dogId: dam2Id,
      date: daysAgo(7),
      weightLbs: 62.8,
      notes: 'Recovery weight',
      createdAt: daysAgo(7),
    },
    // Dam 3 - Weight tracking (young dog)
    {
      id: generateId(),
      dogId: dam3Id,
      date: daysAgo(365),
      weightLbs: 45.0,
      notes: 'Young adult weight',
      createdAt: daysAgo(365),
    },
    {
      id: generateId(),
      dogId: dam3Id,
      date: daysAgo(180),
      weightLbs: 52.5,
      notes: 'Growing weight',
      createdAt: daysAgo(180),
    },
    {
      id: generateId(),
      dogId: dam3Id,
      date: daysAgo(90),
      weightLbs: 55.8,
      notes: 'Mature weight',
      createdAt: daysAgo(90),
    },
    {
      id: generateId(),
      dogId: dam3Id,
      date: daysAgo(30),
      weightLbs: 56.2,
      notes: 'First heat cycle weight',
      createdAt: daysAgo(30),
    },
    {
      id: generateId(),
      dogId: dam3Id,
      date: daysAgo(7),
      weightLbs: 56.5,
      notes: 'Current weight',
      createdAt: daysAgo(7),
    },
    // Weight entries for parents of breeding stock
    ...createWeightEntries(sire1SireId, 85, 6),
    ...createWeightEntries(sire1DamId, 65, 6),
    ...createWeightEntries(sire2SireId, 82, 6),
    ...createWeightEntries(sire2DamId, 60, 6),
    ...createWeightEntries(dam1SireId, 80, 6),
    ...createWeightEntries(dam1DamId, 58, 6),
    ...createWeightEntries(dam2SireId, 78, 6),
    ...createWeightEntries(dam2DamId, 56, 6),
    ...createWeightEntries(dam3SireId, 75, 6),
    ...createWeightEntries(dam3DamId, 54, 6),
    
    // Weight entries for grandparents (retired)
    ...createWeightEntries(pgs1Id, 83, 7, true),
    ...createWeightEntries(pgd1Id, 64, 7, true),
    ...createWeightEntries(mgs1Id, 81, 7, true),
    ...createWeightEntries(mgd1Id, 62, 7, true),
    ...createWeightEntries(pgs2Id, 84, 7, true),
    ...createWeightEntries(pgd2Id, 63, 7, true),
    ...createWeightEntries(mgs2Id, 82, 7, true),
    ...createWeightEntries(mgd2Id, 61, 7, true),
    ...createWeightEntries(pgs3Id, 79, 7, true),
    ...createWeightEntries(pgd3Id, 59, 7, true),
    ...createWeightEntries(mgs3Id, 77, 7, true),
    ...createWeightEntries(mgd3Id, 57, 7, true),
    ...createWeightEntries(pgs4Id, 80, 7, true),
    ...createWeightEntries(pgd4Id, 60, 7, true),
    ...createWeightEntries(mgs4Id, 78, 7, true),
    ...createWeightEntries(mgd4Id, 58, 7, true),
    ...createWeightEntries(pgs5Id, 76, 7, true),
    ...createWeightEntries(pgd5Id, 55, 7, true),
    ...createWeightEntries(mgs5Id, 74, 7, true),
    ...createWeightEntries(mgd5Id, 53, 7, true),
    
    // Weight entries for great-grandparents (retired)
    ...createWeightEntries(ggs1Id, 82, 9, true),
    ...createWeightEntries(ggd1Id, 63, 9, true),
    ...createWeightEntries(ggs2Id, 80, 9, true),
    ...createWeightEntries(ggd2Id, 61, 9, true),
    ...createWeightEntries(ggs3Id, 81, 9, true),
    ...createWeightEntries(ggd3Id, 62, 9, true),
    ...createWeightEntries(ggs4Id, 79, 9, true),
    ...createWeightEntries(ggd4Id, 60, 9, true),
    ...createWeightEntries(ggs5Id, 78, 9, true),
    ...createWeightEntries(ggd5Id, 59, 9, true),
    ...createWeightEntries(ggs6Id, 77, 9, true),
    ...createWeightEntries(ggd6Id, 58, 9, true),
    ...createWeightEntries(ggs7Id, 76, 9, true),
    ...createWeightEntries(ggd7Id, 57, 9, true),
    ...createWeightEntries(ggs8Id, 75, 9, true),
    ...createWeightEntries(ggd8Id, 56, 9, true),
    
    // Weight entries for great-great-grandparents (retired)
    ...createWeightEntries(gggs1Id, 81, 10, true),
    ...createWeightEntries(gggd1Id, 62, 10, true),
    ...createWeightEntries(gggs2Id, 79, 10, true),
    ...createWeightEntries(gggd2Id, 60, 10, true),
    ...createWeightEntries(gggs3Id, 80, 10, true),
    ...createWeightEntries(gggd3Id, 61, 10, true),
    ...createWeightEntries(gggs4Id, 78, 10, true),
    ...createWeightEntries(gggd4Id, 59, 10, true),
    ...createWeightEntries(gggs5Id, 77, 10, true),
    ...createWeightEntries(gggd5Id, 58, 10, true),
    ...createWeightEntries(gggs6Id, 76, 10, true),
    ...createWeightEntries(gggd6Id, 57, 10, true),
    ...createWeightEntries(gggs7Id, 75, 10, true),
    ...createWeightEntries(gggd7Id, 56, 10, true),
    ...createWeightEntries(gggs8Id, 74, 10, true),
    ...createWeightEntries(gggd8Id, 55, 10, true),
    
    // Puppies from Litter 1 - Weekly growth tracking
    ...puppies1.map((puppy, puppyIdx) => {
      const entries = [];
      // Weekly weights from birth to 8 weeks
      for (let week = 0; week <= 8; week++) {
        const ageDays = 55 - (week * 7);
        if (ageDays >= 0) {
          // Growth curve: starts around 1.2 lbs, grows to ~8-12 lbs by 8 weeks
          const baseWeight = 1.2 + (week * 0.15 * (puppyIdx + 1));
          entries.push({
            id: generateId(),
            dogId: puppy.id,
            date: daysAgo(ageDays),
            weightLbs: Math.round((baseWeight + (Math.random() * 0.5 - 0.25)) * 10) / 10,
            notes: week === 0 ? 'Birth weight' : `Week ${week} weight`,
            createdAt: daysAgo(ageDays),
          });
        }
      }
      return entries;
    }).flat(),
    // Puppies from Litter 2 - Daily tracking (newborn)
    ...puppies2.map((puppy, puppyIdx) => {
      const entries = [];
      // Daily weights for first 2 weeks, then weekly
      for (let day = 0; day <= 10; day++) {
        const ageDays = 10 - day;
        if (ageDays >= 0) {
          const baseWeight = 0.8 + (day * 0.12 * (puppyIdx + 1));
          entries.push({
            id: generateId(),
            dogId: puppy.id,
            date: daysAgo(ageDays),
            weightLbs: Math.round((baseWeight + (Math.random() * 0.2 - 0.1)) * 10) / 10,
            notes: day === 0 ? 'Birth weight' : `Day ${day} weight`,
            createdAt: daysAgo(ageDays),
          });
        }
      }
      return entries;
    }).flat(),
  ];
  
  // ============================================
  // MEDICAL RECORDS
  // ============================================
  
  // Create medical records for all dogs
  db.medicalRecords = [
    // Breeding stock - active dogs
    ...createMedicalRecords(sire1Id, 5),
    ...createMedicalRecords(sire2Id, 4),
    ...createMedicalRecords(dam1Id, 3),
    ...createMedicalRecords(dam2Id, 4),
    ...createMedicalRecords(dam3Id, 2),
    
    // Parents of breeding stock
    ...createMedicalRecords(sire1SireId, 6),
    ...createMedicalRecords(sire1DamId, 6),
    ...createMedicalRecords(sire2SireId, 6),
    ...createMedicalRecords(sire2DamId, 6),
    ...createMedicalRecords(dam1SireId, 6),
    ...createMedicalRecords(dam1DamId, 6),
    ...createMedicalRecords(dam2SireId, 6),
    ...createMedicalRecords(dam2DamId, 6),
    ...createMedicalRecords(dam3SireId, 6),
    ...createMedicalRecords(dam3DamId, 6),
    
    // Grandparents (retired)
    ...createMedicalRecords(pgs1Id, 7, false, true),
    ...createMedicalRecords(pgd1Id, 7, false, true),
    ...createMedicalRecords(mgs1Id, 7, false, true),
    ...createMedicalRecords(mgd1Id, 7, false, true),
    ...createMedicalRecords(pgs2Id, 7, false, true),
    ...createMedicalRecords(pgd2Id, 7, false, true),
    ...createMedicalRecords(mgs2Id, 7, false, true),
    ...createMedicalRecords(mgd2Id, 7, false, true),
    ...createMedicalRecords(pgs3Id, 7, false, true),
    ...createMedicalRecords(pgd3Id, 7, false, true),
    ...createMedicalRecords(mgs3Id, 7, false, true),
    ...createMedicalRecords(mgd3Id, 7, false, true),
    ...createMedicalRecords(pgs4Id, 7, false, true),
    ...createMedicalRecords(pgd4Id, 7, false, true),
    ...createMedicalRecords(mgs4Id, 7, false, true),
    ...createMedicalRecords(mgd4Id, 7, false, true),
    ...createMedicalRecords(pgs5Id, 7, false, true),
    ...createMedicalRecords(pgd5Id, 7, false, true),
    ...createMedicalRecords(mgs5Id, 7, false, true),
    ...createMedicalRecords(mgd5Id, 7, false, true),
    
    // Great-grandparents (retired)
    ...createMedicalRecords(ggs1Id, 9, false, true),
    ...createMedicalRecords(ggd1Id, 9, false, true),
    ...createMedicalRecords(ggs2Id, 9, false, true),
    ...createMedicalRecords(ggd2Id, 9, false, true),
    ...createMedicalRecords(ggs3Id, 9, false, true),
    ...createMedicalRecords(ggd3Id, 9, false, true),
    ...createMedicalRecords(ggs4Id, 9, false, true),
    ...createMedicalRecords(ggd4Id, 9, false, true),
    ...createMedicalRecords(ggs5Id, 9, false, true),
    ...createMedicalRecords(ggd5Id, 9, false, true),
    ...createMedicalRecords(ggs6Id, 9, false, true),
    ...createMedicalRecords(ggd6Id, 9, false, true),
    ...createMedicalRecords(ggs7Id, 9, false, true),
    ...createMedicalRecords(ggd7Id, 9, false, true),
    ...createMedicalRecords(ggs8Id, 9, false, true),
    ...createMedicalRecords(ggd8Id, 9, false, true),
    
    // Great-great-grandparents (retired)
    ...createMedicalRecords(gggs1Id, 10, false, true),
    ...createMedicalRecords(gggd1Id, 10, false, true),
    ...createMedicalRecords(gggs2Id, 10, false, true),
    ...createMedicalRecords(gggd2Id, 10, false, true),
    ...createMedicalRecords(gggs3Id, 10, false, true),
    ...createMedicalRecords(gggd3Id, 10, false, true),
    ...createMedicalRecords(gggs4Id, 10, false, true),
    ...createMedicalRecords(gggd4Id, 10, false, true),
    ...createMedicalRecords(gggs5Id, 10, false, true),
    ...createMedicalRecords(gggd5Id, 10, false, true),
    ...createMedicalRecords(gggs6Id, 10, false, true),
    ...createMedicalRecords(gggd6Id, 10, false, true),
    ...createMedicalRecords(gggs7Id, 10, false, true),
    ...createMedicalRecords(gggd7Id, 10, false, true),
    ...createMedicalRecords(gggs8Id, 10, false, true),
    ...createMedicalRecords(gggd8Id, 10, false, true),
    
    // Special medical records for breeding stock
    {
      id: generateId(),
      dogId: dam1Id,
      date: daysAgo(55),
      type: 'surgery' as MedicalRecordType,
      description: 'C-section delivery',
      vetClinic: 'Animal Hospital',
      notes: 'Successful delivery of 8 puppies',
      createdAt: daysAgo(55),
      updatedAt: daysAgo(55),
    },
    {
      id: generateId(),
      dogId: dam2Id,
      date: daysAgo(10),
      type: 'surgery' as MedicalRecordType,
      description: 'Natural whelping assistance',
      vetClinic: 'Animal Hospital',
      notes: 'Successful delivery of 6 puppies',
      createdAt: daysAgo(10),
      updatedAt: daysAgo(10),
    },
    
    // Puppies
    ...createMedicalRecords(puppies1[0].id, 0, true),
    ...createMedicalRecords(puppies1[1].id, 0, true),
    ...createMedicalRecords(puppies1[2].id, 0, true),
    ...createMedicalRecords(puppies1[3].id, 0, true),
    ...createMedicalRecords(puppies1[4].id, 0, true),
    ...createMedicalRecords(puppies1[5].id, 0, true),
    ...createMedicalRecords(puppies1[6].id, 0, true),
    ...createMedicalRecords(puppies1[7].id, 0, true),
    ...createMedicalRecords(puppies2[0].id, 0, true),
    ...createMedicalRecords(puppies2[1].id, 0, true),
    ...createMedicalRecords(puppies2[2].id, 0, true),
    ...createMedicalRecords(puppies2[3].id, 0, true),
    ...createMedicalRecords(puppies2[4].id, 0, true),
    ...createMedicalRecords(puppies2[5].id, 0, true),
    
    // Special puppy medical records
    {
      id: generateId(),
      dogId: puppies1[2].id,
      date: daysAgo(50),
      type: 'surgery' as MedicalRecordType,
      description: 'Dewclaw removal',
      vetClinic: 'Animal Hospital',
      notes: 'Routine procedure',
      createdAt: daysAgo(50),
      updatedAt: daysAgo(50),
    },
  ];
  
  // ============================================
  // EXPENSES (Comprehensive expense history)
  // ============================================
  
  // Helper function to create expense records for a dog based on their vaccinations and medical records
  const createExpenseRecordsForDog = (dogId: string, _dogName: string, ageYears: number, isPuppy: boolean = false): Expense[] => {
    const expenses: Expense[] = [];
    const dogVaccinations = db.vaccinations.filter(v => v.dogId === dogId);
    const dogMedicalRecords = db.medicalRecords.filter(m => m.dogId === dogId);
    
    // Create expenses for vaccinations
    dogVaccinations.forEach(vacc => {
      const cost = isPuppy ? 25 : 45; // Puppy shots are cheaper
      expenses.push({
        id: generateId(),
        date: vacc.date,
        amount: cost,
        category: 'vet',
        vendorName: vacc.vetClinic || 'Animal Hospital',
        description: `${vacc.vaccineType} vaccination${isPuppy ? ' (puppy)' : ''}`,
        paymentMethod: 'Credit Card',
        isTaxDeductible: true,
        relatedDogId: dogId,
        createdAt: vacc.createdAt,
        updatedAt: vacc.updatedAt,
      });
    });
    
    // Create expenses for medical records
    dogMedicalRecords.forEach(record => {
      let cost = 0;
      let description = record.description || 'Medical procedure';
      
      if (record.type === 'exam') {
        cost = ageYears > 7 ? 120 : 85; // Older dogs cost more
        description = `Health exam: ${description}`;
      } else if (record.type === 'surgery') {
        cost = description.toLowerCase().includes('c-section') ? 1200 : 
               description.toLowerCase().includes('dewclaw') ? 85 : 350;
        description = `Surgery: ${description}`;
      } else {
        cost = 75;
        description = `${record.type}: ${description}`;
      }
      
      expenses.push({
        id: generateId(),
        date: record.date,
        amount: cost,
        category: 'vet',
        vendorName: record.vetClinic || 'Animal Hospital',
        description,
        paymentMethod: 'Credit Card',
        isTaxDeductible: true,
        relatedDogId: dogId,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      });
    });
    
    return expenses;
  };
  
  db.expenses = [
    // Veterinary Expenses
    {
      id: generateId(),
      date: daysAgo(365),
      amount: 350.00,
      category: 'vet',
      vendorName: 'Animal Hospital',
      description: 'Annual health checkups - all dogs',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      createdAt: daysAgo(365),
      updatedAt: daysAgo(365),
    },
    {
      id: generateId(),
      date: daysAgo(300),
      amount: 450.00,
      category: 'vet',
      vendorName: 'Animal Hospital',
      description: 'Vaccinations - DHPP and Rabies boosters',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      createdAt: daysAgo(300),
      updatedAt: daysAgo(300),
    },
    {
      id: generateId(),
      date: daysAgo(180),
      amount: 250.00,
      category: 'vet',
      vendorName: 'Animal Hospital',
      description: 'Pre-breeding health exams',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      relatedDogId: sire1Id,
      createdAt: daysAgo(180),
      updatedAt: daysAgo(180),
    },
    {
      id: generateId(),
      date: daysAgo(120),
      amount: 500.00,
      category: 'vet',
      vendorName: 'Animal Hospital',
      description: 'Breeding consultation and progesterone testing',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      relatedDogId: dam1Id,
      createdAt: daysAgo(120),
      updatedAt: daysAgo(120),
    },
    {
      id: generateId(),
      date: daysAgo(90),
      amount: 180.00,
      category: 'vet',
      vendorName: 'Animal Hospital',
      description: 'Ultrasound confirmation - Litter 1',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      relatedDogId: dam1Id,
      relatedLitterId: litter1Id,
      createdAt: daysAgo(90),
      updatedAt: daysAgo(90),
    },
    {
      id: generateId(),
      date: daysAgo(55),
      amount: 1200.00,
      category: 'vet',
      vendorName: 'Animal Hospital',
      description: 'C-section and post-op care - Litter 1',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      relatedDogId: dam1Id,
      relatedLitterId: litter1Id,
      createdAt: daysAgo(55),
      updatedAt: daysAgo(55),
    },
    {
      id: generateId(),
      date: daysAgo(50),
      amount: 150.00,
      category: 'vet',
      vendorName: 'Animal Hospital',
      description: 'X-ray puppy count - Litter 1',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      relatedDogId: dam1Id,
      relatedLitterId: litter1Id,
      createdAt: daysAgo(50),
      updatedAt: daysAgo(50),
    },
    {
      id: generateId(),
      date: daysAgo(133),
      amount: 480.00,
      category: 'vet',
      vendorName: 'Animal Hospital',
      description: 'Breeding consultation and AI procedure - Litter 2',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      relatedDogId: dam2Id,
      createdAt: daysAgo(133),
      updatedAt: daysAgo(133),
    },
    {
      id: generateId(),
      date: daysAgo(58),
      amount: 180.00,
      category: 'vet',
      vendorName: 'Animal Hospital',
      description: 'Ultrasound confirmation - Litter 2',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      relatedDogId: dam2Id,
      relatedLitterId: litter2Id,
      createdAt: daysAgo(58),
      updatedAt: daysAgo(58),
    },
    {
      id: generateId(),
      date: daysAgo(10),
      amount: 950.00,
      category: 'vet',
      vendorName: 'Animal Hospital',
      description: 'Natural whelping assistance - Litter 2',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      relatedDogId: dam2Id,
      relatedLitterId: litter2Id,
      createdAt: daysAgo(10),
      updatedAt: daysAgo(10),
    },
    {
      id: generateId(),
      date: daysAgo(40),
      amount: 120.00,
      category: 'vet',
      vendorName: 'Animal Hospital',
      description: 'Puppy vaccinations - first round',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      relatedLitterId: litter1Id,
      createdAt: daysAgo(40),
      updatedAt: daysAgo(40),
    },
    {
      id: generateId(),
      date: daysAgo(15),
      amount: 85.00,
      category: 'vet',
      vendorName: 'Animal Hospital',
      description: 'Dewclaw removal - Litter 1',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      relatedLitterId: litter1Id,
      createdAt: daysAgo(15),
      updatedAt: daysAgo(15),
    },
    // Food Expenses
    {
      id: generateId(),
      date: daysAgo(60),
      amount: 280.00,
      category: 'food',
      vendorName: 'Premium Pet Supply',
      description: 'Adult dog food - monthly supply',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      createdAt: daysAgo(60),
      updatedAt: daysAgo(60),
    },
    {
      id: generateId(),
      date: daysAgo(30),
      amount: 150.00,
      category: 'food',
      vendorName: 'Premium Pet Supply',
      description: 'Puppy food and supplements - Litter 1',
      paymentMethod: 'Cash',
      isTaxDeductible: true,
      relatedLitterId: litter1Id,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(30),
    },
    {
      id: generateId(),
      date: daysAgo(20),
      amount: 95.00,
      category: 'food',
      vendorName: 'Premium Pet Supply',
      description: 'Puppy food - Litter 2',
      paymentMethod: 'Debit Card',
      isTaxDeductible: true,
      relatedLitterId: litter2Id,
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
    },
    {
      id: generateId(),
      date: daysAgo(7),
      amount: 320.00,
      category: 'food',
      vendorName: 'Premium Pet Supply',
      description: 'Monthly food order - all dogs',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      createdAt: daysAgo(7),
      updatedAt: daysAgo(7),
    },
    // Current month expenses (so monthly total shows data)
    {
      id: generateId(),
      date: daysAgo(2),
      amount: 85.00,
      category: 'supplies',
      vendorName: 'Pet Store',
      description: 'Puppy pads and cleaning supplies',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
    {
      id: generateId(),
      date: daysAgo(1),
      amount: 45.00,
      category: 'food',
      vendorName: 'Premium Pet Supply',
      description: 'Treats and supplements',
      paymentMethod: 'Cash',
      isTaxDeductible: true,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      id: generateId(),
      date: daysAgo(0),
      amount: 150.00,
      category: 'vet',
      vendorName: 'Animal Hospital',
      description: 'Puppy wellness check - Litter 2',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      relatedLitterId: litter2Id,
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    },
    // Supplies
    {
      id: generateId(),
      date: daysAgo(120),
      amount: 200.00,
      category: 'supplies',
      vendorName: 'Pet Store',
      description: 'Whelping box and supplies',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      createdAt: daysAgo(120),
      updatedAt: daysAgo(120),
    },
    {
      id: generateId(),
      date: daysAgo(75),
      amount: 125.00,
      category: 'supplies',
      vendorName: 'Pet Store',
      description: 'Puppy pens and crates',
      paymentMethod: 'Debit Card',
      isTaxDeductible: true,
      relatedLitterId: litter1Id,
      createdAt: daysAgo(75),
      updatedAt: daysAgo(75),
    },
    {
      id: generateId(),
      date: daysAgo(20),
      amount: 75.00,
      category: 'supplies',
      vendorName: 'Pet Store',
      description: 'Toys and bedding - Litter 1',
      paymentMethod: 'Debit Card',
      isTaxDeductible: true,
      relatedLitterId: litter1Id,
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
    },
    {
      id: generateId(),
      date: daysAgo(10),
      amount: 60.00,
      category: 'supplies',
      vendorName: 'Pet Store',
      description: 'Puppy supplies - Litter 2',
      paymentMethod: 'Cash',
      isTaxDeductible: true,
      relatedLitterId: litter2Id,
      createdAt: daysAgo(10),
      updatedAt: daysAgo(10),
    },
    // Transport Expenses
    {
      id: generateId(),
      date: daysAgo(20),
      amount: 150.00,
      category: 'transport',
      vendorName: 'Pet Transport Co',
      description: 'Ground transport for puppy sale',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
    },
    // Registration Expenses
    {
      id: generateId(),
      date: daysAgo(35),
      amount: 45.00,
      category: 'registration',
      vendorName: 'ABKC',
      description: 'Registration fees - 2 puppies',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      createdAt: daysAgo(35),
      updatedAt: daysAgo(35),
    },
    // Marketing Expenses
    {
      id: generateId(),
      date: daysAgo(100),
      amount: 300.00,
      category: 'marketing',
      vendorName: 'Website Hosting',
      description: 'Website and social media advertising',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      createdAt: daysAgo(100),
      updatedAt: daysAgo(100),
    },
    {
      id: generateId(),
      date: daysAgo(50),
      amount: 150.00,
      category: 'marketing',
      vendorName: 'Photo Studio',
      description: 'Professional puppy photos',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      relatedLitterId: litter1Id,
      createdAt: daysAgo(50),
      updatedAt: daysAgo(50),
    },
    // Utilities
    {
      id: generateId(),
      date: daysAgo(30),
      amount: 120.00,
      category: 'utilities',
      vendorName: 'Electric Company',
      description: 'Heating for whelping area',
      paymentMethod: 'Credit Card',
      isTaxDeductible: true,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(30),
    },
    // Miscellaneous
    {
      id: generateId(),
      date: daysAgo(45),
      amount: 85.00,
      category: 'misc',
      vendorName: 'Various',
      description: 'Miscellaneous breeding supplies',
      paymentMethod: 'Cash',
      isTaxDeductible: true,
      createdAt: daysAgo(45),
      updatedAt: daysAgo(45),
    },
    
    // Generate expenses for all dogs based on their vaccinations and medical records
    // Breeding stock
    ...createExpenseRecordsForDog(sire1Id, 'Champion Thunder\'s Legacy', 5),
    ...createExpenseRecordsForDog(sire2Id, 'Royal Blue\'s Titan', 4),
    ...createExpenseRecordsForDog(dam1Id, 'Bella\'s Pride', 3),
    ...createExpenseRecordsForDog(dam2Id, 'Diamond\'s Grace', 4),
    ...createExpenseRecordsForDog(dam3Id, 'Ruby\'s Elegance', 2),
    
    // Parents of breeding stock
    ...createExpenseRecordsForDog(sire1SireId, 'Thunder\'s Sire', 6),
    ...createExpenseRecordsForDog(sire1DamId, 'Thunder\'s Dam', 6),
    ...createExpenseRecordsForDog(sire2SireId, 'Royal\'s Sire', 6),
    ...createExpenseRecordsForDog(sire2DamId, 'Royal\'s Dam', 6),
    ...createExpenseRecordsForDog(dam1SireId, 'Bella\'s Sire', 6),
    ...createExpenseRecordsForDog(dam1DamId, 'Bella\'s Dam', 6),
    ...createExpenseRecordsForDog(dam2SireId, 'Diamond\'s Sire', 6),
    ...createExpenseRecordsForDog(dam2DamId, 'Diamond\'s Dam', 6),
    ...createExpenseRecordsForDog(dam3SireId, 'Ruby\'s Sire', 6),
    ...createExpenseRecordsForDog(dam3DamId, 'Ruby\'s Dam', 6),
    
    // Grandparents
    ...createExpenseRecordsForDog(pgs1Id, 'Thunder\'s Paternal Grandsire', 7),
    ...createExpenseRecordsForDog(pgd1Id, 'Thunder\'s Paternal Granddam', 7),
    ...createExpenseRecordsForDog(mgs1Id, 'Thunder\'s Maternal Grandsire', 7),
    ...createExpenseRecordsForDog(mgd1Id, 'Thunder\'s Maternal Granddam', 7),
    ...createExpenseRecordsForDog(pgs2Id, 'Royal\'s Paternal Grandsire', 7),
    ...createExpenseRecordsForDog(pgd2Id, 'Royal\'s Paternal Granddam', 7),
    ...createExpenseRecordsForDog(mgs2Id, 'Royal\'s Maternal Grandsire', 7),
    ...createExpenseRecordsForDog(mgd2Id, 'Royal\'s Maternal Granddam', 7),
    ...createExpenseRecordsForDog(pgs3Id, 'Bella\'s Paternal Grandsire', 7),
    ...createExpenseRecordsForDog(pgd3Id, 'Bella\'s Paternal Granddam', 7),
    ...createExpenseRecordsForDog(mgs3Id, 'Bella\'s Maternal Grandsire', 7),
    ...createExpenseRecordsForDog(mgd3Id, 'Bella\'s Maternal Granddam', 7),
    ...createExpenseRecordsForDog(pgs4Id, 'Diamond\'s Paternal Grandsire', 7),
    ...createExpenseRecordsForDog(pgd4Id, 'Diamond\'s Paternal Granddam', 7),
    ...createExpenseRecordsForDog(mgs4Id, 'Diamond\'s Maternal Grandsire', 7),
    ...createExpenseRecordsForDog(mgd4Id, 'Diamond\'s Maternal Granddam', 7),
    ...createExpenseRecordsForDog(pgs5Id, 'Ruby\'s Paternal Grandsire', 7),
    ...createExpenseRecordsForDog(pgd5Id, 'Ruby\'s Paternal Granddam', 7),
    ...createExpenseRecordsForDog(mgs5Id, 'Ruby\'s Maternal Grandsire', 7),
    ...createExpenseRecordsForDog(mgd5Id, 'Ruby\'s Maternal Granddam', 7),
    
    // Great-grandparents
    ...createExpenseRecordsForDog(ggs1Id, 'Thunder\'s Grandsire', 9),
    ...createExpenseRecordsForDog(ggd1Id, 'Storm\'s Granddam', 9),
    ...createExpenseRecordsForDog(ggs2Id, 'Royal\'s Grandsire', 9),
    ...createExpenseRecordsForDog(ggd2Id, 'Diamond\'s Granddam', 9),
    ...createExpenseRecordsForDog(ggs3Id, 'Champion\'s Grandsire', 9),
    ...createExpenseRecordsForDog(ggd3Id, 'Elite\'s Granddam', 9),
    ...createExpenseRecordsForDog(ggs4Id, 'Legend\'s Grandsire', 9),
    ...createExpenseRecordsForDog(ggd4Id, 'Noble\'s Granddam', 9),
    ...createExpenseRecordsForDog(ggs5Id, 'Majestic\'s Origin', 9),
    ...createExpenseRecordsForDog(ggd5Id, 'Prestige\'s Ancestry', 9),
    ...createExpenseRecordsForDog(ggs6Id, 'Supreme\'s Foundation', 9),
    ...createExpenseRecordsForDog(ggd6Id, 'Excellence\'s Legacy', 9),
    ...createExpenseRecordsForDog(ggs7Id, 'Grandeur\'s Bloodline', 9),
    ...createExpenseRecordsForDog(ggd7Id, 'Splendor\'s Heritage', 9),
    ...createExpenseRecordsForDog(ggs8Id, 'Magnificence\'s Origin', 9),
    ...createExpenseRecordsForDog(ggd8Id, 'Brilliance\'s Ancestry', 9),
    
    // Great-great-grandparents
    ...createExpenseRecordsForDog(gggs1Id, 'Thunder\'s Foundation', 10),
    ...createExpenseRecordsForDog(gggd1Id, 'Storm\'s Legacy', 10),
    ...createExpenseRecordsForDog(gggs2Id, 'Royal\'s Pride', 10),
    ...createExpenseRecordsForDog(gggd2Id, 'Diamond\'s Crown', 10),
    ...createExpenseRecordsForDog(gggs3Id, 'Champion\'s Bloodline', 10),
    ...createExpenseRecordsForDog(gggd3Id, 'Elite\'s Heritage', 10),
    ...createExpenseRecordsForDog(gggs4Id, 'Legend\'s Dynasty', 10),
    ...createExpenseRecordsForDog(gggd4Id, 'Noble\'s Lineage', 10),
    ...createExpenseRecordsForDog(gggs5Id, 'Majestic\'s Origin', 10),
    ...createExpenseRecordsForDog(gggd5Id, 'Prestige\'s Ancestry', 10),
    ...createExpenseRecordsForDog(gggs6Id, 'Supreme\'s Foundation', 10),
    ...createExpenseRecordsForDog(gggd6Id, 'Excellence\'s Legacy', 10),
    ...createExpenseRecordsForDog(gggs7Id, 'Grandeur\'s Bloodline', 10),
    ...createExpenseRecordsForDog(gggd7Id, 'Splendor\'s Heritage', 10),
    ...createExpenseRecordsForDog(gggs8Id, 'Magnificence\'s Origin', 10),
    ...createExpenseRecordsForDog(gggd8Id, 'Brilliance\'s Ancestry', 10),
    
    // Puppies
    ...createExpenseRecordsForDog(puppies1[0].id, puppies1[0].name, 0, true),
    ...createExpenseRecordsForDog(puppies1[1].id, puppies1[1].name, 0, true),
    ...createExpenseRecordsForDog(puppies1[2].id, puppies1[2].name, 0, true),
    ...createExpenseRecordsForDog(puppies1[3].id, puppies1[3].name, 0, true),
    ...createExpenseRecordsForDog(puppies1[4].id, puppies1[4].name, 0, true),
    ...createExpenseRecordsForDog(puppies1[5].id, puppies1[5].name, 0, true),
    ...createExpenseRecordsForDog(puppies1[6].id, puppies1[6].name, 0, true),
    ...createExpenseRecordsForDog(puppies1[7].id, puppies1[7].name, 0, true),
    ...createExpenseRecordsForDog(puppies2[0].id, puppies2[0].name, 0, true),
    ...createExpenseRecordsForDog(puppies2[1].id, puppies2[1].name, 0, true),
    ...createExpenseRecordsForDog(puppies2[2].id, puppies2[2].name, 0, true),
    ...createExpenseRecordsForDog(puppies2[3].id, puppies2[3].name, 0, true),
    ...createExpenseRecordsForDog(puppies2[4].id, puppies2[4].name, 0, true),
    ...createExpenseRecordsForDog(puppies2[5].id, puppies2[5].name, 0, true),
  ];
  
  // ============================================
  // CLIENTS
  // ============================================
  
  const client1Id = generateId();
  const client2Id = generateId();
  const client3Id = generateId();
  
  db.clients = [
    {
      id: client1Id,
      name: 'John Smith',
      phone: '(555) 123-4567',
      email: 'john.smith@email.com',
      addressLine1: '123 Main Street',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62701',
      notes: 'First-time buyer, very interested',
      createdAt: daysAgo(100),
      updatedAt: daysAgo(10),
    },
    {
      id: client2Id,
      name: 'Sarah Johnson',
      phone: '(555) 234-5678',
      email: 'sarah.j@email.com',
      addressLine1: '456 Oak Avenue',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60601',
      notes: 'Return customer, excellent references',
      createdAt: daysAgo(80),
      updatedAt: daysAgo(5),
    },
    {
      id: client3Id,
      name: 'Michael Brown',
      phone: '(555) 345-6789',
      email: 'm.brown@email.com',
      addressLine1: '789 Elm Street',
      city: 'Peoria',
      state: 'IL',
      postalCode: '61601',
      notes: 'Interested in show prospect',
      createdAt: daysAgo(60),
      updatedAt: daysAgo(2),
    },
  ];
  
  // ============================================
  // SALES
  // ============================================
  
  const sale1Id = generateId();
  
  db.sales = [
    {
      id: sale1Id,
      clientId: client1Id,
      saleDate: daysAgo(30),
      price: 2500.00,
      depositAmount: 500.00,
      depositDate: daysAgo(45),
      isLocalPickup: true,
      paymentStatus: 'paid_in_full',
      warrantyInfo: '2-year health guarantee',
      notes: 'Sold Thunder Jr - excellent puppy',
      createdAt: daysAgo(45),
      updatedAt: daysAgo(30),
    },
    {
      id: generateId(),
      clientId: client2Id,
      saleDate: daysAgo(25),
      price: 2200.00,
      depositAmount: 500.00,
      depositDate: daysAgo(40),
      isLocalPickup: false,
      paymentStatus: 'paid_in_full',
      transportId: null,
      notes: 'Sold Bella\'s Boy',
      createdAt: daysAgo(40),
      updatedAt: daysAgo(25),
    },
  ];
  
  // ============================================
  // SALE PUPPIES
  // ============================================
  
  db.salePuppies = [
    {
      id: generateId(),
      saleId: sale1Id,
      dogId: puppies1[0].id,
      price: 2500.00,
      createdAt: daysAgo(45),
    },
    {
      id: generateId(),
      saleId: db.sales[1].id,
      dogId: puppies1[1].id,
      price: 2200.00,
      createdAt: daysAgo(40),
    },
  ];
  
  // ============================================
  // CLIENT INTERESTS
  // ============================================
  
  db.clientInterests = [
    {
      id: generateId(),
      clientId: client3Id,
      dogId: puppies1[2].id,
      interestDate: daysAgo(20),
      contactMethod: 'email',
      status: 'contacted',
      notes: 'Interested in show prospect',
      createdAt: daysAgo(20),
      updatedAt: daysAgo(15),
    },
    {
      id: generateId(),
      clientId: client1Id,
      dogId: puppies1[0].id,
      interestDate: daysAgo(50),
      contactMethod: 'phone',
      status: 'converted',
      convertedToSaleId: sale1Id,
      notes: 'Converted to sale',
      createdAt: daysAgo(50),
      updatedAt: daysAgo(30),
    },
  ];
  
  // ============================================
  // TRANSPORTS
  // ============================================
  
  db.transports = [
    {
      id: generateId(),
      dogId: puppies1[1].id,
      date: daysAgo(20),
      mode: 'ground',
      shipperBusinessName: 'Pet Transport Co',
      contactName: 'Jane Doe',
      phone: '(555) 999-8888',
      email: 'info@pettransport.com',
      originCity: 'Springfield',
      originState: 'IL',
      destinationCity: 'Chicago',
      destinationState: 'IL',
      trackingNumber: 'PT-2024-001',
      cost: 150.00,
      notes: 'Ground transport successful',
      expenseId: null,
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
    },
  ];
  
  // ============================================
  // WAITLIST ENTRIES
  // ============================================
  
  db.waitlistEntries = [
    {
      id: generateId(),
      clientId: client3Id,
      litterId: litter2Id,
      position: 1,
      preference: 'male',
      colorPreference: 'Tricolor',
      depositAmount: 500.00,
      depositDate: daysAgo(5),
      depositStatus: 'paid',
      status: 'matched',
      assignedPuppyId: puppies2[0].id,
      notes: 'First pick - male tricolor',
      createdAt: daysAgo(10),
      updatedAt: daysAgo(5),
    },
    {
      id: generateId(),
      clientId: client2Id,
      litterId: null,
      position: 1,
      preference: 'either',
      colorPreference: 'Lilac',
      depositAmount: null,
      depositStatus: 'pending',
      status: 'waiting',
      notes: 'General waitlist - next available lilac',
      createdAt: daysAgo(15),
      updatedAt: daysAgo(15),
    },
  ];
  
  // ============================================
  // COMMUNICATION LOGS
  // ============================================
  
  db.communicationLogs = [
    {
      id: generateId(),
      clientId: client1Id,
      date: daysAgo(50),
      type: 'phone',
      direction: 'inbound',
      summary: 'Initial inquiry about available puppies',
      followUpNeeded: true,
      followUpDate: daysAgo(48),
      followUpCompleted: true,
      relatedLitterId: litter1Id,
      notes: 'Very interested, asked about health guarantees',
      createdAt: daysAgo(50),
      updatedAt: daysAgo(48),
    },
    {
      id: generateId(),
      clientId: client1Id,
      date: daysAgo(45),
      type: 'email',
      direction: 'outbound',
      summary: 'Sent puppy photos and health records',
      followUpNeeded: true,
      followUpDate: daysAgo(43),
      followUpCompleted: true,
      relatedLitterId: litter1Id,
      notes: 'Client responded positively',
      createdAt: daysAgo(45),
      updatedAt: daysAgo(43),
    },
    {
      id: generateId(),
      clientId: client3Id,
      date: daysAgo(20),
      type: 'email',
      direction: 'inbound',
      summary: 'Inquiry about show prospects',
      followUpNeeded: true,
      followUpDate: daysFromNow(2),
      followUpCompleted: false,
      relatedLitterId: litter2Id,
      notes: 'Need to schedule visit',
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
    },
  ];
  
  // ============================================
  // EXTERNAL STUDS
  // ============================================
  
  db.externalStuds = [
    {
      id: generateId(),
      name: 'Champion Elite\'s Legend',
      breed: 'American Bully',
      registrationNumber: 'ABKC-99999',
      ownerName: 'Elite Kennels',
      ownerEmail: 'contact@elitekennels.com',
      ownerPhone: '(555) 777-6666',
      healthTestingNotes: 'OFA hips excellent, elbows normal, all genetic tests clear',
      geneticTestResults: JSON.stringify({ DM: 'clear', HUU: 'clear', EIC: 'clear' }),
      semenType: 'frozen',
      notes: 'Available for AI breeding, excellent bloodline',
      createdAt: daysAgo(200),
      updatedAt: daysAgo(200),
    },
  ];
  
  // ============================================
  // GENETIC TESTS
  // ============================================
  
  db.geneticTests = [
    {
      id: generateId(),
      dogId: sire1Id,
      testName: 'DM',
      testType: 'DM',
      result: 'clear',
      labName: 'Embark',
      testDate: daysAgo(365),
      certificateNumber: 'EMB-2023-001',
      notes: 'Clear - no risk',
      createdAt: daysAgo(365),
      updatedAt: daysAgo(365),
    },
    {
      id: generateId(),
      dogId: sire1Id,
      testName: 'HUU',
      testType: 'HUU',
      result: 'clear',
      labName: 'Embark',
      testDate: daysAgo(365),
      certificateNumber: 'EMB-2023-002',
      notes: 'Clear',
      createdAt: daysAgo(365),
      updatedAt: daysAgo(365),
    },
    {
      id: generateId(),
      dogId: dam1Id,
      testName: 'DM',
      testType: 'DM',
      result: 'carrier',
      labName: 'Embark',
      testDate: daysAgo(300),
      certificateNumber: 'EMB-2023-003',
      notes: 'Carrier - breed to clear only',
      createdAt: daysAgo(300),
      updatedAt: daysAgo(300),
    },
    {
      id: generateId(),
      dogId: dam1Id,
      testName: 'EIC',
      testType: 'EIC',
      result: 'clear',
      labName: 'Embark',
      testDate: daysAgo(300),
      certificateNumber: 'EMB-2023-004',
      notes: 'Clear',
      createdAt: daysAgo(300),
      updatedAt: daysAgo(300),
    },
  ];
  
  // ============================================
  // PUPPY HEALTH TASKS
  // ============================================
  
  db.puppyHealthTasks = [
    // Litter 1 tasks
    {
      id: generateId(),
      litterId: litter1Id,
      puppyId: null,
      taskType: 'deworming',
      taskName: 'First Deworming',
      dueDate: daysAgo(53), // 2 days from birth (55-2=53) ✓
      completedDate: daysAgo(53),
      notes: 'All puppies dewormed',
      createdAt: daysAgo(55),
      updatedAt: daysAgo(53),
    },
    {
      id: generateId(),
      litterId: litter1Id,
      puppyId: null,
      taskType: 'deworming',
      taskName: 'Second Deworming',
      dueDate: daysAgo(41), // 14 days from birth (55-14=41) ✓
      completedDate: daysAgo(41),
      notes: 'Completed',
      createdAt: daysAgo(55),
      updatedAt: daysAgo(41),
    },
    {
      id: generateId(),
      litterId: litter1Id,
      puppyId: puppies1[0].id,
      taskType: 'vaccination',
      taskName: 'First DHPP',
      dueDate: daysAgo(13), // 42 days from birth = 55-42=13 days ago
      completedDate: daysAgo(13),
      notes: 'Completed',
      createdAt: daysAgo(55),
      updatedAt: daysAgo(13),
    },
    {
      id: generateId(),
      litterId: litter1Id,
      puppyId: puppies1[1].id,
      taskType: 'vaccination',
      taskName: 'First DHPP',
      dueDate: daysAgo(13), // Due 13 days ago
      completedDate: null, // NOT COMPLETED - OVERDUE
      notes: 'Need to schedule',
      createdAt: daysAgo(55),
      updatedAt: daysAgo(1),
    },
    {
      id: generateId(),
      litterId: litter1Id,
      puppyId: puppies1[2].id,
      taskType: 'vaccination',
      taskName: 'First DHPP',
      dueDate: daysAgo(2), // Due 2 days ago - OVERDUE
      completedDate: null,
      notes: 'Overdue - need to complete',
      createdAt: daysAgo(55),
      updatedAt: daysAgo(1),
    },
    {
      id: generateId(),
      litterId: litter1Id,
      puppyId: puppies1[3].id,
      taskType: 'vaccination',
      taskName: 'First DHPP',
      dueDate: daysFromNow(1), // Due tomorrow
      completedDate: null,
      notes: 'Due tomorrow',
      createdAt: daysAgo(55),
      updatedAt: daysAgo(1),
    },
    {
      id: generateId(),
      litterId: litter1Id,
      puppyId: null,
      taskType: 'microchipping',
      taskName: 'Microchip All Puppies',
      dueDate: daysAgo(6), // 49 days from birth = 55-49=6 days ago - OVERDUE
      completedDate: null,
      notes: 'Overdue - need to schedule microchipping',
      createdAt: daysAgo(55),
      updatedAt: daysAgo(1),
    },
    {
      id: generateId(),
      litterId: litter1Id,
      puppyId: puppies1[0].id,
      taskType: 'vet_check',
      taskName: 'Health Check',
      dueDate: daysFromNow(1), // 56 days from birth = 55-56=-1, so due tomorrow
      completedDate: null,
      notes: 'Due tomorrow',
      createdAt: daysAgo(55),
      updatedAt: daysAgo(1),
    },
    // Litter 2 tasks (newborn puppies - 10 days old)
    {
      id: generateId(),
      litterId: litter2Id,
      puppyId: null,
      taskType: 'deworming',
      taskName: 'First Deworming',
      dueDate: daysAgo(8), // 2 days from birth = 10-2=8 days ago
      completedDate: daysAgo(8),
      notes: 'Completed',
      createdAt: daysAgo(10),
      updatedAt: daysAgo(8),
    },
    {
      id: generateId(),
      litterId: litter2Id,
      puppyId: null,
      taskType: 'daily_weight',
      taskName: 'Daily Weight Check',
      dueDate: daysAgo(1),
      completedDate: daysAgo(1),
      notes: 'All puppies gaining weight well',
      createdAt: daysAgo(10),
      updatedAt: daysAgo(1),
    },
    {
      id: generateId(),
      litterId: litter2Id,
      puppyId: null,
      taskType: 'daily_weight',
      taskName: 'Daily Weight Check',
      dueDate: now, // Due today
      completedDate: null,
      notes: 'Due today - need to weigh all puppies',
      createdAt: daysAgo(10),
      updatedAt: daysAgo(1),
    },
    {
      id: generateId(),
      litterId: litter2Id,
      puppyId: puppies2[0].id,
      taskType: 'eyes_opening',
      taskName: 'Eyes Opening Check',
      dueDate: daysAgo(3), // Usually around 10-14 days, so due 3 days ago
      completedDate: null, // OVERDUE
      notes: 'Overdue - check if eyes have opened',
      createdAt: daysAgo(10),
      updatedAt: daysAgo(1),
    },
    {
      id: generateId(),
      litterId: litter2Id,
      puppyId: puppies2[1].id,
      taskType: 'eyes_opening',
      taskName: 'Eyes Opening Check',
      dueDate: daysFromNow(2), // Due in 2 days
      completedDate: null,
      notes: 'Due soon',
      createdAt: daysAgo(10),
      updatedAt: daysAgo(1),
    },
    {
      id: generateId(),
      litterId: litter2Id,
      puppyId: null,
      taskType: 'deworming',
      taskName: 'Second Deworming',
      dueDate: daysFromNow(4), // 14 days from birth = 10+4=14 days
      completedDate: null,
      notes: 'Due in 4 days',
      createdAt: daysAgo(10),
      updatedAt: daysAgo(1),
    },
  ];
  
  // ============================================
  // HEALTH SCHEDULE TEMPLATES
  // ============================================
  
  db.healthScheduleTemplates = [
    {
      id: generateId(),
      name: 'Standard 8-Week Schedule',
      description: 'Standard health schedule for puppies',
      items: [
        { taskType: 'deworming', taskName: 'First Deworming', daysFromBirth: 2, isPerPuppy: false, notes: 'Whole litter' },
        { taskType: 'deworming', taskName: 'Second Deworming', daysFromBirth: 14, isPerPuppy: false },
        { taskType: 'vaccination', taskName: 'First DHPP', daysFromBirth: 42, isPerPuppy: true },
        { taskType: 'microchipping', taskName: 'Microchip', daysFromBirth: 49, isPerPuppy: true },
        { taskType: 'vet_check', taskName: 'Health Check', daysFromBirth: 56, isPerPuppy: true },
      ],
      isDefault: true,
      createdAt: daysAgo(365),
      updatedAt: daysAgo(365),
    },
  ];
  
  // ============================================
  // SETTINGS
  // ============================================
  
  db.settings = [
    {
      id: generateId(),
      key: 'weightUnit',
      value: 'lbs',
      updatedAt: daysAgo(100),
    },
    {
      id: generateId(),
      key: 'notificationsEnabled',
      value: 'true',
      updatedAt: daysAgo(100),
    },
  ];
  
  // ============================================
  // PEDIGREE ENTRIES (Full 4-generation pedigree for main dogs)
  // ============================================
  
  // Helper function to create pedigree entries for a dog
  const createPedigree = (dogId: string, baseName: string, baseReg: string) => {
    const entries = [];
    const now = daysAgo(1800);
    
    // Generation 1: Parents (S, D)
    entries.push(
      {
        id: generateId(),
        dogId,
        generation: 1,
        position: 'S',
        ancestorName: `Champion ${baseName}'s Sire`,
        ancestorRegistration: `${baseReg}-S1`,
        ancestorColor: 'Blue',
        ancestorBreed: 'American Bully',
        notes: 'Champion bloodline',
        createdAt: now,
      },
      {
        id: generateId(),
        dogId,
        generation: 1,
        position: 'D',
        ancestorName: `Champion ${baseName}'s Dam`,
        ancestorRegistration: `${baseReg}-D1`,
        ancestorColor: 'Fawn',
        ancestorBreed: 'American Bully',
        notes: 'Excellent producer',
        createdAt: now,
      }
    );
    
    // Generation 2: Grandparents (SS, SD, DS, DD)
    entries.push(
      {
        id: generateId(),
        dogId,
        generation: 2,
        position: 'SS',
        ancestorName: `Grand Champion ${baseName}'s Sire's Sire`,
        ancestorRegistration: `${baseReg}-SS`,
        ancestorColor: 'Blue',
        ancestorBreed: 'American Bully',
        notes: 'Grand Champion',
        createdAt: now,
      },
      {
        id: generateId(),
        dogId,
        generation: 2,
        position: 'SD',
        ancestorName: `Champion ${baseName}'s Sire's Dam`,
        ancestorRegistration: `${baseReg}-SD`,
        ancestorColor: 'Tricolor',
        ancestorBreed: 'American Bully',
        notes: 'Champion',
        createdAt: now,
      },
      {
        id: generateId(),
        dogId,
        generation: 2,
        position: 'DS',
        ancestorName: `Champion ${baseName}'s Dam's Sire`,
        ancestorRegistration: `${baseReg}-DS`,
        ancestorColor: 'Chocolate',
        ancestorBreed: 'American Bully',
        notes: 'Champion',
        createdAt: now,
      },
      {
        id: generateId(),
        dogId,
        generation: 2,
        position: 'DD',
        ancestorName: `Champion ${baseName}'s Dam's Dam`,
        ancestorRegistration: `${baseReg}-DD`,
        ancestorColor: 'Lilac',
        ancestorBreed: 'American Bully',
        notes: 'Champion',
        createdAt: now,
      }
    );
    
    // Generation 3: Great-Grandparents (SSS, SSD, SDS, SDD, DSS, DSD, DDS, DDD)
    const gen3Positions = ['SSS', 'SSD', 'SDS', 'SDD', 'DSS', 'DSD', 'DDS', 'DDD'];
    const gen3Colors = ['Blue', 'Tricolor', 'Chocolate', 'Lilac', 'Red', 'Blue Fawn', 'Tricolor', 'Chocolate'];
    gen3Positions.forEach((pos, idx) => {
      entries.push({
        id: generateId(),
        dogId,
        generation: 3,
        position: pos,
        ancestorName: `${baseName}'s ${pos} Ancestor`,
        ancestorRegistration: `${baseReg}-${pos}`,
        ancestorColor: gen3Colors[idx],
        ancestorBreed: 'American Bully',
        notes: idx < 2 ? 'Champion' : 'Excellent bloodline',
        createdAt: now,
      });
    });
    
    // Generation 4: Great-Great-Grandparents (SSSS, SSSD, SSDS, SSDD, SDSS, SDSD, SDDS, SDDD, DSSS, DSSD, DSDS, DSDD, DDSS, DDSD, DDDS, DDDD)
    const gen4Positions = ['SSSS', 'SSSD', 'SSDS', 'SSDD', 'SDSS', 'SDSD', 'SDDS', 'SDDD', 'DSSS', 'DSSD', 'DSDS', 'DSDD', 'DDSS', 'DDSD', 'DDDS', 'DDDD'];
    const gen4Colors = ['Blue', 'Tricolor', 'Chocolate', 'Lilac', 'Red', 'Blue Fawn', 'Tricolor', 'Chocolate', 'Blue', 'Lilac', 'Red', 'Tricolor', 'Chocolate', 'Blue Fawn', 'Lilac', 'Red'];
    gen4Positions.forEach((pos, idx) => {
      entries.push({
        id: generateId(),
        dogId,
        generation: 4,
        position: pos,
        ancestorName: `${baseName}'s ${pos} Ancestor`,
        ancestorRegistration: `${baseReg}-${pos}`,
        ancestorColor: gen4Colors[idx],
        ancestorBreed: 'American Bully',
        notes: 'Foundation bloodline',
        createdAt: now,
      });
    });
    
    return entries;
  };
  
  // Create full pedigrees for main breeding stock
  db.pedigreeEntries = [
    ...createPedigree(sire1Id, 'Thunder', 'ABKC-12345'),
    ...createPedigree(sire2Id, 'Royal', 'ABKC-12346'),
    ...createPedigree(dam1Id, 'Bella', 'ABKC-12347'),
    ...createPedigree(dam2Id, 'Diamond', 'ABKC-12348'),
    ...createPedigree(dam3Id, 'Ruby', 'ABKC-12349'),
    // Also create pedigrees for some puppies
    ...createPedigree(puppies1[0].id, 'Thunder Jr', 'ABKC-12350'),
    ...createPedigree(puppies1[2].id, 'Storm', 'ABKC-12352'),
  ];
  
  // ============================================
  // DOG PHOTOS (sample paths - no actual files)
  // ============================================
  
  db.dogPhotos = [
    {
      id: generateId(),
      dogId: sire1Id,
      filePath: 'sire1-profile.jpg',
      caption: 'Profile photo',
      isPrimary: true,
      uploadedAt: daysAgo(1800),
    },
    {
      id: generateId(),
      dogId: dam1Id,
      filePath: 'dam1-profile.jpg',
      caption: 'Profile photo',
      isPrimary: true,
      uploadedAt: daysAgo(1000),
    },
    {
      id: generateId(),
      dogId: puppies1[0].id,
      filePath: 'puppy1-photo.jpg',
      caption: '8 weeks old',
      isPrimary: true,
      uploadedAt: daysAgo(40),
    },
  ];
  
  // ============================================
  // LITTER PHOTOS (sample paths)
  // ============================================
  
  db.litterPhotos = [
    {
      id: generateId(),
      litterId: litter1Id,
      filePath: 'litter1-newborn.jpg',
      caption: 'Newborn puppies',
      sortOrder: 1,
      uploadedAt: daysAgo(55),
    },
    {
      id: generateId(),
      litterId: litter1Id,
      filePath: 'litter1-4weeks.jpg',
      caption: '4 weeks old',
      sortOrder: 2,
      uploadedAt: daysAgo(30),
    },
    {
      id: generateId(),
      litterId: litter2Id,
      filePath: 'litter2-newborn.jpg',
      caption: 'Newborn puppies',
      sortOrder: 1,
      uploadedAt: daysAgo(10),
    },
  ];
  
  // Save to localStorage
  saveDb(db);
}


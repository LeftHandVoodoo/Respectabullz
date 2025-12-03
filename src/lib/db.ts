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
        expenses: (parsed.expenses || []).map((e: Expense) => ({
          ...e,
          date: new Date(e.date),
          createdAt: new Date(e.createdAt),
          updatedAt: new Date(e.updatedAt),
        })),
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
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
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
  
  // Monthly expenses
  const monthlyExpenses = db.expenses
    .filter(e => new Date(e.date) >= startOfMonth)
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
  
  return {
    totalDogs: db.dogs.length,
    activeDogs,
    dogsInHeat,
    upcomingShots,
    upcomingDueDates,
    monthlyExpenses,
    puppyTasksDueThisWeek,
    followUpsDue,
    recentActivity: [], // TODO: Implement activity tracking
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


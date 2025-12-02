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
  PedigreeEntry,
  DogPhoto,
  Setting,
  CreateDogInput,
  UpdateDogInput,
  CreateLitterInput,
  UpdateLitterInput,
  CreateClientInput,
  UpdateClientInput,
  CreateExpenseInput,
  UpdateExpenseInput,
  CreateTransportInput,
  UpdateTransportInput,
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
  pedigreeEntries: PedigreeEntry[];
  dogPhotos: DogPhoto[];
  settings: Setting[];
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
  pedigreeEntries: [],
  dogPhotos: [],
  settings: [],
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
      // Convert date strings back to Date objects
      return {
        ...emptyDb,
        ...parsed,
        dogs: (parsed.dogs || []).map((d: Dog) => ({
          ...d,
          dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : null,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt),
        })),
        litters: (parsed.litters || []).map((l: Litter) => ({
          ...l,
          breedingDate: l.breedingDate ? new Date(l.breedingDate) : null,
          dueDate: l.dueDate ? new Date(l.dueDate) : null,
          whelpDate: l.whelpDate ? new Date(l.whelpDate) : null,
          createdAt: new Date(l.createdAt),
          updatedAt: new Date(l.updatedAt),
        })),
        heatCycles: (parsed.heatCycles || []).map((h: HeatCycle) => ({
          ...h,
          startDate: new Date(h.startDate),
          standingHeatStart: h.standingHeatStart ? new Date(h.standingHeatStart) : null,
          standingHeatEnd: h.standingHeatEnd ? new Date(h.standingHeatEnd) : null,
          endDate: h.endDate ? new Date(h.endDate) : null,
          createdAt: new Date(h.createdAt),
          updatedAt: new Date(h.updatedAt),
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
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        })),
      };
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
  
  saveDb(db);
  return true;
}

// ============================================
// VACCINATION OPERATIONS
// ============================================

export async function getVaccinations(dogId?: string): Promise<VaccinationRecord[]> {
  const db = loadDb();
  if (dogId) {
    return db.vaccinations.filter(v => v.dogId === dogId);
  }
  return db.vaccinations;
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
  const transport: Transport = {
    ...input,
    id: generateId(),
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
  
  db.transports[index] = {
    ...db.transports[index],
    ...input,
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
    sales: db.sales.filter(s => s.clientId === c.id),
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
      dog: db.dogs.find(d => d.id === s.dogId),
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
  
  db.clients.splice(index, 1);
  saveDb(db);
  return true;
}

// ============================================
// SALE OPERATIONS
// ============================================

export async function getSales(): Promise<Sale[]> {
  const db = loadDb();
  return db.sales.map(s => ({
    ...s,
    dog: db.dogs.find(d => d.id === s.dogId),
    client: db.clients.find(c => c.id === s.clientId),
  }));
}

export async function createSale(input: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'dog' | 'client'>): Promise<Sale> {
  const db = loadDb();
  const now = new Date();
  const sale: Sale = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  db.sales.push(sale);
  
  // Update dog status to sold
  const dogIndex = db.dogs.findIndex(d => d.id === input.dogId);
  if (dogIndex !== -1) {
    db.dogs[dogIndex].status = 'sold';
    db.dogs[dogIndex].updatedAt = now;
  }
  
  saveDb(db);
  return sale;
}

export async function deleteSale(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.sales.findIndex(s => s.id === id);
  if (index === -1) return false;
  
  const sale = db.sales[index];
  
  // Revert dog status
  const dogIndex = db.dogs.findIndex(d => d.id === sale.dogId);
  if (dogIndex !== -1) {
    db.dogs[dogIndex].status = 'active';
    db.dogs[dogIndex].updatedAt = new Date();
  }
  
  db.sales.splice(index, 1);
  saveDb(db);
  return true;
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
  
  return {
    totalDogs: db.dogs.length,
    activeDogs,
    dogsInHeat,
    upcomingShots,
    upcomingDueDates,
    monthlyExpenses,
    recentActivity: [], // TODO: Implement activity tracking
  };
}

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


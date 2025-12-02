// Core entity types matching Prisma schema

export type DogStatus = 'active' | 'sold' | 'retired' | 'deceased';
export type DogSex = 'M' | 'F';

export type HeatEventType = 'bleeding' | 'progesteroneTest' | 'breeding' | 'other';
export type MedicalRecordType = 'exam' | 'surgery' | 'test' | 'medication' | 'injury' | 'other';
export type TransportMode = 'flight' | 'ground' | 'pickup' | 'other';
export type ExpenseCategory = 
  | 'transport' 
  | 'vet' 
  | 'food' 
  | 'supplies' 
  | 'registration' 
  | 'marketing' 
  | 'utilities' 
  | 'misc';

export interface Dog {
  id: string;
  name: string;
  sex: DogSex;
  breed: string;
  registrationNumber?: string | null;
  dateOfBirth?: Date | null;
  color?: string | null;
  microchipNumber?: string | null;
  status: DogStatus;
  profilePhotoPath?: string | null;
  notes?: string | null;
  sireId?: string | null;
  damId?: string | null;
  litterId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations (optional, populated when included)
  sire?: Dog | null;
  dam?: Dog | null;
  birthLitter?: Litter | null;
  vaccinations?: VaccinationRecord[];
  weightEntries?: WeightEntry[];
  medicalRecords?: MedicalRecord[];
  heatCycles?: HeatCycle[];
  transports?: Transport[];
  photos?: DogPhoto[];
  sale?: Sale | null;
}

export interface Litter {
  id: string;
  code: string;
  nickname?: string | null;
  breedingDate?: Date | null;
  dueDate?: Date | null;
  whelpDate?: Date | null;
  totalBorn?: number | null;
  totalAlive?: number | null;
  notes?: string | null;
  sireId?: string | null;
  damId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  sire?: Dog | null;
  dam?: Dog | null;
  puppies?: Dog[];
  expenses?: Expense[];
}

export interface HeatCycle {
  id: string;
  bitchId: string;
  startDate: Date;
  standingHeatStart?: Date | null;
  standingHeatEnd?: Date | null;
  endDate?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  bitch?: Dog;
  events?: HeatEvent[];
}

export interface HeatEvent {
  id: string;
  heatCycleId: string;
  date: Date;
  type: HeatEventType;
  value?: string | null;
  notes?: string | null;
  createdAt: Date;
}

export interface VaccinationRecord {
  id: string;
  dogId: string;
  date: Date;
  vaccineType: string;
  dose?: string | null;
  lotNumber?: string | null;
  vetClinic?: string | null;
  nextDueDate?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  dog?: Dog;
}

export interface WeightEntry {
  id: string;
  dogId: string;
  date: Date;
  weightLbs: number;
  notes?: string | null;
  createdAt: Date;
  // Relations
  dog?: Dog;
}

export interface MedicalRecord {
  id: string;
  dogId: string;
  date: Date;
  type: MedicalRecordType;
  description: string;
  vetClinic?: string | null;
  attachmentPath?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  dog?: Dog;
}

export interface Transport {
  id: string;
  dogId: string;
  date: Date;
  mode: TransportMode;
  shipperBusinessName?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  originCity?: string | null;
  originState?: string | null;
  destinationCity?: string | null;
  destinationState?: string | null;
  trackingNumber?: string | null;
  cost?: number | null;
  notes?: string | null;
  expenseId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  dog?: Dog;
  expense?: Expense | null;
}

export interface Expense {
  id: string;
  date: Date;
  amount: number;
  category: ExpenseCategory;
  vendorName?: string | null;
  description?: string | null;
  paymentMethod?: string | null;
  isTaxDeductible: boolean;
  receiptPath?: string | null;
  notes?: string | null;
  relatedDogId?: string | null;
  relatedLitterId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  relatedDog?: Dog | null;
  relatedLitter?: Litter | null;
  transport?: Transport | null;
}

export interface Client {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  sales?: Sale[];
}

export interface Sale {
  id: string;
  dogId: string;
  clientId: string;
  saleDate: Date;
  price: number;
  depositAmount?: number | null;
  depositDate?: Date | null;
  contractPath?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  dog?: Dog;
  client?: Client;
}

export interface PedigreeEntry {
  id: string;
  dogId: string;
  generation: number;
  position: string;
  ancestorName: string;
  ancestorRegistration?: string | null;
  ancestorColor?: string | null;
  ancestorBreed?: string | null;
  notes?: string | null;
  createdAt: Date;
}

export interface DogPhoto {
  id: string;
  dogId: string;
  filePath: string;
  caption?: string | null;
  isPrimary: boolean;
  uploadedAt: Date;
}

export interface Attachment {
  id: string;
  entityType: string;
  entityId: string;
  filePath: string;
  fileName: string;
  fileType?: string | null;
  uploadedAt: Date;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  updatedAt: Date;
}

// Form input types (for creating/updating entities)
export type CreateDogInput = Omit<Dog, 'id' | 'createdAt' | 'updatedAt' | 'sire' | 'dam' | 'birthLitter' | 'vaccinations' | 'weightEntries' | 'medicalRecords' | 'heatCycles' | 'transports' | 'photos' | 'sale'>;
export type UpdateDogInput = Partial<CreateDogInput>;

export type CreateLitterInput = Omit<Litter, 'id' | 'createdAt' | 'updatedAt' | 'sire' | 'dam' | 'puppies' | 'expenses'>;
export type UpdateLitterInput = Partial<CreateLitterInput>;

export type CreateClientInput = Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'sales'>;
export type UpdateClientInput = Partial<CreateClientInput>;

export type CreateExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'relatedDog' | 'relatedLitter' | 'transport'>;
export type UpdateExpenseInput = Partial<CreateExpenseInput>;

export type CreateTransportInput = Omit<Transport, 'id' | 'createdAt' | 'updatedAt' | 'dog' | 'expense'>;
export type UpdateTransportInput = Partial<CreateTransportInput>;

// Dashboard stats type
export interface DashboardStats {
  totalDogs: number;
  activeDogs: number;
  dogsInHeat: number;
  upcomingShots: number;
  upcomingDueDates: number;
  monthlyExpenses: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'vaccination' | 'litter' | 'transport' | 'expense' | 'sale';
  description: string;
  date: Date;
  relatedDogId?: string;
  relatedDogName?: string;
}

// Settings types
export type WeightUnit = 'lbs' | 'kg';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: ThemeMode;
  weightUnit: WeightUnit;
  notificationsEnabled: boolean;
  dataFolderPath: string;
}


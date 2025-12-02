// Core entity types matching Prisma schema

export type DogStatus = 'active' | 'sold' | 'retired' | 'deceased';
export type DogSex = 'M' | 'F';

export type HeatEventType = 
  | 'bleeding_start'      // First day of bleeding (proestrus start)
  | 'bleeding_heavy'      // Heavy bleeding
  | 'bleeding_light'      // Light/pink discharge
  | 'discharge_straw'     // Straw-colored discharge (estrus indicator)
  | 'vulva_swelling'      // Vulva swelling observation
  | 'flagging'            // Flagging behavior (receptive)
  | 'standing'            // Standing heat confirmed
  | 'progesterone_test'   // Progesterone blood test
  | 'lh_surge'            // LH surge detected
  | 'breeding_natural'    // Natural breeding
  | 'breeding_ai'         // Artificial insemination
  | 'breeding_surgical'   // Surgical AI
  | 'ovulation'           // Estimated ovulation
  | 'end_receptive'       // No longer receptive
  | 'cycle_end'           // Cycle ended
  | 'other';              // Other observation

export type HeatPhase = 
  | 'proestrus'   // Days 1-9: Bleeding, swelling, attracts males but not receptive
  | 'estrus'      // Days 9-14: Standing heat, receptive, optimal breeding
  | 'diestrus'    // Days 14-60+: Not receptive, pregnancy or pseudo-pregnancy
  | 'anestrus';   // Rest period between cycles
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

// Client Interest & Sales types
export type InterestStatus = 
  | 'interested'       // Initial interest expressed
  | 'contacted'        // Breeder has contacted client
  | 'scheduled_visit'  // Visit/meeting scheduled
  | 'converted'        // Converted to a sale
  | 'lost';            // No longer interested

export type ContactMethod = 
  | 'phone'
  | 'email'
  | 'website'
  | 'social_media'
  | 'referral'
  | 'other';

export type PaymentStatus = 
  | 'deposit_only'   // Only deposit paid
  | 'partial'        // Partial payment made
  | 'paid_in_full'   // Fully paid
  | 'refunded';      // Refunded

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
  salePuppies?: SalePuppy[];
  clientInterests?: ClientInterest[];
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
  startDate: Date;                    // First day of bleeding (proestrus)
  standingHeatStart?: Date | null;    // First day of standing heat (estrus)
  standingHeatEnd?: Date | null;      // Last day of standing heat
  ovulationDate?: Date | null;        // Estimated ovulation date
  optimalBreedingStart?: Date | null; // Optimal breeding window start
  optimalBreedingEnd?: Date | null;   // Optimal breeding window end
  endDate?: Date | null;              // Cycle end date
  expectedDueDate?: Date | null;      // If bred, expected whelp date (63 days from ovulation)
  nextHeatEstimate?: Date | null;     // Predicted next heat (typically 6-7 months)
  cycleLength?: number | null;        // Total cycle length in days
  currentPhase?: HeatPhase | null;    // Current phase of cycle
  isBred?: boolean;                   // Whether breeding occurred
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
  time?: string | null;               // Time of event (HH:MM)
  type: HeatEventType;
  value?: string | null;              // Progesterone level, LH result, etc.
  unit?: string | null;               // ng/mL, nmol/L, etc.
  vetClinic?: string | null;          // Where test was performed
  sireId?: string | null;             // For breeding events
  breedingMethod?: string | null;     // natural, AI fresh, AI frozen, surgical
  notes?: string | null;
  createdAt: Date;
  // Relations
  heatCycle?: HeatCycle;
  sire?: Dog | null;
}

// Input types for heat cycle operations
export type CreateHeatCycleInput = Omit<HeatCycle, 'id' | 'createdAt' | 'updatedAt' | 'bitch' | 'events'>;
export type UpdateHeatCycleInput = Partial<CreateHeatCycleInput>;

export type CreateHeatEventInput = Omit<HeatEvent, 'id' | 'createdAt' | 'heatCycle' | 'sire'>;
export type UpdateHeatEventInput = Partial<CreateHeatEventInput>;

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
  interests?: ClientInterest[];
}

export interface Sale {
  id: string;
  clientId: string;
  saleDate: Date;
  price: number;                              // Total sale price
  depositAmount?: number | null;
  depositDate?: Date | null;
  contractPath?: string | null;
  notes?: string | null;
  // New enhanced fields
  shippedDate?: Date | null;
  receivedDate?: Date | null;
  isLocalPickup: boolean;
  paymentStatus: PaymentStatus;
  warrantyInfo?: string | null;
  registrationTransferDate?: Date | null;
  transportId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  client?: Client;
  puppies?: SalePuppy[];                      // Multiple puppies via junction
  transport?: Transport | null;
  convertedInterests?: ClientInterest[];
}

export interface SalePuppy {
  id: string;
  saleId: string;
  dogId: string;
  price: number;                              // Individual puppy price
  createdAt: Date;
  // Relations
  sale?: Sale;
  dog?: Dog;
}

export interface ClientInterest {
  id: string;
  clientId: string;
  dogId: string;
  interestDate: Date;
  contactMethod: ContactMethod;
  status: InterestStatus;
  notes?: string | null;
  convertedToSaleId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  client?: Client;
  dog?: Dog;
  convertedToSale?: Sale | null;
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

// Sale input types (enhanced for multiple puppies)
export interface CreateSaleInput {
  clientId: string;
  saleDate: Date;
  price: number;
  depositAmount?: number | null;
  depositDate?: Date | null;
  contractPath?: string | null;
  notes?: string | null;
  shippedDate?: Date | null;
  receivedDate?: Date | null;
  isLocalPickup?: boolean;
  paymentStatus?: PaymentStatus;
  warrantyInfo?: string | null;
  registrationTransferDate?: Date | null;
  transportId?: string | null;
  // Puppies with individual prices
  puppies: { dogId: string; price: number }[];
}
export type UpdateSaleInput = Partial<Omit<CreateSaleInput, 'puppies'>> & {
  puppies?: { dogId: string; price: number }[];
};

// ClientInterest input types
export type CreateClientInterestInput = Omit<ClientInterest, 'id' | 'createdAt' | 'updatedAt' | 'client' | 'dog' | 'convertedToSale'>;
export type UpdateClientInterestInput = Partial<CreateClientInterestInput>;

// SalePuppy input types
export interface AddPuppyToSaleInput {
  saleId: string;
  dogId: string;
  price: number;
}

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

// ============================================
// BREEDER SETTINGS
// ============================================

export interface BreederSettings {
  kennelName: string;
  breederName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  kennelRegistration?: string;      // AKC/UKC kennel registration number
  kennelPrefix?: string;            // Prefix for dog registration names
  county?: string;                  // For legal jurisdiction
}

// ============================================
// CONTRACT DATA
// ============================================

export type RegistrationType = 'pet' | 'full_rights';

export interface ContractData {
  // Agreement date
  agreementDate: Date;
  
  // Breeder info (from settings)
  breederName: string;
  kennelName: string;
  breederAddressLine1: string;
  breederAddressLine2?: string;
  breederCity: string;
  breederState: string;
  breederPostalCode: string;
  breederPhone: string;
  breederEmail: string;
  breederCounty?: string;
  kennelPrefix?: string;
  
  // Buyer info (from client)
  buyerName: string;
  buyerAddressLine1?: string;
  buyerAddressLine2?: string;
  buyerCity?: string;
  buyerState?: string;
  buyerPostalCode?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  coBuyerName?: string;
  
  // Puppy info (from dog)
  puppyName: string;
  puppyBreed: string;
  puppySex: 'male' | 'female';
  puppyColor?: string;
  puppyDOB?: Date;
  puppyMicrochip?: string;
  puppyRegistrationNumber?: string;
  sireName?: string;
  damName?: string;
  
  // Sale terms
  salePrice: number;
  salePriceWords: string;           // "One Thousand Dollars and no cents"
  puppyCount: number;
  maleCount: number;
  femaleCount: number;
  registrationType: RegistrationType;
  
  // Signature dates
  signingDate?: Date;
}


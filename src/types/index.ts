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

// Puppy Health Task Types
export type PuppyHealthTaskType = 
  | 'daily_weight'
  | 'dewclaw_removal'
  | 'tail_docking'
  | 'deworming'
  | 'eyes_opening'
  | 'ears_opening'
  | 'first_solid_food'
  | 'vaccination'
  | 'vet_check'
  | 'microchipping'
  | 'temperament_test'
  | 'nail_trim'
  | 'bath'
  | 'socialization'
  | 'other';

// Puppy Evaluation Categories
export type PuppyEvaluationCategory = 'show_prospect' | 'breeding_prospect' | 'pet';

// Litter Status Pipeline
export type LitterStatus = 
  | 'planned'
  | 'bred'
  | 'ultrasound_confirmed'
  | 'xray_confirmed'
  | 'whelped'
  | 'weaning'
  | 'ready_to_go'
  | 'completed';
// Built-in expense categories
export type BuiltInExpenseCategory =
  | 'transport'
  | 'vet'
  | 'food'
  | 'supplies'
  | 'registration'
  | 'breeding'
  | 'marketing'
  | 'utilities'
  | 'misc';

// Expense category can be any string (built-in or custom)
export type ExpenseCategory = string;

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
  // Puppy evaluation fields
  evaluationCategory?: PuppyEvaluationCategory | null;
  structureNotes?: string | null;
  temperamentNotes?: string | null;
  // Registration tracking
  registrationStatus?: 'not_registered' | 'pending' | 'registered' | null;
  registrationType?: 'full' | 'limited' | null;
  registryName?: string | null;
  registrationDeadline?: Date | null;
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
  geneticTests?: GeneticTest[];
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
  // Status tracking
  status?: LitterStatus | null;
  // Pregnancy confirmation tracking
  ultrasoundDate?: Date | null;
  ultrasoundResult?: 'pregnant' | 'not_pregnant' | 'inconclusive' | null;
  ultrasoundPuppyCount?: number | null;
  xrayDate?: Date | null;
  xrayPuppyCount?: number | null;
  // Whelping checklist state (JSON stored as string)
  whelpingChecklistState?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  sire?: Dog | null;
  dam?: Dog | null;
  puppies?: Dog[];
  expenses?: Expense[];
  photos?: LitterPhoto[];
  healthTasks?: PuppyHealthTask[];
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

export interface LitterPhoto {
  id: string;
  litterId: string;
  filePath: string;
  caption?: string | null;
  sortOrder: number;
  uploadedAt: Date;
  // Relations
  litter?: Litter;
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

// ============================================
// PUPPY HEALTH TASK SYSTEM
// ============================================

export interface PuppyHealthTask {
  id: string;
  litterId: string;
  puppyId?: string | null;  // Optional - null for litter-wide tasks
  taskType: PuppyHealthTaskType;
  taskName: string;         // Display name for the task
  dueDate: Date;
  completedDate?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  litter?: Litter;
  puppy?: Dog | null;
}

export interface HealthScheduleTemplateItem {
  taskType: PuppyHealthTaskType;
  taskName: string;
  daysFromBirth: number;    // When the task is due (days after whelp date)
  isPerPuppy: boolean;      // If true, create one task per puppy; if false, one for whole litter
  notes?: string;
}

export interface HealthScheduleTemplate {
  id: string;
  name: string;
  description?: string | null;
  items: HealthScheduleTemplateItem[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Input types for puppy health tasks
export type CreatePuppyHealthTaskInput = Omit<PuppyHealthTask, 'id' | 'createdAt' | 'updatedAt' | 'litter' | 'puppy'>;
export type UpdatePuppyHealthTaskInput = Partial<CreatePuppyHealthTaskInput>;

// ============================================
// WAITLIST & RESERVATION SYSTEM
// ============================================

export type WaitlistStatus = 'waiting' | 'matched' | 'converted' | 'withdrawn';
export type DepositStatus = 'pending' | 'paid' | 'refunded' | 'applied_to_sale';
export type SexPreference = 'male' | 'female' | 'either';

export interface WaitlistEntry {
  id: string;
  clientId: string;
  litterId?: string | null;  // null for general waitlist
  position: number;          // Pick order
  preference: SexPreference;
  colorPreference?: string | null;
  depositAmount?: number | null;
  depositDate?: Date | null;
  depositStatus: DepositStatus;
  status: WaitlistStatus;
  assignedPuppyId?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  client?: Client;
  litter?: Litter | null;
  assignedPuppy?: Dog | null;
}

// Input types for waitlist
export type CreateWaitlistEntryInput = Omit<WaitlistEntry, 'id' | 'createdAt' | 'updatedAt' | 'client' | 'litter' | 'assignedPuppy'>;
export type UpdateWaitlistEntryInput = Partial<CreateWaitlistEntryInput>;

// ============================================
// CLIENT COMMUNICATION LOGGING
// ============================================

export type CommunicationType = 'phone' | 'email' | 'text' | 'in_person' | 'video_call' | 'social_media';
export type CommunicationDirection = 'inbound' | 'outbound';

export interface CommunicationLog {
  id: string;
  clientId: string;
  date: Date;
  type: CommunicationType;
  direction: CommunicationDirection;
  summary: string;
  followUpNeeded: boolean;
  followUpDate?: Date | null;
  followUpCompleted?: boolean;
  relatedLitterId?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  client?: Client;
  relatedLitter?: Litter | null;
}

// Input types for communication logs
export type CreateCommunicationLogInput = Omit<CommunicationLog, 'id' | 'createdAt' | 'updatedAt' | 'client' | 'relatedLitter'>;
export type UpdateCommunicationLogInput = Partial<CreateCommunicationLogInput>;

// ============================================
// EXTERNAL STUD DATABASE
// ============================================

export type SemenType = 'fresh' | 'chilled' | 'frozen';

export interface ExternalStud {
  id: string;
  name: string;
  breed: string;
  registrationNumber?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  healthTestingNotes?: string | null;
  geneticTestResults?: string | null;  // JSON string
  semenType?: SemenType | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateExternalStudInput = Omit<ExternalStud, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateExternalStudInput = Partial<CreateExternalStudInput>;

// ============================================
// GENETIC TESTING & COMPATIBILITY
// ============================================

export type GeneticTestStatus = 'clear' | 'carrier' | 'affected' | 'pending';

// Common genetic tests for dogs
export type CommonGeneticTest = 
  | 'DM'        // Degenerative Myelopathy
  | 'HUU'       // Hyperuricosuria
  | 'CMR1'      // Canine Multifocal Retinopathy 1
  | 'EIC'       // Exercise Induced Collapse
  | 'vWD1'      // Von Willebrand Disease Type 1
  | 'PRA-prcd'  // Progressive Retinal Atrophy - prcd
  | 'CDDY'      // Chondrodystrophy
  | 'CDPA'      // Chondrodysplasia
  | 'NCL'       // Neuronal Ceroid Lipofuscinosis
  | 'JHC'       // Juvenile Hereditary Cataracts
  | 'HSF4'      // Hereditary Cataracts
  | 'MDR1'      // Multi-Drug Resistance 1
  | 'other';

export interface GeneticTest {
  id: string;
  dogId: string;
  testName: string;          // e.g., "DM", "HUU", or custom name
  testType: CommonGeneticTest;
  result: GeneticTestStatus;
  labName?: string | null;
  testDate?: Date | null;
  certificateNumber?: string | null;
  certificatePath?: string | null;  // Path to PDF certificate
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  dog?: Dog;
}

export type CreateGeneticTestInput = Omit<GeneticTest, 'id' | 'createdAt' | 'updatedAt' | 'dog'>;
export type UpdateGeneticTestInput = Partial<CreateGeneticTestInput>;

// Mating compatibility result
export interface MatingCompatibilityResult {
  isCompatible: boolean;
  warnings: MatingWarning[];
  summary: string;
}

export interface MatingWarning {
  testName: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  damStatus: GeneticTestStatus | null;
  sireStatus: GeneticTestStatus | null;
}

// ============================================
// HEAT CYCLE PREDICTIONS
// ============================================

export interface HeatCyclePrediction {
  dogId: string;
  averageCycleLength: number | null;
  averageIntervalDays: number | null;
  predictedNextHeat: Date | null;
  confidence: 'low' | 'medium' | 'high';  // Based on data points
  dataPointCount: number;
}

// Form input types (for creating/updating entities)
export type CreateDogInput = Omit<Dog, 'id' | 'createdAt' | 'updatedAt' | 'sire' | 'dam' | 'birthLitter' | 'vaccinations' | 'weightEntries' | 'medicalRecords' | 'heatCycles' | 'transports' | 'photos' | 'sale'>;
export type UpdateDogInput = Partial<CreateDogInput>;

export type CreateLitterInput = Omit<Litter, 'id' | 'createdAt' | 'updatedAt' | 'sire' | 'dam' | 'puppies' | 'expenses' | 'photos'>;
export type UpdateLitterInput = Partial<CreateLitterInput>;

// LitterPhoto input types
export type CreateLitterPhotoInput = Omit<LitterPhoto, 'id' | 'uploadedAt' | 'litter'>;
export type UpdateLitterPhotoInput = Partial<CreateLitterPhotoInput>;

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
  puppyTasksDueThisWeek: number;
  followUpsDue: number;
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

// ============================================
// CUSTOMER PACKET EXPORT
// ============================================

export interface PacketOptions {
  // Sections to include
  includeDogInfo: boolean;
  includePedigree: boolean;
  includeVaccinations: boolean;
  includeMedicalRecords: boolean;
  includeWeightChart: boolean;
  includeGeneticTests: boolean;
  includePhotos: boolean;
  includeParentPhotos: boolean;
  includeFinancial: boolean;
  includeCareInstructions: boolean;
  includeRegistration: boolean;
  
  // Pedigree options
  pedigreeGenerations: 2 | 3 | 4;
}

export interface PacketData {
  // Dog information
  dog: Dog;
  
  // Pedigree data - parents and ancestors
  sire: Dog | null;
  dam: Dog | null;
  pedigreeAncestors: {
    generation: number;
    position: string;
    dog: Dog | null;
    name: string;
    registrationNumber: string | null;
    color: string | null;
  }[];
  
  // Health records
  vaccinations: VaccinationRecord[];
  medicalRecords: MedicalRecord[];
  weightEntries: WeightEntry[];
  geneticTests: GeneticTest[];
  
  // Photos
  dogPhotos: DogPhoto[];
  sirePhoto: string | null;
  damPhoto: string | null;
  
  // Financial data
  sale: Sale | null;
  client: Client | null;
  expenses: Expense[];
  
  // Breeder information
  breederSettings: BreederSettings;
}

export const DEFAULT_PACKET_OPTIONS: PacketOptions = {
  includeDogInfo: true,
  includePedigree: true,
  includeVaccinations: true,
  includeMedicalRecords: true,
  includeWeightChart: true,
  includeGeneticTests: true,
  includePhotos: true,
  includeParentPhotos: true,
  includeFinancial: true,
  includeCareInstructions: true,
  includeRegistration: true,
  pedigreeGenerations: 4,
};

// ============================================
// DOCUMENT MANAGEMENT SYSTEM
// ============================================

// Predefined document tag types
export type PredefinedDocumentTag =
  | 'invoice'
  | 'receipt'
  | 'contract'
  | 'health_certificate'
  | 'registration'
  | 'vet_record'
  | 'vaccination'
  | 'genetic_test'
  | 'microchip'
  | 'photo'
  | 'shipping'
  | 'insurance'
  | 'other';

// Document tag with metadata
export interface DocumentTag {
  id: string;
  name: string;
  color?: string | null;
  isCustom: boolean;
  createdAt: Date;
}

// Document entity
export interface Document {
  id: string;
  filename: string;
  originalName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  notes?: string | null;
  uploadedAt: Date;
  updatedAt: Date;
  // Relations
  tags?: DocumentTag[];
}

// Document-to-tag junction
export interface DocumentTagLink {
  id: string;
  documentId: string;
  tagId: string;
  createdAt: Date;
  // Relations
  document?: Document;
  tag?: DocumentTag;
}

// Document-to-dog junction
export interface DogDocument {
  id: string;
  dogId: string;
  documentId: string;
  createdAt: Date;
  // Relations
  dog?: Dog;
  document?: Document;
}

// Document-to-litter junction
export interface LitterDocument {
  id: string;
  litterId: string;
  documentId: string;
  createdAt: Date;
  // Relations
  litter?: Litter;
  document?: Document;
}

// Document-to-expense junction
export interface ExpenseDocument {
  id: string;
  expenseId: string;
  documentId: string;
  createdAt: Date;
  // Relations
  expense?: Expense;
  document?: Document;
}

// Input types for document operations
export interface CreateDocumentInput {
  filename: string;
  originalName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  notes?: string | null;
  tagIds?: string[];
}

export type UpdateDocumentInput = Partial<Omit<CreateDocumentInput, 'filename' | 'filePath' | 'mimeType' | 'fileSize'>> & {
  tagIds?: string[];
};

export interface CreateDocumentTagInput {
  name: string;
  color?: string | null;
  isCustom?: boolean;
}

// Predefined document tags with colors
export const PREDEFINED_DOCUMENT_TAGS: { name: string; slug: PredefinedDocumentTag; color: string }[] = [
  { name: 'Invoice', slug: 'invoice', color: '#3B82F6' },         // Blue
  { name: 'Receipt', slug: 'receipt', color: '#10B981' },         // Green
  { name: 'Contract', slug: 'contract', color: '#8B5CF6' },       // Purple
  { name: 'Health Certificate', slug: 'health_certificate', color: '#EC4899' }, // Pink
  { name: 'Registration Papers', slug: 'registration', color: '#F59E0B' },      // Amber
  { name: 'Vet Record', slug: 'vet_record', color: '#EF4444' },   // Red
  { name: 'Vaccination Record', slug: 'vaccination', color: '#06B6D4' },        // Cyan
  { name: 'Genetic Test Results', slug: 'genetic_test', color: '#84CC16' },     // Lime
  { name: 'Microchip Certificate', slug: 'microchip', color: '#6366F1' },       // Indigo
  { name: 'Photo/Image', slug: 'photo', color: '#14B8A6' },       // Teal
  { name: 'Shipping/Transport', slug: 'shipping', color: '#F97316' },           // Orange
  { name: 'Insurance', slug: 'insurance', color: '#0EA5E9' },     // Sky
  { name: 'Other', slug: 'other', color: '#6B7280' },             // Gray
];

// Document with full relations
export interface DocumentWithRelations extends Document {
  tags: DocumentTag[];
  dogs?: Dog[];
  litters?: Litter[];
  expenses?: Expense[];
}

// ============================================
// CONTACTS MANAGEMENT SYSTEM
// ============================================

// Contact category (predefined + custom)
export interface ContactCategory {
  id: string;
  name: string;
  color?: string | null;
  isPredefined: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Predefined contact category names
export type PredefinedContactCategory =
  | 'Client'
  | 'Shipping Company'
  | 'Graphic Designer'
  | 'Breeder'
  | 'Vet';

// Contact entity
export interface Contact {
  id: string;
  name: string;
  companyName?: string | null;
  phonePrimary?: string | null;
  phoneSecondary?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
  website?: string | null;
  notes?: string | null;
  businessCardDocumentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations (populated when included)
  categories?: ContactCategory[];
  businessCardDocument?: Document | null;
}

// Contact-to-category junction
export interface ContactCategoryLink {
  id: string;
  contactId: string;
  categoryId: string;
  createdAt: Date;
  // Relations
  contact?: Contact;
  category?: ContactCategory;
}

// Input types for contact operations
export type CreateContactInput = Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'categories' | 'businessCardDocument'> & {
  categoryIds?: string[];
};
export type UpdateContactInput = Partial<CreateContactInput>;

export interface CreateContactCategoryInput {
  name: string;
  color?: string | null;
  isPredefined?: boolean;
}
export type UpdateContactCategoryInput = Partial<CreateContactCategoryInput>;

// Predefined contact categories with colors
export const PREDEFINED_CONTACT_CATEGORIES: { name: PredefinedContactCategory; color: string }[] = [
  { name: 'Client', color: '#3B82F6' },           // Blue
  { name: 'Shipping Company', color: '#F97316' }, // Orange
  { name: 'Graphic Designer', color: '#8B5CF6' }, // Purple
  { name: 'Breeder', color: '#10B981' },          // Green
  { name: 'Vet', color: '#EF4444' },              // Red
];

// Contact with full relations
export interface ContactWithRelations extends Contact {
  categories: ContactCategory[];
  businessCardDocument?: Document | null;
}

// ============================================
// BUG REPORTING SYSTEM
// ============================================

export const bugReportSeverity = ['low', 'medium', 'high', 'critical'] as const;
export type BugReportSeverity = (typeof bugReportSeverity)[number];

export interface BugReportFormData {
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  severity: BugReportSeverity;
}

export interface SystemInfo {
  appVersion: string;
  platform: string;
  userAgent: string;
  timestamp: string;
}

export interface BugReportPayload extends BugReportFormData {
  systemInfo: SystemInfo;
}

export interface GitHubIssueResponse {
  id: number;
  number: number;
  html_url: string;
  title: string;
  state: string;
}


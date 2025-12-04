-- Respectabullz Database Schema
-- SQLite schema matching Prisma models
-- Version: 1.0.0

-- ============================================
-- SCHEMA VERSION TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS _schema_version (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version INTEGER NOT NULL DEFAULT 1,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO _schema_version (id, version) VALUES (1, 1);

-- ============================================
-- CORE ENTITIES
-- ============================================

-- Individual dog record
CREATE TABLE IF NOT EXISTS dogs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('M', 'F')),
  breed TEXT NOT NULL,
  registration_number TEXT,
  date_of_birth TEXT,
  color TEXT,
  microchip_number TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'retired', 'deceased')),
  profile_photo_path TEXT,
  notes TEXT,
  sire_id TEXT REFERENCES dogs(id) ON DELETE SET NULL,
  dam_id TEXT REFERENCES dogs(id) ON DELETE SET NULL,
  litter_id TEXT REFERENCES litters(id) ON DELETE SET NULL,
  -- Puppy evaluation fields
  evaluation_category TEXT CHECK (evaluation_category IN ('show_prospect', 'breeding_prospect', 'pet')),
  structure_notes TEXT,
  temperament_notes TEXT,
  -- Registration tracking
  registration_status TEXT CHECK (registration_status IN ('not_registered', 'pending', 'registered')),
  registration_type TEXT CHECK (registration_type IN ('full', 'limited')),
  registry_name TEXT,
  registration_deadline TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dogs_status ON dogs(status);
CREATE INDEX IF NOT EXISTS idx_dogs_sire ON dogs(sire_id);
CREATE INDEX IF NOT EXISTS idx_dogs_dam ON dogs(dam_id);
CREATE INDEX IF NOT EXISTS idx_dogs_litter ON dogs(litter_id);

-- Breeding litter record
CREATE TABLE IF NOT EXISTS litters (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  nickname TEXT,
  breeding_date TEXT,
  due_date TEXT,
  whelp_date TEXT,
  total_born INTEGER,
  total_alive INTEGER,
  notes TEXT,
  sire_id TEXT REFERENCES dogs(id) ON DELETE SET NULL,
  dam_id TEXT REFERENCES dogs(id) ON DELETE SET NULL,
  -- Status tracking
  status TEXT CHECK (status IN ('planned', 'bred', 'ultrasound_confirmed', 'xray_confirmed', 'whelped', 'weaning', 'ready_to_go', 'completed')),
  -- Pregnancy confirmation
  ultrasound_date TEXT,
  ultrasound_result TEXT,
  xray_date TEXT,
  xray_puppy_count INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_litters_status ON litters(status);
CREATE INDEX IF NOT EXISTS idx_litters_sire ON litters(sire_id);
CREATE INDEX IF NOT EXISTS idx_litters_dam ON litters(dam_id);

-- ============================================
-- BREEDING & REPRODUCTION
-- ============================================

-- Heat cycle tracking
CREATE TABLE IF NOT EXISTS heat_cycles (
  id TEXT PRIMARY KEY,
  bitch_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  start_date TEXT NOT NULL,
  standing_heat_start TEXT,
  standing_heat_end TEXT,
  ovulation_date TEXT,
  optimal_breeding_start TEXT,
  optimal_breeding_end TEXT,
  end_date TEXT,
  expected_due_date TEXT,
  next_heat_estimate TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_heat_cycles_bitch ON heat_cycles(bitch_id);

-- Heat events (progesterone tests, breedings, etc.)
CREATE TABLE IF NOT EXISTS heat_events (
  id TEXT PRIMARY KEY,
  heat_cycle_id TEXT NOT NULL REFERENCES heat_cycles(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  value TEXT,
  sire_id TEXT REFERENCES dogs(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_heat_events_cycle ON heat_events(heat_cycle_id);

-- External stud records
CREATE TABLE IF NOT EXISTS external_studs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  breed TEXT NOT NULL,
  registration_number TEXT,
  color TEXT,
  owner_name TEXT,
  owner_phone TEXT,
  owner_email TEXT,
  stud_fee REAL,
  notes TEXT,
  photo_path TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- HEALTH RECORDS
-- ============================================

-- Vaccination records
CREATE TABLE IF NOT EXISTS vaccination_records (
  id TEXT PRIMARY KEY,
  dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  vaccine_type TEXT NOT NULL,
  dose TEXT,
  lot_number TEXT,
  vet_clinic TEXT,
  next_due_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_vaccinations_dog ON vaccination_records(dog_id);

-- Weight entries
CREATE TABLE IF NOT EXISTS weight_entries (
  id TEXT PRIMARY KEY,
  dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  weight_lbs REAL NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_weight_entries_dog ON weight_entries(dog_id);

-- Medical records
CREATE TABLE IF NOT EXISTS medical_records (
  id TEXT PRIMARY KEY,
  dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('exam', 'surgery', 'test', 'medication', 'injury', 'other')),
  description TEXT NOT NULL,
  vet_clinic TEXT,
  attachment_path TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_medical_records_dog ON medical_records(dog_id);

-- Genetic tests
CREATE TABLE IF NOT EXISTS genetic_tests (
  id TEXT PRIMARY KEY,
  dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  test_date TEXT NOT NULL,
  test_type TEXT NOT NULL,
  result TEXT NOT NULL,
  lab_name TEXT,
  certificate_path TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_genetic_tests_dog ON genetic_tests(dog_id);

-- Puppy health tasks
CREATE TABLE IF NOT EXISTS puppy_health_tasks (
  id TEXT PRIMARY KEY,
  litter_id TEXT NOT NULL REFERENCES litters(id) ON DELETE CASCADE,
  puppy_id TEXT REFERENCES dogs(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  due_date TEXT NOT NULL,
  completed_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_puppy_health_tasks_litter ON puppy_health_tasks(litter_id);
CREATE INDEX IF NOT EXISTS idx_puppy_health_tasks_puppy ON puppy_health_tasks(puppy_id);

-- Health schedule templates
CREATE TABLE IF NOT EXISTS health_schedule_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  items TEXT NOT NULL, -- JSON array of template items
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- LOGISTICS
-- ============================================

-- Transport records
CREATE TABLE IF NOT EXISTS transports (
  id TEXT PRIMARY KEY,
  dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('flight', 'ground', 'pickup', 'other')),
  shipper_business_name TEXT,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  origin_city TEXT,
  origin_state TEXT,
  destination_city TEXT,
  destination_state TEXT,
  tracking_number TEXT,
  cost REAL,
  expense_id TEXT UNIQUE REFERENCES expenses(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transports_dog ON transports(dog_id);

-- ============================================
-- FINANCIAL
-- ============================================

-- Custom expense categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_expense_categories_name ON expense_categories(name);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  vendor_name TEXT,
  description TEXT,
  payment_method TEXT,
  is_tax_deductible INTEGER NOT NULL DEFAULT 0,
  receipt_path TEXT,
  related_dog_id TEXT REFERENCES dogs(id) ON DELETE SET NULL,
  related_litter_id TEXT REFERENCES litters(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_dog ON expenses(related_dog_id);
CREATE INDEX IF NOT EXISTS idx_expenses_litter ON expenses(related_litter_id);

-- ============================================
-- CLIENTS & SALES
-- ============================================

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  sale_date TEXT NOT NULL,
  price REAL NOT NULL,
  deposit_amount REAL,
  deposit_date TEXT,
  contract_path TEXT,
  shipped_date TEXT,
  received_date TEXT,
  is_local_pickup INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'deposit_only' CHECK (payment_status IN ('deposit_only', 'paid_in_full', 'partial', 'refunded')),
  warranty_info TEXT,
  registration_transfer_date TEXT,
  transport_id TEXT UNIQUE REFERENCES transports(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sales_client ON sales(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(payment_status);

-- Sale puppies (many-to-many junction)
CREATE TABLE IF NOT EXISTS sale_puppies (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  price REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(sale_id, dog_id)
);

CREATE INDEX IF NOT EXISTS idx_sale_puppies_sale ON sale_puppies(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_puppies_dog ON sale_puppies(dog_id);

-- Client interests
CREATE TABLE IF NOT EXISTS client_interests (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  interest_date TEXT NOT NULL,
  contact_method TEXT NOT NULL CHECK (contact_method IN ('phone', 'email', 'website', 'social_media', 'referral', 'other')),
  status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'contacted', 'scheduled_visit', 'converted', 'lost')),
  converted_to_sale_id TEXT REFERENCES sales(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_client_interests_client ON client_interests(client_id);
CREATE INDEX IF NOT EXISTS idx_client_interests_dog ON client_interests(dog_id);

-- Waitlist entries
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  litter_id TEXT REFERENCES litters(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  sex_preference TEXT CHECK (sex_preference IN ('M', 'F')),
  color_preference TEXT,
  deposit_amount REAL,
  deposit_date TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched', 'converted', 'cancelled')),
  matched_puppy_id TEXT REFERENCES dogs(id) ON DELETE SET NULL,
  converted_sale_id TEXT REFERENCES sales(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_waitlist_client ON waitlist_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_litter ON waitlist_entries(litter_id);

-- Communication logs
CREATE TABLE IF NOT EXISTS communication_logs (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('phone', 'email', 'text', 'in_person', 'other')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  subject TEXT,
  content TEXT,
  follow_up_date TEXT,
  follow_up_completed INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_communication_logs_client ON communication_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_follow_up ON communication_logs(follow_up_date);

-- ============================================
-- PEDIGREE
-- ============================================

-- Pedigree entries (deep ancestry)
CREATE TABLE IF NOT EXISTS pedigree_entries (
  id TEXT PRIMARY KEY,
  dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  generation INTEGER NOT NULL,
  position TEXT NOT NULL,
  ancestor_name TEXT NOT NULL,
  ancestor_registration TEXT,
  ancestor_color TEXT,
  ancestor_breed TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(dog_id, generation, position)
);

CREATE INDEX IF NOT EXISTS idx_pedigree_entries_dog ON pedigree_entries(dog_id);

-- ============================================
-- ATTACHMENTS & MEDIA
-- ============================================

-- Dog photos
CREATE TABLE IF NOT EXISTS dog_photos (
  id TEXT PRIMARY KEY,
  dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  caption TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dog_photos_dog ON dog_photos(dog_id);

-- Litter photos
CREATE TABLE IF NOT EXISTS litter_photos (
  id TEXT PRIMARY KEY,
  litter_id TEXT NOT NULL REFERENCES litters(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_litter_photos_litter ON litter_photos(litter_id);

-- General attachments
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);

-- ============================================
-- DOCUMENT MANAGEMENT SYSTEM
-- ============================================

-- Document tags (predefined + custom)
CREATE TABLE IF NOT EXISTS document_tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  is_custom INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_document_tags_name ON document_tags(name);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  notes TEXT,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Document to tag junction (many-to-many)
CREATE TABLE IF NOT EXISTS document_tag_links (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES document_tags(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(document_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_document_tag_links_document ON document_tag_links(document_id);
CREATE INDEX IF NOT EXISTS idx_document_tag_links_tag ON document_tag_links(tag_id);

-- Document to dog junction (many-to-many)
CREATE TABLE IF NOT EXISTS dog_documents (
  id TEXT PRIMARY KEY,
  dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(dog_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_dog_documents_dog ON dog_documents(dog_id);
CREATE INDEX IF NOT EXISTS idx_dog_documents_document ON dog_documents(document_id);

-- Document to litter junction (many-to-many)
CREATE TABLE IF NOT EXISTS litter_documents (
  id TEXT PRIMARY KEY,
  litter_id TEXT NOT NULL REFERENCES litters(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(litter_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_litter_documents_litter ON litter_documents(litter_id);
CREATE INDEX IF NOT EXISTS idx_litter_documents_document ON litter_documents(document_id);

-- Document to expense junction (many-to-many)
CREATE TABLE IF NOT EXISTS expense_documents (
  id TEXT PRIMARY KEY,
  expense_id TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(expense_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_expense_documents_expense ON expense_documents(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_documents_document ON expense_documents(document_id);

-- ============================================
-- SETTINGS
-- ============================================

-- User settings
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);


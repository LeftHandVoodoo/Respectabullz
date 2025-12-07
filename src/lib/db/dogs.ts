// Dog database operations
// Handles CRUD and queries for dogs, photos, and pedigree entries

import { query, execute } from './connection';
import { generateId, dateToSql, sqlToDate, nowIso } from './utils';
import type {
  Dog,
  DogPhoto,
  DogSex,
  DogStatus,
  PedigreeEntry,
  PuppyEvaluationCategory,
  CreateDogInput,
  UpdateDogInput,
} from '@/types';

// Type guards for enum validation
const VALID_DOG_SEX: DogSex[] = ['M', 'F'];
const VALID_DOG_STATUS: DogStatus[] = ['active', 'sold', 'retired', 'deceased'];
const VALID_EVALUATION_CATEGORY: PuppyEvaluationCategory[] = ['show_prospect', 'breeding_prospect', 'pet'];
const VALID_REGISTRATION_STATUS = ['not_registered', 'pending', 'registered'] as const;
const VALID_REGISTRATION_TYPE = ['full', 'limited'] as const;

function isValidDogSex(value: string | null): value is DogSex {
  return value !== null && VALID_DOG_SEX.includes(value as DogSex);
}

function isValidDogStatus(value: string | null): value is DogStatus {
  return value !== null && VALID_DOG_STATUS.includes(value as DogStatus);
}

function isValidEvaluationCategory(value: string | null | undefined): value is PuppyEvaluationCategory {
  return value !== null && value !== undefined && VALID_EVALUATION_CATEGORY.includes(value as PuppyEvaluationCategory);
}

function isValidRegistrationStatus(value: string | null | undefined): value is Dog['registrationStatus'] {
  return value === null || value === undefined || VALID_REGISTRATION_STATUS.includes(value as typeof VALID_REGISTRATION_STATUS[number]);
}

function isValidRegistrationType(value: string | null | undefined): value is Dog['registrationType'] {
  return value === null || value === undefined || VALID_REGISTRATION_TYPE.includes(value as typeof VALID_REGISTRATION_TYPE[number]);
}

// SQL row type for dogs table
interface DogRow {
  id: string;
  name: string;
  sex: string;
  breed: string;
  registration_number: string | null;
  date_of_birth: string | null;
  color: string | null;
  microchip_number: string | null;
  status: string;
  profile_photo_path: string | null;
  notes: string | null;
  sire_id: string | null;
  dam_id: string | null;
  litter_id: string | null;
  evaluation_category: string | null;
  structure_notes: string | null;
  temperament_notes: string | null;
  registration_status: string | null;
  registration_type: string | null;
  registry_name: string | null;
  registration_deadline: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert a database row to a Dog object
 */
function rowToDog(row: DogRow): Dog {
  // Validate enum values with fallbacks for invalid data
  const sex: DogSex = isValidDogSex(row.sex) ? row.sex : 'M';
  const status: DogStatus = isValidDogStatus(row.status) ? row.status : 'active';
  const evaluationCategory = isValidEvaluationCategory(row.evaluation_category)
    ? row.evaluation_category
    : null;
  const registrationStatus = isValidRegistrationStatus(row.registration_status)
    ? row.registration_status
    : null;
  const registrationType = isValidRegistrationType(row.registration_type)
    ? row.registration_type
    : null;

  return {
    id: row.id,
    name: row.name,
    sex,
    breed: row.breed,
    registrationNumber: row.registration_number,
    dateOfBirth: sqlToDate(row.date_of_birth),
    color: row.color,
    microchipNumber: row.microchip_number,
    status,
    profilePhotoPath: row.profile_photo_path,
    notes: row.notes,
    sireId: row.sire_id,
    damId: row.dam_id,
    litterId: row.litter_id,
    evaluationCategory,
    structureNotes: row.structure_notes,
    temperamentNotes: row.temperament_notes,
    registrationStatus,
    registrationType,
    registryName: row.registry_name,
    registrationDeadline: sqlToDate(row.registration_deadline),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Get all dogs
 */
export async function getDogs(): Promise<Dog[]> {
  const rows = await query<DogRow>('SELECT * FROM dogs ORDER BY name');
  return rows.map(rowToDog);
}

/**
 * Get a single dog by ID with relations populated
 */
export async function getDog(id: string): Promise<Dog | null> {
  const rows = await query<DogRow>('SELECT * FROM dogs WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  
  const dog = rowToDog(rows[0]);
  
  // Populate sire
  if (dog.sireId) {
    const sireRows = await query<DogRow>('SELECT * FROM dogs WHERE id = ?', [dog.sireId]);
    dog.sire = sireRows.length > 0 ? rowToDog(sireRows[0]) : null;
  }
  
  // Populate dam
  if (dog.damId) {
    const damRows = await query<DogRow>('SELECT * FROM dogs WHERE id = ?', [dog.damId]);
    dog.dam = damRows.length > 0 ? rowToDog(damRows[0]) : null;
  }
  
  // Populate photos
  dog.photos = await getDogPhotos(id);
  
  return dog;
}

/**
 * Create a new dog
 */
export async function createDog(input: CreateDogInput): Promise<Dog> {
  const id = generateId();
  const now = nowIso();
  
  await execute(
    `INSERT INTO dogs (
      id, name, sex, breed, registration_number, date_of_birth, color,
      microchip_number, status, profile_photo_path, notes, sire_id, dam_id,
      litter_id, evaluation_category, structure_notes, temperament_notes,
      registration_status, registration_type, registry_name, registration_deadline,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.sex,
      input.breed,
      input.registrationNumber ?? null,
      dateToSql(input.dateOfBirth),
      input.color ?? null,
      input.microchipNumber ?? null,
      input.status ?? 'active',
      input.profilePhotoPath ?? null,
      input.notes ?? null,
      input.sireId ?? null,
      input.damId ?? null,
      input.litterId ?? null,
      input.evaluationCategory ?? null,
      input.structureNotes ?? null,
      input.temperamentNotes ?? null,
      input.registrationStatus ?? null,
      input.registrationType ?? null,
      input.registryName ?? null,
      dateToSql(input.registrationDeadline),
      now,
      now,
    ]
  );
  
  const dog = await getDog(id);
  if (!dog) throw new Error('Failed to create dog');
  return dog;
}

/**
 * Update an existing dog
 */
export async function updateDog(id: string, input: UpdateDogInput): Promise<Dog | null> {
  // Build dynamic update query
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.name !== undefined) { updates.push('name = ?'); values.push(input.name); }
  if (input.sex !== undefined) { updates.push('sex = ?'); values.push(input.sex); }
  if (input.breed !== undefined) { updates.push('breed = ?'); values.push(input.breed); }
  if (input.registrationNumber !== undefined) { updates.push('registration_number = ?'); values.push(input.registrationNumber); }
  if (input.dateOfBirth !== undefined) { updates.push('date_of_birth = ?'); values.push(dateToSql(input.dateOfBirth)); }
  if (input.color !== undefined) { updates.push('color = ?'); values.push(input.color); }
  if (input.microchipNumber !== undefined) { updates.push('microchip_number = ?'); values.push(input.microchipNumber); }
  if (input.status !== undefined) { updates.push('status = ?'); values.push(input.status); }
  if (input.profilePhotoPath !== undefined) { updates.push('profile_photo_path = ?'); values.push(input.profilePhotoPath); }
  if (input.notes !== undefined) { updates.push('notes = ?'); values.push(input.notes); }
  if (input.sireId !== undefined) { updates.push('sire_id = ?'); values.push(input.sireId); }
  if (input.damId !== undefined) { updates.push('dam_id = ?'); values.push(input.damId); }
  if (input.litterId !== undefined) { updates.push('litter_id = ?'); values.push(input.litterId); }
  if (input.evaluationCategory !== undefined) { updates.push('evaluation_category = ?'); values.push(input.evaluationCategory); }
  if (input.structureNotes !== undefined) { updates.push('structure_notes = ?'); values.push(input.structureNotes); }
  if (input.temperamentNotes !== undefined) { updates.push('temperament_notes = ?'); values.push(input.temperamentNotes); }
  if (input.registrationStatus !== undefined) { updates.push('registration_status = ?'); values.push(input.registrationStatus); }
  if (input.registrationType !== undefined) { updates.push('registration_type = ?'); values.push(input.registrationType); }
  if (input.registryName !== undefined) { updates.push('registry_name = ?'); values.push(input.registryName); }
  if (input.registrationDeadline !== undefined) { updates.push('registration_deadline = ?'); values.push(dateToSql(input.registrationDeadline)); }
  
  if (updates.length === 0) {
    return getDog(id);
  }
  
  updates.push('updated_at = ?');
  values.push(nowIso());
  values.push(id);
  
  await execute(
    `UPDATE dogs SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  return getDog(id);
}

/**
 * Delete a dog and all related records
 */
export async function deleteDog(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM dogs WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}

// ============================================
// DOG PHOTOS
// ============================================

interface DogPhotoRow {
  id: string;
  dog_id: string;
  file_path: string;
  caption: string | null;
  is_primary: number;
  uploaded_at: string;
}

function rowToDogPhoto(row: DogPhotoRow): DogPhoto {
  return {
    id: row.id,
    dogId: row.dog_id,
    filePath: row.file_path,
    caption: row.caption,
    isPrimary: row.is_primary === 1,
    uploadedAt: new Date(row.uploaded_at),
  };
}

/**
 * Get all photos for a dog
 */
export async function getDogPhotos(dogId: string): Promise<DogPhoto[]> {
  const rows = await query<DogPhotoRow>(
    'SELECT * FROM dog_photos WHERE dog_id = ? ORDER BY is_primary DESC, uploaded_at DESC',
    [dogId]
  );
  return rows.map(rowToDogPhoto);
}

/**
 * Create a dog photo
 */
export async function createDogPhoto(
  input: Omit<DogPhoto, 'id' | 'uploadedAt'>
): Promise<DogPhoto> {
  const id = generateId();
  const now = nowIso();
  
  // If this is primary, unset any existing primary
  if (input.isPrimary) {
    await execute(
      'UPDATE dog_photos SET is_primary = 0 WHERE dog_id = ?',
      [input.dogId]
    );
  }
  
  await execute(
    `INSERT INTO dog_photos (id, dog_id, file_path, caption, is_primary, uploaded_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.dogId, input.filePath, input.caption ?? null, input.isPrimary ? 1 : 0, now]
  );
  
  const rows = await query<DogPhotoRow>('SELECT * FROM dog_photos WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw new Error(`Failed to create dog photo: record not found after insert`);
  }
  return rowToDogPhoto(rows[0]);
}

/**
 * Delete a dog photo
 */
export async function deleteDogPhoto(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM dog_photos WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}

/**
 * Set a photo as primary for a dog
 */
export async function setPrimaryDogPhoto(dogId: string, photoId: string): Promise<void> {
  await execute('UPDATE dog_photos SET is_primary = 0 WHERE dog_id = ?', [dogId]);
  await execute('UPDATE dog_photos SET is_primary = 1 WHERE id = ?', [photoId]);
}

// ============================================
// PEDIGREE ENTRIES
// ============================================

interface PedigreeEntryRow {
  id: string;
  dog_id: string;
  generation: number;
  position: string;
  ancestor_name: string;
  ancestor_registration: string | null;
  ancestor_color: string | null;
  ancestor_breed: string | null;
  notes: string | null;
  created_at: string;
}

function rowToPedigreeEntry(row: PedigreeEntryRow): PedigreeEntry {
  return {
    id: row.id,
    dogId: row.dog_id,
    generation: row.generation,
    position: row.position,
    ancestorName: row.ancestor_name,
    ancestorRegistration: row.ancestor_registration,
    ancestorColor: row.ancestor_color,
    ancestorBreed: row.ancestor_breed,
    notes: row.notes,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Get pedigree entries for a dog
 */
export async function getPedigreeEntries(dogId: string): Promise<PedigreeEntry[]> {
  const rows = await query<PedigreeEntryRow>(
    'SELECT * FROM pedigree_entries WHERE dog_id = ? ORDER BY generation, position',
    [dogId]
  );
  return rows.map(rowToPedigreeEntry);
}

/**
 * Create or update a pedigree entry
 */
export async function upsertPedigreeEntry(
  input: Omit<PedigreeEntry, 'id' | 'createdAt'>
): Promise<PedigreeEntry> {
  const id = generateId();
  const now = nowIso();
  
  await execute(
    `INSERT INTO pedigree_entries (id, dog_id, generation, position, ancestor_name, ancestor_registration, ancestor_color, ancestor_breed, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(dog_id, generation, position) DO UPDATE SET
       ancestor_name = excluded.ancestor_name,
       ancestor_registration = excluded.ancestor_registration,
       ancestor_color = excluded.ancestor_color,
       ancestor_breed = excluded.ancestor_breed,
       notes = excluded.notes`,
    [
      id,
      input.dogId,
      input.generation,
      input.position,
      input.ancestorName,
      input.ancestorRegistration ?? null,
      input.ancestorColor ?? null,
      input.ancestorBreed ?? null,
      input.notes ?? null,
      now,
    ]
  );
  
  const rows = await query<PedigreeEntryRow>(
    'SELECT * FROM pedigree_entries WHERE dog_id = ? AND generation = ? AND position = ?',
    [input.dogId, input.generation, input.position]
  );
  if (rows.length === 0) {
    throw new Error(`Failed to create pedigree entry: record not found after insert`);
  }
  return rowToPedigreeEntry(rows[0]);
}

/**
 * Delete a pedigree entry
 */
export async function deletePedigreeEntry(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM pedigree_entries WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}

/**
 * Delete all pedigree entries for a dog
 */
export async function deletePedigreeEntriesForDog(dogId: string): Promise<void> {
  await execute('DELETE FROM pedigree_entries WHERE dog_id = ?', [dogId]);
}


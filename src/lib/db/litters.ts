// Litter database operations
// Handles CRUD and queries for litters and litter photos

import { query, execute } from './connection';
import { generateId, dateToSql, sqlToDate, nowIso } from './utils';
import type {
  Litter,
  LitterPhoto,
  Dog,
  CreateLitterInput,
  UpdateLitterInput,
  CreateLitterPhotoInput,
  UpdateLitterPhotoInput,
} from '@/types';

// SQL row type for litters table
interface LitterRow {
  id: string;
  code: string;
  nickname: string | null;
  breeding_date: string | null;
  due_date: string | null;
  whelp_date: string | null;
  total_born: number | null;
  total_alive: number | null;
  notes: string | null;
  sire_id: string | null;
  dam_id: string | null;
  status: string | null;
  ultrasound_date: string | null;
  ultrasound_result: string | null;
  xray_date: string | null;
  xray_puppy_count: number | null;
  whelping_checklist_state: string | null;
  created_at: string;
  updated_at: string;
}

interface DogRow {
  id: string;
  name: string;
  sex: string;
  breed: string;
  status: string;
  litter_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert a database row to a Litter object
 */
function rowToLitter(row: LitterRow): Litter {
  return {
    id: row.id,
    code: row.code,
    nickname: row.nickname,
    breedingDate: sqlToDate(row.breeding_date),
    dueDate: sqlToDate(row.due_date),
    whelpDate: sqlToDate(row.whelp_date),
    totalBorn: row.total_born,
    totalAlive: row.total_alive,
    notes: row.notes,
    sireId: row.sire_id,
    damId: row.dam_id,
    status: row.status as Litter['status'],
    ultrasoundDate: sqlToDate(row.ultrasound_date),
    ultrasoundResult: row.ultrasound_result as Litter['ultrasoundResult'],
    xrayDate: sqlToDate(row.xray_date),
    xrayPuppyCount: row.xray_puppy_count,
    whelpingChecklistState: row.whelping_checklist_state,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Convert a dog row to a minimal Dog object for relations
 */
function rowToMinimalDog(row: DogRow): Dog {
  return {
    id: row.id,
    name: row.name,
    sex: row.sex as Dog['sex'],
    breed: row.breed,
    status: row.status as Dog['status'],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Get all litters with sire/dam populated
 */
export async function getLitters(): Promise<Litter[]> {
  const rows = await query<LitterRow>('SELECT * FROM litters ORDER BY created_at DESC');
  const litters = rows.map(rowToLitter);
  
  // Populate relations
  for (const litter of litters) {
    if (litter.sireId) {
      const sireRows = await query<DogRow>('SELECT * FROM dogs WHERE id = ?', [litter.sireId]);
      litter.sire = sireRows.length > 0 ? rowToMinimalDog(sireRows[0]) : null;
    }
    if (litter.damId) {
      const damRows = await query<DogRow>('SELECT * FROM dogs WHERE id = ?', [litter.damId]);
      litter.dam = damRows.length > 0 ? rowToMinimalDog(damRows[0]) : null;
    }
    // Get puppies
    const puppyRows = await query<DogRow>('SELECT * FROM dogs WHERE litter_id = ?', [litter.id]);
    litter.puppies = puppyRows.map(rowToMinimalDog);
  }
  
  return litters;
}

/**
 * Get a single litter by ID with all relations
 */
export async function getLitter(id: string): Promise<Litter | null> {
  const rows = await query<LitterRow>('SELECT * FROM litters WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  
  const litter = rowToLitter(rows[0]);
  
  // Populate sire
  if (litter.sireId) {
    const sireRows = await query<DogRow>('SELECT * FROM dogs WHERE id = ?', [litter.sireId]);
    litter.sire = sireRows.length > 0 ? rowToMinimalDog(sireRows[0]) : null;
  }
  
  // Populate dam
  if (litter.damId) {
    const damRows = await query<DogRow>('SELECT * FROM dogs WHERE id = ?', [litter.damId]);
    litter.dam = damRows.length > 0 ? rowToMinimalDog(damRows[0]) : null;
  }
  
  // Get puppies
  const puppyRows = await query<DogRow>('SELECT * FROM dogs WHERE litter_id = ?', [id]);
  litter.puppies = puppyRows.map(rowToMinimalDog);
  
  // Get photos
  litter.photos = await getLitterPhotos(id);
  
  return litter;
}

/**
 * Create a new litter
 */
export async function createLitter(input: CreateLitterInput): Promise<Litter> {
  const id = generateId();
  const now = nowIso();
  
  await execute(
    `INSERT INTO litters (
      id, code, nickname, breeding_date, due_date, whelp_date,
      total_born, total_alive, notes, sire_id, dam_id, status,
      ultrasound_date, ultrasound_result, xray_date, xray_puppy_count,
      whelping_checklist_state, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.code,
      input.nickname ?? null,
      dateToSql(input.breedingDate),
      dateToSql(input.dueDate),
      dateToSql(input.whelpDate),
      input.totalBorn ?? null,
      input.totalAlive ?? null,
      input.notes ?? null,
      input.sireId ?? null,
      input.damId ?? null,
      input.status ?? null,
      dateToSql(input.ultrasoundDate),
      input.ultrasoundResult ?? null,
      dateToSql(input.xrayDate),
      input.xrayPuppyCount ?? null,
      input.whelpingChecklistState ?? null,
      now,
      now,
    ]
  );
  
  const litter = await getLitter(id);
  if (!litter) throw new Error('Failed to create litter');
  return litter;
}

/**
 * Update an existing litter
 */
export async function updateLitter(id: string, input: UpdateLitterInput): Promise<Litter | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.code !== undefined) { updates.push('code = ?'); values.push(input.code); }
  if (input.nickname !== undefined) { updates.push('nickname = ?'); values.push(input.nickname); }
  if (input.breedingDate !== undefined) { updates.push('breeding_date = ?'); values.push(dateToSql(input.breedingDate)); }
  if (input.dueDate !== undefined) { updates.push('due_date = ?'); values.push(dateToSql(input.dueDate)); }
  if (input.whelpDate !== undefined) { updates.push('whelp_date = ?'); values.push(dateToSql(input.whelpDate)); }
  if (input.totalBorn !== undefined) { updates.push('total_born = ?'); values.push(input.totalBorn); }
  if (input.totalAlive !== undefined) { updates.push('total_alive = ?'); values.push(input.totalAlive); }
  if (input.notes !== undefined) { updates.push('notes = ?'); values.push(input.notes); }
  if (input.sireId !== undefined) { updates.push('sire_id = ?'); values.push(input.sireId); }
  if (input.damId !== undefined) { updates.push('dam_id = ?'); values.push(input.damId); }
  if (input.status !== undefined) { updates.push('status = ?'); values.push(input.status); }
  if (input.ultrasoundDate !== undefined) { updates.push('ultrasound_date = ?'); values.push(dateToSql(input.ultrasoundDate)); }
  if (input.ultrasoundResult !== undefined) { updates.push('ultrasound_result = ?'); values.push(input.ultrasoundResult); }
  if (input.xrayDate !== undefined) { updates.push('xray_date = ?'); values.push(dateToSql(input.xrayDate)); }
  if (input.xrayPuppyCount !== undefined) { updates.push('xray_puppy_count = ?'); values.push(input.xrayPuppyCount); }
  if (input.whelpingChecklistState !== undefined) { updates.push('whelping_checklist_state = ?'); values.push(input.whelpingChecklistState); }
  
  if (updates.length === 0) {
    return getLitter(id);
  }
  
  updates.push('updated_at = ?');
  values.push(nowIso());
  values.push(id);
  
  await execute(
    `UPDATE litters SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  return getLitter(id);
}

/**
 * Delete a litter
 */
export async function deleteLitter(id: string): Promise<boolean> {
  // First, unlink puppies from this litter
  await execute('UPDATE dogs SET litter_id = NULL WHERE litter_id = ?', [id]);
  
  const result = await execute('DELETE FROM litters WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}

// ============================================
// LITTER PHOTOS
// ============================================

interface LitterPhotoRow {
  id: string;
  litter_id: string;
  file_path: string;
  caption: string | null;
  sort_order: number;
  uploaded_at: string;
}

function rowToLitterPhoto(row: LitterPhotoRow): LitterPhoto {
  return {
    id: row.id,
    litterId: row.litter_id,
    filePath: row.file_path,
    caption: row.caption,
    sortOrder: row.sort_order,
    uploadedAt: new Date(row.uploaded_at),
  };
}

/**
 * Get all photos for a litter
 */
export async function getLitterPhotos(litterId: string): Promise<LitterPhoto[]> {
  const rows = await query<LitterPhotoRow>(
    'SELECT * FROM litter_photos WHERE litter_id = ? ORDER BY sort_order',
    [litterId]
  );
  return rows.map(rowToLitterPhoto);
}

/**
 * Get a single litter photo
 */
export async function getLitterPhoto(id: string): Promise<LitterPhoto | null> {
  const rows = await query<LitterPhotoRow>('SELECT * FROM litter_photos WHERE id = ?', [id]);
  return rows.length > 0 ? rowToLitterPhoto(rows[0]) : null;
}

/**
 * Create a litter photo
 */
export async function createLitterPhoto(input: CreateLitterPhotoInput): Promise<LitterPhoto> {
  const id = generateId();
  const now = nowIso();
  
  // Get the next sort order
  const maxResult = await query<{ max_order: number | null }>(
    'SELECT MAX(sort_order) as max_order FROM litter_photos WHERE litter_id = ?',
    [input.litterId]
  );
  const sortOrder = input.sortOrder ?? ((maxResult[0]?.max_order ?? -1) + 1);
  
  await execute(
    `INSERT INTO litter_photos (id, litter_id, file_path, caption, sort_order, uploaded_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.litterId, input.filePath, input.caption ?? null, sortOrder, now]
  );
  
  const photo = await getLitterPhoto(id);
  if (!photo) throw new Error('Failed to create litter photo');
  return photo;
}

/**
 * Update a litter photo
 */
export async function updateLitterPhoto(id: string, input: UpdateLitterPhotoInput): Promise<LitterPhoto | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.filePath !== undefined) { updates.push('file_path = ?'); values.push(input.filePath); }
  if (input.caption !== undefined) { updates.push('caption = ?'); values.push(input.caption); }
  if (input.sortOrder !== undefined) { updates.push('sort_order = ?'); values.push(input.sortOrder); }
  
  if (updates.length === 0) {
    return getLitterPhoto(id);
  }
  
  values.push(id);
  await execute(
    `UPDATE litter_photos SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  return getLitterPhoto(id);
}

/**
 * Delete a litter photo
 */
export async function deleteLitterPhoto(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM litter_photos WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}

/**
 * Reorder litter photos
 */
export async function reorderLitterPhotos(litterId: string, photoIds: string[]): Promise<void> {
  for (let i = 0; i < photoIds.length; i++) {
    await execute(
      'UPDATE litter_photos SET sort_order = ? WHERE id = ? AND litter_id = ?',
      [i, photoIds[i], litterId]
    );
  }
}


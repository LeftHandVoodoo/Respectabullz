// Health database operations
// Handles vaccinations, weight entries, medical records, genetic tests, and puppy health tasks

import { query, execute } from './connection';
import { generateId, dateToSql, sqlToDate, nowIso } from './utils';
import type {
  VaccinationRecord,
  WeightEntry,
  MedicalRecord,
  GeneticTest,
  PuppyHealthTask,
  HealthScheduleTemplate,
  CreateGeneticTestInput,
  UpdateGeneticTestInput,
  CreatePuppyHealthTaskInput,
  UpdatePuppyHealthTaskInput,
} from '@/types';

// ============================================
// VACCINATIONS
// ============================================

interface VaccinationRow {
  id: string;
  dog_id: string;
  date: string;
  vaccine_type: string;
  dose: string | null;
  lot_number: string | null;
  vet_clinic: string | null;
  next_due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToVaccination(row: VaccinationRow): VaccinationRecord {
  return {
    id: row.id,
    dogId: row.dog_id,
    date: new Date(row.date),
    vaccineType: row.vaccine_type,
    dose: row.dose,
    lotNumber: row.lot_number,
    vetClinic: row.vet_clinic,
    nextDueDate: sqlToDate(row.next_due_date),
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getVaccinations(dogId?: string): Promise<VaccinationRecord[]> {
  const sql = dogId 
    ? 'SELECT * FROM vaccination_records WHERE dog_id = ? ORDER BY date DESC'
    : 'SELECT * FROM vaccination_records ORDER BY date DESC';
  const rows = await query<VaccinationRow>(sql, dogId ? [dogId] : []);
  return rows.map(rowToVaccination);
}

export async function createVaccination(
  input: Omit<VaccinationRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<VaccinationRecord> {
  const id = generateId();
  const now = nowIso();
  
  await execute(
    `INSERT INTO vaccination_records 
     (id, dog_id, date, vaccine_type, dose, lot_number, vet_clinic, next_due_date, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.dogId,
      dateToSql(input.date),
      input.vaccineType,
      input.dose ?? null,
      input.lotNumber ?? null,
      input.vetClinic ?? null,
      dateToSql(input.nextDueDate),
      input.notes ?? null,
      now,
      now,
    ]
  );
  
  const rows = await query<VaccinationRow>('SELECT * FROM vaccination_records WHERE id = ?', [id]);
  return rowToVaccination(rows[0]);
}

export async function updateVaccination(
  id: string,
  input: Partial<VaccinationRecord>
): Promise<VaccinationRecord | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.date !== undefined) { updates.push('date = ?'); values.push(dateToSql(input.date)); }
  if (input.vaccineType !== undefined) { updates.push('vaccine_type = ?'); values.push(input.vaccineType); }
  if (input.dose !== undefined) { updates.push('dose = ?'); values.push(input.dose); }
  if (input.lotNumber !== undefined) { updates.push('lot_number = ?'); values.push(input.lotNumber); }
  if (input.vetClinic !== undefined) { updates.push('vet_clinic = ?'); values.push(input.vetClinic); }
  if (input.nextDueDate !== undefined) { updates.push('next_due_date = ?'); values.push(dateToSql(input.nextDueDate)); }
  if (input.notes !== undefined) { updates.push('notes = ?'); values.push(input.notes); }
  
  if (updates.length === 0) {
    const rows = await query<VaccinationRow>('SELECT * FROM vaccination_records WHERE id = ?', [id]);
    return rows.length > 0 ? rowToVaccination(rows[0]) : null;
  }
  
  updates.push('updated_at = ?');
  values.push(nowIso());
  values.push(id);
  
  await execute(`UPDATE vaccination_records SET ${updates.join(', ')} WHERE id = ?`, values);
  
  const rows = await query<VaccinationRow>('SELECT * FROM vaccination_records WHERE id = ?', [id]);
  return rows.length > 0 ? rowToVaccination(rows[0]) : null;
}

export async function deleteVaccination(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM vaccination_records WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}

// ============================================
// WEIGHT ENTRIES
// ============================================

interface WeightEntryRow {
  id: string;
  dog_id: string;
  date: string;
  weight_lbs: number;
  notes: string | null;
  created_at: string;
}

function rowToWeightEntry(row: WeightEntryRow): WeightEntry {
  return {
    id: row.id,
    dogId: row.dog_id,
    date: new Date(row.date),
    weightLbs: row.weight_lbs,
    notes: row.notes,
    createdAt: new Date(row.created_at),
  };
}

export async function getWeightEntries(dogId?: string): Promise<WeightEntry[]> {
  const sql = dogId
    ? 'SELECT * FROM weight_entries WHERE dog_id = ? ORDER BY date DESC'
    : 'SELECT * FROM weight_entries ORDER BY date DESC';
  const rows = await query<WeightEntryRow>(sql, dogId ? [dogId] : []);
  return rows.map(rowToWeightEntry);
}

export async function createWeightEntry(
  input: Omit<WeightEntry, 'id' | 'createdAt'>
): Promise<WeightEntry> {
  const id = generateId();
  const now = nowIso();
  
  await execute(
    `INSERT INTO weight_entries (id, dog_id, date, weight_lbs, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.dogId, dateToSql(input.date), input.weightLbs, input.notes ?? null, now]
  );
  
  const rows = await query<WeightEntryRow>('SELECT * FROM weight_entries WHERE id = ?', [id]);
  return rowToWeightEntry(rows[0]);
}

export async function updateWeightEntry(
  id: string,
  input: Partial<WeightEntry>
): Promise<WeightEntry | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.date !== undefined) { updates.push('date = ?'); values.push(dateToSql(input.date)); }
  if (input.weightLbs !== undefined) { updates.push('weight_lbs = ?'); values.push(input.weightLbs); }
  if (input.notes !== undefined) { updates.push('notes = ?'); values.push(input.notes); }
  
  if (updates.length === 0) {
    const rows = await query<WeightEntryRow>('SELECT * FROM weight_entries WHERE id = ?', [id]);
    return rows.length > 0 ? rowToWeightEntry(rows[0]) : null;
  }
  
  values.push(id);
  await execute(`UPDATE weight_entries SET ${updates.join(', ')} WHERE id = ?`, values);
  
  const rows = await query<WeightEntryRow>('SELECT * FROM weight_entries WHERE id = ?', [id]);
  return rows.length > 0 ? rowToWeightEntry(rows[0]) : null;
}

export async function deleteWeightEntry(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM weight_entries WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}

// ============================================
// MEDICAL RECORDS
// ============================================

interface MedicalRecordRow {
  id: string;
  dog_id: string;
  date: string;
  type: string;
  description: string;
  vet_clinic: string | null;
  attachment_path: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToMedicalRecord(row: MedicalRecordRow): MedicalRecord {
  return {
    id: row.id,
    dogId: row.dog_id,
    date: new Date(row.date),
    type: row.type as MedicalRecord['type'],
    description: row.description,
    vetClinic: row.vet_clinic,
    attachmentPath: row.attachment_path,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getMedicalRecords(dogId?: string): Promise<MedicalRecord[]> {
  const sql = dogId
    ? 'SELECT * FROM medical_records WHERE dog_id = ? ORDER BY date DESC'
    : 'SELECT * FROM medical_records ORDER BY date DESC';
  const rows = await query<MedicalRecordRow>(sql, dogId ? [dogId] : []);
  return rows.map(rowToMedicalRecord);
}

export async function createMedicalRecord(
  input: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<MedicalRecord> {
  const id = generateId();
  const now = nowIso();
  
  await execute(
    `INSERT INTO medical_records 
     (id, dog_id, date, type, description, vet_clinic, attachment_path, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.dogId,
      dateToSql(input.date),
      input.type,
      input.description,
      input.vetClinic ?? null,
      input.attachmentPath ?? null,
      input.notes ?? null,
      now,
      now,
    ]
  );
  
  const rows = await query<MedicalRecordRow>('SELECT * FROM medical_records WHERE id = ?', [id]);
  return rowToMedicalRecord(rows[0]);
}

export async function updateMedicalRecord(
  id: string,
  input: Partial<MedicalRecord>
): Promise<MedicalRecord | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.date !== undefined) { updates.push('date = ?'); values.push(dateToSql(input.date)); }
  if (input.type !== undefined) { updates.push('type = ?'); values.push(input.type); }
  if (input.description !== undefined) { updates.push('description = ?'); values.push(input.description); }
  if (input.vetClinic !== undefined) { updates.push('vet_clinic = ?'); values.push(input.vetClinic); }
  if (input.attachmentPath !== undefined) { updates.push('attachment_path = ?'); values.push(input.attachmentPath); }
  if (input.notes !== undefined) { updates.push('notes = ?'); values.push(input.notes); }
  
  if (updates.length === 0) {
    const rows = await query<MedicalRecordRow>('SELECT * FROM medical_records WHERE id = ?', [id]);
    return rows.length > 0 ? rowToMedicalRecord(rows[0]) : null;
  }
  
  updates.push('updated_at = ?');
  values.push(nowIso());
  values.push(id);
  
  await execute(`UPDATE medical_records SET ${updates.join(', ')} WHERE id = ?`, values);
  
  const rows = await query<MedicalRecordRow>('SELECT * FROM medical_records WHERE id = ?', [id]);
  return rows.length > 0 ? rowToMedicalRecord(rows[0]) : null;
}

export async function deleteMedicalRecord(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM medical_records WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}

// ============================================
// GENETIC TESTS
// ============================================

interface GeneticTestRow {
  id: string;
  dog_id: string;
  test_date: string;
  test_type: string;
  result: string;
  lab_name: string | null;
  certificate_path: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToGeneticTest(row: GeneticTestRow): GeneticTest {
  return {
    id: row.id,
    dogId: row.dog_id,
    testName: row.test_type, // testType column stores the test name/type
    testType: row.test_type as GeneticTest['testType'],
    result: row.result as GeneticTest['result'],
    labName: row.lab_name,
    testDate: sqlToDate(row.test_date),
    certificatePath: row.certificate_path,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getGeneticTests(dogId?: string): Promise<GeneticTest[]> {
  const sql = dogId
    ? 'SELECT * FROM genetic_tests WHERE dog_id = ? ORDER BY test_date DESC'
    : 'SELECT * FROM genetic_tests ORDER BY test_date DESC';
  const rows = await query<GeneticTestRow>(sql, dogId ? [dogId] : []);
  return rows.map(rowToGeneticTest);
}

export async function getGeneticTest(id: string): Promise<GeneticTest | null> {
  const rows = await query<GeneticTestRow>('SELECT * FROM genetic_tests WHERE id = ?', [id]);
  return rows.length > 0 ? rowToGeneticTest(rows[0]) : null;
}

export async function createGeneticTest(input: CreateGeneticTestInput): Promise<GeneticTest> {
  const id = generateId();
  const now = nowIso();
  
  await execute(
    `INSERT INTO genetic_tests 
     (id, dog_id, test_date, test_type, result, lab_name, certificate_path, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.dogId,
      dateToSql(input.testDate),
      input.testType,
      input.result,
      input.labName ?? null,
      input.certificatePath ?? null,
      input.notes ?? null,
      now,
      now,
    ]
  );
  
  const test = await getGeneticTest(id);
  if (!test) throw new Error('Failed to create genetic test');
  return test;
}

export async function updateGeneticTest(
  id: string,
  input: UpdateGeneticTestInput
): Promise<GeneticTest | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.testDate !== undefined) { updates.push('test_date = ?'); values.push(dateToSql(input.testDate)); }
  if (input.testType !== undefined) { updates.push('test_type = ?'); values.push(input.testType); }
  if (input.result !== undefined) { updates.push('result = ?'); values.push(input.result); }
  if (input.labName !== undefined) { updates.push('lab_name = ?'); values.push(input.labName); }
  if (input.certificatePath !== undefined) { updates.push('certificate_path = ?'); values.push(input.certificatePath); }
  if (input.notes !== undefined) { updates.push('notes = ?'); values.push(input.notes); }
  
  if (updates.length === 0) {
    return getGeneticTest(id);
  }
  
  updates.push('updated_at = ?');
  values.push(nowIso());
  values.push(id);
  
  await execute(`UPDATE genetic_tests SET ${updates.join(', ')} WHERE id = ?`, values);
  return getGeneticTest(id);
}

export async function deleteGeneticTest(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM genetic_tests WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}

// ============================================
// PUPPY HEALTH TASKS
// ============================================

interface PuppyHealthTaskRow {
  id: string;
  litter_id: string;
  puppy_id: string | null;
  task_type: string;
  due_date: string;
  completed_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToPuppyHealthTask(row: PuppyHealthTaskRow): PuppyHealthTask {
  return {
    id: row.id,
    litterId: row.litter_id,
    puppyId: row.puppy_id,
    taskType: row.task_type as PuppyHealthTask['taskType'],
    taskName: row.task_type, // Using task_type as taskName
    dueDate: new Date(row.due_date),
    completedDate: sqlToDate(row.completed_date),
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getPuppyHealthTasks(
  litterId?: string,
  puppyId?: string
): Promise<PuppyHealthTask[]> {
  let sql = 'SELECT * FROM puppy_health_tasks';
  const params: unknown[] = [];
  
  if (litterId && puppyId) {
    sql += ' WHERE litter_id = ? AND (puppy_id = ? OR puppy_id IS NULL)';
    params.push(litterId, puppyId);
  } else if (litterId) {
    sql += ' WHERE litter_id = ?';
    params.push(litterId);
  } else if (puppyId) {
    sql += ' WHERE puppy_id = ?';
    params.push(puppyId);
  }
  
  sql += ' ORDER BY due_date';
  
  const rows = await query<PuppyHealthTaskRow>(sql, params);
  return rows.map(rowToPuppyHealthTask);
}

export async function getPuppyHealthTask(id: string): Promise<PuppyHealthTask | null> {
  const rows = await query<PuppyHealthTaskRow>('SELECT * FROM puppy_health_tasks WHERE id = ?', [id]);
  return rows.length > 0 ? rowToPuppyHealthTask(rows[0]) : null;
}

export async function createPuppyHealthTask(input: CreatePuppyHealthTaskInput): Promise<PuppyHealthTask> {
  const id = generateId();
  const now = nowIso();
  
  await execute(
    `INSERT INTO puppy_health_tasks 
     (id, litter_id, puppy_id, task_type, due_date, completed_date, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.litterId,
      input.puppyId ?? null,
      input.taskType,
      dateToSql(input.dueDate),
      dateToSql(input.completedDate),
      input.notes ?? null,
      now,
      now,
    ]
  );
  
  const task = await getPuppyHealthTask(id);
  if (!task) throw new Error('Failed to create puppy health task');
  return task;
}

export async function updatePuppyHealthTask(
  id: string,
  input: UpdatePuppyHealthTaskInput
): Promise<PuppyHealthTask | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.taskType !== undefined) { updates.push('task_type = ?'); values.push(input.taskType); }
  if (input.dueDate !== undefined) { updates.push('due_date = ?'); values.push(dateToSql(input.dueDate)); }
  if (input.completedDate !== undefined) { updates.push('completed_date = ?'); values.push(dateToSql(input.completedDate)); }
  if (input.notes !== undefined) { updates.push('notes = ?'); values.push(input.notes); }
  
  if (updates.length === 0) {
    return getPuppyHealthTask(id);
  }
  
  updates.push('updated_at = ?');
  values.push(nowIso());
  values.push(id);
  
  await execute(`UPDATE puppy_health_tasks SET ${updates.join(', ')} WHERE id = ?`, values);
  return getPuppyHealthTask(id);
}

export async function deletePuppyHealthTask(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM puppy_health_tasks WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}

export async function completePuppyHealthTask(id: string, notes?: string): Promise<PuppyHealthTask | null> {
  const now = nowIso();
  await execute(
    'UPDATE puppy_health_tasks SET completed_date = ?, notes = COALESCE(?, notes), updated_at = ? WHERE id = ?',
    [now, notes ?? null, now, id]
  );
  return getPuppyHealthTask(id);
}

export async function uncompletePuppyHealthTask(id: string): Promise<PuppyHealthTask | null> {
  await execute(
    'UPDATE puppy_health_tasks SET completed_date = NULL, updated_at = ? WHERE id = ?',
    [nowIso(), id]
  );
  return getPuppyHealthTask(id);
}

export async function deletePuppyHealthTasksForLitter(litterId: string): Promise<void> {
  await execute('DELETE FROM puppy_health_tasks WHERE litter_id = ?', [litterId]);
}

export async function getPuppyHealthTasksDueThisWeek(): Promise<PuppyHealthTask[]> {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const rows = await query<PuppyHealthTaskRow>(
    `SELECT * FROM puppy_health_tasks 
     WHERE completed_date IS NULL AND due_date <= ? AND due_date >= ?
     ORDER BY due_date`,
    [dateToSql(weekFromNow), dateToSql(now)]
  );
  return rows.map(rowToPuppyHealthTask);
}

export async function getOverduePuppyHealthTasks(): Promise<PuppyHealthTask[]> {
  const now = dateToSql(new Date());
  
  const rows = await query<PuppyHealthTaskRow>(
    `SELECT * FROM puppy_health_tasks 
     WHERE completed_date IS NULL AND due_date < ?
     ORDER BY due_date`,
    [now]
  );
  return rows.map(rowToPuppyHealthTask);
}

// ============================================
// HEALTH SCHEDULE TEMPLATES
// ============================================

interface HealthScheduleTemplateRow {
  id: string;
  name: string;
  is_default: number;
  items: string;
  created_at: string;
  updated_at: string;
}

function rowToHealthScheduleTemplate(row: HealthScheduleTemplateRow): HealthScheduleTemplate {
  return {
    id: row.id,
    name: row.name,
    isDefault: row.is_default === 1,
    items: JSON.parse(row.items),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getHealthScheduleTemplates(): Promise<HealthScheduleTemplate[]> {
  const rows = await query<HealthScheduleTemplateRow>('SELECT * FROM health_schedule_templates');
  return rows.map(rowToHealthScheduleTemplate);
}

export async function getHealthScheduleTemplate(id: string): Promise<HealthScheduleTemplate | null> {
  const rows = await query<HealthScheduleTemplateRow>(
    'SELECT * FROM health_schedule_templates WHERE id = ?',
    [id]
  );
  return rows.length > 0 ? rowToHealthScheduleTemplate(rows[0]) : null;
}

export async function getDefaultHealthScheduleTemplate(): Promise<HealthScheduleTemplate> {
  const rows = await query<HealthScheduleTemplateRow>(
    'SELECT * FROM health_schedule_templates WHERE is_default = 1'
  );
  
  if (rows.length > 0) {
    return rowToHealthScheduleTemplate(rows[0]);
  }
  
  // Return a default template if none exists
  return {
    id: 'default',
    name: 'Default Schedule',
    isDefault: true,
    items: [
      { taskType: 'daily_weight', taskName: 'Daily Weight Check', daysFromBirth: 1, isPerPuppy: true },
      { taskType: 'dewclaw_removal', taskName: 'Dewclaw Removal', daysFromBirth: 3, isPerPuppy: true },
      { taskType: 'deworming', taskName: 'First Deworming', daysFromBirth: 14, isPerPuppy: false },
      { taskType: 'vaccination', taskName: 'First Vaccination', daysFromBirth: 42, isPerPuppy: true },
      { taskType: 'microchipping', taskName: 'Microchipping', daysFromBirth: 56, isPerPuppy: true },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function createHealthScheduleTemplate(
  input: Omit<HealthScheduleTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<HealthScheduleTemplate> {
  const id = generateId();
  const now = nowIso();
  
  // If setting as default, unset other defaults
  if (input.isDefault) {
    await execute('UPDATE health_schedule_templates SET is_default = 0');
  }
  
  await execute(
    `INSERT INTO health_schedule_templates (id, name, is_default, items, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.name, input.isDefault ? 1 : 0, JSON.stringify(input.items), now, now]
  );
  
  const template = await getHealthScheduleTemplate(id);
  if (!template) throw new Error('Failed to create health schedule template');
  return template;
}

export async function updateHealthScheduleTemplate(
  id: string,
  input: Partial<HealthScheduleTemplate>
): Promise<HealthScheduleTemplate | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.name !== undefined) { updates.push('name = ?'); values.push(input.name); }
  if (input.isDefault !== undefined) {
    if (input.isDefault) {
      await execute('UPDATE health_schedule_templates SET is_default = 0');
    }
    updates.push('is_default = ?');
    values.push(input.isDefault ? 1 : 0);
  }
  if (input.items !== undefined) { updates.push('items = ?'); values.push(JSON.stringify(input.items)); }
  
  if (updates.length === 0) {
    return getHealthScheduleTemplate(id);
  }
  
  updates.push('updated_at = ?');
  values.push(nowIso());
  values.push(id);
  
  await execute(`UPDATE health_schedule_templates SET ${updates.join(', ')} WHERE id = ?`, values);
  return getHealthScheduleTemplate(id);
}

export async function deleteHealthScheduleTemplate(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM health_schedule_templates WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}


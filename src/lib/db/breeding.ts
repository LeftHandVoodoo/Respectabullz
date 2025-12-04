// Breeding database operations
// Handles heat cycles, heat events, external studs, and breeding predictions

import { query, execute } from './connection';
import { generateId, dateToSql, sqlToDate, nowIso } from './utils';
import type {
  HeatCycle,
  HeatEvent,
  ExternalStud,
  HeatCyclePrediction,
  CreateExternalStudInput,
  UpdateExternalStudInput,
} from '@/types';

// ============================================
// HEAT CYCLES
// ============================================

interface HeatCycleRow {
  id: string;
  bitch_id: string;
  start_date: string;
  standing_heat_start: string | null;
  standing_heat_end: string | null;
  ovulation_date: string | null;
  optimal_breeding_start: string | null;
  optimal_breeding_end: string | null;
  end_date: string | null;
  expected_due_date: string | null;
  next_heat_estimate: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToHeatCycle(row: HeatCycleRow): HeatCycle {
  return {
    id: row.id,
    bitchId: row.bitch_id,
    startDate: new Date(row.start_date),
    standingHeatStart: sqlToDate(row.standing_heat_start),
    standingHeatEnd: sqlToDate(row.standing_heat_end),
    ovulationDate: sqlToDate(row.ovulation_date),
    optimalBreedingStart: sqlToDate(row.optimal_breeding_start),
    optimalBreedingEnd: sqlToDate(row.optimal_breeding_end),
    endDate: sqlToDate(row.end_date),
    expectedDueDate: sqlToDate(row.expected_due_date),
    nextHeatEstimate: sqlToDate(row.next_heat_estimate),
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getHeatCycles(bitchId?: string): Promise<HeatCycle[]> {
  const sql = bitchId
    ? 'SELECT * FROM heat_cycles WHERE bitch_id = ? ORDER BY start_date DESC'
    : 'SELECT * FROM heat_cycles ORDER BY start_date DESC';
  const rows = await query<HeatCycleRow>(sql, bitchId ? [bitchId] : []);
  
  const cycles = rows.map(rowToHeatCycle);
  
  // Populate events for each cycle
  for (const cycle of cycles) {
    cycle.events = await getHeatEvents(cycle.id);
  }
  
  return cycles;
}

export async function getHeatCycle(id: string): Promise<HeatCycle | null> {
  const rows = await query<HeatCycleRow>('SELECT * FROM heat_cycles WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  
  const cycle = rowToHeatCycle(rows[0]);
  cycle.events = await getHeatEvents(id);
  
  return cycle;
}

export async function createHeatCycle(
  input: Omit<HeatCycle, 'id' | 'createdAt' | 'updatedAt' | 'bitch' | 'events'>
): Promise<HeatCycle> {
  const id = generateId();
  const now = nowIso();
  
  await execute(
    `INSERT INTO heat_cycles 
     (id, bitch_id, start_date, standing_heat_start, standing_heat_end, ovulation_date,
      optimal_breeding_start, optimal_breeding_end, end_date, expected_due_date,
      next_heat_estimate, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.bitchId,
      dateToSql(input.startDate),
      dateToSql(input.standingHeatStart),
      dateToSql(input.standingHeatEnd),
      dateToSql(input.ovulationDate),
      dateToSql(input.optimalBreedingStart),
      dateToSql(input.optimalBreedingEnd),
      dateToSql(input.endDate),
      dateToSql(input.expectedDueDate),
      dateToSql(input.nextHeatEstimate),
      input.notes ?? null,
      now,
      now,
    ]
  );
  
  const cycle = await getHeatCycle(id);
  if (!cycle) throw new Error('Failed to create heat cycle');
  return cycle;
}

export async function updateHeatCycle(
  id: string,
  input: Partial<HeatCycle>
): Promise<HeatCycle | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.startDate !== undefined) { updates.push('start_date = ?'); values.push(dateToSql(input.startDate)); }
  if (input.standingHeatStart !== undefined) { updates.push('standing_heat_start = ?'); values.push(dateToSql(input.standingHeatStart)); }
  if (input.standingHeatEnd !== undefined) { updates.push('standing_heat_end = ?'); values.push(dateToSql(input.standingHeatEnd)); }
  if (input.ovulationDate !== undefined) { updates.push('ovulation_date = ?'); values.push(dateToSql(input.ovulationDate)); }
  if (input.optimalBreedingStart !== undefined) { updates.push('optimal_breeding_start = ?'); values.push(dateToSql(input.optimalBreedingStart)); }
  if (input.optimalBreedingEnd !== undefined) { updates.push('optimal_breeding_end = ?'); values.push(dateToSql(input.optimalBreedingEnd)); }
  if (input.endDate !== undefined) { updates.push('end_date = ?'); values.push(dateToSql(input.endDate)); }
  if (input.expectedDueDate !== undefined) { updates.push('expected_due_date = ?'); values.push(dateToSql(input.expectedDueDate)); }
  if (input.nextHeatEstimate !== undefined) { updates.push('next_heat_estimate = ?'); values.push(dateToSql(input.nextHeatEstimate)); }
  if (input.notes !== undefined) { updates.push('notes = ?'); values.push(input.notes); }
  
  if (updates.length === 0) {
    return getHeatCycle(id);
  }
  
  updates.push('updated_at = ?');
  values.push(nowIso());
  values.push(id);
  
  await execute(`UPDATE heat_cycles SET ${updates.join(', ')} WHERE id = ?`, values);
  return getHeatCycle(id);
}

export async function deleteHeatCycle(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM heat_cycles WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}

// ============================================
// HEAT EVENTS
// ============================================

interface HeatEventRow {
  id: string;
  heat_cycle_id: string;
  date: string;
  type: string;
  value: string | null;
  sire_id: string | null;
  notes: string | null;
  created_at: string;
}

function rowToHeatEvent(row: HeatEventRow): HeatEvent {
  return {
    id: row.id,
    heatCycleId: row.heat_cycle_id,
    date: new Date(row.date),
    type: row.type as HeatEvent['type'],
    value: row.value,
    sireId: row.sire_id,
    notes: row.notes,
    createdAt: new Date(row.created_at),
  };
}

export async function getHeatEvents(heatCycleId: string): Promise<HeatEvent[]> {
  const rows = await query<HeatEventRow>(
    'SELECT * FROM heat_events WHERE heat_cycle_id = ? ORDER BY date',
    [heatCycleId]
  );
  return rows.map(rowToHeatEvent);
}

export async function createHeatEvent(
  input: Omit<HeatEvent, 'id' | 'createdAt' | 'heatCycle' | 'sire'>
): Promise<HeatEvent> {
  const id = generateId();
  const now = nowIso();
  
  await execute(
    `INSERT INTO heat_events 
     (id, heat_cycle_id, date, type, value, sire_id, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.heatCycleId,
      dateToSql(input.date),
      input.type,
      input.value ?? null,
      input.sireId ?? null,
      input.notes ?? null,
      now,
    ]
  );
  
  const rows = await query<HeatEventRow>('SELECT * FROM heat_events WHERE id = ?', [id]);
  return rowToHeatEvent(rows[0]);
}

export async function updateHeatEvent(
  id: string,
  input: Partial<HeatEvent>
): Promise<HeatEvent | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.date !== undefined) { updates.push('date = ?'); values.push(dateToSql(input.date)); }
  if (input.type !== undefined) { updates.push('type = ?'); values.push(input.type); }
  if (input.value !== undefined) { updates.push('value = ?'); values.push(input.value); }
  if (input.sireId !== undefined) { updates.push('sire_id = ?'); values.push(input.sireId); }
  if (input.notes !== undefined) { updates.push('notes = ?'); values.push(input.notes); }
  
  if (updates.length === 0) {
    const rows = await query<HeatEventRow>('SELECT * FROM heat_events WHERE id = ?', [id]);
    return rows.length > 0 ? rowToHeatEvent(rows[0]) : null;
  }
  
  values.push(id);
  await execute(`UPDATE heat_events SET ${updates.join(', ')} WHERE id = ?`, values);
  
  const rows = await query<HeatEventRow>('SELECT * FROM heat_events WHERE id = ?', [id]);
  return rows.length > 0 ? rowToHeatEvent(rows[0]) : null;
}

export async function deleteHeatEvent(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM heat_events WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}

// ============================================
// EXTERNAL STUDS
// ============================================

interface ExternalStudRow {
  id: string;
  name: string;
  breed: string;
  registration_number: string | null;
  color: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  owner_email: string | null;
  stud_fee: number | null;
  notes: string | null;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
}

function rowToExternalStud(row: ExternalStudRow): ExternalStud {
  return {
    id: row.id,
    name: row.name,
    breed: row.breed,
    registrationNumber: row.registration_number,
    ownerName: row.owner_name,
    ownerPhone: row.owner_phone,
    ownerEmail: row.owner_email,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getExternalStuds(): Promise<ExternalStud[]> {
  const rows = await query<ExternalStudRow>('SELECT * FROM external_studs ORDER BY name');
  return rows.map(rowToExternalStud);
}

export async function getExternalStud(id: string): Promise<ExternalStud | null> {
  const rows = await query<ExternalStudRow>('SELECT * FROM external_studs WHERE id = ?', [id]);
  return rows.length > 0 ? rowToExternalStud(rows[0]) : null;
}

export async function createExternalStud(input: CreateExternalStudInput): Promise<ExternalStud> {
  const id = generateId();
  const now = nowIso();
  
  await execute(
    `INSERT INTO external_studs 
     (id, name, breed, registration_number, color, owner_name, owner_phone, owner_email, stud_fee, notes, photo_path, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.breed,
      input.registrationNumber ?? null,
      null, // color
      input.ownerName ?? null,
      input.ownerPhone ?? null,
      input.ownerEmail ?? null,
      null, // stud_fee
      input.notes ?? null,
      null, // photo_path
      now,
      now,
    ]
  );
  
  const stud = await getExternalStud(id);
  if (!stud) throw new Error('Failed to create external stud');
  return stud;
}

export async function updateExternalStud(
  id: string,
  input: UpdateExternalStudInput
): Promise<ExternalStud | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.name !== undefined) { updates.push('name = ?'); values.push(input.name); }
  if (input.breed !== undefined) { updates.push('breed = ?'); values.push(input.breed); }
  if (input.registrationNumber !== undefined) { updates.push('registration_number = ?'); values.push(input.registrationNumber); }
  if (input.ownerName !== undefined) { updates.push('owner_name = ?'); values.push(input.ownerName); }
  if (input.ownerPhone !== undefined) { updates.push('owner_phone = ?'); values.push(input.ownerPhone); }
  if (input.ownerEmail !== undefined) { updates.push('owner_email = ?'); values.push(input.ownerEmail); }
  if (input.notes !== undefined) { updates.push('notes = ?'); values.push(input.notes); }
  
  if (updates.length === 0) {
    return getExternalStud(id);
  }
  
  updates.push('updated_at = ?');
  values.push(nowIso());
  values.push(id);
  
  await execute(`UPDATE external_studs SET ${updates.join(', ')} WHERE id = ?`, values);
  return getExternalStud(id);
}

export async function deleteExternalStud(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM external_studs WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}

// ============================================
// BREEDING PREDICTIONS
// ============================================

/**
 * Get breeding recommendation based on progesterone level
 */
export function getBreedingRecommendation(progesteroneLevel: number): {
  phase: string;
  recommendation: string;
  isOptimal: boolean;
  daysUntilOptimal?: number;
} {
  if (progesteroneLevel < 1.0) {
    return {
      phase: 'Proestrus (early)',
      recommendation: 'Too early for breeding. Continue monitoring every 2-3 days.',
      isOptimal: false,
      daysUntilOptimal: 5,
    };
  } else if (progesteroneLevel < 2.0) {
    return {
      phase: 'Proestrus (late)',
      recommendation: 'LH surge may be imminent. Increase testing frequency to every 1-2 days.',
      isOptimal: false,
      daysUntilOptimal: 3,
    };
  } else if (progesteroneLevel >= 2.0 && progesteroneLevel < 3.0) {
    return {
      phase: 'LH surge',
      recommendation: 'LH surge occurring! Ovulation expected in 24-48 hours.',
      isOptimal: false,
      daysUntilOptimal: 2,
    };
  } else if (progesteroneLevel >= 3.0 && progesteroneLevel < 5.0) {
    return {
      phase: 'Ovulation',
      recommendation: 'Ovulation occurring. Eggs need 2 days to mature.',
      isOptimal: false,
      daysUntilOptimal: 1,
    };
  } else if (progesteroneLevel >= 5.0 && progesteroneLevel < 15.0) {
    return {
      phase: 'Optimal breeding window',
      recommendation: 'OPTIMAL breeding time! Breed now or within next 24-48 hours.',
      isOptimal: true,
    };
  } else if (progesteroneLevel >= 15.0 && progesteroneLevel < 25.0) {
    return {
      phase: 'Late breeding window',
      recommendation: 'Still fertile but window closing. Breed immediately if not done.',
      isOptimal: false,
    };
  } else {
    return {
      phase: 'Post-fertile',
      recommendation: 'Breeding window has closed. Wait for next cycle.',
      isOptimal: false,
    };
  }
}

/**
 * Calculate heat cycle prediction for a dog
 */
export async function calculateHeatCyclePrediction(dogId: string): Promise<HeatCyclePrediction> {
  const cycles = await getHeatCycles(dogId);
  
  if (cycles.length === 0) {
    return {
      dogId,
      averageCycleLength: null,
      averageIntervalDays: null,
      predictedNextHeat: null,
      confidence: 'low',
      dataPointCount: 0,
    };
  }
  
  // Calculate average interval between cycles
  const intervals: number[] = [];
  for (let i = 0; i < cycles.length - 1; i++) {
    const current = cycles[i];
    const previous = cycles[i + 1];
    const diffMs = current.startDate.getTime() - previous.startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 0 && diffDays < 400) { // Sanity check
      intervals.push(diffDays);
    }
  }
  
  const avgInterval = intervals.length > 0
    ? intervals.reduce((a, b) => a + b, 0) / intervals.length
    : null;
  
  // Calculate predicted next heat
  let predictedNextHeat: Date | null = null;
  if (avgInterval && cycles.length > 0) {
    const lastCycle = cycles[0];
    predictedNextHeat = new Date(lastCycle.startDate.getTime() + avgInterval * 24 * 60 * 60 * 1000);
  }
  
  // Determine confidence level
  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (cycles.length >= 5) {
    confidence = 'high';
  } else if (cycles.length >= 3) {
    confidence = 'medium';
  }
  
  return {
    dogId,
    averageCycleLength: null, // Would need end dates to calculate
    averageIntervalDays: avgInterval,
    predictedNextHeat,
    confidence,
    dataPointCount: cycles.length,
  };
}


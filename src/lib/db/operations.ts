// Operations database module
// Handles expenses, transports, and communication logs

import { query, execute } from './connection';
import { generateId, dateToSql, sqlToDate, nowIso, boolToSql, sqlToBool } from './utils';
import type {
  Expense,
  Transport,
  CommunicationLog,
  CreateExpenseInput,
  UpdateExpenseInput,
  CreateTransportInput,
  UpdateTransportInput,
  CreateCommunicationLogInput,
  UpdateCommunicationLogInput,
} from '@/types';

// ============================================
// EXPENSES
// ============================================

interface ExpenseRow {
  id: string;
  date: string;
  amount: number;
  category: string;
  vendor_name: string | null;
  description: string | null;
  payment_method: string | null;
  is_tax_deductible: number;
  receipt_path: string | null;
  related_dog_id: string | null;
  related_litter_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    date: new Date(row.date),
    amount: row.amount,
    category: row.category as Expense['category'],
    vendorName: row.vendor_name,
    description: row.description,
    paymentMethod: row.payment_method,
    isTaxDeductible: sqlToBool(row.is_tax_deductible),
    receiptPath: row.receipt_path,
    relatedDogId: row.related_dog_id,
    relatedLitterId: row.related_litter_id,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getExpenses(filters?: {
  dogId?: string;
  litterId?: string;
  category?: string;
}): Promise<Expense[]> {
  let sql = 'SELECT * FROM expenses WHERE 1=1';
  const params: unknown[] = [];
  
  if (filters?.dogId) {
    // Match exact dog ID, excluding NULL and empty strings
    sql += ' AND related_dog_id = ? AND related_dog_id IS NOT NULL AND related_dog_id != \'\'';
    params.push(filters.dogId);
  }
  if (filters?.litterId) {
    // Match exact litter ID, excluding NULL and empty strings
    sql += ' AND related_litter_id = ? AND related_litter_id IS NOT NULL AND related_litter_id != \'\'';
    params.push(filters.litterId);
  }
  if (filters?.category) {
    sql += ' AND category = ?';
    params.push(filters.category);
  }
  
  sql += ' ORDER BY date DESC';
  
  const rows = await query<ExpenseRow>(sql, params);
  return rows.map(rowToExpense);
}

export async function getExpense(id: string): Promise<Expense | null> {
  const rows = await query<ExpenseRow>('SELECT * FROM expenses WHERE id = ?', [id]);
  return rows.length > 0 ? rowToExpense(rows[0]) : null;
}

// Internal options for createExpense - not exposed in public API
interface CreateExpenseOptions {
  // When true, skip auto-creating a transport record even if category is 'transport'
  // Used by createTransport to avoid duplicate transport creation
  skipTransportCreation?: boolean;
}

export async function createExpense(
  input: CreateExpenseInput,
  options: CreateExpenseOptions = {}
): Promise<Expense> {
  const id = generateId();
  const now = nowIso();

  // Normalize empty strings to null for optional fields
  const relatedDogId = input.relatedDogId && typeof input.relatedDogId === 'string' && input.relatedDogId.trim() !== '' ? input.relatedDogId : null;
  const relatedLitterId = input.relatedLitterId && typeof input.relatedLitterId === 'string' && input.relatedLitterId.trim() !== '' ? input.relatedLitterId : null;

  await execute(
    `INSERT INTO expenses
     (id, date, amount, category, vendor_name, description, payment_method,
      is_tax_deductible, receipt_path, related_dog_id, related_litter_id, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      dateToSql(input.date),
      input.amount,
      input.category,
      input.vendorName ?? null,
      input.description ?? null,
      input.paymentMethod ?? null,
      boolToSql(input.isTaxDeductible ?? false),
      input.receiptPath ?? null,
      relatedDogId,
      relatedLitterId,
      input.notes ?? null,
      now,
      now,
    ]
  );

  const expense = await getExpense(id);
  if (!expense) throw new Error('Failed to create expense');

  // If this is a transport expense with a related dog, also create a transport record
  // so it appears on the Transport page
  // Skip if called from createTransport (which handles its own transport record)
  if (input.category === 'transport' && relatedDogId && !options.skipTransportCreation) {
    const transportId = generateId();
    await execute(
      `INSERT INTO transports
       (id, dog_id, date, mode, shipper_business_name, contact_name, phone, email,
        origin_city, origin_state, destination_city, destination_state,
        tracking_number, cost, expense_id, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transportId,
        relatedDogId,
        dateToSql(input.date),
        'other', // Default mode when created from expense form
        input.vendorName ?? null,
        null, // contactName
        null, // phone
        null, // email
        null, // originCity
        null, // originState
        null, // destinationCity
        null, // destinationState
        null, // trackingNumber
        input.amount,
        id, // Link back to the expense
        input.description ?? input.notes ?? null,
        now,
        now,
      ]
    );
  }

  return expense;
}

export async function updateExpense(id: string, input: UpdateExpenseInput): Promise<Expense | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.date !== undefined) { updates.push('date = ?'); values.push(dateToSql(input.date)); }
  if (input.amount !== undefined) { updates.push('amount = ?'); values.push(input.amount); }
  if (input.category !== undefined) { updates.push('category = ?'); values.push(input.category); }
  if (input.vendorName !== undefined) { updates.push('vendor_name = ?'); values.push(input.vendorName ?? null); }
  if (input.description !== undefined) { updates.push('description = ?'); values.push(input.description ?? null); }
  if (input.paymentMethod !== undefined) { updates.push('payment_method = ?'); values.push(input.paymentMethod ?? null); }
  if (input.isTaxDeductible !== undefined) { updates.push('is_tax_deductible = ?'); values.push(boolToSql(input.isTaxDeductible)); }
  if (input.receiptPath !== undefined) { updates.push('receipt_path = ?'); values.push(input.receiptPath ?? null); }
  if (input.relatedDogId !== undefined) { 
    // Normalize empty strings to null
    const relatedDogId = input.relatedDogId && typeof input.relatedDogId === 'string' && input.relatedDogId.trim() !== '' ? input.relatedDogId : null;
    updates.push('related_dog_id = ?'); 
    values.push(relatedDogId); 
  }
  if (input.relatedLitterId !== undefined) { 
    // Normalize empty strings to null
    const relatedLitterId = input.relatedLitterId && typeof input.relatedLitterId === 'string' && input.relatedLitterId.trim() !== '' ? input.relatedLitterId : null;
    updates.push('related_litter_id = ?'); 
    values.push(relatedLitterId); 
  }
  if (input.notes !== undefined) { updates.push('notes = ?'); values.push(input.notes ?? null); }
  
  if (updates.length === 0) return getExpense(id);
  
  updates.push('updated_at = ?');
  values.push(nowIso());
  values.push(id);
  
  await execute(`UPDATE expenses SET ${updates.join(', ')} WHERE id = ?`, values);
  return getExpense(id);
}

export async function deleteExpense(id: string): Promise<boolean> {
  // Delete any linked transport records first
  await execute('DELETE FROM transports WHERE expense_id = ?', [id]);

  const result = await execute('DELETE FROM expenses WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}

// ============================================
// TRANSPORTS
// ============================================

interface TransportRow {
  id: string;
  dog_id: string;
  date: string;
  mode: string;
  shipper_business_name: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  origin_city: string | null;
  origin_state: string | null;
  destination_city: string | null;
  destination_state: string | null;
  tracking_number: string | null;
  cost: number | null;
  expense_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface TransportRowWithDog extends TransportRow {
  dog_name: string | null;
}

function rowToTransport(row: TransportRow): Transport {
  return {
    id: row.id,
    dogId: row.dog_id,
    date: new Date(row.date),
    mode: row.mode as Transport['mode'],
    shipperBusinessName: row.shipper_business_name,
    contactName: row.contact_name,
    phone: row.phone,
    email: row.email,
    originCity: row.origin_city,
    originState: row.origin_state,
    destinationCity: row.destination_city,
    destinationState: row.destination_state,
    trackingNumber: row.tracking_number,
    cost: row.cost,
    expenseId: row.expense_id,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToTransportWithDog(row: TransportRowWithDog): Transport {
  const transport = rowToTransport(row);
  if (row.dog_name) {
    // Only populate minimal dog info needed for display (id + name)
    transport.dog = { id: row.dog_id, name: row.dog_name } as Transport['dog'];
  }
  return transport;
}

export async function getTransports(dogId?: string): Promise<Transport[]> {
  const sql = dogId
    ? `SELECT t.*, d.name as dog_name
       FROM transports t
       LEFT JOIN dogs d ON t.dog_id = d.id
       WHERE t.dog_id = ?
       ORDER BY t.date DESC`
    : `SELECT t.*, d.name as dog_name
       FROM transports t
       LEFT JOIN dogs d ON t.dog_id = d.id
       ORDER BY t.date DESC`;
  const rows = await query<TransportRowWithDog>(sql, dogId ? [dogId] : []);
  return rows.map(rowToTransportWithDog);
}

export async function getTransport(id: string): Promise<Transport | null> {
  const rows = await query<TransportRow>('SELECT * FROM transports WHERE id = ?', [id]);
  return rows.length > 0 ? rowToTransport(rows[0]) : null;
}

export async function createTransport(input: CreateTransportInput): Promise<Transport> {
  const id = generateId();
  const now = nowIso();

  // Create linked expense if cost is provided
  // Pass skipTransportCreation to prevent duplicate transport creation
  let expenseId: string | null = null;
  if (input.cost && input.cost > 0) {
    const expense = await createExpense(
      {
        date: input.date,
        amount: input.cost,
        category: 'transport',
        vendorName: input.shipperBusinessName,
        description: `Transport for dog`,
        relatedDogId: input.dogId,
        isTaxDeductible: false,
      },
      { skipTransportCreation: true }
    );
    expenseId = expense.id;
  }
  
  await execute(
    `INSERT INTO transports 
     (id, dog_id, date, mode, shipper_business_name, contact_name, phone, email,
      origin_city, origin_state, destination_city, destination_state, 
      tracking_number, cost, expense_id, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.dogId,
      dateToSql(input.date),
      input.mode,
      input.shipperBusinessName ?? null,
      input.contactName ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.originCity ?? null,
      input.originState ?? null,
      input.destinationCity ?? null,
      input.destinationState ?? null,
      input.trackingNumber ?? null,
      input.cost ?? null,
      expenseId,
      input.notes ?? null,
      now,
      now,
    ]
  );
  
  const transport = await getTransport(id);
  if (!transport) throw new Error('Failed to create transport');
  return transport;
}

export async function updateTransport(id: string, input: UpdateTransportInput): Promise<Transport | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.date !== undefined) { updates.push('date = ?'); values.push(dateToSql(input.date)); }
  if (input.mode !== undefined) { updates.push('mode = ?'); values.push(input.mode); }
  if (input.shipperBusinessName !== undefined) { updates.push('shipper_business_name = ?'); values.push(input.shipperBusinessName); }
  if (input.contactName !== undefined) { updates.push('contact_name = ?'); values.push(input.contactName); }
  if (input.phone !== undefined) { updates.push('phone = ?'); values.push(input.phone); }
  if (input.email !== undefined) { updates.push('email = ?'); values.push(input.email); }
  if (input.originCity !== undefined) { updates.push('origin_city = ?'); values.push(input.originCity); }
  if (input.originState !== undefined) { updates.push('origin_state = ?'); values.push(input.originState); }
  if (input.destinationCity !== undefined) { updates.push('destination_city = ?'); values.push(input.destinationCity); }
  if (input.destinationState !== undefined) { updates.push('destination_state = ?'); values.push(input.destinationState); }
  if (input.trackingNumber !== undefined) { updates.push('tracking_number = ?'); values.push(input.trackingNumber); }
  if (input.cost !== undefined) { updates.push('cost = ?'); values.push(input.cost); }
  if (input.notes !== undefined) { updates.push('notes = ?'); values.push(input.notes); }
  
  if (updates.length === 0) return getTransport(id);
  
  updates.push('updated_at = ?');
  values.push(nowIso());
  values.push(id);
  
  await execute(`UPDATE transports SET ${updates.join(', ')} WHERE id = ?`, values);
  return getTransport(id);
}

export async function deleteTransport(id: string): Promise<boolean> {
  // Get the transport to find linked expense
  const transport = await getTransport(id);
  if (transport?.expenseId) {
    await deleteExpense(transport.expenseId);
  }
  
  const result = await execute('DELETE FROM transports WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}

// ============================================
// COMMUNICATION LOGS
// ============================================

interface CommunicationLogRow {
  id: string;
  client_id: string;
  date: string;
  type: string;
  direction: string;
  subject: string | null;
  content: string | null;
  follow_up_date: string | null;
  follow_up_completed: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToCommunicationLog(row: CommunicationLogRow): CommunicationLog {
  return {
    id: row.id,
    clientId: row.client_id,
    date: new Date(row.date),
    type: row.type as CommunicationLog['type'],
    direction: row.direction as CommunicationLog['direction'],
    summary: row.subject ?? '',
    followUpNeeded: row.follow_up_date !== null,
    followUpDate: sqlToDate(row.follow_up_date),
    followUpCompleted: sqlToBool(row.follow_up_completed),
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getCommunicationLogs(clientId?: string): Promise<CommunicationLog[]> {
  const sql = clientId
    ? 'SELECT * FROM communication_logs WHERE client_id = ? ORDER BY date DESC'
    : 'SELECT * FROM communication_logs ORDER BY date DESC';
  const rows = await query<CommunicationLogRow>(sql, clientId ? [clientId] : []);
  return rows.map(rowToCommunicationLog);
}

export async function getCommunicationLog(id: string): Promise<CommunicationLog | null> {
  const rows = await query<CommunicationLogRow>(
    'SELECT * FROM communication_logs WHERE id = ?',
    [id]
  );
  return rows.length > 0 ? rowToCommunicationLog(rows[0]) : null;
}

export async function getFollowUpsDue(): Promise<CommunicationLog[]> {
  const now = dateToSql(new Date());
  const weekFromNow = dateToSql(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  
  const rows = await query<CommunicationLogRow>(
    `SELECT * FROM communication_logs 
     WHERE follow_up_completed = 0 
       AND follow_up_date IS NOT NULL 
       AND follow_up_date <= ?
       AND follow_up_date >= ?
     ORDER BY follow_up_date`,
    [weekFromNow, now]
  );
  return rows.map(rowToCommunicationLog);
}

export async function getOverdueFollowUps(): Promise<CommunicationLog[]> {
  const now = dateToSql(new Date());
  
  const rows = await query<CommunicationLogRow>(
    `SELECT * FROM communication_logs 
     WHERE follow_up_completed = 0 
       AND follow_up_date IS NOT NULL 
       AND follow_up_date < ?
     ORDER BY follow_up_date`,
    [now]
  );
  return rows.map(rowToCommunicationLog);
}

export async function createCommunicationLog(input: CreateCommunicationLogInput): Promise<CommunicationLog> {
  const id = generateId();
  const now = nowIso();
  
  await execute(
    `INSERT INTO communication_logs 
     (id, client_id, date, type, direction, subject, content, follow_up_date, 
      follow_up_completed, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.clientId,
      dateToSql(input.date),
      input.type,
      input.direction,
      input.summary ?? null,
      null, // content
      dateToSql(input.followUpDate),
      boolToSql(input.followUpCompleted ?? false),
      input.notes ?? null,
      now,
      now,
    ]
  );
  
  const log = await getCommunicationLog(id);
  if (!log) throw new Error('Failed to create communication log');
  return log;
}

export async function updateCommunicationLog(
  id: string,
  input: UpdateCommunicationLogInput
): Promise<CommunicationLog | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.date !== undefined) { updates.push('date = ?'); values.push(dateToSql(input.date)); }
  if (input.type !== undefined) { updates.push('type = ?'); values.push(input.type); }
  if (input.direction !== undefined) { updates.push('direction = ?'); values.push(input.direction); }
  if (input.summary !== undefined) { updates.push('subject = ?'); values.push(input.summary); }
  if (input.followUpDate !== undefined) { updates.push('follow_up_date = ?'); values.push(dateToSql(input.followUpDate)); }
  if (input.followUpCompleted !== undefined) { updates.push('follow_up_completed = ?'); values.push(boolToSql(input.followUpCompleted)); }
  if (input.notes !== undefined) { updates.push('notes = ?'); values.push(input.notes); }
  
  if (updates.length === 0) return getCommunicationLog(id);
  
  updates.push('updated_at = ?');
  values.push(nowIso());
  values.push(id);
  
  await execute(`UPDATE communication_logs SET ${updates.join(', ')} WHERE id = ?`, values);
  return getCommunicationLog(id);
}

export async function deleteCommunicationLog(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM communication_logs WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}

export async function completeFollowUp(id: string): Promise<CommunicationLog | null> {
  await execute(
    'UPDATE communication_logs SET follow_up_completed = 1, updated_at = ? WHERE id = ?',
    [nowIso(), id]
  );
  return getCommunicationLog(id);
}


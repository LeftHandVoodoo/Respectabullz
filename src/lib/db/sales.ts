// Sales database operations
// Handles clients, sales, sale puppies, client interests, and waitlist

import { query, execute } from './connection';
import { generateId, dateToSql, sqlToDate, nowIso, boolToSql, sqlToBool } from './utils';
import type {
  Client,
  Sale,
  SalePuppy,
  ClientInterest,
  WaitlistEntry,
  CreateClientInput,
  UpdateClientInput,
  CreateSaleInput,
  UpdateSaleInput,
  CreateClientInterestInput,
  UpdateClientInterestInput,
  CreateWaitlistEntryInput,
  UpdateWaitlistEntryInput,
} from '@/types';

// ============================================
// CLIENTS
// ============================================

interface ClientRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getClients(): Promise<Client[]> {
  const rows = await query<ClientRow>('SELECT * FROM clients ORDER BY name');
  return rows.map(rowToClient);
}

export async function getClient(id: string): Promise<Client | null> {
  const rows = await query<ClientRow>('SELECT * FROM clients WHERE id = ?', [id]);
  return rows.length > 0 ? rowToClient(rows[0]) : null;
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  const id = generateId();
  const now = nowIso();
  
  await execute(
    `INSERT INTO clients 
     (id, name, phone, email, address_line1, address_line2, city, state, postal_code, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.phone ?? null,
      input.email ?? null,
      input.addressLine1 ?? null,
      input.addressLine2 ?? null,
      input.city ?? null,
      input.state ?? null,
      input.postalCode ?? null,
      input.notes ?? null,
      now,
      now,
    ]
  );
  
  const client = await getClient(id);
  if (!client) throw new Error('Failed to create client');
  return client;
}

export async function updateClient(id: string, input: UpdateClientInput): Promise<Client | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.name !== undefined) { updates.push('name = ?'); values.push(input.name); }
  if (input.phone !== undefined) { updates.push('phone = ?'); values.push(input.phone); }
  if (input.email !== undefined) { updates.push('email = ?'); values.push(input.email); }
  if (input.addressLine1 !== undefined) { updates.push('address_line1 = ?'); values.push(input.addressLine1); }
  if (input.addressLine2 !== undefined) { updates.push('address_line2 = ?'); values.push(input.addressLine2); }
  if (input.city !== undefined) { updates.push('city = ?'); values.push(input.city); }
  if (input.state !== undefined) { updates.push('state = ?'); values.push(input.state); }
  if (input.postalCode !== undefined) { updates.push('postal_code = ?'); values.push(input.postalCode); }
  if (input.notes !== undefined) { updates.push('notes = ?'); values.push(input.notes); }
  
  if (updates.length === 0) return getClient(id);
  
  updates.push('updated_at = ?');
  values.push(nowIso());
  values.push(id);
  
  await execute(`UPDATE clients SET ${updates.join(', ')} WHERE id = ?`, values);
  return getClient(id);
}

export async function deleteClient(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM clients WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}

// ============================================
// SALES
// ============================================

interface SaleRow {
  id: string;
  client_id: string;
  sale_date: string;
  price: number;
  deposit_amount: number | null;
  deposit_date: string | null;
  contract_path: string | null;
  shipped_date: string | null;
  received_date: string | null;
  is_local_pickup: number;
  payment_status: string;
  warranty_info: string | null;
  registration_transfer_date: string | null;
  transport_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface SalePuppyRow {
  id: string;
  sale_id: string;
  dog_id: string;
  price: number;
  created_at: string;
}

function rowToSale(row: SaleRow): Sale {
  return {
    id: row.id,
    clientId: row.client_id,
    saleDate: new Date(row.sale_date),
    price: row.price,
    depositAmount: row.deposit_amount,
    depositDate: sqlToDate(row.deposit_date),
    contractPath: row.contract_path,
    shippedDate: sqlToDate(row.shipped_date),
    receivedDate: sqlToDate(row.received_date),
    isLocalPickup: sqlToBool(row.is_local_pickup),
    paymentStatus: row.payment_status as Sale['paymentStatus'],
    warrantyInfo: row.warranty_info,
    registrationTransferDate: sqlToDate(row.registration_transfer_date),
    transportId: row.transport_id,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToSalePuppy(row: SalePuppyRow): SalePuppy {
  return {
    id: row.id,
    saleId: row.sale_id,
    dogId: row.dog_id,
    price: row.price,
    createdAt: new Date(row.created_at),
  };
}

export async function getSales(): Promise<Sale[]> {
  const rows = await query<SaleRow>('SELECT * FROM sales ORDER BY sale_date DESC');
  const sales = rows.map(rowToSale);
  
  // Populate puppies for each sale
  for (const sale of sales) {
    sale.puppies = await getSalePuppies(sale.id);
    sale.client = (await getClient(sale.clientId)) ?? undefined;
  }
  
  return sales;
}

export async function getSale(id: string): Promise<Sale | null> {
  const rows = await query<SaleRow>('SELECT * FROM sales WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  
  const sale = rowToSale(rows[0]);
  sale.puppies = await getSalePuppies(id);
  sale.client = (await getClient(sale.clientId)) ?? undefined;
  
  return sale;
}

export async function createSale(input: CreateSaleInput): Promise<Sale> {
  const id = generateId();
  const now = nowIso();
  
  await execute(
    `INSERT INTO sales 
     (id, client_id, sale_date, price, deposit_amount, deposit_date, contract_path,
      shipped_date, received_date, is_local_pickup, payment_status, warranty_info,
      registration_transfer_date, transport_id, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.clientId,
      dateToSql(input.saleDate),
      input.price,
      input.depositAmount ?? null,
      dateToSql(input.depositDate),
      input.contractPath ?? null,
      dateToSql(input.shippedDate),
      dateToSql(input.receivedDate),
      boolToSql(input.isLocalPickup ?? false),
      input.paymentStatus ?? 'deposit_only',
      input.warrantyInfo ?? null,
      dateToSql(input.registrationTransferDate),
      input.transportId ?? null,
      input.notes ?? null,
      now,
      now,
    ]
  );
  
  const sale = await getSale(id);
  if (!sale) throw new Error('Failed to create sale');
  return sale;
}

export async function updateSale(id: string, input: UpdateSaleInput): Promise<Sale | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.clientId !== undefined) { updates.push('client_id = ?'); values.push(input.clientId); }
  if (input.saleDate !== undefined) { updates.push('sale_date = ?'); values.push(dateToSql(input.saleDate)); }
  if (input.price !== undefined) { updates.push('price = ?'); values.push(input.price); }
  if (input.depositAmount !== undefined) { updates.push('deposit_amount = ?'); values.push(input.depositAmount); }
  if (input.depositDate !== undefined) { updates.push('deposit_date = ?'); values.push(dateToSql(input.depositDate)); }
  if (input.contractPath !== undefined) { updates.push('contract_path = ?'); values.push(input.contractPath); }
  if (input.shippedDate !== undefined) { updates.push('shipped_date = ?'); values.push(dateToSql(input.shippedDate)); }
  if (input.receivedDate !== undefined) { updates.push('received_date = ?'); values.push(dateToSql(input.receivedDate)); }
  if (input.isLocalPickup !== undefined) { updates.push('is_local_pickup = ?'); values.push(boolToSql(input.isLocalPickup)); }
  if (input.paymentStatus !== undefined) { updates.push('payment_status = ?'); values.push(input.paymentStatus); }
  if (input.warrantyInfo !== undefined) { updates.push('warranty_info = ?'); values.push(input.warrantyInfo); }
  if (input.registrationTransferDate !== undefined) { updates.push('registration_transfer_date = ?'); values.push(dateToSql(input.registrationTransferDate)); }
  if (input.transportId !== undefined) { updates.push('transport_id = ?'); values.push(input.transportId); }
  if (input.notes !== undefined) { updates.push('notes = ?'); values.push(input.notes); }
  
  if (updates.length === 0) return getSale(id);
  
  updates.push('updated_at = ?');
  values.push(nowIso());
  values.push(id);
  
  await execute(`UPDATE sales SET ${updates.join(', ')} WHERE id = ?`, values);
  return getSale(id);
}

export async function deleteSale(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM sales WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}

// ============================================
// SALE PUPPIES
// ============================================

async function getSalePuppies(saleId: string): Promise<SalePuppy[]> {
  const rows = await query<SalePuppyRow>(
    'SELECT * FROM sale_puppies WHERE sale_id = ?',
    [saleId]
  );
  return rows.map(rowToSalePuppy);
}

export async function addPuppyToSale(saleId: string, dogId: string, price: number): Promise<SalePuppy | null> {
  const id = generateId();
  const now = nowIso();
  
  await execute(
    `INSERT INTO sale_puppies (id, sale_id, dog_id, price, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, saleId, dogId, price, now]
  );
  
  // Update dog status to sold
  await execute('UPDATE dogs SET status = ? WHERE id = ?', ['sold', dogId]);
  
  const rows = await query<SalePuppyRow>('SELECT * FROM sale_puppies WHERE id = ?', [id]);
  return rows.length > 0 ? rowToSalePuppy(rows[0]) : null;
}

export async function removePuppyFromSale(saleId: string, dogId: string): Promise<boolean> {
  const result = await execute(
    'DELETE FROM sale_puppies WHERE sale_id = ? AND dog_id = ?',
    [saleId, dogId]
  );
  
  // Update dog status back to active
  if (result.rowsAffected > 0) {
    await execute('UPDATE dogs SET status = ? WHERE id = ?', ['active', dogId]);
  }
  
  return result.rowsAffected > 0;
}

export async function updatePuppyPrice(saleId: string, dogId: string, price: number): Promise<SalePuppy | null> {
  await execute(
    'UPDATE sale_puppies SET price = ? WHERE sale_id = ? AND dog_id = ?',
    [price, saleId, dogId]
  );
  
  const rows = await query<SalePuppyRow>(
    'SELECT * FROM sale_puppies WHERE sale_id = ? AND dog_id = ?',
    [saleId, dogId]
  );
  return rows.length > 0 ? rowToSalePuppy(rows[0]) : null;
}

// ============================================
// CLIENT INTERESTS
// ============================================

interface ClientInterestRow {
  id: string;
  client_id: string;
  dog_id: string;
  interest_date: string;
  contact_method: string;
  status: string;
  converted_to_sale_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToClientInterest(row: ClientInterestRow): ClientInterest {
  return {
    id: row.id,
    clientId: row.client_id,
    dogId: row.dog_id,
    interestDate: new Date(row.interest_date),
    contactMethod: row.contact_method as ClientInterest['contactMethod'],
    status: row.status as ClientInterest['status'],
    convertedToSaleId: row.converted_to_sale_id,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getClientInterests(): Promise<ClientInterest[]> {
  const rows = await query<ClientInterestRow>(
    'SELECT * FROM client_interests ORDER BY interest_date DESC'
  );
  return rows.map(rowToClientInterest);
}

export async function getClientInterest(id: string): Promise<ClientInterest | null> {
  const rows = await query<ClientInterestRow>(
    'SELECT * FROM client_interests WHERE id = ?',
    [id]
  );
  return rows.length > 0 ? rowToClientInterest(rows[0]) : null;
}

export async function getInterestsByClient(clientId: string): Promise<ClientInterest[]> {
  const rows = await query<ClientInterestRow>(
    'SELECT * FROM client_interests WHERE client_id = ? ORDER BY interest_date DESC',
    [clientId]
  );
  return rows.map(rowToClientInterest);
}

export async function getInterestsByDog(dogId: string): Promise<ClientInterest[]> {
  const rows = await query<ClientInterestRow>(
    'SELECT * FROM client_interests WHERE dog_id = ? ORDER BY interest_date DESC',
    [dogId]
  );
  return rows.map(rowToClientInterest);
}

export async function createClientInterest(input: CreateClientInterestInput): Promise<ClientInterest> {
  const id = generateId();
  const now = nowIso();
  
  await execute(
    `INSERT INTO client_interests 
     (id, client_id, dog_id, interest_date, contact_method, status, converted_to_sale_id, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.clientId,
      input.dogId,
      dateToSql(input.interestDate),
      input.contactMethod,
      input.status ?? 'interested',
      input.convertedToSaleId ?? null,
      input.notes ?? null,
      now,
      now,
    ]
  );
  
  const interest = await getClientInterest(id);
  if (!interest) throw new Error('Failed to create client interest');
  return interest;
}

export async function updateClientInterest(
  id: string,
  input: UpdateClientInterestInput
): Promise<ClientInterest | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.interestDate !== undefined) { updates.push('interest_date = ?'); values.push(dateToSql(input.interestDate)); }
  if (input.contactMethod !== undefined) { updates.push('contact_method = ?'); values.push(input.contactMethod); }
  if (input.status !== undefined) { updates.push('status = ?'); values.push(input.status); }
  if (input.convertedToSaleId !== undefined) { updates.push('converted_to_sale_id = ?'); values.push(input.convertedToSaleId); }
  if (input.notes !== undefined) { updates.push('notes = ?'); values.push(input.notes); }
  
  if (updates.length === 0) return getClientInterest(id);
  
  updates.push('updated_at = ?');
  values.push(nowIso());
  values.push(id);
  
  await execute(`UPDATE client_interests SET ${updates.join(', ')} WHERE id = ?`, values);
  return getClientInterest(id);
}

export async function deleteClientInterest(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM client_interests WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}

export async function convertInterestToSale(interestId: string, saleId: string): Promise<ClientInterest | null> {
  await execute(
    'UPDATE client_interests SET status = ?, converted_to_sale_id = ?, updated_at = ? WHERE id = ?',
    ['converted', saleId, nowIso(), interestId]
  );
  return getClientInterest(interestId);
}

// ============================================
// WAITLIST
// ============================================

interface WaitlistEntryRow {
  id: string;
  client_id: string;
  litter_id: string | null;
  position: number;
  sex_preference: string | null;
  color_preference: string | null;
  deposit_amount: number | null;
  deposit_date: string | null;
  status: string;
  matched_puppy_id: string | null;
  converted_sale_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToWaitlistEntry(row: WaitlistEntryRow): WaitlistEntry {
  return {
    id: row.id,
    clientId: row.client_id,
    litterId: row.litter_id,
    position: row.position,
    preference: (row.sex_preference as WaitlistEntry['preference']) ?? 'any',
    colorPreference: row.color_preference,
    depositAmount: row.deposit_amount,
    depositDate: sqlToDate(row.deposit_date),
    depositStatus: row.deposit_amount ? 'paid' : 'pending',
    status: row.status as WaitlistEntry['status'],
    assignedPuppyId: row.matched_puppy_id,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getWaitlistEntries(litterId?: string): Promise<WaitlistEntry[]> {
  const sql = litterId
    ? 'SELECT * FROM waitlist_entries WHERE litter_id = ? ORDER BY position'
    : 'SELECT * FROM waitlist_entries ORDER BY position';
  const rows = await query<WaitlistEntryRow>(sql, litterId ? [litterId] : []);
  return rows.map(rowToWaitlistEntry);
}

export async function getGeneralWaitlist(): Promise<WaitlistEntry[]> {
  const rows = await query<WaitlistEntryRow>(
    'SELECT * FROM waitlist_entries WHERE litter_id IS NULL ORDER BY position'
  );
  return rows.map(rowToWaitlistEntry);
}

export async function getWaitlistEntry(id: string): Promise<WaitlistEntry | null> {
  const rows = await query<WaitlistEntryRow>(
    'SELECT * FROM waitlist_entries WHERE id = ?',
    [id]
  );
  return rows.length > 0 ? rowToWaitlistEntry(rows[0]) : null;
}

export async function getWaitlistEntriesByClient(clientId: string): Promise<WaitlistEntry[]> {
  const rows = await query<WaitlistEntryRow>(
    'SELECT * FROM waitlist_entries WHERE client_id = ? ORDER BY created_at DESC',
    [clientId]
  );
  return rows.map(rowToWaitlistEntry);
}

export async function createWaitlistEntry(input: CreateWaitlistEntryInput): Promise<WaitlistEntry> {
  const id = generateId();
  const now = nowIso();
  
  // Get next position
  const maxResult = await query<{ max_pos: number | null }>(
    'SELECT MAX(position) as max_pos FROM waitlist_entries WHERE litter_id IS ?',
    [input.litterId ?? null]
  );
  const position = input.position ?? ((maxResult[0]?.max_pos ?? -1) + 1);
  
  await execute(
    `INSERT INTO waitlist_entries 
     (id, client_id, litter_id, position, sex_preference, color_preference, deposit_amount, 
      deposit_date, status, matched_puppy_id, converted_sale_id, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.clientId,
      input.litterId ?? null,
      position,
      input.preference ?? null,
      input.colorPreference ?? null,
      input.depositAmount ?? null,
      dateToSql(input.depositDate),
      input.status ?? 'waiting',
      input.assignedPuppyId ?? null,
      null, // converted_sale_id
      input.notes ?? null,
      now,
      now,
    ]
  );
  
  const entry = await getWaitlistEntry(id);
  if (!entry) throw new Error('Failed to create waitlist entry');
  return entry;
}

export async function updateWaitlistEntry(
  id: string,
  input: UpdateWaitlistEntryInput
): Promise<WaitlistEntry | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.litterId !== undefined) { updates.push('litter_id = ?'); values.push(input.litterId); }
  if (input.position !== undefined) { updates.push('position = ?'); values.push(input.position); }
  if (input.preference !== undefined) { updates.push('sex_preference = ?'); values.push(input.preference); }
  if (input.colorPreference !== undefined) { updates.push('color_preference = ?'); values.push(input.colorPreference); }
  if (input.depositAmount !== undefined) { updates.push('deposit_amount = ?'); values.push(input.depositAmount); }
  if (input.depositDate !== undefined) { updates.push('deposit_date = ?'); values.push(dateToSql(input.depositDate)); }
  if (input.status !== undefined) { updates.push('status = ?'); values.push(input.status); }
  if (input.assignedPuppyId !== undefined) { updates.push('matched_puppy_id = ?'); values.push(input.assignedPuppyId); }
  if (input.notes !== undefined) { updates.push('notes = ?'); values.push(input.notes); }
  
  if (updates.length === 0) return getWaitlistEntry(id);
  
  updates.push('updated_at = ?');
  values.push(nowIso());
  values.push(id);
  
  await execute(`UPDATE waitlist_entries SET ${updates.join(', ')} WHERE id = ?`, values);
  return getWaitlistEntry(id);
}

export async function deleteWaitlistEntry(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM waitlist_entries WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}

export async function reorderWaitlist(_litterId: string | null, entryIds: string[]): Promise<void> {
  for (let i = 0; i < entryIds.length; i++) {
    await execute(
      'UPDATE waitlist_entries SET position = ?, updated_at = ? WHERE id = ?',
      [i, nowIso(), entryIds[i]]
    );
  }
}

export async function matchPuppyToWaitlist(entryId: string, puppyId: string): Promise<WaitlistEntry | null> {
  await execute(
    'UPDATE waitlist_entries SET matched_puppy_id = ?, status = ?, updated_at = ? WHERE id = ?',
    [puppyId, 'matched', nowIso(), entryId]
  );
  return getWaitlistEntry(entryId);
}

export async function convertWaitlistToSale(entryId: string, saleId: string): Promise<WaitlistEntry | null> {
  await execute(
    'UPDATE waitlist_entries SET converted_sale_id = ?, status = ?, updated_at = ? WHERE id = ?',
    [saleId, 'converted', nowIso(), entryId]
  );
  return getWaitlistEntry(entryId);
}


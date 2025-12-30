// Database operations for contacts management
// Handles contacts, categories, and category links

import { query, execute } from './connection';
import { generateId, sqlToDate, sqlToBool, nowIso, boolToSql } from './utils';
import type {
  Contact,
  ContactCategory,
  ContactWithRelations,
  CreateContactInput,
  UpdateContactInput,
  CreateContactCategoryInput,
  UpdateContactCategoryInput,
} from '@/types';

// ============================================
// COLOR GENERATION FOR CATEGORIES
// ============================================

// Color palette for auto-assigning to new categories
// Excludes colors already used by predefined categories (Blue, Orange, Purple, Green, Red)
const CATEGORY_COLOR_PALETTE = [
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F59E0B', // Amber
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#06B6D4', // Cyan
  '#A855F7', // Violet
  '#F43F5E', // Rose
  '#22C55E', // Emerald
  '#0EA5E9', // Sky
  '#D946EF', // Fuchsia
  '#EAB308', // Yellow
];

/**
 * Generate a random color for a new category
 * Tries to pick a color not already in use by existing categories
 */
async function generateCategoryColor(): Promise<string> {
  const existingCategories = await getContactCategories();
  const usedColors = new Set(
    existingCategories
      .map(c => c.color?.toUpperCase())
      .filter(Boolean)
  );

  // Find colors not yet used
  const availableColors = CATEGORY_COLOR_PALETTE.filter(
    color => !usedColors.has(color.toUpperCase())
  );

  // If we have available colors, pick one randomly
  if (availableColors.length > 0) {
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  }

  // If all colors are used, pick a random one from the palette
  return CATEGORY_COLOR_PALETTE[Math.floor(Math.random() * CATEGORY_COLOR_PALETTE.length)];
}

// ============================================
// CONTACT CATEGORIES
// ============================================

interface ContactCategoryRow {
  id: string;
  name: string;
  color: string | null;
  is_predefined: number;
  created_at: string;
  updated_at: string;
}

function rowToContactCategory(row: ContactCategoryRow): ContactCategory {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    isPredefined: sqlToBool(row.is_predefined),
    createdAt: sqlToDate(row.created_at)!,
    updatedAt: sqlToDate(row.updated_at)!,
  };
}

/**
 * Get all contact categories
 */
export async function getContactCategories(): Promise<ContactCategory[]> {
  const rows = await query<ContactCategoryRow>(
    'SELECT * FROM contact_categories ORDER BY is_predefined DESC, name'
  );
  return rows.map(rowToContactCategory);
}

/**
 * Get contact category by ID
 */
export async function getContactCategory(id: string): Promise<ContactCategory | null> {
  const rows = await query<ContactCategoryRow>(
    'SELECT * FROM contact_categories WHERE id = ?',
    [id]
  );
  if (rows.length === 0) return null;
  return rowToContactCategory(rows[0]);
}

/**
 * Get contact category by name
 */
export async function getContactCategoryByName(name: string): Promise<ContactCategory | null> {
  const rows = await query<ContactCategoryRow>(
    'SELECT * FROM contact_categories WHERE name = ?',
    [name]
  );
  if (rows.length === 0) return null;
  return rowToContactCategory(rows[0]);
}

/**
 * Create a contact category
 * Auto-generates a color if none is provided
 */
export async function createContactCategory(input: CreateContactCategoryInput): Promise<ContactCategory> {
  const id = generateId();
  const now = nowIso();

  // Auto-generate a color if none provided
  const color = input.color ?? await generateCategoryColor();

  await execute(
    `INSERT INTO contact_categories (id, name, color, is_predefined, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.name, color, boolToSql(input.isPredefined ?? false), now, now]
  );

  return {
    id,
    name: input.name,
    color,
    isPredefined: input.isPredefined ?? false,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };
}

/**
 * Update a contact category
 */
export async function updateContactCategory(
  id: string,
  input: UpdateContactCategoryInput
): Promise<ContactCategory | null> {
  const existing = await getContactCategory(id);
  if (!existing) return null;

  const updates: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.color !== undefined) {
    updates.push('color = ?');
    values.push(input.color);
  }

  if (updates.length === 0) return existing;

  updates.push('updated_at = ?');
  values.push(nowIso());
  values.push(id);

  await execute(`UPDATE contact_categories SET ${updates.join(', ')} WHERE id = ?`, values);
  return getContactCategory(id);
}

/**
 * Delete a contact category (only custom categories can be deleted)
 */
export async function deleteContactCategory(id: string): Promise<boolean> {
  const category = await getContactCategory(id);
  if (!category || category.isPredefined) return false;

  await execute('DELETE FROM contact_categories WHERE id = ?', [id]);
  return true;
}

// ============================================
// CONTACTS
// ============================================

interface ContactRow {
  id: string;
  name: string;
  company_name: string | null;
  phone_primary: string | null;
  phone_secondary: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  twitter: string | null;
  website: string | null;
  notes: string | null;
  business_card_document_id: string | null;
  created_at: string;
  updated_at: string;
}

function rowToContact(row: ContactRow): Contact {
  return {
    id: row.id,
    name: row.name,
    companyName: row.company_name,
    phonePrimary: row.phone_primary,
    phoneSecondary: row.phone_secondary,
    email: row.email,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    facebook: row.facebook,
    instagram: row.instagram,
    tiktok: row.tiktok,
    twitter: row.twitter,
    website: row.website,
    notes: row.notes,
    businessCardDocumentId: row.business_card_document_id,
    createdAt: sqlToDate(row.created_at)!,
    updatedAt: sqlToDate(row.updated_at)!,
  };
}

/**
 * Get all contacts with their categories
 */
export async function getContacts(): Promise<ContactWithRelations[]> {
  const rows = await query<ContactRow>('SELECT * FROM contacts ORDER BY name');
  const contacts: ContactWithRelations[] = [];

  for (const row of rows) {
    const contact = rowToContact(row);
    const categories = await getCategoriesForContact(contact.id);
    contacts.push({
      ...contact,
      categories,
    });
  }

  return contacts;
}

/**
 * Get contact by ID with categories
 */
export async function getContact(id: string): Promise<ContactWithRelations | null> {
  const rows = await query<ContactRow>('SELECT * FROM contacts WHERE id = ?', [id]);
  if (rows.length === 0) return null;

  const contact = rowToContact(rows[0]);
  const categories = await getCategoriesForContact(id);

  return {
    ...contact,
    categories,
  };
}

/**
 * Get contacts by category
 */
export async function getContactsByCategory(categoryId: string): Promise<ContactWithRelations[]> {
  const rows = await query<ContactRow>(
    `SELECT c.* FROM contacts c
     INNER JOIN contact_category_links l ON l.contact_id = c.id
     WHERE l.category_id = ?
     ORDER BY c.name`,
    [categoryId]
  );

  const contacts: ContactWithRelations[] = [];
  for (const row of rows) {
    const contact = rowToContact(row);
    const categories = await getCategoriesForContact(contact.id);
    contacts.push({
      ...contact,
      categories,
    });
  }

  return contacts;
}

/**
 * Create a new contact
 */
export async function createContact(input: CreateContactInput): Promise<ContactWithRelations> {
  const id = generateId();
  const now = nowIso();

  await execute(
    `INSERT INTO contacts (
      id, name, company_name, phone_primary, phone_secondary, email,
      address_line1, address_line2, city, state, postal_code,
      facebook, instagram, tiktok, twitter, website,
      notes, business_card_document_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.companyName ?? null,
      input.phonePrimary ?? null,
      input.phoneSecondary ?? null,
      input.email ?? null,
      input.addressLine1 ?? null,
      input.addressLine2 ?? null,
      input.city ?? null,
      input.state ?? null,
      input.postalCode ?? null,
      input.facebook ?? null,
      input.instagram ?? null,
      input.tiktok ?? null,
      input.twitter ?? null,
      input.website ?? null,
      input.notes ?? null,
      input.businessCardDocumentId ?? null,
      now,
      now,
    ]
  );

  // Add categories if provided
  if (input.categoryIds && input.categoryIds.length > 0) {
    await setContactCategories(id, input.categoryIds);
  }

  const contact = await getContact(id);
  if (!contact) throw new Error('Failed to create contact');
  return contact;
}

/**
 * Update a contact
 */
export async function updateContact(
  id: string,
  input: UpdateContactInput
): Promise<ContactWithRelations | null> {
  const existing = await getContact(id);
  if (!existing) return null;

  const updates: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.companyName !== undefined) {
    updates.push('company_name = ?');
    values.push(input.companyName);
  }
  if (input.phonePrimary !== undefined) {
    updates.push('phone_primary = ?');
    values.push(input.phonePrimary);
  }
  if (input.phoneSecondary !== undefined) {
    updates.push('phone_secondary = ?');
    values.push(input.phoneSecondary);
  }
  if (input.email !== undefined) {
    updates.push('email = ?');
    values.push(input.email);
  }
  if (input.addressLine1 !== undefined) {
    updates.push('address_line1 = ?');
    values.push(input.addressLine1);
  }
  if (input.addressLine2 !== undefined) {
    updates.push('address_line2 = ?');
    values.push(input.addressLine2);
  }
  if (input.city !== undefined) {
    updates.push('city = ?');
    values.push(input.city);
  }
  if (input.state !== undefined) {
    updates.push('state = ?');
    values.push(input.state);
  }
  if (input.postalCode !== undefined) {
    updates.push('postal_code = ?');
    values.push(input.postalCode);
  }
  if (input.facebook !== undefined) {
    updates.push('facebook = ?');
    values.push(input.facebook);
  }
  if (input.instagram !== undefined) {
    updates.push('instagram = ?');
    values.push(input.instagram);
  }
  if (input.tiktok !== undefined) {
    updates.push('tiktok = ?');
    values.push(input.tiktok);
  }
  if (input.twitter !== undefined) {
    updates.push('twitter = ?');
    values.push(input.twitter);
  }
  if (input.website !== undefined) {
    updates.push('website = ?');
    values.push(input.website);
  }
  if (input.notes !== undefined) {
    updates.push('notes = ?');
    values.push(input.notes);
  }
  if (input.businessCardDocumentId !== undefined) {
    updates.push('business_card_document_id = ?');
    values.push(input.businessCardDocumentId);
  }

  if (updates.length > 0) {
    updates.push('updated_at = ?');
    values.push(nowIso());
    values.push(id);

    await execute(`UPDATE contacts SET ${updates.join(', ')} WHERE id = ?`, values);
  }

  // Update categories if provided
  if (input.categoryIds !== undefined) {
    await setContactCategories(id, input.categoryIds);
  }

  return getContact(id);
}

/**
 * Delete a contact
 */
export async function deleteContact(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM contacts WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}

// ============================================
// CONTACT-CATEGORY LINKS
// ============================================

/**
 * Get categories for a contact
 */
export async function getCategoriesForContact(contactId: string): Promise<ContactCategory[]> {
  const rows = await query<ContactCategoryRow>(
    `SELECT c.* FROM contact_categories c
     INNER JOIN contact_category_links l ON l.category_id = c.id
     WHERE l.contact_id = ?
     ORDER BY c.is_predefined DESC, c.name`,
    [contactId]
  );

  return rows.map(rowToContactCategory);
}

/**
 * Set categories for a contact (replaces existing categories)
 */
export async function setContactCategories(contactId: string, categoryIds: string[]): Promise<void> {
  // Remove existing category links
  await execute('DELETE FROM contact_category_links WHERE contact_id = ?', [contactId]);

  // Add new category links
  for (const categoryId of categoryIds) {
    const linkId = generateId();
    await execute(
      `INSERT INTO contact_category_links (id, contact_id, category_id, created_at)
       VALUES (?, ?, ?, ?)`,
      [linkId, contactId, categoryId, nowIso()]
    );
  }
}

/**
 * Add a category to a contact
 */
export async function addCategoryToContact(contactId: string, categoryId: string): Promise<void> {
  // Check if link already exists
  const existing = await query<{ id: string }>(
    'SELECT id FROM contact_category_links WHERE contact_id = ? AND category_id = ?',
    [contactId, categoryId]
  );

  if (existing.length > 0) return;

  const linkId = generateId();
  await execute(
    `INSERT INTO contact_category_links (id, contact_id, category_id, created_at)
     VALUES (?, ?, ?, ?)`,
    [linkId, contactId, categoryId, nowIso()]
  );
}

/**
 * Remove a category from a contact
 */
export async function removeCategoryFromContact(contactId: string, categoryId: string): Promise<void> {
  await execute(
    'DELETE FROM contact_category_links WHERE contact_id = ? AND category_id = ?',
    [contactId, categoryId]
  );
}

/**
 * Search contacts by name, email, or phone
 */
export async function searchContacts(searchTerm: string): Promise<ContactWithRelations[]> {
  const term = `%${searchTerm}%`;
  const rows = await query<ContactRow>(
    `SELECT * FROM contacts
     WHERE name LIKE ? OR company_name LIKE ? OR email LIKE ? OR phone_primary LIKE ? OR phone_secondary LIKE ?
     ORDER BY name`,
    [term, term, term, term, term]
  );

  const contacts: ContactWithRelations[] = [];
  for (const row of rows) {
    const contact = rowToContact(row);
    const categories = await getCategoriesForContact(contact.id);
    contacts.push({
      ...contact,
      categories,
    });
  }

  return contacts;
}

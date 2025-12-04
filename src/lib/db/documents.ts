// Database operations for document management
// Handles documents, tags, and entity links (dogs, litters, expenses)

import { query, execute } from './connection';
import { generateId, sqlToDate, sqlToBool, nowIso } from './utils';
import type {
  Document,
  DocumentTag,
  DocumentWithRelations,
  CreateDocumentInput,
  UpdateDocumentInput,
  CreateDocumentTagInput,
  PREDEFINED_DOCUMENT_TAGS,
} from '@/types';
import { deleteDocumentFile } from '../documentUtils';

// ============================================
// DOCUMENT TAGS
// ============================================

interface DocumentTagRow {
  id: string;
  name: string;
  color: string | null;
  is_custom: number;
  created_at: string;
}

/**
 * Get all document tags
 */
export async function getDocumentTags(): Promise<DocumentTag[]> {
  const rows = await query<DocumentTagRow>('SELECT * FROM document_tags ORDER BY is_custom, name');
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    color: row.color,
    isCustom: sqlToBool(row.is_custom),
    createdAt: sqlToDate(row.created_at)!,
  }));
}

/**
 * Get document tag by ID
 */
export async function getDocumentTag(id: string): Promise<DocumentTag | null> {
  const rows = await query<DocumentTagRow>('SELECT * FROM document_tags WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  
  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    isCustom: sqlToBool(row.is_custom),
    createdAt: sqlToDate(row.created_at)!,
  };
}

/**
 * Get document tag by name
 */
export async function getDocumentTagByName(name: string): Promise<DocumentTag | null> {
  const rows = await query<DocumentTagRow>('SELECT * FROM document_tags WHERE name = ?', [name]);
  if (rows.length === 0) return null;
  
  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    isCustom: sqlToBool(row.is_custom),
    createdAt: sqlToDate(row.created_at)!,
  };
}

/**
 * Create a document tag
 */
export async function createDocumentTag(input: CreateDocumentTagInput): Promise<DocumentTag> {
  const id = generateId();
  const now = nowIso();
  
  await execute(
    `INSERT INTO document_tags (id, name, color, is_custom, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, input.name, input.color ?? null, input.isCustom ? 1 : 0, now]
  );
  
  return {
    id,
    name: input.name,
    color: input.color ?? null,
    isCustom: input.isCustom ?? false,
    createdAt: new Date(now),
  };
}

/**
 * Delete a document tag (only custom tags can be deleted)
 */
export async function deleteDocumentTag(id: string): Promise<boolean> {
  const tag = await getDocumentTag(id);
  if (!tag || !tag.isCustom) return false;
  
  await execute('DELETE FROM document_tags WHERE id = ?', [id]);
  return true;
}

/**
 * Seed predefined document tags
 */
export async function seedPredefinedTags(tags: typeof PREDEFINED_DOCUMENT_TAGS): Promise<void> {
  for (const tag of tags) {
    const existing = await getDocumentTagByName(tag.name);
    if (!existing) {
      await createDocumentTag({
        name: tag.name,
        color: tag.color,
        isCustom: false,
      });
    }
  }
}

// ============================================
// DOCUMENTS
// ============================================

interface DocumentRow {
  id: string;
  filename: string;
  original_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  notes: string | null;
  uploaded_at: string;
  updated_at: string;
}

function rowToDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    filename: row.filename,
    originalName: row.original_name,
    filePath: row.file_path,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    notes: row.notes,
    uploadedAt: sqlToDate(row.uploaded_at)!,
    updatedAt: sqlToDate(row.updated_at)!,
  };
}

/**
 * Get all documents
 */
export async function getDocuments(): Promise<Document[]> {
  const rows = await query<DocumentRow>('SELECT * FROM documents ORDER BY uploaded_at DESC');
  return rows.map(rowToDocument);
}

/**
 * Get document by ID
 */
export async function getDocument(id: string): Promise<Document | null> {
  const rows = await query<DocumentRow>('SELECT * FROM documents WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return rowToDocument(rows[0]);
}

/**
 * Get document with all relations (tags and linked entities)
 */
export async function getDocumentWithRelations(id: string): Promise<DocumentWithRelations | null> {
  const doc = await getDocument(id);
  if (!doc) return null;
  
  const tags = await getDocumentTags_ForDocument(id);
  
  return {
    ...doc,
    tags,
  };
}

/**
 * Get tags for a document
 */
export async function getDocumentTags_ForDocument(documentId: string): Promise<DocumentTag[]> {
  const rows = await query<DocumentTagRow>(
    `SELECT t.* FROM document_tags t
     INNER JOIN document_tag_links l ON l.tag_id = t.id
     WHERE l.document_id = ?
     ORDER BY t.name`,
    [documentId]
  );
  
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    color: row.color,
    isCustom: sqlToBool(row.is_custom),
    createdAt: sqlToDate(row.created_at)!,
  }));
}

/**
 * Create a new document
 */
export async function createDocument(input: CreateDocumentInput): Promise<Document> {
  const id = generateId();
  const now = nowIso();
  
  await execute(
    `INSERT INTO documents (id, filename, original_name, file_path, mime_type, file_size, notes, uploaded_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, input.filename, input.originalName, input.filePath, input.mimeType, input.fileSize, input.notes ?? null, now, now]
  );
  
  // Add tags if provided
  if (input.tagIds && input.tagIds.length > 0) {
    await setDocumentTags(id, input.tagIds);
  }
  
  return {
    id,
    filename: input.filename,
    originalName: input.originalName,
    filePath: input.filePath,
    mimeType: input.mimeType,
    fileSize: input.fileSize,
    notes: input.notes ?? null,
    uploadedAt: new Date(now),
    updatedAt: new Date(now),
  };
}

/**
 * Update a document
 */
export async function updateDocument(id: string, input: UpdateDocumentInput): Promise<Document | null> {
  const existing = await getDocument(id);
  if (!existing) return null;
  
  const now = nowIso();
  
  await execute(
    `UPDATE documents SET notes = ?, updated_at = ? WHERE id = ?`,
    [input.notes ?? existing.notes, now, id]
  );
  
  // Update tags if provided
  if (input.tagIds !== undefined) {
    await setDocumentTags(id, input.tagIds);
  }
  
  return getDocument(id);
}

/**
 * Delete a document (also deletes the file)
 */
export async function deleteDocument(id: string): Promise<boolean> {
  const doc = await getDocument(id);
  if (!doc) return false;
  
  // Delete the file from storage
  await deleteDocumentFile(doc.filename);
  
  // Delete from database (cascades to junction tables)
  await execute('DELETE FROM documents WHERE id = ?', [id]);
  return true;
}

/**
 * Set tags for a document (replaces existing tags)
 */
export async function setDocumentTags(documentId: string, tagIds: string[]): Promise<void> {
  // Remove existing tags
  await execute('DELETE FROM document_tag_links WHERE document_id = ?', [documentId]);
  
  // Add new tags
  for (const tagId of tagIds) {
    const linkId = generateId();
    await execute(
      `INSERT INTO document_tag_links (id, document_id, tag_id, created_at)
       VALUES (?, ?, ?, ?)`,
      [linkId, documentId, tagId, nowIso()]
    );
  }
}

/**
 * Add a tag to a document
 */
export async function addTagToDocument(documentId: string, tagId: string): Promise<void> {
  const linkId = generateId();
  await execute(
    `INSERT OR IGNORE INTO document_tag_links (id, document_id, tag_id, created_at)
     VALUES (?, ?, ?, ?)`,
    [linkId, documentId, tagId, nowIso()]
  );
}

/**
 * Remove a tag from a document
 */
export async function removeTagFromDocument(documentId: string, tagId: string): Promise<void> {
  await execute(
    'DELETE FROM document_tag_links WHERE document_id = ? AND tag_id = ?',
    [documentId, tagId]
  );
}

// ============================================
// DOG DOCUMENTS
// ============================================

/**
 * Get documents for a dog
 */
export async function getDocumentsForDog(dogId: string): Promise<DocumentWithRelations[]> {
  const rows = await query<DocumentRow>(
    `SELECT d.* FROM documents d
     INNER JOIN dog_documents dd ON dd.document_id = d.id
     WHERE dd.dog_id = ?
     ORDER BY d.uploaded_at DESC`,
    [dogId]
  );
  
  const docs = rows.map(rowToDocument);
  
  // Fetch tags for each document
  const docsWithTags: DocumentWithRelations[] = [];
  for (const doc of docs) {
    const tags = await getDocumentTags_ForDocument(doc.id);
    docsWithTags.push({ ...doc, tags });
  }
  
  return docsWithTags;
}

/**
 * Link a document to a dog
 */
export async function linkDocumentToDog(documentId: string, dogId: string): Promise<void> {
  const linkId = generateId();
  await execute(
    `INSERT OR IGNORE INTO dog_documents (id, dog_id, document_id, created_at)
     VALUES (?, ?, ?, ?)`,
    [linkId, dogId, documentId, nowIso()]
  );
}

/**
 * Unlink a document from a dog
 */
export async function unlinkDocumentFromDog(documentId: string, dogId: string): Promise<void> {
  await execute(
    'DELETE FROM dog_documents WHERE document_id = ? AND dog_id = ?',
    [documentId, dogId]
  );
}

/**
 * Get dog IDs linked to a document
 */
export async function getDogsForDocument(documentId: string): Promise<string[]> {
  const rows = await query<{ dog_id: string }>(
    'SELECT dog_id FROM dog_documents WHERE document_id = ?',
    [documentId]
  );
  return rows.map(r => r.dog_id);
}

// ============================================
// LITTER DOCUMENTS
// ============================================

/**
 * Get documents for a litter
 */
export async function getDocumentsForLitter(litterId: string): Promise<DocumentWithRelations[]> {
  const rows = await query<DocumentRow>(
    `SELECT d.* FROM documents d
     INNER JOIN litter_documents ld ON ld.document_id = d.id
     WHERE ld.litter_id = ?
     ORDER BY d.uploaded_at DESC`,
    [litterId]
  );
  
  const docs = rows.map(rowToDocument);
  
  // Fetch tags for each document
  const docsWithTags: DocumentWithRelations[] = [];
  for (const doc of docs) {
    const tags = await getDocumentTags_ForDocument(doc.id);
    docsWithTags.push({ ...doc, tags });
  }
  
  return docsWithTags;
}

/**
 * Link a document to a litter
 */
export async function linkDocumentToLitter(documentId: string, litterId: string): Promise<void> {
  const linkId = generateId();
  await execute(
    `INSERT OR IGNORE INTO litter_documents (id, litter_id, document_id, created_at)
     VALUES (?, ?, ?, ?)`,
    [linkId, litterId, documentId, nowIso()]
  );
}

/**
 * Unlink a document from a litter
 */
export async function unlinkDocumentFromLitter(documentId: string, litterId: string): Promise<void> {
  await execute(
    'DELETE FROM litter_documents WHERE document_id = ? AND litter_id = ?',
    [documentId, litterId]
  );
}

/**
 * Get litter IDs linked to a document
 */
export async function getLittersForDocument(documentId: string): Promise<string[]> {
  const rows = await query<{ litter_id: string }>(
    'SELECT litter_id FROM litter_documents WHERE document_id = ?',
    [documentId]
  );
  return rows.map(r => r.litter_id);
}

// ============================================
// EXPENSE DOCUMENTS
// ============================================

/**
 * Get documents for an expense
 */
export async function getDocumentsForExpense(expenseId: string): Promise<DocumentWithRelations[]> {
  const rows = await query<DocumentRow>(
    `SELECT d.* FROM documents d
     INNER JOIN expense_documents ed ON ed.document_id = d.id
     WHERE ed.expense_id = ?
     ORDER BY d.uploaded_at DESC`,
    [expenseId]
  );
  
  const docs = rows.map(rowToDocument);
  
  // Fetch tags for each document
  const docsWithTags: DocumentWithRelations[] = [];
  for (const doc of docs) {
    const tags = await getDocumentTags_ForDocument(doc.id);
    docsWithTags.push({ ...doc, tags });
  }
  
  return docsWithTags;
}

/**
 * Link a document to an expense
 */
export async function linkDocumentToExpense(documentId: string, expenseId: string): Promise<void> {
  const linkId = generateId();
  await execute(
    `INSERT OR IGNORE INTO expense_documents (id, expense_id, document_id, created_at)
     VALUES (?, ?, ?, ?)`,
    [linkId, expenseId, documentId, nowIso()]
  );
}

/**
 * Unlink a document from an expense
 */
export async function unlinkDocumentFromExpense(documentId: string, expenseId: string): Promise<void> {
  await execute(
    'DELETE FROM expense_documents WHERE document_id = ? AND expense_id = ?',
    [documentId, expenseId]
  );
}

/**
 * Get expense IDs linked to a document
 */
export async function getExpensesForDocument(documentId: string): Promise<string[]> {
  const rows = await query<{ expense_id: string }>(
    'SELECT expense_id FROM expense_documents WHERE document_id = ?',
    [documentId]
  );
  return rows.map(r => r.expense_id);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get document count for a dog
 */
export async function getDocumentCountForDog(dogId: string): Promise<number> {
  const rows = await query<{ count: number }>(
    'SELECT COUNT(*) as count FROM dog_documents WHERE dog_id = ?',
    [dogId]
  );
  return rows[0]?.count ?? 0;
}

/**
 * Get document count for a litter
 */
export async function getDocumentCountForLitter(litterId: string): Promise<number> {
  const rows = await query<{ count: number }>(
    'SELECT COUNT(*) as count FROM litter_documents WHERE litter_id = ?',
    [litterId]
  );
  return rows[0]?.count ?? 0;
}

/**
 * Get document count for an expense
 */
export async function getDocumentCountForExpense(expenseId: string): Promise<number> {
  const rows = await query<{ count: number }>(
    'SELECT COUNT(*) as count FROM expense_documents WHERE expense_id = ?',
    [expenseId]
  );
  return rows[0]?.count ?? 0;
}

/**
 * Search documents by tag
 */
export async function getDocumentsByTag(tagId: string): Promise<DocumentWithRelations[]> {
  const rows = await query<DocumentRow>(
    `SELECT d.* FROM documents d
     INNER JOIN document_tag_links l ON l.document_id = d.id
     WHERE l.tag_id = ?
     ORDER BY d.uploaded_at DESC`,
    [tagId]
  );
  
  const docs = rows.map(rowToDocument);
  
  // Fetch tags for each document
  const docsWithTags: DocumentWithRelations[] = [];
  for (const doc of docs) {
    const tags = await getDocumentTags_ForDocument(doc.id);
    docsWithTags.push({ ...doc, tags });
  }
  
  return docsWithTags;
}


// Expense categories database operations
// Handles custom expense categories

import { query, execute } from './connection';
import { generateId, nowIso } from './utils';

// ============================================
// EXPENSE CATEGORIES
// ============================================

export interface ExpenseCategory {
  id: string;
  name: string;
  color?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ExpenseCategoryRow {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}

function rowToExpenseCategory(row: ExpenseCategoryRow): ExpenseCategory {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export interface CreateExpenseCategoryInput {
  name: string;
  color?: string | null;
}

export interface UpdateExpenseCategoryInput {
  name?: string;
  color?: string | null;
}

/**
 * Get all custom expense categories
 */
export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const rows = await query<ExpenseCategoryRow>(
    'SELECT * FROM expense_categories ORDER BY name ASC'
  );
  return rows.map(rowToExpenseCategory);
}

/**
 * Get a single expense category by ID
 */
export async function getExpenseCategory(id: string): Promise<ExpenseCategory | null> {
  const rows = await query<ExpenseCategoryRow>(
    'SELECT * FROM expense_categories WHERE id = ?',
    [id]
  );
  return rows.length > 0 ? rowToExpenseCategory(rows[0]) : null;
}

/**
 * Get a single expense category by name
 */
export async function getExpenseCategoryByName(name: string): Promise<ExpenseCategory | null> {
  const rows = await query<ExpenseCategoryRow>(
    'SELECT * FROM expense_categories WHERE name = ?',
    [name]
  );
  return rows.length > 0 ? rowToExpenseCategory(rows[0]) : null;
}

/**
 * Create a new expense category
 */
export async function createExpenseCategory(input: CreateExpenseCategoryInput): Promise<ExpenseCategory> {
  const id = generateId();
  const now = nowIso();
  
  try {
    await execute(
      `INSERT INTO expense_categories (id, name, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        input.name.trim(),
        input.color ?? null,
        now,
        now,
      ]
    );
    
    const category = await getExpenseCategory(id);
    if (!category) throw new Error('Failed to create expense category');
    return category;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if table doesn't exist
    if (errorMessage.includes('no such table') || errorMessage.includes('expense_categories')) {
      throw new Error('Database migration required. Please restart the application to run migrations.');
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Update an expense category
 */
export async function updateExpenseCategory(
  id: string,
  input: UpdateExpenseCategoryInput
): Promise<ExpenseCategory | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name.trim());
  }
  if (input.color !== undefined) {
    updates.push('color = ?');
    values.push(input.color ?? null);
  }
  
  if (updates.length === 0) return getExpenseCategory(id);
  
  updates.push('updated_at = ?');
  values.push(nowIso());
  values.push(id);
  
  await execute(
    `UPDATE expense_categories SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  return getExpenseCategory(id);
}

/**
 * Delete an expense category
 * Note: This will not delete expenses using this category, but will leave them orphaned
 */
export async function deleteExpenseCategory(id: string): Promise<boolean> {
  const result = await execute('DELETE FROM expense_categories WHERE id = ?', [id]);
  return result.rowsAffected > 0;
}


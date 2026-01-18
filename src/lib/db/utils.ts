// Database utility functions
// Shared helpers for ID generation, date conversion, and common operations

/**
 * Generate a unique ID for database records
 * Format: timestamp-random7chars (similar to cuid)
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Convert a JavaScript Date to SQLite datetime string
 * SQLite stores dates as TEXT in ISO format
 */
export function dateToSql(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString();
}

/**
 * Convert a SQLite datetime string to JavaScript Date
 */
export function sqlToDate(sqlDate: string | null | undefined): Date | null {
  if (!sqlDate) return null;
  return new Date(sqlDate);
}

/**
 * Convert boolean to SQLite integer (0/1)
 */
export function boolToSql(value: boolean | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return value ? 1 : 0;
}

/**
 * Convert SQLite integer to boolean
 */
export function sqlToBool(value: number | null | undefined): boolean {
  return value === 1;
}

/**
 * Convert camelCase to snake_case for SQL column names
 * @internal - used only in tests
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase for TypeScript properties
 * @internal - used only in tests
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Transform a database row (snake_case) to TypeScript object (camelCase)
 * Also handles date and boolean conversions
 * @internal - used only in tests
 */
export function rowToObject<T>(row: Record<string, unknown>, dateFields: string[] = [], boolFields: string[] = []): T {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(row)) {
    const camelKey = snakeToCamel(key);
    
    if (dateFields.includes(camelKey) && value !== null) {
      result[camelKey] = sqlToDate(value as string);
    } else if (boolFields.includes(camelKey)) {
      result[camelKey] = sqlToBool(value as number);
    } else {
      result[camelKey] = value;
    }
  }
  
  return result as T;
}

/**
 * Transform a TypeScript object (camelCase) to database row (snake_case)
 * Also handles date and boolean conversions
 * @internal - used only in tests
 */
export function objectToRow(
  obj: Record<string, unknown>,
  dateFields: string[] = [],
  boolFields: string[] = []
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key);
    
    if (dateFields.includes(key) && value !== null && value !== undefined) {
      result[snakeKey] = dateToSql(value as Date);
    } else if (boolFields.includes(key)) {
      result[snakeKey] = boolToSql(value as boolean);
    } else {
      result[snakeKey] = value;
    }
  }
  
  return result;
}

/**
 * Build an UPDATE SET clause from an object
 * Returns { clause: "col1 = ?, col2 = ?", values: [val1, val2] }
 * @internal - used only in tests
 */
export function buildUpdateClause(
  data: Record<string, unknown>,
  dateFields: string[] = [],
  boolFields: string[] = []
): { clause: string; values: unknown[] } {
  const entries = Object.entries(data).filter(([_, v]) => v !== undefined);
  const parts: string[] = [];
  const values: unknown[] = [];
  
  for (const [key, value] of entries) {
    const snakeKey = camelToSnake(key);
    parts.push(`${snakeKey} = ?`);
    
    if (dateFields.includes(key) && value !== null) {
      values.push(dateToSql(value as Date));
    } else if (boolFields.includes(key)) {
      values.push(boolToSql(value as boolean));
    } else {
      values.push(value);
    }
  }
  
  return { clause: parts.join(', '), values };
}

/**
 * Build an INSERT statement from an object
 * Returns { columns: "(col1, col2)", placeholders: "(?, ?)", values: [val1, val2] }
 * @internal - used only in tests
 */
export function buildInsertClause(
  data: Record<string, unknown>,
  dateFields: string[] = [],
  boolFields: string[] = []
): { columns: string; placeholders: string; values: unknown[] } {
  const entries = Object.entries(data).filter(([_, v]) => v !== undefined);
  const columns: string[] = [];
  const values: unknown[] = [];
  
  for (const [key, value] of entries) {
    columns.push(camelToSnake(key));
    
    if (dateFields.includes(key) && value !== null) {
      values.push(dateToSql(value as Date));
    } else if (boolFields.includes(key)) {
      values.push(boolToSql(value as boolean));
    } else {
      values.push(value);
    }
  }
  
  return {
    columns: `(${columns.join(', ')})`,
    placeholders: `(${columns.map(() => '?').join(', ')})`,
    values,
  };
}

/**
 * Get current timestamp as ISO string for created_at/updated_at
 */
export function nowIso(): string {
  return new Date().toISOString();
}


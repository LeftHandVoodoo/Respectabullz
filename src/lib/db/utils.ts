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
 * Get current timestamp as ISO string for created_at/updated_at
 */
export function nowIso(): string {
  return new Date().toISOString();
}


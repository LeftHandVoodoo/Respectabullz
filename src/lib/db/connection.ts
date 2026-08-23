// Database connection management
// The renderer can use only the constrained Rust database command boundary.

import { invoke } from '@tauri-apps/api/core';
import { logger } from '../errorTracking';

interface DatabaseExecuteResult {
  lastInsertId: number;
  rowsAffected: number;
}

export interface NativeDatabaseBoundary {
  select<T>(sql: string, params?: unknown[]): Promise<T>;
  execute(sql: string, params?: unknown[]): Promise<DatabaseExecuteResult>;
}

let db: NativeDatabaseBoundary | null = null;
let dbPromise: Promise<NativeDatabaseBoundary> | null = null;

const nativeDatabase: NativeDatabaseBoundary = Object.freeze({
  select<T>(sql: string, params: unknown[] = []): Promise<T> {
    return invoke<T>('database_select', { sql, params });
  },
  execute(sql: string, params: unknown[] = []): Promise<DatabaseExecuteResult> {
    return invoke<DatabaseExecuteResult>('database_execute', { sql, params });
  },
});

/**
 * Get the fixed native database boundary.
 *
 * A promise lock prevents duplicate startup verification. Rust owns the only
 * supported SQLite pool and rejects schema, transaction, extension,
 * filesystem, and multi-statement SQL before execution.
 */
export async function getDatabase(): Promise<NativeDatabaseBoundary> {
  if (db) {
    return db;
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = (async () => {
    try {
      logger.debug('Verifying native database boundary');
      await nativeDatabase.select<Array<{ test: number }>>('SELECT 1 as test');
      logger.info('Successfully connected to the native SQLite boundary');
      db = nativeDatabase;
      return nativeDatabase;
    } catch (error) {
      logger.error('Failed to connect to the native database boundary', error as Error);
      throw new Error('Database connection failed. Please restart Respectabullz and try again.');
    } finally {
      dbPromise = null;
    }
  })();

  return dbPromise;
}

/** Execute a read-only SQL query through the constrained native boundary. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const database = await getDatabase();
  return database.select<T[]>(sql, params);
}

/** Execute one INSERT, UPDATE, DELETE, or REPLACE statement. */
export async function execute(
  sql: string,
  params: unknown[] = []
): Promise<DatabaseExecuteResult> {
  const database = await getDatabase();
  return database.execute(sql, params);
}

/** Check whether the application schema has been initialized. */
export async function isDatabaseInitialized(): Promise<boolean> {
  try {
    const rows = await query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='dogs'"
    );
    return rows.length > 0;
  } catch (error) {
    logger.debug('Database not initialized (expected on first run)', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

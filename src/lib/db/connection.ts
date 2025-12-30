// Database connection management
// Singleton connection to SQLite via tauri-plugin-sql

import Database from '@tauri-apps/plugin-sql';
import { logger } from '../errorTracking';

// Database singleton instance
let db: Database | null = null;

// Database path - will be in app data directory
// Format: sqlite:filename.db (creates database in app data directory)
const DB_NAME = 'sqlite:respectabullz.db';

/**
 * Get or create the database connection
 * This is a singleton - only one connection is maintained
 */
export async function getDatabase(): Promise<Database> {
  if (db) {
    return db;
  }
  
  try {
    logger.debug('Attempting to load database', { name: DB_NAME });
    db = await Database.load(DB_NAME);
    logger.info('Successfully connected to SQLite database');

    // Test the connection with a simple query
    try {
      await db.select('SELECT 1 as test');
      logger.debug('Database connection verified');
    } catch (testError) {
      logger.warn('Connection test failed', { error: testError });
    }

    return db;
  } catch (error) {
    logger.error('Failed to connect to database', error as Error);

    // Extract error message with better handling for Tauri plugin errors
    let errorMessage = 'Unknown database error';
    if (error instanceof Error) {
      errorMessage = error.message || error.toString();
      logger.debug('Error details', { name: error.name, stack: error.stack });
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      const errObj = error as Record<string, unknown>;
      if ('message' in errObj && typeof errObj.message === 'string') {
        errorMessage = errObj.message;
      } else if ('error' in errObj && typeof errObj.error === 'string') {
        errorMessage = errObj.error;
      } else {
        try {
          errorMessage = JSON.stringify(error);
        } catch {
          errorMessage = String(error);
        }
      }
    }
    logger.debug('Extracted error message', { errorMessage });
    
    // Reset db so we can retry
    db = null;
    
    throw new Error(`Database connection failed: ${errorMessage}. Please ensure Tauri is running and SQL plugin is properly configured.`);
  }
}

/**
 * Close the database connection
 * Call this when the app is shutting down
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    logger.info('Database connection closed');
  }
}

/**
 * Execute a SQL query that returns rows
 * @param sql - SQL query string with ? placeholders
 * @param params - Array of parameter values
 * @returns Array of row objects
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const database = await getDatabase();
  return database.select<T[]>(sql, params);
}

/**
 * Execute a SQL statement that modifies data (INSERT, UPDATE, DELETE)
 * @param sql - SQL statement string with ? placeholders
 * @param params - Array of parameter values
 * @returns Object with lastInsertId and rowsAffected
 */
export async function execute(
  sql: string,
  params: unknown[] = []
): Promise<{ lastInsertId: number; rowsAffected: number }> {
  const database = await getDatabase();
  const result = await database.execute(sql, params);
  return {
    lastInsertId: result.lastInsertId ?? 0,
    rowsAffected: result.rowsAffected,
  };
}

/**
 * Execute multiple SQL statements in a transaction
 * If any statement fails, all changes are rolled back
 */
export async function transaction<T>(
  callback: (tx: TransactionContext) => Promise<T>
): Promise<T> {
  const database = await getDatabase();
  
  await database.execute('BEGIN TRANSACTION');
  
  try {
    const result = await callback({
      query: async <R = Record<string, unknown>>(sql: string, params: unknown[] = []) => {
        return database.select<R[]>(sql, params);
      },
      execute: async (sql: string, params: unknown[] = []) => {
        const result = await database.execute(sql, params);
        return {
          lastInsertId: result.lastInsertId ?? 0,
          rowsAffected: result.rowsAffected,
        };
      },
    });
    
    await database.execute('COMMIT');
    return result;
  } catch (error) {
    await database.execute('ROLLBACK');
    throw error;
  }
}

/**
 * Transaction context passed to transaction callbacks
 */
export interface TransactionContext {
  query: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<T[]>;
  execute: (sql: string, params?: unknown[]) => Promise<{ lastInsertId: number; rowsAffected: number }>;
}

/**
 * Check if the database has been initialized
 */
export async function isDatabaseInitialized(): Promise<boolean> {
  try {
    // First try to get the database connection
    const database = await getDatabase();
    
    // Then check if the dogs table exists
    const result = await database.select<Array<{ name: string }>>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='dogs'"
    );
    return result.length > 0;
  } catch (error) {
    // If database doesn't exist or connection fails, it's not initialized
    logger.debug('Database not initialized (expected on first run)', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

/**
 * Check if the database has any data
 */
export async function isDatabaseEmpty(): Promise<boolean> {
  try {
    const database = await getDatabase();
    const result = await database.select<Array<{ count: number }>>(
      'SELECT COUNT(*) as count FROM dogs'
    );
    return (result[0]?.count ?? 0) === 0;
  } catch (error) {
    // If query fails, assume database is empty
    logger.debug('Could not check if database is empty', { error: error instanceof Error ? error.message : String(error) });
    return true;
  }
}


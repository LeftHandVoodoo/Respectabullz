// Database connection management
// Singleton connection to SQLite via tauri-plugin-sql

import Database from '@tauri-apps/plugin-sql';
import { logger } from '../errorTracking';

// Database singleton instance
let db: Database | null = null;

// Promise-based lock to prevent duplicate connection verification attempts.
// Rust preloads the only supported pool before the renderer starts.
let dbPromise: Promise<Database> | null = null;

// Database path - will be in app data directory
// Format: sqlite:filename.db (creates database in app data directory)
const DB_NAME = 'sqlite:respectabullz.db';

/**
 * Get the fixed, Rust-preloaded database connection
 * This is a singleton - only one connection is maintained
 *
 * Uses a promise-based lock to prevent race conditions where multiple
 * concurrent calls to getDatabase() could duplicate startup verification.
 * The first caller retrieves and verifies the fixed pool, and subsequent
 * callers await the same promise.
 */
export async function getDatabase(): Promise<Database> {
  // Fast path: return cached connection
  if (db) {
    return db;
  }

  // If a connection attempt is in progress, await it
  if (dbPromise) {
    return dbPromise;
  }

  // Initiate new connection with promise-based lock
  dbPromise = (async () => {
    try {
      logger.debug('Retrieving preloaded database', { name: DB_NAME });
      const database = Database.get(DB_NAME);

      logger.info('Successfully connected to SQLite database');

      // Fail closed if the fixed pool was not preloaded by the Rust plugin.
      await database.select('SELECT 1 as test');
      logger.debug('Database connection verified');

      // Store in singleton before returning
      db = database;
      return database;
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

      throw new Error(`Database connection failed: ${errorMessage}. Please ensure Tauri is running and the fixed SQL pool was preloaded.`);
    } finally {
      // Clear promise lock so retry is possible on failure
      dbPromise = null;
    }
  })();

  return dbPromise;
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


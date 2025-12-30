// Database initialization
// Handles setup, migration, and first-launch checks

import { setupDatabase, runMigrations } from './migrations';
import { isDatabaseInitialized, isDatabaseEmpty } from './connection';
import { hasLocalStorageData, migrateFromLocalStorage, clearLocalStorageData } from './migrate-from-localstorage';
import { isFirstLaunch } from './settings';
import { logger } from '../errorTracking';

export interface InitResult {
  success: boolean;
  migrated: boolean;
  migratedCounts?: Record<string, number>;
  error?: string;
}

/**
 * Initialize the database on app startup
 * This should be called once when the app loads
 * @param onProgress - Optional callback for migration progress updates
 */
export async function initializeAppDatabase(
  onProgress?: (stage: string, current: number, total: number) => void
): Promise<InitResult> {
  try {
    logger.info('Starting database initialization');

    // Check if Tauri is available (for browser dev mode)
    if (typeof window !== 'undefined' && !('__TAURI_INTERNALS__' in window)) {
      logger.warn('Tauri not available, skipping database initialization');
      return {
        success: false,
        migrated: false,
        error: 'Tauri environment not available - database requires Tauri runtime',
      };
    }

    // Step 1: Setup database schema
    let dbInitialized = false;
    try {
      dbInitialized = await isDatabaseInitialized();
    } catch (error) {
      logger.debug('Database check failed (may not exist yet)', { error: error instanceof Error ? error.message : String(error) });
      dbInitialized = false;
    }

    if (!dbInitialized) {
      logger.info('Database not initialized, setting up schema');
      try {
        await setupDatabase();
        logger.info('Database schema initialized');
      } catch (error) {
        logger.error('Failed to setup database', error as Error);
        throw new Error(`Database setup failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      // Database exists, but we still need to run migrations to upgrade schema
      logger.info('Database exists, running migrations');
      try {
        // Note: No artificial delay needed - SQLite operations via Tauri are sequential
        // and the await ensures previous operations complete before migrations run
        await runMigrations();
        logger.info('Migrations complete');
      } catch (error) {
        logger.error('Failed to run migrations', error as Error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Migration failed: ${errorMessage}`);
      }
    }

    // Step 2: Check if we need to migrate from localStorage
    const dbEmpty = await isDatabaseEmpty();
    const hasLocalData = hasLocalStorageData();

    if (dbEmpty && hasLocalData) {
      logger.info('Database is empty and localStorage has data, migrating');

      const migrationResult = await migrateFromLocalStorage((stage, current, total) => {
        logger.debug(`Migrating ${stage}`, { current, total });
        if (onProgress) {
          onProgress(stage, current, total);
        }
      });

      if (migrationResult.success) {
        logger.info('Migration successful', { migrated: migrationResult.migrated });

        // Clear localStorage after successful migration
        clearLocalStorageData();
        logger.info('localStorage cleared');

        return {
          success: true,
          migrated: true,
          migratedCounts: migrationResult.migrated,
        };
      } else {
        logger.error('Migration failed', undefined, { error: migrationResult.error });
        return {
          success: false,
          migrated: false,
          error: migrationResult.error,
        };
      }
    }

    logger.info('Database initialization complete');
    return {
      success: true,
      migrated: false,
    };
  } catch (error) {
    logger.error('Initialization failed', error as Error);

    // Extract error message with better handling for various error types
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message || error.toString();
      logger.debug('Error details', { name: error.name, stack: error.stack });
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      // Handle Tauri plugin errors which may have different structure
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
    
    return {
      success: false,
      migrated: false,
      error: errorMessage,
    };
  }
}

/**
 * Check if this is the first launch (no breeder settings configured)
 */
export async function checkFirstLaunch(): Promise<boolean> {
  return await isFirstLaunch();
}


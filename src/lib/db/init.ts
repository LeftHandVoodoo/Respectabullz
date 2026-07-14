// Database initialization
// Handles setup, migration, and first-launch checks

import { setupDatabase, runMigrations } from './migrations';
import { isDatabaseInitialized } from './connection';
import { hasLegacyLocalStoragePayload } from './legacyStorage';
import { isFirstLaunch } from './settings';
import { logger } from '../errorTracking';

export interface InitResult {
  success: boolean;
  migrated: boolean;
  error?: string;
}

/**
 * Initialize the database on app startup
 * This should be called once when the app loads
 */
export async function initializeAppDatabase(): Promise<InitResult> {
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

    // The former browser-storage importer performed independent multi-table writes and could
    // leave a partially imported database. Preserve the original payload unchanged and require a
    // separately designed, transactional recovery workflow instead of attempting an automatic
    // conversion during startup.
    if (hasLegacyLocalStoragePayload()) {
      const error =
        'Legacy browser-storage data was detected. Automatic import is withdrawn because it is not transactional. Preserve this browser profile; no legacy data was changed.';
      logger.warn('Legacy browser-storage data detected; startup blocked', { error });
      return {
        success: false,
        migrated: false,
        error,
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


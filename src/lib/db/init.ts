// Database initialization
// Handles setup, migration, and first-launch checks

import { setupDatabase, runMigrations } from './migrations';
import { isDatabaseInitialized, isDatabaseEmpty } from './connection';
import { hasLocalStorageData, migrateFromLocalStorage, clearLocalStorageData } from './migrate-from-localstorage';
import { isFirstLaunch } from './settings';

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
    console.log('[DB Init] Starting database initialization...');
    
    // Check if Tauri is available (for browser dev mode)
    if (typeof window !== 'undefined' && !('__TAURI_INTERNALS__' in window)) {
      console.warn('[DB Init] Tauri not available, skipping database initialization');
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
      console.log('[DB Init] Database check failed (may not exist yet):', error instanceof Error ? error.message : String(error));
      dbInitialized = false;
    }
    
    if (!dbInitialized) {
      console.log('[DB Init] Database not initialized, setting up schema...');
      try {
        await setupDatabase();
        console.log('[DB Init] Database schema initialized');
      } catch (error) {
        console.error('[DB Init] Failed to setup database:', error);
        throw new Error(`Database setup failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      // Database exists, but we still need to run migrations to upgrade schema
      console.log('[DB Init] Database exists, running migrations...');
      try {
        // Note: No artificial delay needed - SQLite operations via Tauri are sequential
        // and the await ensures previous operations complete before migrations run
        await runMigrations();
        console.log('[DB Init] Migrations complete');
      } catch (error) {
        console.error('[DB Init] Failed to run migrations:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Migration failed: ${errorMessage}`);
      }
    }
    
    // Step 2: Check if we need to migrate from localStorage
    const dbEmpty = await isDatabaseEmpty();
    const hasLocalData = hasLocalStorageData();
    
    if (dbEmpty && hasLocalData) {
      console.log('[DB Init] Database is empty and localStorage has data, migrating...');
      
      const migrationResult = await migrateFromLocalStorage((stage, current, total) => {
        console.log(`[DB Init] Migrating ${stage}: ${current}/${total}`);
        if (onProgress) {
          onProgress(stage, current, total);
        }
      });
      
      if (migrationResult.success) {
        console.log('[DB Init] Migration successful:', migrationResult.migrated);
        
        // Clear localStorage after successful migration
        clearLocalStorageData();
        console.log('[DB Init] localStorage cleared');
        
        return {
          success: true,
          migrated: true,
          migratedCounts: migrationResult.migrated,
        };
      } else {
        console.error('[DB Init] Migration failed:', migrationResult.error);
        return {
          success: false,
          migrated: false,
          error: migrationResult.error,
        };
      }
    }
    
    console.log('[DB Init] Database initialization complete');
    return {
      success: true,
      migrated: false,
    };
  } catch (error) {
    console.error('[DB Init] Initialization failed:', error);
    
    // Extract error message with better handling for various error types
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message || error.toString();
      console.error('[DB Init] Error name:', error.name);
      console.error('[DB Init] Error stack:', error.stack);
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
    console.error('[DB Init] Extracted error message:', errorMessage);
    
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


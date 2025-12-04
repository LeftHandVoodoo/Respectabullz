// Database migrations
// Handles schema initialization and version upgrades

import { query, execute } from './connection';
import { SCHEMA_SQL } from './schema';

// Current schema version - increment when schema changes
const CURRENT_VERSION = 2;

/**
 * Initialize the database schema
 * Creates all tables if they don't exist
 */
export async function initializeDatabase(): Promise<void> {
  console.log('[DB] Initializing database schema...');
  
  try {
    // Import connection to ensure database is loaded
    const { getDatabase } = await import('./connection');
    const database = await getDatabase();
    
    // Execute the schema SQL (creates tables if not exist)
    // Split by semicolon and process each statement
    const statements = SCHEMA_SQL.split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      // Remove leading comment lines from each statement (not the whole statement)
      .map(s => {
        // Split into lines and remove leading comment-only lines
        const lines = s.split('\n');
        while (lines.length > 0 && lines[0].trim().startsWith('--')) {
          lines.shift();
        }
        return lines.join('\n').trim();
      })
      .filter(s => s.length > 0);
    
    console.log(`[DB] Executing ${statements.length} schema statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await database.execute(statement);
        if ((i + 1) % 10 === 0) {
          console.log(`[DB] Progress: ${i + 1}/${statements.length} statements executed`);
        }
      } catch (error) {
        console.error(`[DB] Failed to execute statement ${i + 1}:`, statement.substring(0, 100));
        console.error(`[DB] Error:`, error);
        throw error;
      }
    }
    
    console.log('[DB] Database schema initialized successfully');
  } catch (error) {
    console.error('[DB] Failed to initialize database:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[DB] Error stack:', errorStack);
    throw new Error(`Database initialization failed: ${errorMessage}`);
  }
}

/**
 * Get the current schema version from the database
 */
export async function getSchemaVersion(): Promise<number> {
  try {
    const result = await query<{ version: number }>(
      'SELECT version FROM _schema_version WHERE id = 1'
    );
    return result[0]?.version ?? 0;
  } catch {
    // Table doesn't exist yet
    return 0;
  }
}

/**
 * Update the schema version in the database
 */
async function setSchemaVersion(version: number): Promise<void> {
  const { getDatabase } = await import('./connection');
  const database = await getDatabase();
  await database.execute(
    'UPDATE _schema_version SET version = ?, applied_at = datetime("now") WHERE id = 1',
    [version]
  );
}

/**
 * Run any pending migrations to upgrade the schema
 */
export async function runMigrations(): Promise<void> {
  try {
    const currentVersion = await getSchemaVersion();
    
    if (currentVersion >= CURRENT_VERSION) {
      console.log(`[DB] Schema is up to date (version ${currentVersion})`);
      return;
    }
    
    console.log(`[DB] Migrating from version ${currentVersion} to ${CURRENT_VERSION}...`);
    
    // Run migrations sequentially (each statement auto-commits in SQLite)
    for (let v = currentVersion + 1; v <= CURRENT_VERSION; v++) {
      await applyMigration(v);
    }
    
    await setSchemaVersion(CURRENT_VERSION);
    console.log(`[DB] Migration complete (version ${CURRENT_VERSION})`);
  } catch (error) {
    console.error('[DB] Migration failed:', error);
    throw error;
  }
}

/**
 * Apply a specific migration version
 * Each statement auto-commits in SQLite when not in explicit transaction
 */
async function applyMigration(version: number): Promise<void> {
  console.log(`[DB] Applying migration v${version}...`);
  
  switch (version) {
    case 1:
      // Initial schema - nothing to migrate
      break;
    
    case 2:
      // Migration 2: Add custom expense categories support
      // Create expense_categories table
      await execute(`
        CREATE TABLE IF NOT EXISTS expense_categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          color TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      await execute(`
        CREATE INDEX IF NOT EXISTS idx_expense_categories_name ON expense_categories(name)
      `);
      
      // Check the state of expenses table
      try {
        // Check if expenses table exists
        const expensesExists = await query<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='expenses'"
        );
        
        // Check if expenses_new table exists (from a failed previous migration)
        const expensesNewExists = await query<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='expenses_new'"
        );
        
        if (expensesNewExists.length > 0 && expensesExists.length === 0) {
          // Previous migration dropped expenses but didn't rename expenses_new
          console.log('[DB] Recovering from incomplete migration - renaming expenses_new to expenses...');
          await execute(`ALTER TABLE expenses_new RENAME TO expenses`);
        } else if (expensesExists.length === 0 && expensesNewExists.length === 0) {
          // Neither table exists - create fresh expenses table
          console.log('[DB] Creating expenses table (was missing)...');
          await execute(`
            CREATE TABLE IF NOT EXISTS expenses (
              id TEXT PRIMARY KEY,
              date TEXT NOT NULL,
              amount REAL NOT NULL,
              category TEXT NOT NULL,
              vendor_name TEXT,
              description TEXT,
              payment_method TEXT,
              is_tax_deductible INTEGER NOT NULL DEFAULT 0,
              receipt_path TEXT,
              related_dog_id TEXT REFERENCES dogs(id) ON DELETE SET NULL,
              related_litter_id TEXT REFERENCES litters(id) ON DELETE SET NULL,
              notes TEXT,
              created_at TEXT NOT NULL DEFAULT (datetime('now')),
              updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
          `);
        } else if (expensesExists.length > 0) {
          // Expenses table exists, check if it has CHECK constraint
          const tableInfo = await query<{ sql: string }>(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='expenses'"
          );
          
          const hasCheckConstraint = tableInfo[0]?.sql?.includes('CHECK');
          
          if (hasCheckConstraint) {
            console.log('[DB] Migrating expenses table to remove CHECK constraint...');
            
            // Drop expenses_new if it exists from a previous failed attempt
            await execute(`DROP TABLE IF EXISTS expenses_new`);
            
            // Create new table without CHECK constraint
            await execute(`
              CREATE TABLE expenses_new (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                amount REAL NOT NULL,
                category TEXT NOT NULL,
                vendor_name TEXT,
                description TEXT,
                payment_method TEXT,
                is_tax_deductible INTEGER NOT NULL DEFAULT 0,
                receipt_path TEXT,
                related_dog_id TEXT REFERENCES dogs(id) ON DELETE SET NULL,
                related_litter_id TEXT REFERENCES litters(id) ON DELETE SET NULL,
                notes TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
              )
            `);
            
            // Copy data
            await execute(`
              INSERT INTO expenses_new 
              SELECT * FROM expenses
            `);
            
            // Drop old table
            await execute(`DROP TABLE expenses`);
            
            // Rename new table
            await execute(`ALTER TABLE expenses_new RENAME TO expenses`);
            
            console.log('[DB] Expenses table migrated successfully');
          } else {
            console.log('[DB] Expenses table already migrated, skipping...');
          }
        }
        
        // Ensure indexes exist
        await execute(`
          CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)
        `);
        await execute(`
          CREATE INDEX IF NOT EXISTS idx_expenses_dog ON expenses(related_dog_id)
        `);
        await execute(`
          CREATE INDEX IF NOT EXISTS idx_expenses_litter ON expenses(related_litter_id)
        `);
        
      } catch (error) {
        console.error('[DB] Error checking/migrating expenses table:', error);
        throw error;
      }
      break;
    
    default:
      throw new Error(`Unknown migration version: ${version}`);
  }
}

/**
 * Full database setup: initialize schema and run migrations
 */
export async function setupDatabase(): Promise<void> {
  await initializeDatabase();
  await runMigrations();
}


// Database migrations
// Handles schema initialization and version upgrades

import { query, execute, getDatabase } from './connection';
import { SCHEMA_SQL } from './schema';

// Current schema version - increment when schema changes
const CURRENT_VERSION = 5;

/**
 * Initialize the database schema
 * Creates all tables if they don't exist
 */
export async function initializeDatabase(): Promise<void> {
  console.log('[DB] Initializing database schema...');
  
  try {
    // Get database connection
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
    
    case 3: {
      // Migration 3: Add document management system
      console.log('[DB] Creating document management tables...');
      
      // Create document_tags table
      await execute(`
        CREATE TABLE IF NOT EXISTS document_tags (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          color TEXT,
          is_custom INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      await execute(`
        CREATE INDEX IF NOT EXISTS idx_document_tags_name ON document_tags(name)
      `);
      
      // Create documents table
      await execute(`
        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          filename TEXT NOT NULL,
          original_name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          notes TEXT,
          uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      
      // Create document_tag_links junction table
      await execute(`
        CREATE TABLE IF NOT EXISTS document_tag_links (
          id TEXT PRIMARY KEY,
          document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          tag_id TEXT NOT NULL REFERENCES document_tags(id) ON DELETE CASCADE,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE(document_id, tag_id)
        )
      `);
      await execute(`
        CREATE INDEX IF NOT EXISTS idx_document_tag_links_document ON document_tag_links(document_id)
      `);
      await execute(`
        CREATE INDEX IF NOT EXISTS idx_document_tag_links_tag ON document_tag_links(tag_id)
      `);
      
      // Create dog_documents junction table
      await execute(`
        CREATE TABLE IF NOT EXISTS dog_documents (
          id TEXT PRIMARY KEY,
          dog_id TEXT NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
          document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE(dog_id, document_id)
        )
      `);
      await execute(`
        CREATE INDEX IF NOT EXISTS idx_dog_documents_dog ON dog_documents(dog_id)
      `);
      await execute(`
        CREATE INDEX IF NOT EXISTS idx_dog_documents_document ON dog_documents(document_id)
      `);
      
      // Create litter_documents junction table
      await execute(`
        CREATE TABLE IF NOT EXISTS litter_documents (
          id TEXT PRIMARY KEY,
          litter_id TEXT NOT NULL REFERENCES litters(id) ON DELETE CASCADE,
          document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE(litter_id, document_id)
        )
      `);
      await execute(`
        CREATE INDEX IF NOT EXISTS idx_litter_documents_litter ON litter_documents(litter_id)
      `);
      await execute(`
        CREATE INDEX IF NOT EXISTS idx_litter_documents_document ON litter_documents(document_id)
      `);
      
      // Create expense_documents junction table
      await execute(`
        CREATE TABLE IF NOT EXISTS expense_documents (
          id TEXT PRIMARY KEY,
          expense_id TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
          document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE(expense_id, document_id)
        )
      `);
      await execute(`
        CREATE INDEX IF NOT EXISTS idx_expense_documents_expense ON expense_documents(expense_id)
      `);
      await execute(`
        CREATE INDEX IF NOT EXISTS idx_expense_documents_document ON expense_documents(document_id)
      `);
      
      // Seed predefined document tags
      console.log('[DB] Seeding predefined document tags...');
      const predefinedTags = [
        { name: 'Invoice', color: '#3B82F6' },           // Blue
        { name: 'Receipt', color: '#10B981' },           // Green
        { name: 'Contract', color: '#8B5CF6' },          // Purple
        { name: 'Health Certificate', color: '#EC4899' },// Pink
        { name: 'Registration Papers', color: '#F59E0B' },// Amber
        { name: 'Vet Record', color: '#EF4444' },        // Red
        { name: 'Vaccination Record', color: '#06B6D4' },// Cyan
        { name: 'Genetic Test Results', color: '#84CC16' },// Lime
        { name: 'Microchip Certificate', color: '#6366F1' },// Indigo
        { name: 'Photo/Image', color: '#14B8A6' },       // Teal
        { name: 'Shipping/Transport', color: '#F97316' },// Orange
        { name: 'Insurance', color: '#0EA5E9' },         // Sky
        { name: 'Other', color: '#6B7280' },             // Gray
      ];
      
      for (const tag of predefinedTags) {
        const tagId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        await execute(
          `INSERT OR IGNORE INTO document_tags (id, name, color, is_custom, created_at)
           VALUES (?, ?, ?, 0, datetime('now'))`,
          [tagId, tag.name, tag.color]
        );
      }
      
      console.log('[DB] Document management tables and tags created successfully');
      break;
    }

    case 4: {
      // Migration 4: Add contacts management system
      console.log('[DB] Creating contacts management tables...');

      // Create contact_categories table (predefined + custom categories)
      await execute(`
        CREATE TABLE IF NOT EXISTS contact_categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          color TEXT,
          is_predefined INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      await execute(`
        CREATE INDEX IF NOT EXISTS idx_contact_categories_name ON contact_categories(name)
      `);

      // Create contacts table
      await execute(`
        CREATE TABLE IF NOT EXISTS contacts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone_primary TEXT,
          phone_secondary TEXT,
          email TEXT,
          address_line1 TEXT,
          address_line2 TEXT,
          city TEXT,
          state TEXT,
          postal_code TEXT,
          facebook TEXT,
          instagram TEXT,
          tiktok TEXT,
          twitter TEXT,
          website TEXT,
          notes TEXT,
          business_card_document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      await execute(`
        CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name)
      `);
      await execute(`
        CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email)
      `);

      // Create contact_category_links junction table (many-to-many)
      await execute(`
        CREATE TABLE IF NOT EXISTS contact_category_links (
          id TEXT PRIMARY KEY,
          contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
          category_id TEXT NOT NULL REFERENCES contact_categories(id) ON DELETE CASCADE,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE(contact_id, category_id)
        )
      `);
      await execute(`
        CREATE INDEX IF NOT EXISTS idx_contact_category_links_contact ON contact_category_links(contact_id)
      `);
      await execute(`
        CREATE INDEX IF NOT EXISTS idx_contact_category_links_category ON contact_category_links(category_id)
      `);

      // Seed predefined contact categories
      console.log('[DB] Seeding predefined contact categories...');
      const predefinedCategories = [
        { name: 'Client', color: '#3B82F6' },           // Blue
        { name: 'Shipping Company', color: '#F97316' }, // Orange
        { name: 'Graphic Designer', color: '#8B5CF6' }, // Purple
        { name: 'Breeder', color: '#10B981' },          // Green
        { name: 'Vet', color: '#EF4444' },              // Red
      ];

      for (const cat of predefinedCategories) {
        const catId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        await execute(
          `INSERT OR IGNORE INTO contact_categories (id, name, color, is_predefined, created_at, updated_at)
           VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))`,
          [catId, cat.name, cat.color]
        );
      }

      console.log('[DB] Contacts management tables and categories created successfully');
      break;
    }

    case 5: {
      // Migration 5: Add company_name column to contacts table
      console.log('[DB] Adding company_name column to contacts table...');

      await execute(`
        ALTER TABLE contacts ADD COLUMN company_name TEXT
      `);

      console.log('[DB] Company name column added to contacts table successfully');
      break;
    }

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


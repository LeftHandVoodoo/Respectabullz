// Database module - Re-exports from new SQLite-based modules
// This file maintains backwards compatibility while using the new SQLite backend

// Re-export all database operations from the new modular structure
export * from './db/index';

// Legacy seed/unseed functions - these still use localStorage for now
// TODO: Migrate these to SQLite in a future update

const STORAGE_KEY = 'respectabullz_db';

/**
 * Clear all database data
 */
export async function unseedDatabase(): Promise<void> {
  const { clearDatabase } = await import('./db/legacy');
  await clearDatabase();
  localStorage.removeItem(STORAGE_KEY);
}

// Re-export seedDatabase from legacy
export { seedDatabase, clearDatabase } from './db/legacy';

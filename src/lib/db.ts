// Database module - Re-exports from new SQLite-based modules
// This file maintains backwards compatibility while using the new SQLite backend

// Re-export all database operations from the new modular structure
export * from './db/index';

// Development-only sample data entry point. Deliberately no reset/unseed
// facade is exposed while complete deletion semantics remain withdrawn.
export { seedDatabase } from './db/legacy';

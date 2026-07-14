// Database setup and migrations are owned by one Rust/SQLx transaction.
// tauri-plugin-sql exposes a pooled JavaScript API, so BEGIN/COMMIT issued as
// separate renderer calls would not be a trustworthy transaction boundary.

import { invoke } from '@tauri-apps/api/core';
import { getDatabase, query } from './connection';
import { logger } from '../errorTracking';

export const CURRENT_VERSION = 5;

interface MigrationReport {
  fromVersion: number;
  toVersion: number;
  appliedVersions: number[];
  foreignKeysVerified: boolean;
}

interface DocumentReconciliationReport {
  scanned: number;
  restored: number;
  removedStaging: number;
  removedTombstones: number;
  quarantinedOrphans: number;
  failures: number;
  truncated: boolean;
}

let setupPromise: Promise<void> | null = null;

/**
 * Get the current schema version from the database.
 */
export async function getSchemaVersion(): Promise<number> {
  try {
    const result = await query<{ version: number }>(
      'SELECT version FROM _schema_version WHERE id = 1'
    );
    return result[0]?.version ?? 0;
  } catch {
    return 0;
  }
}

async function runIntegritySetup(): Promise<void> {
  // Ensure the SQL plugin has loaded the pool before the Rust command reads it.
  await getDatabase();

  const report = await invoke<MigrationReport>('setup_integrity_database');
  logger.info('Database integrity setup complete', {
    fromVersion: report.fromVersion,
    toVersion: report.toVersion,
    appliedVersions: report.appliedVersions,
    foreignKeysVerified: report.foreignKeysVerified,
  });

  const reconciliation = await invoke<DocumentReconciliationReport>('reconcile_document_storage');
  logger.info('Document storage reconciliation complete', {
    scanned: reconciliation.scanned,
    restored: reconciliation.restored,
    removedStaging: reconciliation.removedStaging,
    removedTombstones: reconciliation.removedTombstones,
    quarantinedOrphans: reconciliation.quarantinedOrphans,
    failures: reconciliation.failures,
    truncated: reconciliation.truncated,
  });
  if (reconciliation.truncated) {
    logger.warn('Document storage reconciliation reached its startup scan limit', {
      scanned: reconciliation.scanned,
      failures: reconciliation.failures,
    });
  }
  if (reconciliation.failures > 0) {
    throw new Error(
      `Document storage reconciliation is incomplete (${reconciliation.failures} failures). Recoverable residues were preserved.`
    );
  }
}

function ensureIntegritySetup(): Promise<void> {
  if (!setupPromise) {
    setupPromise = runIntegritySetup().catch((error) => {
      setupPromise = null;
      throw error;
    });
  }
  return setupPromise;
}

/**
 * Initialize a fresh schema or migrate the declared supported baseline.
 */
export async function initializeDatabase(): Promise<void> {
  await ensureIntegritySetup();
}

/**
 * Run the integrity-owned migration path for an existing database.
 */
export async function runMigrations(): Promise<void> {
  await ensureIntegritySetup();
}

/**
 * Full database setup entry point used at application startup.
 */
export async function setupDatabase(): Promise<void> {
  await ensureIntegritySetup();
}

import { logger } from '@/lib/errorTracking';

const LEGACY_STORAGE_KEY = 'respectabullz_db';

/**
 * Detects the browser-storage database used by pre-SQLite builds.
 *
 * The automatic importer has been withdrawn because its multi-table writes were
 * not atomic. Detection is deliberately read-only and fails closed: when the
 * browser storage cannot be inspected, startup must not continue as though no
 * legacy data exists.
 */
export function hasLegacyLocalStoragePayload(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(LEGACY_STORAGE_KEY) !== null;
  } catch (error) {
    logger.warn('Could not inspect legacy browser storage; blocking startup safely', {
      error: error instanceof Error ? error.message : String(error),
    });
    return true;
  }
}

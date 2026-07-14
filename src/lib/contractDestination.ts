const SESSION_CONTRACTS_DIRECTORY_KEY =
  'respectabullz_session_contracts_directory';

/**
 * Custom contract destinations are intentionally session-scoped because native
 * dialog filesystem grants do not survive an application restart.
 */
export function getSessionContractsDirectory(): string {
  if (typeof sessionStorage === 'undefined') return '';
  return sessionStorage.getItem(SESSION_CONTRACTS_DIRECTORY_KEY) ?? '';
}

export function setSessionContractsDirectory(path: string): void {
  if (typeof sessionStorage === 'undefined') return;
  const normalized = path.trim();
  if (!normalized || normalized.includes('\0')) {
    throw new Error('The selected contracts directory is invalid.');
  }
  sessionStorage.setItem(SESSION_CONTRACTS_DIRECTORY_KEY, normalized);
}

export function clearSessionContractsDirectory(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(SESSION_CONTRACTS_DIRECTORY_KEY);
}

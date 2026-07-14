import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  setupDatabase: vi.fn(),
  runMigrations: vi.fn(),
  isDatabaseInitialized: vi.fn(),
  hasLegacyLocalStoragePayload: vi.fn(),
}));

vi.mock('../migrations', () => ({
  setupDatabase: mocks.setupDatabase,
  runMigrations: mocks.runMigrations,
}));

vi.mock('../connection', () => ({
  isDatabaseInitialized: mocks.isDatabaseInitialized,
}));

vi.mock('../legacyStorage', () => ({
  hasLegacyLocalStoragePayload: mocks.hasLegacyLocalStoragePayload,
}));

vi.mock('@/lib/errorTracking', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { initializeAppDatabase } from '../init';

describe('database startup containment', () => {
  beforeEach(() => {
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    mocks.setupDatabase.mockReset().mockResolvedValue(undefined);
    mocks.runMigrations.mockReset().mockResolvedValue(undefined);
    mocks.isDatabaseInitialized.mockReset().mockResolvedValue(false);
    mocks.hasLegacyLocalStoragePayload.mockReset().mockReturnValue(false);
  });

  afterEach(() => {
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  });

  it('blocks before any SQLite write when legacy browser data is detected', async () => {
    mocks.hasLegacyLocalStoragePayload.mockReturnValue(true);

    const result = await initializeAppDatabase();

    expect(result).toEqual({
      success: false,
      migrated: false,
      error:
        'Legacy browser-storage data was detected. Automatic import is withdrawn because it is not transactional. Preserve this browser profile; no legacy data was changed.',
    });
    expect(mocks.isDatabaseInitialized).not.toHaveBeenCalled();
    expect(mocks.setupDatabase).not.toHaveBeenCalled();
    expect(mocks.runMigrations).not.toHaveBeenCalled();
  });

  it('continues normal schema setup when no legacy payload exists', async () => {
    await expect(initializeAppDatabase()).resolves.toEqual({
      success: true,
      migrated: false,
    });

    expect(mocks.isDatabaseInitialized).toHaveBeenCalledOnce();
    expect(mocks.setupDatabase).toHaveBeenCalledOnce();
    expect(mocks.runMigrations).not.toHaveBeenCalled();
  });
});

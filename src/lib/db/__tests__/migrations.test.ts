import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { getDatabase } from '@/lib/db/connection';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@/lib/db/connection', () => ({
  getDatabase: vi.fn(),
  query: vi.fn(),
}));

vi.mock('@/lib/errorTracking', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

const mockInvoke = vi.mocked(invoke);
const mockGetDatabase = vi.mocked(getDatabase);

describe('database startup document reconciliation', () => {
  beforeEach(() => {
    vi.resetModules();
    mockInvoke.mockReset();
    mockGetDatabase.mockReset().mockResolvedValue({} as Awaited<ReturnType<typeof getDatabase>>);
  });

  it('runs bounded document reconciliation after database integrity setup', async () => {
    mockInvoke.mockImplementation(async (command) => {
      if (command === 'setup_integrity_database') {
        return {
          fromVersion: 5,
          toVersion: 5,
          appliedVersions: [],
          foreignKeysVerified: true,
        };
      }
      if (command === 'reconcile_document_storage') {
        return {
          scanned: 3,
          restored: 1,
          removedStaging: 1,
          removedTombstones: 0,
          quarantinedOrphans: 1,
          failures: 0,
          truncated: false,
        };
      }
      throw new Error(`Unexpected command: ${command}`);
    });
    const { setupDatabase } = await import('@/lib/db/migrations');

    await setupDatabase();

    expect(mockInvoke.mock.calls.map(([command]) => command)).toEqual([
      'setup_integrity_database',
      'reconcile_document_storage',
    ]);
  });

  it('blocks startup while recoverable residues remain', async () => {
    mockInvoke.mockImplementation(async (command) => {
      if (command === 'setup_integrity_database') {
        return {
          fromVersion: 5,
          toVersion: 5,
          appliedVersions: [],
          foreignKeysVerified: true,
        };
      }
      return {
        scanned: 1,
        restored: 0,
        removedStaging: 0,
        removedTombstones: 0,
        quarantinedOrphans: 0,
        failures: 1,
        truncated: false,
      };
    });
    const { setupDatabase } = await import('@/lib/db/migrations');

    await expect(setupDatabase()).rejects.toThrow('Recoverable residues were preserved');
  });

  it('allows startup with an explicit warning when the bounded scan is truncated', async () => {
    mockInvoke.mockImplementation(async (command) => {
      if (command === 'setup_integrity_database') {
        return {
          fromVersion: 5,
          toVersion: 5,
          appliedVersions: [],
          foreignKeysVerified: true,
        };
      }
      return {
        scanned: 10_000,
        restored: 0,
        removedStaging: 0,
        removedTombstones: 0,
        quarantinedOrphans: 0,
        failures: 0,
        truncated: true,
      };
    });
    const { setupDatabase } = await import('@/lib/db/migrations');

    await expect(setupDatabase()).resolves.toBeUndefined();
  });
});

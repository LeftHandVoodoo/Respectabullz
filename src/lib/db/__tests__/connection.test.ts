import { invoke } from '@tauri-apps/api/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@/lib/errorTracking', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const invokeMock = vi.mocked(invoke);

describe('native database connection boundary', () => {
  beforeEach(() => {
    vi.resetModules();
    invokeMock.mockReset();
  });

  it('verifies the native boundary once for concurrent callers', async () => {
    invokeMock.mockResolvedValue([{ test: 1 }]);

    const { getDatabase } = await import('../connection');
    const [first, second] = await Promise.all([getDatabase(), getDatabase()]);

    expect(first).toBe(second);
    expect(invokeMock).toHaveBeenCalledOnce();
    expect(invokeMock).toHaveBeenCalledWith('database_select', {
      sql: 'SELECT 1 as test',
      params: [],
    });
  });

  it('routes reads and writes through the constrained Rust commands', async () => {
    invokeMock
      .mockResolvedValueOnce([{ test: 1 }])
      .mockResolvedValueOnce([{ id: 'dog-1' }])
      .mockResolvedValueOnce({ lastInsertId: 7, rowsAffected: 1 });

    const { query, execute } = await import('../connection');
    await expect(query('SELECT id FROM dogs WHERE id = ?', ['dog-1'])).resolves.toEqual([
      { id: 'dog-1' },
    ]);
    await expect(
      execute('UPDATE dogs SET name = ? WHERE id = ?', ['Nova', 'dog-1'])
    ).resolves.toEqual({ lastInsertId: 7, rowsAffected: 1 });

    expect(invokeMock).toHaveBeenNthCalledWith(2, 'database_select', {
      sql: 'SELECT id FROM dogs WHERE id = ?',
      params: ['dog-1'],
    });
    expect(invokeMock).toHaveBeenNthCalledWith(3, 'database_execute', {
      sql: 'UPDATE dogs SET name = ? WHERE id = ?',
      params: ['Nova', 'dog-1'],
    });
  });

  it('does not expose native database details in the renderer error', async () => {
    invokeMock.mockRejectedValue(
      new Error('C:\\Users\\person\\AppData\\respectabullz.db is locked')
    );

    const { getDatabase } = await import('../connection');
    const failure = getDatabase();

    await expect(failure).rejects.toThrow(
      'Database connection failed. Please restart Respectabullz and try again.'
    );
    await expect(failure).rejects.not.toThrow('person');
  });
});

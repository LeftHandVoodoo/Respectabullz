import Database from '@tauri-apps/plugin-sql';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/errorTracking', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const getMock = vi.mocked(Database.get);

describe('fixed database connection boundary', () => {
  beforeEach(() => {
    vi.resetModules();
    getMock.mockReset();
  });

  it('retrieves and verifies only the fixed preloaded pool', async () => {
    const select = vi.fn().mockResolvedValue([{ test: 1 }]);
    const database = { select } as unknown as Database;
    getMock.mockReturnValue(database);

    const { getDatabase } = await import('../connection');
    const [first, second] = await Promise.all([getDatabase(), getDatabase()]);

    expect(first).toBe(database);
    expect(second).toBe(database);
    expect(getMock).toHaveBeenCalledOnce();
    expect(getMock).toHaveBeenCalledWith('sqlite:respectabullz.db');
    expect(select).toHaveBeenCalledOnce();
    expect(select).toHaveBeenCalledWith('SELECT 1 as test');
  });

  it('fails closed when Rust did not preload the pool', async () => {
    const database = {
      select: vi.fn().mockRejectedValue(new Error('Database not loaded')),
    } as unknown as Database;
    getMock.mockReturnValue(database);

    const { getDatabase } = await import('../connection');

    await expect(getDatabase()).rejects.toThrow(
      'Please ensure Tauri is running and the fixed SQL pool was preloaded.'
    );
  });
});

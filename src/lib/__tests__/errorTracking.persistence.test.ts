import { beforeEach, describe, expect, it, vi } from 'vitest';

const persistenceMocks = vi.hoisted(() => ({
  atomicWriteFile: vi.fn(),
  exists: vi.fn().mockResolvedValue(true),
  mkdir: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockRejectedValue(new Error('missing')),
}));

vi.mock('@/lib/fsUtils', () => ({
  atomicWriteFile: persistenceMocks.atomicWriteFile,
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  BaseDirectory: { AppData: 22 },
  exists: persistenceMocks.exists,
  mkdir: persistenceMocks.mkdir,
  readFile: persistenceMocks.readFile,
}));

describe('log persistence serialization', () => {
  beforeEach(() => {
    vi.resetModules();
    persistenceMocks.atomicWriteFile.mockReset();
    persistenceMocks.exists.mockResolvedValue(true);
    persistenceMocks.mkdir.mockResolvedValue(undefined);
    persistenceMocks.readFile.mockRejectedValue(new Error('missing'));
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
  });

  it('makes a user clear win over an in-flight flush', async () => {
    let finishFirstWrite: (() => void) | undefined;
    persistenceMocks.atomicWriteFile
      .mockImplementationOnce(
        () => new Promise<void>((resolve) => {
          finishFirstWrite = resolve;
        }),
      )
      .mockResolvedValueOnce(undefined);

    const { clearLogFile, logger } = await import('../errorTracking');
    logger.info('old queued entry');
    const flush = logger.flush();

    await vi.waitFor(() => {
      expect(persistenceMocks.atomicWriteFile).toHaveBeenCalledTimes(1);
    });
    const clear = clearLogFile();
    expect(persistenceMocks.atomicWriteFile).toHaveBeenCalledTimes(1);

    finishFirstWrite?.();
    await expect(flush).resolves.toBeUndefined();
    await expect(clear).resolves.toBe(true);

    expect(persistenceMocks.atomicWriteFile).toHaveBeenCalledTimes(2);
    const finalContents = persistenceMocks.atomicWriteFile.mock.calls[1][1];
    expect(finalContents).toContain('Log file cleared');
    expect(finalContents).not.toContain('old queued entry');
  });
});

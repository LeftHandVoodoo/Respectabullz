import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseDirectory, remove, rename, writeFile } from '@tauri-apps/plugin-fs';
import { atomicWriteFile, atomicWriteFileAbsolute } from '@/lib/fsUtils';

vi.mock('@tauri-apps/plugin-fs', () => ({
  BaseDirectory: { AppData: 26 },
  writeFile: vi.fn(),
  rename: vi.fn(),
  remove: vi.fn(),
}));

const mockWriteFile = vi.mocked(writeFile);
const mockRename = vi.mocked(rename);
const mockRemove = vi.mocked(remove);

describe('atomic file writes', () => {
  beforeEach(() => {
    mockWriteFile.mockReset().mockResolvedValue(undefined);
    mockRename.mockReset().mockResolvedValue(undefined);
    mockRemove.mockReset().mockResolvedValue(undefined);
  });

  it('uses distinct temporary files for concurrent writes to one target', async () => {
    await Promise.all([
      atomicWriteFile('logs/app.log', 'first', { baseDir: BaseDirectory.AppData }),
      atomicWriteFile('logs/app.log', 'second', { baseDir: BaseDirectory.AppData }),
    ]);

    const firstTemp = mockWriteFile.mock.calls[0][0];
    const secondTemp = mockWriteFile.mock.calls[1][0];
    expect(firstTemp).not.toBe(secondTemp);
    expect(firstTemp).toMatch(/^logs\/app\.log\.tmp-/);
    expect(secondTemp).toMatch(/^logs\/app\.log\.tmp-/);
    expect(mockRename).toHaveBeenCalledWith(firstTemp, 'logs/app.log', {
      oldPathBaseDir: BaseDirectory.AppData,
      newPathBaseDir: BaseDirectory.AppData,
    });
    expect(mockRename).toHaveBeenCalledWith(secondTemp, 'logs/app.log', {
      oldPathBaseDir: BaseDirectory.AppData,
      newPathBaseDir: BaseDirectory.AppData,
    });
  });

  it('removes only its unique temporary file when rename fails', async () => {
    mockRename.mockRejectedValueOnce(new Error('rename failed'));

    await expect(
      atomicWriteFile('logs/app.log', 'data', { baseDir: BaseDirectory.AppData })
    ).rejects.toThrow('rename failed');

    const tempPath = mockWriteFile.mock.calls[0][0];
    expect(mockRemove).toHaveBeenCalledWith(tempPath, { baseDir: BaseDirectory.AppData });
  });

  it('also uses a unique adjacent temporary name for absolute writes', async () => {
    await atomicWriteFileAbsolute('C:\\exports\\report.zip', new Uint8Array([1, 2, 3]));

    const tempPath = mockWriteFile.mock.calls[0][0];
    expect(tempPath).toMatch(/^C:\\exports\\report\.zip\.tmp-/);
    expect(mockRename).toHaveBeenCalledWith(tempPath, 'C:\\exports\\report.zip');
  });
});

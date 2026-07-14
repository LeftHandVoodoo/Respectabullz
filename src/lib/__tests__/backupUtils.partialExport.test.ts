import { beforeEach, describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';

const exportMocks = vi.hoisted(() => ({
  save: vi.fn(),
  writeFile: vi.fn(),
  exists: vi.fn(),
  readDir: vi.fn(),
  readFile: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: exportMocks.save,
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  BaseDirectory: { AppData: 22 },
  exists: exportMocks.exists,
  readDir: exportMocks.readDir,
  readFile: exportMocks.readFile,
  writeFile: exportMocks.writeFile,
}));

describe('partial ZIP export', () => {
  beforeEach(() => {
    exportMocks.save.mockReset().mockResolvedValue('C:\\Exports\\respectabullz-partial.zip');
    exportMocks.writeFile.mockReset().mockResolvedValue(undefined);
    exportMocks.exists.mockReset().mockResolvedValue(false);
    exportMocks.readDir.mockReset();
    exportMocks.readFile.mockReset();
  });

  it('writes only to the exact path granted by the native save dialog', async () => {
    const { exportPartialDataWithPhotos } = await import('../backupUtils');

    await expect(exportPartialDataWithPhotos('{"dogs":[]}')).resolves.toBe(true);

    expect(exportMocks.writeFile).toHaveBeenCalledOnce();
    expect(exportMocks.writeFile.mock.calls[0][0]).toBe(
      'C:\\Exports\\respectabullz-partial.zip',
    );
    expect(exportMocks.writeFile.mock.calls[0][1]).toBeInstanceOf(Uint8Array);
  });

  it('aborts before the save dialog when the photo directory cannot be enumerated', async () => {
    exportMocks.exists.mockResolvedValue(true);
    exportMocks.readDir.mockRejectedValue(new Error('directory unavailable'));
    const { exportPartialDataWithPhotos } = await import('../backupUtils');

    await expect(exportPartialDataWithPhotos('{"dogs":[]}')).rejects.toThrow(
      'Could not enumerate managed photos',
    );

    expect(exportMocks.save).not.toHaveBeenCalled();
    expect(exportMocks.writeFile).not.toHaveBeenCalled();
  });

  it('aborts rather than silently omitting an unreadable managed photo', async () => {
    exportMocks.exists.mockResolvedValue(true);
    exportMocks.readDir.mockResolvedValue([{ isFile: true, name: 'dog.jpg' }]);
    exportMocks.readFile.mockRejectedValue(new Error('read denied'));
    const { exportPartialDataWithPhotos } = await import('../backupUtils');

    await expect(exportPartialDataWithPhotos('{"dogs":[]}')).rejects.toThrow(
      'Could not read managed photo dog.jpg',
    );

    expect(exportMocks.save).not.toHaveBeenCalled();
    expect(exportMocks.writeFile).not.toHaveBeenCalled();
  });

  it('records the exact included-photo count in the ZIP metadata', async () => {
    exportMocks.exists.mockResolvedValue(true);
    exportMocks.readDir.mockResolvedValue([{ isFile: true, name: 'dog.jpg' }]);
    exportMocks.readFile.mockResolvedValue(new Uint8Array([0xff, 0xd8, 0xff]));
    const { exportPartialDataWithPhotos } = await import('../backupUtils');

    await expect(exportPartialDataWithPhotos('{"dogs":[]}')).resolves.toBe(true);

    const archive = await JSZip.loadAsync(exportMocks.writeFile.mock.calls[0][1]);
    const metadata = JSON.parse(await archive.file('metadata.json')!.async('string'));
    expect(metadata.photoCount).toBe(1);
    await expect(archive.file('photos/dog.jpg')!.async('uint8array')).resolves.toEqual(
      new Uint8Array([0xff, 0xd8, 0xff]),
    );
  });
});

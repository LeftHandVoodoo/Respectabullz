import { beforeEach, describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';
import { PHOTO_LIMITS } from '../photoValidation';

const DOG_PHOTO = '550e8400-e29b-41d4-a716-446655440000.png';
const REFERENCED_PHOTO = '550e8400-e29b-41d4-a716-446655440001.png';

function managedFilename(index: number): string {
  return `00000000-0000-4000-8000-${index.toString(16).padStart(12, '0')}.png`;
}

const exportMocks = vi.hoisted(() => ({
  save: vi.fn(),
  writeFile: vi.fn(),
  stat: vi.fn(),
  readFile: vi.fn(),
  query: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: exportMocks.save,
  open: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  BaseDirectory: { AppData: 22 },
  exists: vi.fn(),
  mkdir: vi.fn(),
  remove: vi.fn(),
  stat: exportMocks.stat,
  readFile: exportMocks.readFile,
  writeFile: exportMocks.writeFile,
}));

vi.mock('@/lib/db/connection', () => ({
  query: exportMocks.query,
}));

function validPng(width = 1, height = 1): Uint8Array {
  const bytes = new Uint8Array(45);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes[11] = 13;
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  bytes.set([8, 6, 0, 0, 0], 24);
  bytes.set([0x49, 0x45, 0x4e, 0x44], 37);
  return bytes;
}

describe('partial ZIP export', () => {
  const image = validPng();

  beforeEach(() => {
    exportMocks.save.mockReset().mockResolvedValue('C:\\Exports\\respectabullz-partial.zip');
    exportMocks.writeFile.mockReset().mockResolvedValue(undefined);
    exportMocks.query.mockReset().mockResolvedValue([]);
    exportMocks.stat.mockReset().mockResolvedValue({ isFile: true, size: image.byteLength });
    exportMocks.readFile.mockReset().mockResolvedValue(image);
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

  it('aborts before the save dialog when database photo references cannot be read', async () => {
    exportMocks.query.mockRejectedValue(new Error('database unavailable'));
    const { exportPartialDataWithPhotos } = await import('../backupUtils');

    await expect(exportPartialDataWithPhotos('{"dogs":[]}')).rejects.toThrow(
      'database unavailable',
    );

    expect(exportMocks.save).not.toHaveBeenCalled();
    expect(exportMocks.writeFile).not.toHaveBeenCalled();
  });

  it('aborts rather than silently omitting an unreadable referenced photo', async () => {
    exportMocks.query.mockResolvedValue([{ filename: DOG_PHOTO }]);
    exportMocks.readFile.mockRejectedValue(new Error('read denied'));
    const { exportPartialDataWithPhotos } = await import('../backupUtils');

    await expect(exportPartialDataWithPhotos('{"dogs":[]}')).rejects.toThrow(
      `Could not read managed photo ${DOG_PHOTO}`,
    );

    expect(exportMocks.save).not.toHaveBeenCalled();
    expect(exportMocks.writeFile).not.toHaveBeenCalled();
  });

  it('exports only validated database references and never directory orphans', async () => {
    exportMocks.query.mockResolvedValue([{ filename: REFERENCED_PHOTO }]);
    const { exportPartialDataWithPhotos } = await import('../backupUtils');

    await expect(exportPartialDataWithPhotos('{"dogs":[]}')).resolves.toBe(true);

    const archive = await JSZip.loadAsync(exportMocks.writeFile.mock.calls[0][1]);
    const metadata = JSON.parse(await archive.file('metadata.json')!.async('string'));
    expect(metadata.photoCount).toBe(1);
    expect(archive.file(`photos/${REFERENCED_PHOTO}`)).not.toBeNull();
    expect(archive.file('photos/orphan.png')).toBeNull();
    expect(exportMocks.readFile).toHaveBeenCalledWith(`photos/${REFERENCED_PHOTO}`, { baseDir: 22 });
  });

  it('rejects an invalid image signature before opening the save dialog', async () => {
    exportMocks.query.mockResolvedValue([{ filename: DOG_PHOTO }]);
    exportMocks.stat.mockResolvedValue({ isFile: true, size: 4 });
    exportMocks.readFile.mockResolvedValue(new Uint8Array([1, 2, 3, 4]));
    const { exportPartialDataWithPhotos } = await import('../backupUtils');

    await expect(exportPartialDataWithPhotos('{"dogs":[]}')).rejects.toThrow(
      'File signature is not a supported image format',
    );
    expect(exportMocks.save).not.toHaveBeenCalled();
  });

  it('rejects a photo over the per-file limit before reading it', async () => {
    exportMocks.query.mockResolvedValue([{ filename: DOG_PHOTO }]);
    exportMocks.stat.mockResolvedValue({
      isFile: true,
      size: PHOTO_LIMITS.maxFileBytes + 1,
    });
    const { exportPartialDataWithPhotos } = await import('../backupUtils');

    await expect(exportPartialDataWithPhotos('{"dogs":[]}')).rejects.toThrow('20 MB photo limit');
    expect(exportMocks.readFile).not.toHaveBeenCalled();
    expect(exportMocks.save).not.toHaveBeenCalled();
  });

  it('rejects an excessive referenced-photo count before filesystem reads', async () => {
    exportMocks.query.mockResolvedValue(
      Array.from({ length: PHOTO_LIMITS.maxExportCount + 1 }, (_, index) => ({
        filename: managedFilename(index),
      })),
    );
    const { exportPartialDataWithPhotos } = await import('../backupUtils');

    await expect(exportPartialDataWithPhotos('{"dogs":[]}')).rejects.toThrow(
      `${PHOTO_LIMITS.maxExportCount} referenced photos`,
    );
    expect(exportMocks.stat).not.toHaveBeenCalled();
    expect(exportMocks.readFile).not.toHaveBeenCalled();
  });

  it('rejects an excessive aggregate size before reading photo contents', async () => {
    const photoCount = Math.floor(PHOTO_LIMITS.maxExportBytes / PHOTO_LIMITS.maxFileBytes) + 1;
    exportMocks.query.mockResolvedValue(
      Array.from({ length: photoCount }, (_, index) => ({ filename: managedFilename(index) })),
    );
    exportMocks.stat.mockResolvedValue({
      isFile: true,
      size: PHOTO_LIMITS.maxFileBytes,
    });
    const { exportPartialDataWithPhotos } = await import('../backupUtils');

    await expect(exportPartialDataWithPhotos('{"dogs":[]}')).rejects.toThrow(
      '128 MB partial-export limit',
    );
    expect(exportMocks.readFile).not.toHaveBeenCalled();
    expect(exportMocks.save).not.toHaveBeenCalled();
  });

  it('uses file metadata rather than full reads for the export summary', async () => {
    exportMocks.query.mockResolvedValue([{ filename: DOG_PHOTO }]);
    exportMocks.stat.mockResolvedValue({ isFile: true, size: 1024 });
    const { getPartialExportInfo } = await import('../backupUtils');

    await expect(getPartialExportInfo()).resolves.toEqual({ photoCount: 1, photosSize: 1024 });
    expect(exportMocks.readFile).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const cleanupMocks = vi.hoisted(() => ({
  query: vi.fn(),
  execute: vi.fn(),
  deleteManagedPhotoIfUnreferenced: vi.fn(),
}));

vi.mock('../connection', () => ({
  query: cleanupMocks.query,
  execute: cleanupMocks.execute,
}));

vi.mock('@/lib/photoStorage', () => ({
  deleteManagedPhotoIfUnreferenced: cleanupMocks.deleteManagedPhotoIfUnreferenced,
}));

import { deleteDog, deleteDogPhoto } from '../dogs';
import { deleteLitter, deleteLitterPhoto } from '../litters';

const SHARED_PHOTO = '550e8400-e29b-41d4-a716-446655440000.png';
const DOG_GALLERY_PHOTO = '550e8400-e29b-41d4-a716-446655440001.png';
const LITTER_PHOTO = '550e8400-e29b-41d4-a716-446655440002.png';

const dogPhotoRow = {
  id: 'dog-photo-1',
  dog_id: 'dog-1',
  file_path: SHARED_PHOTO,
  caption: null,
  is_primary: 0,
  uploaded_at: '2026-08-22T12:00:00.000Z',
};

const litterPhotoRow = {
  id: 'litter-photo-1',
  litter_id: 'litter-1',
  file_path: LITTER_PHOTO,
  caption: null,
  sort_order: 0,
  uploaded_at: '2026-08-22T12:00:00.000Z',
};

describe('photo record cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanupMocks.execute.mockResolvedValue({ rowsAffected: 1, lastInsertId: 0 });
    cleanupMocks.deleteManagedPhotoIfUnreferenced.mockResolvedValue('deleted');
  });

  it('deletes a litter photo record before removing its now-unreferenced file', async () => {
    cleanupMocks.query.mockResolvedValue([litterPhotoRow]);

    await expect(deleteLitterPhoto('litter-photo-1')).resolves.toBe(true);

    expect(cleanupMocks.execute).toHaveBeenCalledWith(
      'DELETE FROM litter_photos WHERE id = ?',
      ['litter-photo-1'],
    );
    expect(cleanupMocks.deleteManagedPhotoIfUnreferenced).toHaveBeenCalledWith(LITTER_PHOTO);
    expect(cleanupMocks.execute.mock.invocationCallOrder[0]).toBeLessThan(
      cleanupMocks.deleteManagedPhotoIfUnreferenced.mock.invocationCallOrder[0],
    );
  });

  it('does not touch storage when the litter photo record does not exist', async () => {
    cleanupMocks.query.mockResolvedValue([]);

    await expect(deleteLitterPhoto('missing')).resolves.toBe(false);

    expect(cleanupMocks.execute).not.toHaveBeenCalled();
    expect(cleanupMocks.deleteManagedPhotoIfUnreferenced).not.toHaveBeenCalled();
  });

  it('deletes a dog gallery record before attempting reference-safe cleanup', async () => {
    cleanupMocks.query.mockResolvedValue([dogPhotoRow]);
    cleanupMocks.deleteManagedPhotoIfUnreferenced.mockResolvedValue('referenced');

    await expect(deleteDogPhoto('dog-photo-1')).resolves.toBe(true);

    expect(cleanupMocks.execute).toHaveBeenCalledWith(
      'DELETE FROM dog_photos WHERE id = ?',
      ['dog-photo-1'],
    );
    expect(cleanupMocks.deleteManagedPhotoIfUnreferenced).toHaveBeenCalledWith(SHARED_PHOTO);
  });

  it('collects distinct dog profile and gallery photos before deleting the parent', async () => {
    cleanupMocks.query.mockResolvedValue([
      { filename: SHARED_PHOTO },
      { filename: DOG_GALLERY_PHOTO },
      { filename: SHARED_PHOTO },
      { filename: 'CON.png' },
    ]);

    await expect(deleteDog('dog-1')).resolves.toBe(true);

    expect(cleanupMocks.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT profile_photo_path AS filename FROM dogs'),
      ['dog-1', 'dog-1'],
    );
    expect(cleanupMocks.execute).toHaveBeenCalledWith('DELETE FROM dogs WHERE id = ?', ['dog-1']);
    expect(cleanupMocks.deleteManagedPhotoIfUnreferenced).toHaveBeenCalledTimes(2);
    expect(cleanupMocks.deleteManagedPhotoIfUnreferenced).toHaveBeenNthCalledWith(1, SHARED_PHOTO);
    expect(cleanupMocks.deleteManagedPhotoIfUnreferenced).toHaveBeenNthCalledWith(2, DOG_GALLERY_PHOTO);
    expect(cleanupMocks.execute.mock.invocationCallOrder[0]).toBeLessThan(
      cleanupMocks.deleteManagedPhotoIfUnreferenced.mock.invocationCallOrder[0],
    );
  });

  it('keeps a parent photo when another record still references it', async () => {
    cleanupMocks.query.mockResolvedValue([{ filename: SHARED_PHOTO }]);
    cleanupMocks.deleteManagedPhotoIfUnreferenced.mockResolvedValue('referenced');

    await expect(deleteDog('dog-1')).resolves.toBe(true);

    expect(cleanupMocks.deleteManagedPhotoIfUnreferenced).toHaveBeenCalledWith(SHARED_PHOTO);
  });

  it('reports parent cleanup failures while preserving successful database deletion', async () => {
    cleanupMocks.query.mockResolvedValue([
      { filename: SHARED_PHOTO },
      { filename: DOG_GALLERY_PHOTO },
    ]);
    cleanupMocks.deleteManagedPhotoIfUnreferenced
      .mockRejectedValueOnce(new Error('file locked'))
      .mockResolvedValueOnce('deleted');

    await expect(deleteDog('dog-1')).resolves.toEqual({
      deleted: true,
      photoCleanupFailures: [SHARED_PHOTO],
    });
    expect(cleanupMocks.deleteManagedPhotoIfUnreferenced).toHaveBeenCalledTimes(2);
    expect(cleanupMocks.execute).toHaveBeenCalledWith('DELETE FROM dogs WHERE id = ?', ['dog-1']);
  });

  it('collects and cleans litter photos only after the litter delete succeeds', async () => {
    cleanupMocks.query.mockResolvedValue([
      { filename: LITTER_PHOTO },
      { filename: LITTER_PHOTO },
    ]);

    await expect(deleteLitter('litter-1')).resolves.toBe(true);

    expect(cleanupMocks.query).toHaveBeenCalledWith(
      'SELECT file_path AS filename FROM litter_photos WHERE litter_id = ?',
      ['litter-1'],
    );
    expect(cleanupMocks.execute).toHaveBeenNthCalledWith(
      1,
      'UPDATE dogs SET litter_id = NULL WHERE litter_id = ?',
      ['litter-1'],
    );
    expect(cleanupMocks.execute).toHaveBeenNthCalledWith(
      2,
      'DELETE FROM litters WHERE id = ?',
      ['litter-1'],
    );
    expect(cleanupMocks.deleteManagedPhotoIfUnreferenced).toHaveBeenCalledOnce();
    expect(cleanupMocks.deleteManagedPhotoIfUnreferenced).toHaveBeenCalledWith(LITTER_PHOTO);
  });

  it('does not clean litter photos when the parent delete affects no row', async () => {
    cleanupMocks.query.mockResolvedValue([{ filename: LITTER_PHOTO }]);
    cleanupMocks.execute
      .mockResolvedValueOnce({ rowsAffected: 1, lastInsertId: 0 })
      .mockResolvedValueOnce({ rowsAffected: 0, lastInsertId: 0 });

    await expect(deleteLitter('missing')).resolves.toBe(false);

    expect(cleanupMocks.deleteManagedPhotoIfUnreferenced).not.toHaveBeenCalled();
  });
});

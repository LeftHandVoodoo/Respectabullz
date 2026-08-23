import { BaseDirectory, exists, remove } from '@tauri-apps/plugin-fs';
import { query } from '@/lib/db/connection';
import { logger } from '@/lib/errorTracking';
import { clearPhotoUrlCache, getPhotoPath } from '@/lib/photoUtils';
import { isValidManagedPhotoFilename } from '@/lib/photoValidation';

interface PhotoReferenceRow {
  filename: string | null;
}

interface PhotoReferenceCountRow {
  reference_count: number | string;
}

const REFERENCED_PHOTO_SQL = `
  SELECT profile_photo_path AS filename FROM dogs WHERE profile_photo_path IS NOT NULL
  UNION
  SELECT file_path AS filename FROM dog_photos
  UNION
  SELECT file_path AS filename FROM litter_photos
  UNION
  SELECT photo_path AS filename FROM external_studs WHERE photo_path IS NOT NULL
`;

/**
 * Return unique, validated managed-photo filenames still referenced by data.
 * Invalid paths fail closed so export and cleanup cannot traverse elsewhere.
 */
export async function getReferencedManagedPhotoFilenames(): Promise<string[]> {
  const rows = await query<PhotoReferenceRow>(REFERENCED_PHOTO_SQL);
  const filenames = new Set<string>();

  for (const row of rows) {
    if (!row.filename) continue;
    if (!isValidManagedPhotoFilename(row.filename)) {
      throw new Error(`Database contains an invalid managed photo reference: ${row.filename}`);
    }
    filenames.add(row.filename);
  }

  return [...filenames].sort((left, right) => left.localeCompare(right));
}

export type ManagedPhotoDeleteResult = 'deleted' | 'missing' | 'referenced';

/** Remove a managed photo only when no database record references it. */
export async function deleteManagedPhotoIfUnreferenced(
  filename: string,
): Promise<ManagedPhotoDeleteResult> {
  if (!isValidManagedPhotoFilename(filename)) {
    throw new Error('Refusing to delete an invalid managed photo filename.');
  }

  const referenceRows = await query<PhotoReferenceCountRow>(
    `SELECT COUNT(*) AS reference_count FROM (${REFERENCED_PHOTO_SQL}) WHERE filename = ?`,
    [filename],
  );
  if (Number(referenceRows[0]?.reference_count ?? 0) > 0) return 'referenced';

  const photoPath = getPhotoPath(filename);
  if (!await exists(photoPath, { baseDir: BaseDirectory.AppData })) {
    clearPhotoUrlCache(filename);
    return 'missing';
  }

  try {
    await remove(photoPath, { baseDir: BaseDirectory.AppData });
    clearPhotoUrlCache(filename);
    return 'deleted';
  } catch (error) {
    logger.error('Failed to delete unreferenced managed photo', error, {
      context: 'deleteManagedPhotoIfUnreferenced',
      filename,
    });
    throw new Error(`Managed photo ${filename} is no longer referenced, but its file could not be removed.`);
  }
}

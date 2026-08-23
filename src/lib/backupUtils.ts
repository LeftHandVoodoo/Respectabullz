// Partial-export utilities for exporting the legacy record subset with photos.
// These archives are not a supported recovery format.

import JSZip from 'jszip';
import { readFile, writeFile, stat, BaseDirectory } from '@tauri-apps/plugin-fs';
import { save } from '@tauri-apps/plugin-dialog';
import { logger } from '@/lib/errorTracking';
import { getPhotoPath } from '@/lib/photoUtils';
import { getReferencedManagedPhotoFilenames } from '@/lib/photoStorage';
import { PHOTO_LIMITS, assertPhotoFileSize, validateImageBytes } from '@/lib/photoValidation';

const PHOTOS_DIR = 'photos';
const DB_FILENAME = 'database.json';
const PARTIAL_EXPORT_VERSION = '1.0';

interface PartialExportMetadata {
  version: string;
  createdAt: string;
  appVersion: string;
  photoCount: number;
}

interface ReferencedPhotoInfo {
  filename: string;
  size: number;
}

async function getReferencedPhotoInfo(): Promise<ReferencedPhotoInfo[]> {
  const filenames = await getReferencedManagedPhotoFilenames();
  if (filenames.length > PHOTO_LIMITS.maxExportCount) {
    throw new Error(`Partial export supports at most ${PHOTO_LIMITS.maxExportCount} referenced photos.`);
  }

  const photos: ReferencedPhotoInfo[] = [];
  let aggregateBytes = 0;
  for (const filename of filenames) {
    const photoPath = getPhotoPath(filename);
    let fileInfo;
    try {
      fileInfo = await stat(photoPath, { baseDir: BaseDirectory.AppData });
    } catch (error) {
      logger.error('Failed to inspect referenced photo', error, { filename });
      throw new Error(`Referenced managed photo ${filename} is missing or inaccessible.`);
    }
    if (!fileInfo.isFile) {
      throw new Error(`Referenced managed photo ${filename} is not a regular file.`);
    }
    assertPhotoFileSize(fileInfo.size, `Managed photo ${filename}`);
    aggregateBytes += fileInfo.size;
    if (aggregateBytes > PHOTO_LIMITS.maxExportBytes) {
      throw new Error('Referenced photos exceed the 128 MB partial-export limit.');
    }
    photos.push({ filename, size: fileInfo.size });
  }

  return photos;
}

/**
 * Read a photo file and return its data
 */
async function readPhotoFile(filename: string): Promise<Uint8Array> {
  let data: Uint8Array;
  try {
    const photoPath = `${PHOTOS_DIR}/${filename}`;
    const fileData = await readFile(photoPath, { baseDir: BaseDirectory.AppData });
    data = fileData instanceof Uint8Array ? fileData : new Uint8Array(fileData);
  } catch (error) {
    logger.error(`Failed to read photo file ${filename}`, error instanceof Error ? error : undefined);
    throw new Error(`Could not read managed photo ${filename} for the partial export.`);
  }

  validateImageBytes(filename, data);
  return data;
}

/**
 * Export the legacy JSON record subset and every enumerated managed photo as a ZIP.
 * Enumeration or read failures abort before the save dialog so omissions can never
 * be represented as a successful export.
 * This output cannot be restored by the application.
 */
export async function exportPartialDataWithPhotos(databaseJson: string): Promise<boolean> {
  try {
    const databaseBytes = new TextEncoder().encode(databaseJson).byteLength;
    if (databaseBytes > PHOTO_LIMITS.maxDatabaseJsonBytes) {
      throw new Error('Database JSON exceeds the 25 MB partial-export limit.');
    }

    const zip = new JSZip();
    
    // Get app version from the version module
    const { VERSION } = await import('./version');
    
    // Database references are the authority. Files merely present in the photos
    // directory are orphans and must never be disclosed by an export.
    const referencedPhotos = await getReferencedPhotoInfo();

    // Create metadata from the files that will actually be included.
    const metadata: PartialExportMetadata = {
      version: PARTIAL_EXPORT_VERSION,
      createdAt: new Date().toISOString(),
      appVersion: VERSION,
      photoCount: referencedPhotos.length,
    };
    
    // Add metadata
    zip.file('metadata.json', JSON.stringify(metadata, null, 2));
    
    // Add database
    zip.file(DB_FILENAME, databaseJson);
    
    // Add photos folder
    const photosFolder = zip.folder('photos');
    if (!photosFolder) {
      throw new Error('Could not initialize the photos folder in the partial export.');
    }
    let actualPhotoBytes = 0;
    for (const photo of referencedPhotos) {
      const data = await readPhotoFile(photo.filename);
      actualPhotoBytes += data.byteLength;
      if (actualPhotoBytes > PHOTO_LIMITS.maxExportBytes) {
        throw new Error('Referenced photos changed and now exceed the 128 MB partial-export limit.');
      }
      photosFolder.file(photo.filename, data);
    }
    
    // Generate bytes directly for the native filesystem API.
    const zipData = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    // Open save dialog
    const savePath = await save({
      defaultPath: `respectabullz-partial-export-${new Date().toISOString().split('T')[0]}.zip`,
      filters: [{
        name: 'ZIP Archive',
        extensions: ['zip']
      }]
    });
    
    if (!savePath) {
      return false;
    }

    // The native save dialog grants the exact selected file, not a sibling
    // temporary path. This partial export is written to that explicit target;
    // it is not represented as an atomic recovery artifact.
    await writeFile(savePath, zipData);

    return true;
  } catch (error) {
    logger.error('Failed to create partial export', error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Check if running in Tauri environment
 */
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * Get photo inventory information for the partial-export display.
 */
export async function getPartialExportInfo(): Promise<{ photoCount: number; photosSize: number }> {
  try {
    const photos = await getReferencedPhotoInfo();
    const totalSize = photos.reduce((sum, photo) => sum + photo.size, 0);
    
    return {
      photoCount: photos.length,
      photosSize: totalSize,
    };
  } catch (error) {
    logger.error('Failed to get partial-export photo info', error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}


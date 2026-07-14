// Partial-export utilities for exporting the legacy record subset with photos.
// These archives are not a supported recovery format.

import JSZip from 'jszip';
import { readFile, writeFile, exists, readDir, BaseDirectory } from '@tauri-apps/plugin-fs';
import { save } from '@tauri-apps/plugin-dialog';
import { logger } from '@/lib/errorTracking';

const PHOTOS_DIR = 'photos';
const DB_FILENAME = 'database.json';
const PARTIAL_EXPORT_VERSION = '1.0';

interface PartialExportMetadata {
  version: string;
  createdAt: string;
  appVersion: string;
  photoCount: number;
}

/**
 * Get list of all photo files in the photos directory
 */
async function getPhotoFiles(): Promise<string[]> {
  try {
    const dirExists = await exists(PHOTOS_DIR, { baseDir: BaseDirectory.AppData });
    if (!dirExists) {
      return [];
    }
    
    const entries = await readDir(PHOTOS_DIR, { baseDir: BaseDirectory.AppData });
    const photoFiles: string[] = [];
    
    for (const entry of entries) {
      if (entry.isFile && entry.name) {
        photoFiles.push(entry.name);
      }
    }
    
    return photoFiles;
  } catch (error) {
    logger.error('Failed to list photo files', error instanceof Error ? error : undefined);
    throw new Error('Could not enumerate managed photos for the partial export.');
  }
}

/**
 * Read a photo file and return its data
 */
async function readPhotoFile(filename: string): Promise<Uint8Array> {
  try {
    const photoPath = `${PHOTOS_DIR}/${filename}`;
    const data = await readFile(photoPath, { baseDir: BaseDirectory.AppData });
    return data;
  } catch (error) {
    logger.error(`Failed to read photo file ${filename}`, error instanceof Error ? error : undefined);
    throw new Error(`Could not read managed photo ${filename} for the partial export.`);
  }
}

/**
 * Export the legacy JSON record subset and every enumerated managed photo as a ZIP.
 * Enumeration or read failures abort before the save dialog so omissions can never
 * be represented as a successful export.
 * This output cannot be restored by the application.
 */
export async function exportPartialDataWithPhotos(databaseJson: string): Promise<boolean> {
  try {
    const zip = new JSZip();
    
    // Get app version from the version module
    const { VERSION } = await import('./version');
    
    // Get list of photos
    const photoFiles = await getPhotoFiles();
    
    // Read every enumerated photo before constructing metadata or requesting a
    // destination. A single failure aborts the export rather than silently omitting
    // a file while still reporting success.
    const includedPhotos: Array<{ filename: string; data: Uint8Array }> = [];
    for (const filename of photoFiles) {
      includedPhotos.push({
        filename,
        data: await readPhotoFile(filename),
      });
    }

    // Create metadata from the files that will actually be included.
    const metadata: PartialExportMetadata = {
      version: PARTIAL_EXPORT_VERSION,
      createdAt: new Date().toISOString(),
      appVersion: VERSION,
      photoCount: includedPhotos.length,
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
    for (const photo of includedPhotos) {
      photosFolder.file(photo.filename, photo.data);
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
    const photoFiles = await getPhotoFiles();
    let totalSize = 0;
    
    for (const filename of photoFiles) {
      const data = await readPhotoFile(filename);
      totalSize += data.length;
    }
    
    return {
      photoCount: photoFiles.length,
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


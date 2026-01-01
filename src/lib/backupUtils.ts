// Backup utilities for exporting and importing data with photos
// Creates ZIP archives containing database JSON and all photo files

import JSZip from 'jszip';
import { readFile, writeFile, exists, mkdir, readDir, BaseDirectory } from '@tauri-apps/plugin-fs';
import { save, open } from '@tauri-apps/plugin-dialog';
import { z } from 'zod';
import { logger } from '@/lib/errorTracking';

const PHOTOS_DIR = 'photos';
const DB_FILENAME = 'database.json';
const BACKUP_VERSION = '1.0';

// Zod schema for validating backup metadata
const BackupMetadataSchema = z.object({
  version: z.string(),
  createdAt: z.string(),
  appVersion: z.string(),
  photoCount: z.number(),
});

interface BackupMetadata {
  version: string;
  createdAt: string;
  appVersion: string;
  photoCount: number;
}

// Extended result type for detailed restore status
interface ImportResult {
  success: boolean;
  databaseJson?: string;
  photoCount?: number;
  error?: string;
  failedPhotos?: string[];
  metadata?: BackupMetadata;
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
    console.error('Failed to list photo files:', error);
    return [];
  }
}

/**
 * Read a photo file and return its data
 */
async function readPhotoFile(filename: string): Promise<Uint8Array | null> {
  try {
    const photoPath = `${PHOTOS_DIR}/${filename}`;
    const data = await readFile(photoPath, { baseDir: BaseDirectory.AppData });
    return data;
  } catch (error) {
    console.error(`Failed to read photo file ${filename}:`, error);
    return null;
  }
}

/**
 * Export database and all photos as a ZIP file
 */
export async function exportBackupWithPhotos(databaseJson: string): Promise<boolean> {
  try {
    const zip = new JSZip();
    
    // Get app version from the version module
    const { VERSION } = await import('./version');
    
    // Get list of photos
    const photoFiles = await getPhotoFiles();
    
    // Create metadata
    const metadata: BackupMetadata = {
      version: BACKUP_VERSION,
      createdAt: new Date().toISOString(),
      appVersion: VERSION,
      photoCount: photoFiles.length,
    };
    
    // Add metadata
    zip.file('metadata.json', JSON.stringify(metadata, null, 2));
    
    // Add database
    zip.file(DB_FILENAME, databaseJson);
    
    // Add photos folder
    const photosFolder = zip.folder('photos');
    if (photosFolder) {
      for (const filename of photoFiles) {
        const photoData = await readPhotoFile(filename);
        if (photoData) {
          photosFolder.file(filename, photoData);
        }
      }
    }
    
    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    // Convert blob to Uint8Array for Tauri
    const arrayBuffer = await zipBlob.arrayBuffer();
    const zipData = new Uint8Array(arrayBuffer);
    
    // Open save dialog
    const savePath = await save({
      defaultPath: `respectabullz-backup-${new Date().toISOString().split('T')[0]}.zip`,
      filters: [{
        name: 'ZIP Archive',
        extensions: ['zip']
      }]
    });
    
    if (!savePath) {
      return false;
    }

    // Write the ZIP file
    await writeFile(savePath, zipData);
    
    return true;
  } catch (error) {
    console.error('Failed to create backup:', error);
    throw error;
  }
}

/**
 * Import database and photos from a ZIP backup file
 */
export async function importBackupWithPhotos(): Promise<ImportResult> {
  try {
    // Open file dialog to select backup
    const selectedPath = await open({
      multiple: false,
      filters: [{
        name: 'ZIP Archive',
        extensions: ['zip']
      }]
    });

    if (!selectedPath || typeof selectedPath !== 'string') {
      return { success: false, error: 'cancelled' };
    }

    // Read the ZIP file
    const zipData = await readFile(selectedPath);

    // Load the ZIP
    const zip = await JSZip.loadAsync(zipData);

    // Validate and parse metadata
    let metadata: BackupMetadata | undefined;
    const metadataFile = zip.file('metadata.json');
    if (metadataFile) {
      const metadataText = await metadataFile.async('string');
      try {
        const rawMetadata = JSON.parse(metadataText);
        const parseResult = BackupMetadataSchema.safeParse(rawMetadata);
        if (parseResult.success) {
          metadata = parseResult.data;
          logger.info('Backup metadata validated', { metadata });
        } else {
          logger.warn('Backup metadata failed validation', {
            errors: parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          });
          // Continue without metadata - we can still try to restore
        }
      } catch (e) {
        logger.error('Failed to parse backup metadata', e instanceof Error ? e : undefined);
        // Continue without metadata
      }
    }

    // Extract database
    const dbFile = zip.file(DB_FILENAME);
    if (!dbFile) {
      return { success: false, error: 'Invalid backup: missing database.json' };
    }

    const databaseJson = await dbFile.async('string');

    // Ensure photos directory exists
    const photosDirExists = await exists(PHOTOS_DIR, { baseDir: BaseDirectory.AppData });
    if (!photosDirExists) {
      await mkdir(PHOTOS_DIR, { recursive: true, baseDir: BaseDirectory.AppData });
    }

    // Extract photos with detailed tracking
    const photosFolder = zip.folder('photos');
    let photoCount = 0;
    const failedPhotos: string[] = [];

    if (photosFolder) {
      const photoEntries: { name: string; file: JSZip.JSZipObject }[] = [];

      photosFolder.forEach((relativePath, file) => {
        if (!file.dir) {
          photoEntries.push({ name: relativePath, file });
        }
      });

      for (const { name, file } of photoEntries) {
        try {
          const photoData = await file.async('uint8array');
          const photoPath = `${PHOTOS_DIR}/${name}`;
          await writeFile(photoPath, photoData, { baseDir: BaseDirectory.AppData });
          photoCount++;
        } catch (error) {
          failedPhotos.push(name);
          logger.error(`Failed to restore photo ${name}`, error instanceof Error ? error : undefined);
        }
      }
    }

    // Determine success status based on photo restoration
    const allPhotosRestored = failedPhotos.length === 0;

    return {
      success: allPhotosRestored,
      databaseJson,
      photoCount,
      failedPhotos: failedPhotos.length > 0 ? failedPhotos : undefined,
      metadata,
      error: failedPhotos.length > 0
        ? `${failedPhotos.length} photo(s) failed to restore`
        : undefined,
    };
  } catch (error) {
    logger.error('Failed to import backup', error instanceof Error ? error : undefined);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if running in Tauri environment
 */
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * Get backup info (photo count, etc.) for display
 */
export async function getBackupInfo(): Promise<{ photoCount: number; photosSize: number }> {
  try {
    const photoFiles = await getPhotoFiles();
    let totalSize = 0;
    
    for (const filename of photoFiles) {
      const data = await readPhotoFile(filename);
      if (data) {
        totalSize += data.length;
      }
    }
    
    return {
      photoCount: photoFiles.length,
      photosSize: totalSize,
    };
  } catch (error) {
    console.error('Failed to get backup info:', error);
    return { photoCount: 0, photosSize: 0 };
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


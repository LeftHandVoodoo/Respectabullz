// Photo utilities for handling image uploads and file management
// Uses Tauri's file system and dialog plugins

import { open } from '@tauri-apps/plugin-dialog';
import { logger } from '@/lib/errorTracking';
import { readFile, exists, mkdir, remove, stat, BaseDirectory } from '@tauri-apps/plugin-fs';
import { atomicWriteFile } from '@/lib/fsUtils';
import { appDataDir, join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';
import {
  PHOTO_LIMITS,
  SUPPORTED_IMAGE_EXTENSIONS,
  assertPhotoFileSize,
  isSupportedImageFilename,
  isValidManagedPhotoFilename,
  validateImageBytes,
} from '@/lib/photoValidation';

/**
 * Generate a unique filename for storing photos
 */
import { v4 as uuidv4 } from 'uuid';

function generateUniqueFilename(originalPath: string): string {
  const ext = originalPath.split('.').pop()?.toLowerCase() || 'jpg';
  // Use UUID v4 for collision-free filenames
  return `${uuidv4()}.${ext}`;
}

/**
 * Ensure the photos directory exists in app data
 *
 * Note: The exists() check followed by mkdir() has a theoretical TOCTOU race condition,
 * but this is safe because:
 * 1. mkdir with `recursive: true` is idempotent - it succeeds even if directory exists
 * 2. Single-user desktop app context eliminates concurrent directory creation scenarios
 * 3. The exists check is purely an optimization to skip unnecessary mkdir calls
 */
async function ensurePhotosDirectory(): Promise<string> {
  try {
    // Use BaseDirectory.AppData for consistent path handling
    const photosPath = 'photos';

    const dirExists = await exists(photosPath, { baseDir: BaseDirectory.AppData });
    if (!dirExists) {
      // mkdir with recursive:true is idempotent - safe even if directory was created between check and call
      await mkdir(photosPath, { recursive: true, baseDir: BaseDirectory.AppData });
    }

    // Return the relative path - we'll use BaseDirectory.AppData when accessing
    return photosPath;
  } catch (error) {
    console.error('Failed to ensure photos directory:', error);
    throw error;
  }
}

/**
 * Open a file picker dialog for selecting an image
 * Returns the selected file path or null if cancelled
 */
export async function selectImageFile(): Promise<string | null> {
  try {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'Images',
        extensions: [...SUPPORTED_IMAGE_EXTENSIONS],
      }],
    });

    if (!selected) {
      return null;
    }

    // Handle different return types from Tauri v2 dialog
    if (typeof selected === 'string') {
      return selected;
    }

    // Tauri v2 might return an object with path property
    if (typeof selected === 'object' && selected !== null) {
      // Could be { path: string } or array
      const obj = selected as Record<string, unknown>;

      // Check if it's an array first (shouldn't happen with multiple: false, but handle it)
      if (Array.isArray(obj)) {
        const arr = obj as unknown[];
        if (arr.length > 0) {
          const first = arr[0];
          if (typeof first === 'string') {
            return first;
          }
          if (typeof first === 'object' && first !== null && 'path' in (first as Record<string, unknown>)) {
            return (first as Record<string, unknown>).path as string;
          }
        }
      } else if ('path' in obj && typeof obj.path === 'string') {
        return obj.path;
      }
    }

    return null;
  } catch (error) {
    logger.warn('Failed to open photo file dialog', {
      error: error instanceof Error ? error.message : String(error),
      context: 'selectImageFile'
    });
    throw new Error('Could not open the photo picker.');
  }
}

/**
 * Helper to extract path from dialog result
 * Handles various return types from Tauri dialog plugin
 */
function extractPath(item: unknown): string | null {
  // Handle string paths (Tauri v1 style)
  if (typeof item === 'string') {
    return item;
  }

  // Handle object with path property (Tauri v2 style)
  if (typeof item === 'object' && item !== null) {
    // Check for 'path' property (FileResponse type)
    if ('path' in item) {
      const path = (item as { path: unknown }).path;
      if (typeof path === 'string') {
        return path;
      }
    }
    // Check for 'file' property (alternative response format)
    if ('file' in item) {
      const file = (item as { file: unknown }).file;
      if (typeof file === 'string') {
        return file;
      }
    }
  }

  return null;
}

/**
 * Select multiple images from the file picker
 */
export async function selectMultipleImages(): Promise<string[]> {
  try {
    const selected = await open({
      multiple: true,
      filters: [{
        name: 'Images',
        extensions: [...SUPPORTED_IMAGE_EXTENSIONS],
      }],
    });

    if (!selected) {
      return [];
    }

    const results: string[] = [];

    if (Array.isArray(selected)) {
      for (const item of selected) {
        const path = extractPath(item);
        if (path) {
          results.push(path);
        }
      }
    } else {
      const path = extractPath(selected);
      if (path) {
        results.push(path);
      }
    }

    if (results.length > PHOTO_LIMITS.maxSelectionCount) {
      throw new Error(`Select no more than ${PHOTO_LIMITS.maxSelectionCount} photos at one time.`);
    }

    return results;
  } catch (error) {
    logger.warn('Failed to select multiple photos', {
      error: error instanceof Error ? error.message : String(error),
      context: 'selectMultipleImages',
    });
    throw error instanceof Error ? error : new Error('Could not open the photo picker.');
  }
}

/**
 * Copy an image file to the app's photos directory
 * Returns the new file path (relative to app data); rejects on validation or I/O failure.
 */
export async function copyImageToPhotosDir(sourcePath: string): Promise<string> {
  try {
    if (!isSupportedImageFilename(sourcePath)) {
      throw new Error('Selected file does not use a supported image extension.');
    }

    const sourceInfo = await stat(sourcePath);
    if (!sourceInfo.isFile) {
      throw new Error('Selected photo is not a regular file.');
    }
    assertPhotoFileSize(sourceInfo.size, 'Selected photo');

    // The dialog grants access to the selected path. Size is checked before the
    // whole-file read, then checked again with signature and dimensions to close
    // the gap if the source changes between stat and read.
    const sourceData = await readFile(sourcePath);
    const dataToWrite = sourceData instanceof Uint8Array
      ? sourceData
      : new Uint8Array(sourceData);
    validateImageBytes(sourcePath, dataToWrite);

    const photosDir = await ensurePhotosDirectory();
    const newFilename = generateUniqueFilename(sourcePath);
    const destPath = `${photosDir}/${newFilename}`;

    // Write to destination atomically using BaseDirectory.AppData
    // This prevents partial file corruption if write is interrupted
    await atomicWriteFile(destPath, dataToWrite, { baseDir: BaseDirectory.AppData });

    // Return just the filename - we'll reconstruct the full path when needed
    return newFilename;
  } catch (error) {
    logger.warn('Failed to copy image to photos directory', {
      error: error instanceof Error ? error.message : String(error),
      context: 'copyImageToPhotosDir',
      sourcePath
    });
    throw error instanceof Error ? error : new Error('Selected photo could not be copied.');
  }
}

/**
 * Get the relative file path for a stored photo filename
 * Uses BaseDirectory.AppData when accessing files
 */
export function getPhotoPath(filename: string): string {
  if (!isValidManagedPhotoFilename(filename)) {
    throw new Error('Managed photo filename is invalid.');
  }
  return `photos/${filename}`;
}

/**
 * Convert a stored photo filename to a displayable URL
 * Uses Tauri's convertFileSrc for proper file:// protocol handling
 */
export async function getPhotoUrl(filename: string | null | undefined): Promise<string | null> {
  if (!filename || !isValidManagedPhotoFilename(filename)) return null;

  try {
    // Get the full app data directory path
    const appData = await appDataDir();
    const fullPath = await join(appData, 'photos', filename);
    const url = convertFileSrc(fullPath);
    return url;
  } catch (error) {
    logger.warn('Failed to get photo URL', {
      error: error instanceof Error ? error.message : String(error),
      context: 'getPhotoUrl',
    });
    return null;
  }
}

/**
 * Synchronous helper that returns a photo URL from a cached path
 * This assumes the photos directory path has been pre-computed
 * For use in React components where async isn't ideal
 */
let cachedPhotosBasePath: string | null = null;
const photoUrlCache = new Map<string, string>();

function getCachedPhotoUrl(filename: string): string | null {
  const cached = photoUrlCache.get(filename);
  if (!cached) return null;

  // Refresh insertion order so the bounded map behaves as an LRU cache.
  photoUrlCache.delete(filename);
  photoUrlCache.set(filename, cached);
  return cached;
}

function cachePhotoUrl(filename: string, url: string): void {
  photoUrlCache.delete(filename);
  photoUrlCache.set(filename, url);
  while (photoUrlCache.size > PHOTO_LIMITS.urlCacheEntries) {
    const oldestKey = photoUrlCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    photoUrlCache.delete(oldestKey);
  }
}

export function clearPhotoUrlCache(filename?: string): void {
  if (filename) {
    photoUrlCache.delete(filename);
    return;
  }
  photoUrlCache.clear();
}

export async function initPhotoBasePath(): Promise<void> {
  try {
    const appData = await appDataDir();
    const photosPath = await join(appData, 'photos');
    cachedPhotosBasePath = photosPath;
  } catch (error) {
    logger.warn('Failed to initialize photo base path', {
      error: error instanceof Error ? error.message : String(error),
      context: 'initPhotoBasePath',
    });
  }
}

/**
 * Get a photo URL asynchronously (preferred method).
 * The native asset URL avoids retaining full base64 images in renderer memory.
 */
export async function getPhotoUrlAsync(filename: string | null | undefined): Promise<string | null> {
  if (!filename || !isValidManagedPhotoFilename(filename)) return null;

  const cached = getCachedPhotoUrl(filename);
  if (cached) return cached;

  try {
    const photoPath = getPhotoPath(filename);
    if (!await exists(photoPath, { baseDir: BaseDirectory.AppData })) return null;

    const appData = await appDataDir();
    const fullPath = await join(appData, 'photos', filename);
    const assetUrl = convertFileSrc(fullPath);
    cachePhotoUrl(filename, assetUrl);
    return assetUrl;
  } catch (error) {
    logger.warn('Failed to get photo URL asynchronously', {
      error: error instanceof Error ? error.message : String(error),
      context: 'getPhotoUrlAsync',
      filename,
    });
    return null;
  }
}

export interface PhotoDataUrl {
  dataUrl: string;
  byteLength: number;
}

const BASE64_CHUNK_BYTES = 24 * 1024;

function encodeBase64InChunks(bytes: Uint8Array): string {
  let encoded = '';
  for (let offset = 0; offset < bytes.byteLength; offset += BASE64_CHUNK_BYTES) {
    const chunk = bytes.subarray(offset, offset + BASE64_CHUNK_BYTES);
    let binary = '';
    for (let index = 0; index < chunk.byteLength; index += 1) {
      binary += String.fromCharCode(chunk[index]);
    }
    encoded += btoa(binary);
  }
  return encoded;
}

function assertPdfPhotoSize(size: number): void {
  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new Error('PDF photo is empty or has an invalid size.');
  }
  if (size > PHOTO_LIMITS.maxPdfPhotoBytes) {
    throw new Error('PDF photo exceeds the 8 MB embedding limit.');
  }
}

/**
 * Read a validated managed photo for PDF embedding.
 * UI rendering should continue to use the bounded asset-URL helpers above.
 */
export async function getPhotoDataUrl(
  filename: string | null | undefined,
): Promise<PhotoDataUrl | null> {
  if (!filename) return null;
  if (!isValidManagedPhotoFilename(filename)) {
    throw new Error('Managed photo filename is invalid.');
  }

  const photoPath = getPhotoPath(filename);
  const fileInfo = await stat(photoPath, { baseDir: BaseDirectory.AppData });
  if (!fileInfo.isFile) throw new Error('PDF photo is not a regular file.');
  assertPdfPhotoSize(fileInfo.size);

  const fileData = await readFile(photoPath, { baseDir: BaseDirectory.AppData });
  const bytes = fileData instanceof Uint8Array ? fileData : new Uint8Array(fileData);
  assertPdfPhotoSize(bytes.byteLength);
  const image = validateImageBytes(filename, bytes);
  const mimeType = image.format === 'jpeg' ? 'image/jpeg' : `image/${image.format}`;

  return {
    dataUrl: `data:${mimeType};base64,${encodeBase64InChunks(bytes)}`,
    byteLength: bytes.byteLength,
  };
}

/**
 * Get photo URL synchronously (requires initPhotoBasePath to be called first)
 * Falls back to async lookup if cache isn't ready
 * Uses convertFileSrc (asset://) for better performance vs base64
 */
export function getPhotoUrlSync(filename: string | null | undefined): string | null {
  if (!filename || !isValidManagedPhotoFilename(filename)) return null;

  const cached = getCachedPhotoUrl(filename);
  if (cached) return cached;

  // If base path is initialized, construct URL using convertFileSrc
  if (cachedPhotosBasePath) {
    try {
      // Normalize path to use forward slashes (Tauri handles this on all platforms)
      const normalizedBase = cachedPhotosBasePath.replace(/\\/g, '/').replace(/\/$/, '');
      const fullPath = `${normalizedBase}/${filename}`;
      const url = convertFileSrc(fullPath);
      cachePhotoUrl(filename, url);
      return url;
    } catch (error) {
      logger.warn('Failed to get photo URL synchronously', {
        error: error instanceof Error ? error.message : String(error),
        context: 'getPhotoUrlSync',
        filename,
      });
      return null;
    }
  }

  return null;
}

/**
 * Check if a photo file exists
 */
export async function photoExists(filename: string): Promise<boolean> {
  try {
    if (!isValidManagedPhotoFilename(filename)) return false;
    const photoPath = getPhotoPath(filename);
    return exists(photoPath, { baseDir: BaseDirectory.AppData });
  } catch {
    return false;
  }
}

/**
 * Validate that a file is a supported image type
 */
export function isValidImageFile(filename: string): boolean {
  return isSupportedImageFilename(filename);
}

/**
 * Select and copy an image in one step
 * Returns the new filename or null if cancelled/failed
 */
export async function selectAndCopyImage(): Promise<string | null> {
  const selected = await selectImageFile();
  if (!selected) {
    return null;
  }

  const filename = await copyImageToPhotosDir(selected);
  return filename;
}

/**
 * Select and copy multiple images in one step
 * Returns array of new filenames
 */
export async function selectAndCopyMultipleImages(): Promise<string[]> {
  const selected = await selectMultipleImages();
  if (selected.length === 0) return [];

  const results: string[] = [];
  try {
    for (const path of selected) {
      const newFilename = await copyImageToPhotosDir(path);
      results.push(newFilename);
    }
    return results;
  } catch (error) {
    const cleanupResults = await Promise.allSettled(
      results.map(async (filename) => {
        const photoPath = getPhotoPath(filename);
        if (await exists(photoPath, { baseDir: BaseDirectory.AppData })) {
          await remove(photoPath, { baseDir: BaseDirectory.AppData });
        }
        clearPhotoUrlCache(filename);
      }),
    );
    if (cleanupResults.some((result) => result.status === 'rejected')) {
      logger.error('Failed to clean up one or more photos after a batch copy error', undefined, {
        context: 'selectAndCopyMultipleImages',
      });
    }
    throw error;
  }
}

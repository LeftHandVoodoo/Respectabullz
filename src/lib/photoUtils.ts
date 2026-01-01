// Photo utilities for handling image uploads and file management
// Uses Tauri's file system and dialog plugins

import { open } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile, exists, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';

// Supported image extensions
const SUPPORTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

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
 */
async function ensurePhotosDirectory(): Promise<string> {
  try {
    // Use BaseDirectory.AppData for consistent path handling
    const photosPath = 'photos';

    const dirExists = await exists(photosPath, { baseDir: BaseDirectory.AppData });
    if (!dirExists) {
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
        extensions: SUPPORTED_EXTENSIONS,
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
    console.error('Failed to open file dialog:', error);
    return null;
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
        extensions: SUPPORTED_EXTENSIONS,
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

    return results;
  } catch (error) {
    console.error('Failed to open file dialog:', error);
    return [];
  }
}

/**
 * Copy an image file to the app's photos directory
 * Returns the new file path (relative to app data) or null on failure
 */
export async function copyImageToPhotosDir(sourcePath: string): Promise<string | null> {
  try {
    const photosDir = await ensurePhotosDirectory();
    const newFilename = generateUniqueFilename(sourcePath);
    const destPath = `${photosDir}/${newFilename}`;

    // Read the source file (it's a user-selected file, so read it directly)
    // The sourcePath is an absolute path from the file dialog
    const sourceData = await readFile(sourcePath);

    // Ensure we have a Uint8Array
    const dataToWrite = sourceData instanceof Uint8Array
      ? sourceData
      : new Uint8Array(sourceData);

    // Write to destination using BaseDirectory.AppData
    await writeFile(destPath, dataToWrite, { baseDir: BaseDirectory.AppData });

    // Return just the filename - we'll reconstruct the full path when needed
    return newFilename;
  } catch (error) {
    console.error('Failed to copy image to photos directory:', error);
    return null;
  }
}

/**
 * Get the relative file path for a stored photo filename
 * Uses BaseDirectory.AppData when accessing files
 */
export function getPhotoPath(filename: string): string {
  return `photos/${filename}`;
}

/**
 * Convert a stored photo filename to a displayable URL
 * Uses Tauri's convertFileSrc for proper file:// protocol handling
 */
export async function getPhotoUrl(filename: string | null | undefined): Promise<string | null> {
  if (!filename) return null;

  try {
    // Get the full app data directory path
    const appData = await appDataDir();
    const fullPath = await join(appData, 'photos', filename);
    const url = convertFileSrc(fullPath);
    return url;
  } catch (error) {
    console.error('Failed to get photo URL:', error);
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

export async function initPhotoBasePath(): Promise<void> {
  try {
    const appData = await appDataDir();
    const photosPath = await join(appData, 'photos');
    cachedPhotosBasePath = photosPath;
  } catch (error) {
    console.error('Failed to init photo base path:', error);
  }
}

/**
 * Get the MIME type from a filename
 */
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
  };
  return mimeTypes[ext || ''] || 'image/jpeg';
}

/**
 * Convert Uint8Array to base64 string
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Get photo URL asynchronously (preferred method)
 * This properly constructs the path and caches the result
 * Uses base64 data URL for reliable cross-platform display
 */
export async function getPhotoUrlAsync(filename: string | null | undefined): Promise<string | null> {
  if (!filename) return null;

  // Check cache first
  if (photoUrlCache.has(filename)) {
    return photoUrlCache.get(filename) || null;
  }

  try {
    // Read the file from app data directory
    const photoPath = getPhotoPath(filename);
    const fileData = await readFile(photoPath, { baseDir: BaseDirectory.AppData });

    // Convert to base64 data URL
    const mimeType = getMimeType(filename);
    const base64 = uint8ArrayToBase64(fileData);
    const dataUrl = `data:${mimeType};base64,${base64}`;

    photoUrlCache.set(filename, dataUrl);
    return dataUrl;
  } catch (error) {
    console.error('Failed to get photo URL async:', error);

    // Fallback: try convertFileSrc
    try {
      const appData = await appDataDir();
      const fullPath = await join(appData, 'photos', filename);
      const assetUrl = convertFileSrc(fullPath);
      photoUrlCache.set(filename, assetUrl);
      return assetUrl;
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return null;
    }
  }
}

/**
 * Get photo URL synchronously (requires initPhotoBasePath to be called first)
 * Falls back to async lookup if cache isn't ready
 * Uses convertFileSrc (asset://) for better performance vs base64
 */
export function getPhotoUrlSync(filename: string | null | undefined): string | null {
  if (!filename) return null;

  // Check cache first
  if (photoUrlCache.has(filename)) {
    return photoUrlCache.get(filename) || null;
  }

  // If base path is initialized, construct URL using convertFileSrc
  if (cachedPhotosBasePath) {
    try {
      // Normalize path to use forward slashes (Tauri handles this on all platforms)
      const normalizedBase = cachedPhotosBasePath.replace(/\\/g, '/').replace(/\/$/, '');
      const fullPath = `${normalizedBase}/${filename}`;
      const url = convertFileSrc(fullPath);
      photoUrlCache.set(filename, url);
      return url;
    } catch (error) {
      console.error('Failed to get photo URL sync:', error);
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
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? SUPPORTED_EXTENSIONS.includes(ext) : false;
}

/**
 * Select and copy an image in one step
 * Returns the new filename or null if cancelled/failed
 */
export async function selectAndCopyImage(): Promise<string | null> {
  try {
    const selected = await selectImageFile();
    if (!selected) {
      return null;
    }

    const filename = await copyImageToPhotosDir(selected);
    return filename;
  } catch (error) {
    console.error('Error in selectAndCopyImage:', error);
    return null;
  }
}

/**
 * Select and copy multiple images in one step
 * Returns array of new filenames
 */
export async function selectAndCopyMultipleImages(): Promise<string[]> {
  const selected = await selectMultipleImages();
  if (selected.length === 0) return [];

  const results: string[] = [];
  for (const path of selected) {
    const newFilename = await copyImageToPhotosDir(path);
    if (newFilename) {
      results.push(newFilename);
    }
  }

  return results;
}

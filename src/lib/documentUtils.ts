// Document utilities for handling file uploads and management
// Uses Tauri's file system and dialog plugins

import { open } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile, exists, mkdir, remove, BaseDirectory } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';
import { open as shellOpen } from '@tauri-apps/plugin-shell';

// Supported file extensions by category
export const SUPPORTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
export const SUPPORTED_PDF_EXTENSIONS = ['pdf'];
export const SUPPORTED_WORD_EXTENSIONS = ['doc', 'docx'];
export const SUPPORTED_EXCEL_EXTENSIONS = ['xls', 'xlsx'];

export const ALL_SUPPORTED_EXTENSIONS = [
  ...SUPPORTED_IMAGE_EXTENSIONS,
  ...SUPPORTED_PDF_EXTENSIONS,
  ...SUPPORTED_WORD_EXTENSIONS,
  ...SUPPORTED_EXCEL_EXTENSIONS,
];

// MIME type mappings
const MIME_TYPES: Record<string, string> = {
  // Images
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  // Documents
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Get MIME type from filename
 */
export function getMimeType(filename: string): string {
  const ext = getFileExtension(filename);
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Check if file is an image
 */
export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return SUPPORTED_IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Check if file is a PDF
 */
export function isPdfFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return SUPPORTED_PDF_EXTENSIONS.includes(ext);
}

/**
 * Check if file is a Word document
 */
export function isWordFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return SUPPORTED_WORD_EXTENSIONS.includes(ext);
}

/**
 * Check if file is an Excel spreadsheet
 */
export function isExcelFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return SUPPORTED_EXCEL_EXTENSIONS.includes(ext);
}

/**
 * Check if file type is supported
 */
export function isSupportedFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ALL_SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * Generate a unique filename for storing documents
 */
function generateUniqueFilename(originalPath: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = getFileExtension(originalPath);
  return `${timestamp}-${random}.${ext}`;
}

/**
 * Ensure the documents directory exists in app data
 */
async function ensureDocumentsDirectory(): Promise<string> {
  try {
    const docsPath = 'documents';
    
    const dirExists = await exists(docsPath, { baseDir: BaseDirectory.AppData });
    if (!dirExists) {
      await mkdir(docsPath, { recursive: true, baseDir: BaseDirectory.AppData });
    }
    
    return docsPath;
  } catch (error) {
    console.error('Failed to ensure documents directory:', error);
    throw error;
  }
}

/**
 * Extract file path from Tauri dialog result
 */
function extractPath(item: unknown): string | null {
  if (typeof item === 'string') {
    return item;
  }
  if (typeof item === 'object' && item !== null && 'path' in item) {
    const path = (item as Record<string, unknown>).path;
    if (typeof path === 'string') {
      return path;
    }
  }
  return null;
}

/**
 * Open a file picker dialog for selecting a document
 * Returns the selected file path or null if cancelled
 */
export async function selectDocumentFile(): Promise<string | null> {
  try {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: 'Documents',
          extensions: ALL_SUPPORTED_EXTENSIONS,
        },
        {
          name: 'Images',
          extensions: SUPPORTED_IMAGE_EXTENSIONS,
        },
        {
          name: 'PDF',
          extensions: SUPPORTED_PDF_EXTENSIONS,
        },
        {
          name: 'Word Documents',
          extensions: SUPPORTED_WORD_EXTENSIONS,
        },
        {
          name: 'Excel Spreadsheets',
          extensions: SUPPORTED_EXCEL_EXTENSIONS,
        },
      ],
    });
    
    if (!selected) {
      return null;
    }
    
    return extractPath(selected);
  } catch (error) {
    console.error('Failed to open file dialog:', error);
    return null;
  }
}

/**
 * Select multiple documents from the file picker
 */
export async function selectMultipleDocuments(): Promise<string[]> {
  try {
    const selected = await open({
      multiple: true,
      filters: [
        {
          name: 'Documents',
          extensions: ALL_SUPPORTED_EXTENSIONS,
        },
      ],
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
 * Copy a document file to the app's documents directory
 * Returns object with new filename and file size, or null on failure
 */
export async function copyDocumentToDocsDir(sourcePath: string): Promise<{ filename: string; fileSize: number } | null> {
  try {
    const docsDir = await ensureDocumentsDirectory();

    const newFilename = generateUniqueFilename(sourcePath);
    const destPath = `${docsDir}/${newFilename}`;

    const sourceData = await readFile(sourcePath);

    const dataToWrite = sourceData instanceof Uint8Array
      ? sourceData
      : new Uint8Array(sourceData);

    await writeFile(destPath, dataToWrite, { baseDir: BaseDirectory.AppData });

    return {
      filename: newFilename,
      fileSize: dataToWrite.length,
    };
  } catch (error) {
    console.error('Failed to copy document to docs directory:', error);
    return null;
  }
}

/**
 * Get the relative file path for a stored document filename
 */
export function getDocumentPath(filename: string): string {
  return `documents/${filename}`;
}

/**
 * Get the full path to a document file
 */
export async function getDocumentFullPath(filename: string): Promise<string> {
  const appData = await appDataDir();
  return await join(appData, 'documents', filename);
}

/**
 * Convert a stored document filename to a displayable URL (for images)
 */
export async function getDocumentUrl(filename: string | null | undefined): Promise<string | null> {
  if (!filename) return null;
  
  try {
    const appData = await appDataDir();
    const fullPath = await join(appData, 'documents', filename);
    return convertFileSrc(fullPath);
  } catch (error) {
    console.error('Failed to get document URL:', error);
    return null;
  }
}

/**
 * Get document as base64 data URL (for images)
 */
export async function getDocumentBase64(filename: string): Promise<string | null> {
  try {
    const docPath = getDocumentPath(filename);
    const fileData = await readFile(docPath, { baseDir: BaseDirectory.AppData });
    
    const mimeType = getMimeType(filename);
    const base64 = uint8ArrayToBase64(fileData);
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Failed to get document base64:', error);
    return null;
  }
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
 * Check if a document file exists
 */
export async function documentExists(filename: string): Promise<boolean> {
  try {
    const docPath = getDocumentPath(filename);
    return exists(docPath, { baseDir: BaseDirectory.AppData });
  } catch {
    return false;
  }
}

/**
 * Delete a document file from storage
 */
export async function deleteDocumentFile(filename: string): Promise<boolean> {
  try {
    const docPath = getDocumentPath(filename);
    await remove(docPath, { baseDir: BaseDirectory.AppData });
    return true;
  } catch (error) {
    console.error('Failed to delete document file:', error);
    return false;
  }
}

/**
 * Open a document with the system default application
 */
export async function openDocumentWithSystem(filename: string): Promise<boolean> {
  try {
    const fullPath = await getDocumentFullPath(filename);
    await shellOpen(fullPath);
    return true;
  } catch (error) {
    console.error('Failed to open document with system:', error);
    return false;
  }
}

/**
 * Select and copy a document in one step
 * Returns object with filename, original name, mime type, and file size
 */
export async function selectAndCopyDocument(): Promise<{
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
} | null> {
  try {
    const selected = await selectDocumentFile();
    if (!selected) {
      return null;
    }
    
    // Extract original filename from path
    const pathParts = selected.split(/[/\\]/);
    const originalName = pathParts[pathParts.length - 1];
    
    if (!isSupportedFile(originalName)) {
      console.error('Unsupported file type:', originalName);
      return null;
    }
    
    const result = await copyDocumentToDocsDir(selected);
    if (!result) {
      return null;
    }
    
    return {
      filename: result.filename,
      originalName,
      mimeType: getMimeType(originalName),
      fileSize: result.fileSize,
    };
  } catch (error) {
    console.error('Error in selectAndCopyDocument:', error);
    return null;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file type display name
 */
export function getFileTypeDisplayName(filename: string): string {
  if (isImageFile(filename)) return 'Image';
  if (isPdfFile(filename)) return 'PDF';
  if (isWordFile(filename)) return 'Word Document';
  if (isExcelFile(filename)) return 'Excel Spreadsheet';
  return 'Document';
}



/**
 * File System Utilities
 *
 * Provides safe, atomic file operations for the Tauri application.
 * These utilities ensure data integrity during file writes by using
 * write-to-temp-then-rename patterns.
 */

import { writeFile, rename, remove, BaseDirectory } from '@tauri-apps/plugin-fs';

/**
 * Atomically write data to a file using write-to-temp-then-rename pattern.
 * This prevents data corruption if the write is interrupted (e.g., power loss, crash).
 *
 * The process:
 * 1. Write data to a temporary file (path.tmp)
 * 2. Rename the temp file to the target path (atomic on most filesystems)
 * 3. On failure, clean up the temp file
 *
 * @param path - The target file path (relative when using baseDir)
 * @param data - The data to write (Uint8Array or string)
 * @param options - Optional configuration including baseDir
 */
export async function atomicWriteFile(
  path: string,
  data: Uint8Array | string,
  options?: { baseDir?: BaseDirectory }
): Promise<void> {
  const tempPath = `${path}.tmp`;
  const dataToWrite = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : data;

  // Write to temporary file first
  await writeFile(tempPath, dataToWrite, options);

  try {
    // Atomically rename temp file to target path
    // Tauri rename uses oldPathBaseDir/newPathBaseDir instead of single baseDir
    const renameOptions = options?.baseDir
      ? { oldPathBaseDir: options.baseDir, newPathBaseDir: options.baseDir }
      : undefined;
    await rename(tempPath, path, renameOptions);
  } catch (error) {
    // Clean up temp file on failure (ignore cleanup errors)
    await remove(tempPath, options).catch(() => {});
    throw error;
  }
}

/**
 * Atomically write data to an absolute file path (no baseDir).
 * Use this for user-selected paths from file dialogs.
 *
 * @param absolutePath - The absolute file path
 * @param data - The data to write (Uint8Array or string)
 */
export async function atomicWriteFileAbsolute(
  absolutePath: string,
  data: Uint8Array | string
): Promise<void> {
  const tempPath = `${absolutePath}.tmp`;
  const dataToWrite = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : data;

  // Write to temporary file first
  await writeFile(tempPath, dataToWrite);

  try {
    // Atomically rename temp file to target path
    await rename(tempPath, absolutePath);
  } catch (error) {
    // Clean up temp file on failure (ignore cleanup errors)
    await remove(tempPath).catch(() => {});
    throw error;
  }
}

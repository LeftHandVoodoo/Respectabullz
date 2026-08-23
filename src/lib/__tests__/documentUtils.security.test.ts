import { readFile, stat } from '@tauri-apps/plugin-fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getDocumentBase64,
  getDocumentPath,
  isValidStoredFilename,
  MAX_DOCUMENT_PREVIEW_BYTES,
} from '../documentUtils';

const managedPdf = '550e8400-e29b-41d4-a716-446655440000.pdf';

describe('stored document filename validation', () => {
  beforeEach(() => {
    vi.mocked(stat).mockResolvedValue({
      size: 1,
      isFile: true,
      isDirectory: false,
      isSymlink: false,
    } as Awaited<ReturnType<typeof stat>>);
    vi.mocked(readFile).mockResolvedValue(new Uint8Array([0x25]));
  });

  it.each([
    '1704067200000-abc123.pdf',
    '1704067200000-12345.docx',
    '550e8400-e29b-41d4-a716-446655440000.png',
  ])('accepts a managed filename: %s', (filename) => {
    expect(isValidStoredFilename(filename)).toBe(true);
    expect(getDocumentPath(filename)).toBe(`documents/${filename}`);
  });

  it.each([
    '../secrets.pdf',
    '..\\secrets.pdf',
    'nested/secrets.pdf',
    'C:\\secrets.pdf',
    'unmanaged.pdf',
    '1704067200000-abc123.exe',
    '',
  ])('rejects an unmanaged or traversing filename: %s', (filename) => {
    expect(isValidStoredFilename(filename)).toBe(false);
    expect(() => getDocumentPath(filename)).toThrow('Invalid stored document filename');
  });

  it('rejects an oversized preview before reading the file into renderer memory', async () => {
    vi.mocked(stat).mockResolvedValue({
      size: MAX_DOCUMENT_PREVIEW_BYTES + 1,
      isFile: true,
      isDirectory: false,
      isSymlink: false,
    } as Awaited<ReturnType<typeof stat>>);

    await expect(getDocumentBase64(managedPdf)).rejects.toThrow('20 MB preview limit');
    expect(readFile).not.toHaveBeenCalled();
  });
});

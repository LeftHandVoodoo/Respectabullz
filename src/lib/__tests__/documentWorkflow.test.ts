import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
  createManagedDocument,
  deleteManagedDocument,
  updateManagedDocument,
} from '@/lib/documentWorkflow';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const commandDocument = {
  id: 'document-1',
  filename: '1700000000000-abc123.pdf',
  originalName: 'record.pdf',
  filePath: 'documents/1700000000000-abc123.pdf',
  mimeType: 'application/pdf',
  fileSize: 42,
  notes: 'notes',
  uploadedAt: '2026-07-14 12:00:00',
  updatedAt: '2026-07-14 12:00:00',
};

describe('document workflow bridge', () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it('sends one create request and converts database dates', async () => {
    mockInvoke.mockResolvedValue(commandDocument);

    const result = await createManagedDocument({
      sourcePath: 'C:\\selected\\record.pdf',
      entityType: 'dog',
      entityId: 'dog-1',
      notes: 'notes',
      tagIds: ['tag-1'],
    });

    expect(mockInvoke).toHaveBeenCalledOnce();
    expect(mockInvoke).toHaveBeenCalledWith('create_document_with_file', {
      request: {
        sourcePath: 'C:\\selected\\record.pdf',
        entityType: 'dog',
        entityId: 'dog-1',
        notes: 'notes',
        tagIds: ['tag-1'],
      },
    });
    expect(result.uploadedAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('updates notes and tags through one command', async () => {
    mockInvoke.mockResolvedValue({ ...commandDocument, notes: 'changed' });

    const result = await updateManagedDocument('document-1', {
      notes: 'changed',
      tagIds: ['tag-2'],
    });

    expect(mockInvoke).toHaveBeenCalledWith('update_document_metadata', {
      request: {
        documentId: 'document-1',
        notes: 'changed',
        tagIds: ['tag-2'],
      },
    });
    expect(result.notes).toBe('changed');
  });

  it.each([
    ['file failure', { code: 'file_promotion_failed', message: 'Could not promote file.' }],
    ['database failure', { code: 'database_write_failed', message: 'Could not write row.' }],
    [
      'cleanup failure',
      {
        code: 'database_commit_failed',
        message: 'Cleanup was deferred.',
        cleanupResidue: 'documents/.staging/recoverable-file',
      },
    ],
  ])('preserves the typed %s from the Rust workflow', async (_label, error) => {
    mockInvoke.mockRejectedValue(error);

    await expect(
      createManagedDocument({
        sourcePath: 'C:\\selected\\record.pdf',
        entityType: 'dog',
        entityId: 'dog-1',
        tagIds: [],
      })
    ).rejects.toEqual(error);
  });

  it('returns recoverable cleanup residue after a committed delete', async () => {
    mockInvoke.mockResolvedValue({
      deleted: true,
      cleanupResidue: 'documents/.quarantine/recoverable-file',
    });

    await expect(deleteManagedDocument('document-1')).resolves.toEqual({
      deleted: true,
      cleanupResidue: 'documents/.quarantine/recoverable-file',
    });
  });
});

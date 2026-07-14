import { invoke } from '@tauri-apps/api/core';
import type { CreateDocumentInput, Document, UpdateDocumentInput } from '@/types';

interface CommandDocument {
  id: string;
  filename: string;
  originalName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  notes?: string | null;
  uploadedAt: string;
  updatedAt: string;
}

export interface DeleteDocumentResult {
  deleted: boolean;
  cleanupResidue?: string | null;
}

export interface DocumentWorkflowError {
  code: string;
  message: string;
  cleanupResidue?: string | null;
}

export function documentWorkflowErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object'
    && error !== null
    && 'message' in error
    && typeof error.message === 'string'
  ) {
    return error.message;
  }
  return error instanceof Error ? error.message : fallback;
}

function fromCommandDocument(document: CommandDocument): Document {
  return {
    ...document,
    uploadedAt: new Date(document.uploadedAt),
    updatedAt: new Date(document.updatedAt),
  };
}

export async function createManagedDocument(input: CreateDocumentInput): Promise<Document> {
  const document = await invoke<CommandDocument>('create_document_with_file', {
    request: input,
  });
  return fromCommandDocument(document);
}

export async function updateManagedDocument(
  documentId: string,
  input: UpdateDocumentInput
): Promise<Document> {
  const document = await invoke<CommandDocument>('update_document_metadata', {
    request: {
      documentId,
      notes: input.notes ?? null,
      tagIds: input.tagIds,
    },
  });
  return fromCommandDocument(document);
}

export async function replaceManagedDocumentTags(
  documentId: string,
  tagIds: string[]
): Promise<void> {
  await invoke('replace_document_tags', {
    request: { documentId, tagIds },
  });
}

export async function deleteManagedDocument(documentId: string): Promise<DeleteDocumentResult> {
  return invoke<DeleteDocumentResult>('delete_document_recoverable', { documentId });
}

export async function openManagedDocument(filename: string): Promise<void> {
  await invoke('open_managed_document', { filename });
}

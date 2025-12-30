import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db/documents';
import type { CreateDocumentInput, UpdateDocumentInput } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/lib/errorTracking';

// ============================================
// DOCUMENT QUERIES
// ============================================

/**
 * Get all documents
 */
export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: db.getDocuments,
  });
}

/**
 * Get a single document by ID
 */
export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: () => (id ? db.getDocument(id) : null),
    enabled: !!id,
  });
}

/**
 * Get a document with all its relations (tags, linked entities)
 */
export function useDocumentWithRelations(id: string | undefined) {
  return useQuery({
    queryKey: ['documents', id, 'relations'],
    queryFn: () => (id ? db.getDocumentWithRelations(id) : null),
    enabled: !!id,
  });
}

/**
 * Get documents for a specific dog
 */
export function useDocumentsForDog(dogId: string | undefined) {
  return useQuery({
    queryKey: ['documents', 'dog', dogId],
    queryFn: () => (dogId ? db.getDocumentsForDog(dogId) : []),
    enabled: !!dogId,
  });
}

/**
 * Get documents for a specific litter
 */
export function useDocumentsForLitter(litterId: string | undefined) {
  return useQuery({
    queryKey: ['documents', 'litter', litterId],
    queryFn: () => (litterId ? db.getDocumentsForLitter(litterId) : []),
    enabled: !!litterId,
  });
}

/**
 * Get documents for a specific expense
 */
export function useDocumentsForExpense(expenseId: string | undefined) {
  return useQuery({
    queryKey: ['documents', 'expense', expenseId],
    queryFn: () => (expenseId ? db.getDocumentsForExpense(expenseId) : []),
    enabled: !!expenseId,
  });
}

/**
 * Get document count for a dog
 */
export function useDocumentCountForDog(dogId: string | undefined) {
  return useQuery({
    queryKey: ['documents', 'count', 'dog', dogId],
    queryFn: () => (dogId ? db.getDocumentCountForDog(dogId) : 0),
    enabled: !!dogId,
  });
}

/**
 * Get document count for a litter
 */
export function useDocumentCountForLitter(litterId: string | undefined) {
  return useQuery({
    queryKey: ['documents', 'count', 'litter', litterId],
    queryFn: () => (litterId ? db.getDocumentCountForLitter(litterId) : 0),
    enabled: !!litterId,
  });
}

/**
 * Get document count for an expense
 */
export function useDocumentCountForExpense(expenseId: string | undefined) {
  return useQuery({
    queryKey: ['documents', 'count', 'expense', expenseId],
    queryFn: () => (expenseId ? db.getDocumentCountForExpense(expenseId) : 0),
    enabled: !!expenseId,
  });
}

/**
 * Get documents by tag
 */
export function useDocumentsByTag(tagId: string | undefined) {
  return useQuery({
    queryKey: ['documents', 'tag', tagId],
    queryFn: () => (tagId ? db.getDocumentsByTag(tagId) : []),
    enabled: !!tagId,
  });
}

// ============================================
// DOCUMENT MUTATIONS
// ============================================

/**
 * Create a new document
 */
export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDocumentInput) => db.createDocument(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: 'Document uploaded',
        description: 'The document has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to upload document. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to create document', error as Error);
    },
  });
}

/**
 * Update a document
 */
export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentInput }) =>
      db.updateDocument(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents', variables.id] });
      toast({
        title: 'Document updated',
        description: 'The document has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update document. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to update document', error as Error);
    },
  });
}

/**
 * Delete a document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: 'Document deleted',
        description: 'The document has been removed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete document. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to delete document', error as Error);
    },
  });
}

// ============================================
// DOCUMENT LINKING MUTATIONS
// ============================================

/**
 * Link a document to a dog
 */
export function useLinkDocumentToDog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, dogId }: { documentId: string; dogId: string }) =>
      db.linkDocumentToDog(documentId, dogId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'dog', variables.dogId] });
      queryClient.invalidateQueries({ queryKey: ['documents', 'count', 'dog', variables.dogId] });
      queryClient.invalidateQueries({ queryKey: ['documents', variables.documentId] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to link document. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to link document to dog', error as Error);
    },
  });
}

/**
 * Unlink a document from a dog
 */
export function useUnlinkDocumentFromDog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, dogId }: { documentId: string; dogId: string }) =>
      db.unlinkDocumentFromDog(documentId, dogId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'dog', variables.dogId] });
      queryClient.invalidateQueries({ queryKey: ['documents', 'count', 'dog', variables.dogId] });
      queryClient.invalidateQueries({ queryKey: ['documents', variables.documentId] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to unlink document. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to unlink document from dog', error as Error);
    },
  });
}

/**
 * Link a document to a litter
 */
export function useLinkDocumentToLitter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, litterId }: { documentId: string; litterId: string }) =>
      db.linkDocumentToLitter(documentId, litterId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'litter', variables.litterId] });
      queryClient.invalidateQueries({ queryKey: ['documents', 'count', 'litter', variables.litterId] });
      queryClient.invalidateQueries({ queryKey: ['documents', variables.documentId] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to link document. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to link document to litter', error as Error);
    },
  });
}

/**
 * Unlink a document from a litter
 */
export function useUnlinkDocumentFromLitter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, litterId }: { documentId: string; litterId: string }) =>
      db.unlinkDocumentFromLitter(documentId, litterId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'litter', variables.litterId] });
      queryClient.invalidateQueries({ queryKey: ['documents', 'count', 'litter', variables.litterId] });
      queryClient.invalidateQueries({ queryKey: ['documents', variables.documentId] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to unlink document. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to unlink document from litter', error as Error);
    },
  });
}

/**
 * Link a document to an expense
 */
export function useLinkDocumentToExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, expenseId }: { documentId: string; expenseId: string }) =>
      db.linkDocumentToExpense(documentId, expenseId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'expense', variables.expenseId] });
      queryClient.invalidateQueries({ queryKey: ['documents', 'count', 'expense', variables.expenseId] });
      queryClient.invalidateQueries({ queryKey: ['documents', variables.documentId] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to link document. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to link document to expense', error as Error);
    },
  });
}

/**
 * Unlink a document from an expense
 */
export function useUnlinkDocumentFromExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, expenseId }: { documentId: string; expenseId: string }) =>
      db.unlinkDocumentFromExpense(documentId, expenseId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'expense', variables.expenseId] });
      queryClient.invalidateQueries({ queryKey: ['documents', 'count', 'expense', variables.expenseId] });
      queryClient.invalidateQueries({ queryKey: ['documents', variables.documentId] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to unlink document. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to unlink document from expense', error as Error);
    },
  });
}


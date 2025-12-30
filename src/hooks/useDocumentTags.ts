import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db/documents';
import type { CreateDocumentTagInput } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/lib/errorTracking';

/**
 * Get all document tags
 */
export function useDocumentTags() {
  return useQuery({
    queryKey: ['documentTags'],
    queryFn: db.getDocumentTags,
  });
}

/**
 * Get a single document tag by ID
 */
export function useDocumentTag(id: string | undefined) {
  return useQuery({
    queryKey: ['documentTags', id],
    queryFn: () => (id ? db.getDocumentTag(id) : null),
    enabled: !!id,
  });
}

/**
 * Create a new custom tag
 */
export function useCreateDocumentTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDocumentTagInput) => 
      db.createDocumentTag({ ...input, isCustom: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTags'] });
      toast({
        title: 'Tag created',
        description: 'The custom tag has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create tag. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to create document tag', error as Error);
    },
  });
}

/**
 * Delete a custom tag
 */
export function useDeleteDocumentTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteDocumentTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTags'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: 'Tag deleted',
        description: 'The custom tag has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete tag. Only custom tags can be deleted.',
        variant: 'destructive',
      });
      logger.error('Failed to delete document tag', error as Error);
    },
  });
}

/**
 * Add a tag to a document
 */
export function useAddTagToDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, tagId }: { documentId: string; tagId: string }) =>
      db.addTagToDocument(documentId, tagId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add tag. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to add tag to document', error as Error);
    },
  });
}

/**
 * Remove a tag from a document
 */
export function useRemoveTagFromDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, tagId }: { documentId: string; tagId: string }) =>
      db.removeTagFromDocument(documentId, tagId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to remove tag. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to remove tag from document', error as Error);
    },
  });
}

/**
 * Set all tags for a document (replaces existing)
 */
export function useSetDocumentTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, tagIds }: { documentId: string; tagIds: string[] }) =>
      db.setDocumentTags(documentId, tagIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update tags. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to set document tags', error as Error);
    },
  });
}


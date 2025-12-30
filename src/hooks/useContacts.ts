import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import type {
  CreateContactInput,
  UpdateContactInput,
  CreateContactCategoryInput,
  UpdateContactCategoryInput,
} from '@/types';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/lib/errorTracking';

// ============================================
// CONTACTS
// ============================================

export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: db.getContacts,
  });
}

export function useContact(id: string | undefined) {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: () => (id ? db.getContact(id) : null),
    enabled: !!id,
  });
}

export function useContactsByCategory(categoryId: string | undefined) {
  return useQuery({
    queryKey: ['contacts', 'category', categoryId],
    queryFn: () => (categoryId ? db.getContactsByCategory(categoryId) : []),
    enabled: !!categoryId,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateContactInput) => db.createContact(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: 'Contact created',
        description: 'The contact has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create contact. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to create contact', error as Error);
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactInput }) =>
      db.updateContact(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', variables.id] });
      toast({
        title: 'Contact updated',
        description: 'The contact has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update contact. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to update contact', error as Error);
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: 'Contact deleted',
        description: 'The contact has been removed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete contact. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to delete contact', error as Error);
    },
  });
}

// ============================================
// CONTACT CATEGORIES
// ============================================

export function useContactCategories() {
  return useQuery({
    queryKey: ['contactCategories'],
    queryFn: db.getContactCategories,
  });
}

export function useContactCategory(id: string | undefined) {
  return useQuery({
    queryKey: ['contactCategories', id],
    queryFn: () => (id ? db.getContactCategory(id) : null),
    enabled: !!id,
  });
}

export function useCreateContactCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateContactCategoryInput) => db.createContactCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactCategories'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: 'Category created',
        description: 'The contact category has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create category. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to create contact category', error as Error);
    },
  });
}

export function useUpdateContactCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactCategoryInput }) =>
      db.updateContactCategory(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contactCategories'] });
      queryClient.invalidateQueries({ queryKey: ['contactCategories', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: 'Category updated',
        description: 'The contact category has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update category. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to update contact category', error as Error);
    },
  });
}

export function useDeleteContactCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteContactCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactCategories'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: 'Category deleted',
        description: 'The contact category has been removed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete category. Only custom categories can be deleted.',
        variant: 'destructive',
      });
      logger.error('Failed to delete contact category', error as Error);
    },
  });
}

// ============================================
// CONTACT CATEGORY LINKS
// ============================================

export function useSetContactCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, categoryIds }: { contactId: string; categoryIds: string[] }) =>
      db.setContactCategories(contactId, categoryIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update contact categories. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to set contact categories', error as Error);
    },
  });
}

export function useAddCategoryToContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, categoryId }: { contactId: string; categoryId: string }) =>
      db.addCategoryToContact(contactId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add category to contact. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to add category to contact', error as Error);
    },
  });
}

export function useRemoveCategoryFromContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, categoryId }: { contactId: string; categoryId: string }) =>
      db.removeCategoryFromContact(contactId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to remove category from contact. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to remove category from contact', error as Error);
    },
  });
}

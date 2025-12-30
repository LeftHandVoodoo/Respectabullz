import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import type { CreateWaitlistEntryInput, UpdateWaitlistEntryInput } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/lib/errorTracking';

export function useWaitlistEntries(litterId?: string) {
  return useQuery({
    queryKey: ['waitlist', litterId],
    queryFn: () => db.getWaitlistEntries(litterId),
  });
}

export function useGeneralWaitlist() {
  return useQuery({
    queryKey: ['waitlist', 'general'],
    queryFn: db.getGeneralWaitlist,
  });
}

export function useWaitlistEntry(id: string | undefined) {
  return useQuery({
    queryKey: ['waitlist', id],
    queryFn: () => (id ? db.getWaitlistEntry(id) : null),
    enabled: !!id,
  });
}

export function useClientWaitlistEntries(clientId: string | undefined) {
  return useQuery({
    queryKey: ['waitlist', 'client', clientId],
    queryFn: () => (clientId ? db.getWaitlistEntriesByClient(clientId) : []),
    enabled: !!clientId,
  });
}

export function useCreateWaitlistEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWaitlistEntryInput) => db.createWaitlistEntry(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      toast({
        title: 'Added to waitlist',
        description: 'The client has been added to the waitlist.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add to waitlist. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to create waitlist entry', error as Error);
    },
  });
}

export function useUpdateWaitlistEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWaitlistEntryInput }) =>
      db.updateWaitlistEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      toast({
        title: 'Waitlist updated',
        description: 'The waitlist entry has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update waitlist. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to update waitlist entry', error as Error);
    },
  });
}

export function useDeleteWaitlistEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteWaitlistEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      toast({
        title: 'Removed from waitlist',
        description: 'The client has been removed from the waitlist.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to remove from waitlist. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to delete waitlist entry', error as Error);
    },
  });
}

export function useReorderWaitlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ litterId, entryIds }: { litterId: string | null; entryIds: string[] }) =>
      db.reorderWaitlist(litterId, entryIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to reorder waitlist. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to reorder waitlist', error as Error);
    },
  });
}

export function useMatchPuppyToWaitlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, puppyId }: { entryId: string; puppyId: string }) =>
      db.matchPuppyToWaitlist(entryId, puppyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      toast({
        title: 'Puppy matched',
        description: 'The puppy has been matched to the waitlist entry.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to match puppy. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to match puppy to waitlist', error as Error);
    },
  });
}

export function useConvertWaitlistToSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, saleId }: { entryId: string; saleId: string }) =>
      db.convertWaitlistToSale(entryId, saleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast({
        title: 'Converted to sale',
        description: 'The waitlist entry has been converted to a sale.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to convert to sale. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to convert waitlist to sale', error as Error);
    },
  });
}


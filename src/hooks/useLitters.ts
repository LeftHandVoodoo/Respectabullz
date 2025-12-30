import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import type { CreateLitterInput, UpdateLitterInput } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/lib/errorTracking';

export function useLitters() {
  return useQuery({
    queryKey: ['litters'],
    queryFn: db.getLitters,
  });
}

export function useLitter(id: string | undefined) {
  return useQuery({
    queryKey: ['litters', id],
    queryFn: () => (id ? db.getLitter(id) : null),
    enabled: !!id,
  });
}

export function useCreateLitter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLitterInput) => db.createLitter(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['litters'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Litter created',
        description: 'The litter has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create litter. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to create litter', error as Error);
    },
  });
}

export function useUpdateLitter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLitterInput }) =>
      db.updateLitter(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['litters'] });
      queryClient.invalidateQueries({ queryKey: ['litters', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Litter updated',
        description: 'The litter has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update litter. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to update litter', error as Error);
    },
  });
}

export function useDeleteLitter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteLitter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['litters'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Litter deleted',
        description: 'The litter has been removed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete litter. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to delete litter', error as Error);
    },
  });
}


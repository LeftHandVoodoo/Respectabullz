import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import type { CreateDogInput, UpdateDogInput } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/lib/errorTracking';

export function useDogs() {
  return useQuery({
    queryKey: ['dogs'],
    queryFn: db.getDogs,
  });
}

export function useDog(id: string | undefined) {
  return useQuery({
    queryKey: ['dogs', id],
    queryFn: () => (id ? db.getDog(id) : null),
    enabled: !!id,
  });
}

export function useCreateDog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDogInput) => db.createDog(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      queryClient.invalidateQueries({ queryKey: ['litters'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Dog created',
        description: 'The dog has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create dog. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to create dog', error as Error);
    },
  });
}

export function useUpdateDog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDogInput }) =>
      db.updateDog(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      queryClient.invalidateQueries({ queryKey: ['dogs', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['litters'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Dog updated',
        description: 'The dog has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update dog. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to update dog', error as Error);
    },
  });
}

export function useDeleteDog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteDog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      queryClient.invalidateQueries({ queryKey: ['litters'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Dog deleted',
        description: 'The dog has been removed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete dog. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to delete dog', error as Error);
    },
  });
}


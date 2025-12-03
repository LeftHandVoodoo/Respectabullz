import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import type { CreateExternalStudInput, UpdateExternalStudInput } from '@/types';
import { toast } from '@/components/ui/use-toast';

export function useExternalStuds() {
  return useQuery({
    queryKey: ['externalStuds'],
    queryFn: db.getExternalStuds,
  });
}

export function useExternalStud(id: string | undefined) {
  return useQuery({
    queryKey: ['externalStuds', id],
    queryFn: () => (id ? db.getExternalStud(id) : null),
    enabled: !!id,
  });
}

export function useCreateExternalStud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateExternalStudInput) => db.createExternalStud(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['externalStuds'] });
      toast({
        title: 'Stud added',
        description: 'The external stud has been added to your database.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add stud. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to create external stud:', error);
    },
  });
}

export function useUpdateExternalStud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExternalStudInput }) =>
      db.updateExternalStud(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['externalStuds'] });
      toast({
        title: 'Stud updated',
        description: 'The external stud has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update stud. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to update external stud:', error);
    },
  });
}

export function useDeleteExternalStud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteExternalStud(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['externalStuds'] });
      toast({
        title: 'Stud removed',
        description: 'The external stud has been removed from your database.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to remove stud. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to delete external stud:', error);
    },
  });
}

// Heat cycle prediction hooks
export function useHeatCyclePrediction(dogId: string | undefined) {
  return useQuery({
    queryKey: ['heatCyclePrediction', dogId],
    queryFn: () => (dogId ? db.getHeatCyclePrediction(dogId) : null),
    enabled: !!dogId,
  });
}

export function useFemalesExpectingHeatSoon(days: number = 30) {
  return useQuery({
    queryKey: ['femalesExpectingHeat', days],
    queryFn: () => db.getFemalesExpectingHeatSoon(days),
  });
}


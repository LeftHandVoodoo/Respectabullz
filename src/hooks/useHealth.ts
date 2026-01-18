import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import type { VaccinationRecord, WeightEntry, MedicalRecord } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/lib/errorTracking';

// ============================================
// VACCINATIONS
// ============================================

export function useVaccinations(dogId?: string) {
  return useQuery({
    queryKey: ['vaccinations', dogId],
    queryFn: () => db.getVaccinations(dogId),
  });
}

export function useCreateVaccination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<VaccinationRecord, 'id' | 'createdAt' | 'updatedAt'>) =>
      db.createVaccination(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations'] });
      queryClient.invalidateQueries({ queryKey: ['dogs', variables.dogId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Vaccination recorded',
        description: 'The vaccination has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to record vaccination. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to create vaccination', error as Error);
    },
  });
}

export function useUpdateVaccination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VaccinationRecord> }) =>
      db.updateVaccination(id, data),
    onMutate: async () => {
      // Cancel any outgoing refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['vaccinations'] });

      // Snapshot the previous value for potential rollback
      const previousVaccinations = queryClient.getQueryData(['vaccinations']);

      return { previousVaccinations };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Vaccination updated',
        description: 'The vaccination has been updated successfully.',
      });
    },
    onError: (error, variables, context) => {
      // Rollback to previous state on error
      if (context?.previousVaccinations) {
        queryClient.setQueryData(['vaccinations'], context.previousVaccinations);
      }
      // Force refetch to ensure sync with server state
      queryClient.invalidateQueries({ queryKey: ['vaccinations'] });

      toast({
        title: 'Error',
        description: 'Failed to update vaccination. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to update vaccination', error as Error, { variables });
    },
  });
}

export function useDeleteVaccination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteVaccination(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Vaccination deleted',
        description: 'The vaccination has been removed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete vaccination. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to delete vaccination', error as Error);
    },
  });
}

// ============================================
// WEIGHT ENTRIES
// ============================================

export function useWeightEntries(dogId?: string) {
  return useQuery({
    queryKey: ['weights', dogId],
    queryFn: () => db.getWeightEntries(dogId),
  });
}

export function useCreateWeightEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<WeightEntry, 'id' | 'createdAt'>) =>
      db.createWeightEntry(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['weights'] });
      queryClient.invalidateQueries({ queryKey: ['dogs', variables.dogId] });
      toast({
        title: 'Weight recorded',
        description: 'The weight entry has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to record weight. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to create weight entry', error as Error);
    },
  });
}

export function useUpdateWeightEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WeightEntry> }) =>
      db.updateWeightEntry(id, data),
    onMutate: async () => {
      // Cancel any outgoing refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['weights'] });

      // Snapshot the previous value for potential rollback
      const previousWeights = queryClient.getQueryData(['weights']);

      return { previousWeights };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weights'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      toast({
        title: 'Weight entry updated',
        description: 'The weight entry has been updated successfully.',
      });
    },
    onError: (error, variables, context) => {
      // Rollback to previous state on error
      if (context?.previousWeights) {
        queryClient.setQueryData(['weights'], context.previousWeights);
      }
      // Force refetch to ensure sync with server state
      queryClient.invalidateQueries({ queryKey: ['weights'] });

      toast({
        title: 'Error',
        description: 'Failed to update weight entry. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to update weight entry', error as Error, { variables });
    },
  });
}

export function useDeleteWeightEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteWeightEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weights'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      toast({
        title: 'Weight entry deleted',
        description: 'The weight entry has been removed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete weight entry. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to delete weight entry', error as Error);
    },
  });
}

// ============================================
// MEDICAL RECORDS
// ============================================

export function useMedicalRecords(dogId?: string) {
  return useQuery({
    queryKey: ['medical', dogId],
    queryFn: () => db.getMedicalRecords(dogId),
  });
}

export function useCreateMedicalRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>) =>
      db.createMedicalRecord(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['medical'] });
      queryClient.invalidateQueries({ queryKey: ['dogs', variables.dogId] });
      toast({
        title: 'Medical record added',
        description: 'The medical record has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add medical record. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to create medical record', error as Error);
    },
  });
}

export function useUpdateMedicalRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MedicalRecord> }) =>
      db.updateMedicalRecord(id, data),
    onMutate: async () => {
      // Cancel any outgoing refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['medical'] });

      // Snapshot the previous value for potential rollback
      const previousMedical = queryClient.getQueryData(['medical']);

      return { previousMedical };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      toast({
        title: 'Medical record updated',
        description: 'The medical record has been updated successfully.',
      });
    },
    onError: (error, variables, context) => {
      // Rollback to previous state on error
      if (context?.previousMedical) {
        queryClient.setQueryData(['medical'], context.previousMedical);
      }
      // Force refetch to ensure sync with server state
      queryClient.invalidateQueries({ queryKey: ['medical'] });

      toast({
        title: 'Error',
        description: 'Failed to update medical record. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to update medical record', error as Error, { variables });
    },
  });
}

export function useDeleteMedicalRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteMedicalRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      toast({
        title: 'Medical record deleted',
        description: 'The medical record has been removed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete medical record. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to delete medical record', error as Error);
    },
  });
}


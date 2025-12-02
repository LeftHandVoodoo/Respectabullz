import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import type { VaccinationRecord, WeightEntry, MedicalRecord } from '@/types';
import { toast } from '@/components/ui/use-toast';

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
      console.error('Failed to create vaccination:', error);
    },
  });
}

export function useUpdateVaccination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VaccinationRecord> }) =>
      db.updateVaccination(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Vaccination updated',
        description: 'The vaccination has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update vaccination. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to update vaccination:', error);
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
      console.error('Failed to delete vaccination:', error);
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
      console.error('Failed to create weight entry:', error);
    },
  });
}

export function useUpdateWeightEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WeightEntry> }) =>
      db.updateWeightEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weights'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      toast({
        title: 'Weight entry updated',
        description: 'The weight entry has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update weight entry. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to update weight entry:', error);
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
      console.error('Failed to delete weight entry:', error);
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
      console.error('Failed to create medical record:', error);
    },
  });
}

export function useUpdateMedicalRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MedicalRecord> }) =>
      db.updateMedicalRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      toast({
        title: 'Medical record updated',
        description: 'The medical record has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update medical record. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to update medical record:', error);
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
      console.error('Failed to delete medical record:', error);
    },
  });
}


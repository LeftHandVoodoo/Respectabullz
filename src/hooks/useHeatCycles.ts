import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import type { HeatCycle } from '@/types';
import { toast } from '@/components/ui/use-toast';

export function useHeatCycles(bitchId?: string) {
  return useQuery({
    queryKey: ['heatCycles', bitchId],
    queryFn: () => db.getHeatCycles(bitchId),
  });
}

export function useCreateHeatCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<HeatCycle, 'id' | 'createdAt' | 'updatedAt' | 'bitch' | 'events'>) =>
      db.createHeatCycle(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['heatCycles'] });
      queryClient.invalidateQueries({ queryKey: ['dogs', variables.bitchId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Heat cycle recorded',
        description: 'The heat cycle has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to record heat cycle. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to create heat cycle:', error);
    },
  });
}

export function useUpdateHeatCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HeatCycle> }) =>
      db.updateHeatCycle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['heatCycles'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Heat cycle updated',
        description: 'The heat cycle has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update heat cycle. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to update heat cycle:', error);
    },
  });
}

export function useDeleteHeatCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteHeatCycle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['heatCycles'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Heat cycle deleted',
        description: 'The heat cycle has been removed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete heat cycle. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to delete heat cycle:', error);
    },
  });
}


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import type { HeatEvent } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/lib/errorTracking';

export function useHeatEvents(heatCycleId: string | undefined) {
  return useQuery({
    queryKey: ['heatEvents', heatCycleId],
    queryFn: () => (heatCycleId ? db.getHeatEvents(heatCycleId) : []),
    enabled: !!heatCycleId,
  });
}

export function useHeatCycle(id: string | undefined) {
  return useQuery({
    queryKey: ['heatCycles', id],
    queryFn: () => (id ? db.getHeatCycle(id) : null),
    enabled: !!id,
  });
}

export function useCreateHeatEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<HeatEvent, 'id' | 'createdAt' | 'heatCycle' | 'sire'>) =>
      db.createHeatEvent(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['heatEvents', variables.heatCycleId] });
      queryClient.invalidateQueries({ queryKey: ['heatCycles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Event recorded',
        description: 'The heat cycle event has been logged successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to record event. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to create heat event', error as Error);
    },
  });
}

export function useUpdateHeatEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HeatEvent> }) =>
      db.updateHeatEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['heatEvents'] });
      queryClient.invalidateQueries({ queryKey: ['heatCycles'] });
      toast({
        title: 'Event updated',
        description: 'The heat cycle event has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update event. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to update heat event', error as Error);
    },
  });
}

export function useDeleteHeatEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteHeatEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['heatEvents'] });
      queryClient.invalidateQueries({ queryKey: ['heatCycles'] });
      toast({
        title: 'Event deleted',
        description: 'The heat cycle event has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete event. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to delete heat event', error as Error);
    },
  });
}


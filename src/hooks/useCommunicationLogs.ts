import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import type { CreateCommunicationLogInput, UpdateCommunicationLogInput } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/lib/errorTracking';

export function useCommunicationLogs(clientId?: string) {
  return useQuery({
    queryKey: ['communicationLogs', clientId],
    queryFn: () => db.getCommunicationLogs(clientId),
  });
}

export function useCommunicationLog(id: string | undefined) {
  return useQuery({
    queryKey: ['communicationLogs', id],
    queryFn: () => (id ? db.getCommunicationLog(id) : null),
    enabled: !!id,
  });
}

export function useFollowUpsDue() {
  return useQuery({
    queryKey: ['communicationLogs', 'followUps', 'due'],
    queryFn: db.getFollowUpsDue,
  });
}

export function useOverdueFollowUps() {
  return useQuery({
    queryKey: ['communicationLogs', 'followUps', 'overdue'],
    queryFn: db.getOverdueFollowUps,
  });
}

export function useCreateCommunicationLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCommunicationLogInput) => db.createCommunicationLog(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communicationLogs'] });
      toast({
        title: 'Communication logged',
        description: 'The communication has been recorded.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to log communication. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to create communication log', error as Error);
    },
  });
}

export function useUpdateCommunicationLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCommunicationLogInput }) =>
      db.updateCommunicationLog(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communicationLogs'] });
      toast({
        title: 'Communication updated',
        description: 'The communication record has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update communication. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to update communication log', error as Error);
    },
  });
}

export function useDeleteCommunicationLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteCommunicationLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communicationLogs'] });
      toast({
        title: 'Communication deleted',
        description: 'The communication record has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete communication. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to delete communication log', error as Error);
    },
  });
}

export function useCompleteFollowUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.completeFollowUp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communicationLogs'] });
      toast({
        title: 'Follow-up completed',
        description: 'The follow-up has been marked as complete.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to complete follow-up. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to complete follow-up', error as Error);
    },
  });
}


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import type { CreateTransportInput, UpdateTransportInput } from '@/types';
import { toast } from '@/components/ui/use-toast';

export function useTransports(dogId?: string) {
  return useQuery({
    queryKey: ['transports', dogId],
    queryFn: () => db.getTransports(dogId),
  });
}

export function useCreateTransport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTransportInput) => db.createTransport(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transports'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dogs', variables.dogId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Transport recorded',
        description: variables.cost && variables.cost > 0 
          ? 'Transport and expense have been added successfully.'
          : 'The transport has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to record transport. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to create transport:', error);
    },
  });
}

export function useUpdateTransport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransportInput }) =>
      db.updateTransport(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transports'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Transport updated',
        description: 'The transport has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update transport. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to update transport:', error);
    },
  });
}

export function useDeleteTransport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteTransport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transports'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      toast({
        title: 'Transport deleted',
        description: 'The transport has been removed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete transport. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to delete transport:', error);
    },
  });
}


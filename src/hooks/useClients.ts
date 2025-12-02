import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import type { CreateClientInput, UpdateClientInput, Sale } from '@/types';
import { toast } from '@/components/ui/use-toast';

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: db.getClients,
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => (id ? db.getClient(id) : null),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateClientInput) => db.createClient(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Client created',
        description: 'The client has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create client. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to create client:', error);
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientInput }) =>
      db.updateClient(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', variables.id] });
      toast({
        title: 'Client updated',
        description: 'The client has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update client. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to update client:', error);
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Client deleted',
        description: 'The client has been removed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete client. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to delete client:', error);
    },
  });
}

// Sales
export function useSales() {
  return useQuery({
    queryKey: ['sales'],
    queryFn: db.getSales,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'dog' | 'client'>) =>
      db.createSale(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      toast({
        title: 'Sale recorded',
        description: 'The sale has been recorded successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to record sale. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to create sale:', error);
    },
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      toast({
        title: 'Sale deleted',
        description: 'The sale has been removed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete sale. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to delete sale:', error);
    },
  });
}


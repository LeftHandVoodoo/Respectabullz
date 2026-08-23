import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import type { CreateClientInput, UpdateClientInput, CreateSaleInput, UpdateSaleInput } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/lib/errorTracking';

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
      logger.error('Failed to create client', error as Error);
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientInput }) =>
      db.updateClient(id, data),
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['clients', variables.id] });
      await queryClient.cancelQueries({ queryKey: ['clients'] });

      // Snapshot the previous value for potential rollback
      const previousClient = queryClient.getQueryData(['clients', variables.id]);
      const previousClients = queryClient.getQueryData(['clients']);

      return { previousClient, previousClients };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', variables.id] });
      toast({
        title: 'Client updated',
        description: 'The client has been updated successfully.',
      });
    },
    onError: (error, variables, context) => {
      // Rollback to previous state on error
      if (context?.previousClient) {
        queryClient.setQueryData(['clients', variables.id], context.previousClient);
      }
      if (context?.previousClients) {
        queryClient.setQueryData(['clients'], context.previousClients);
      }
      // Force refetch to ensure sync with server state
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', variables.id] });

      toast({
        title: 'Error',
        description: 'Failed to update client. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to update client', error as Error, { variables });
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
      logger.error('Failed to delete client', error as Error);
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

export function useSale(id: string | undefined) {
  return useQuery({
    queryKey: ['sales', id],
    queryFn: () => (id ? db.getSale(id) : null),
    enabled: !!id,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSaleInput) => {
      const sale = await db.createSale(input);
      if (!sale.puppies?.length) {
        throw new Error('The sale was not returned with its puppy assignments');
      }
      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      queryClient.invalidateQueries({ queryKey: ['clientInterests'] });
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
      logger.error('Failed to create sale', error as Error);
    },
  });
}

export function useUpdateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSaleInput }) => {
      const sale = await db.updateSale(id, data);
      if (!sale || !sale.puppies?.length) {
        throw new Error('The sale update did not preserve its puppy assignments');
      }
      return sale;
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['sales', variables.id] });
      await queryClient.cancelQueries({ queryKey: ['sales'] });

      // Snapshot the previous value for potential rollback
      const previousSale = queryClient.getQueryData(['sales', variables.id]);
      const previousSales = queryClient.getQueryData(['sales']);

      return { previousSale, previousSales };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      toast({
        title: 'Sale updated',
        description: 'The sale has been updated successfully.',
      });
    },
    onError: (error, variables, context) => {
      // Rollback to previous state on error
      if (context?.previousSale) {
        queryClient.setQueryData(['sales', variables.id], context.previousSale);
      }
      if (context?.previousSales) {
        queryClient.setQueryData(['sales'], context.previousSales);
      }
      // Force refetch to ensure sync with server state
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales', variables.id] });

      toast({
        title: 'Error',
        description: 'Failed to update sale. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to update sale', error as Error, { variables });
    },
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const deleted = await db.deleteSale(id);
      if (!deleted) throw new Error('The sale no longer exists');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      queryClient.invalidateQueries({ queryKey: ['clientInterests'] });
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
      logger.error('Failed to delete sale', error as Error);
    },
  });
}


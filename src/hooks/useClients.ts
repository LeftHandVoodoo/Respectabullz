import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import type { CreateClientInput, UpdateClientInput, CreateSaleInput, UpdateSaleInput } from '@/types';
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
    mutationFn: (input: CreateSaleInput) => db.createSale(input),
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
      console.error('Failed to create sale:', error);
    },
  });
}

export function useUpdateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSaleInput }) =>
      db.updateSale(id, data),
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
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update sale. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to update sale:', error);
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
      console.error('Failed to delete sale:', error);
    },
  });
}

// Sale Puppy operations
export function useAddPuppyToSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ saleId, dogId, price }: { saleId: string; dogId: string; price: number }) =>
      db.addPuppyToSale(saleId, dogId, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      toast({
        title: 'Puppy added to sale',
        description: 'The puppy has been added to the sale successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add puppy to sale. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to add puppy to sale:', error);
    },
  });
}

export function useRemovePuppyFromSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ saleId, dogId }: { saleId: string; dogId: string }) =>
      db.removePuppyFromSale(saleId, dogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      toast({
        title: 'Puppy removed from sale',
        description: 'The puppy has been removed from the sale successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to remove puppy from sale. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to remove puppy from sale:', error);
    },
  });
}

export function useUpdatePuppyPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ saleId, dogId, price }: { saleId: string; dogId: string; price: number }) =>
      db.updatePuppyPrice(saleId, dogId, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast({
        title: 'Price updated',
        description: 'The puppy price has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update price. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to update puppy price:', error);
    },
  });
}


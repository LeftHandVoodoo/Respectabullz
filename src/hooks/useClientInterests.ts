import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import type { CreateClientInterestInput, UpdateClientInterestInput, CreateSaleInput } from '@/types';
import { toast } from '@/components/ui/use-toast';

// Get all client interests
export function useClientInterests() {
  return useQuery({
    queryKey: ['clientInterests'],
    queryFn: db.getClientInterests,
  });
}

// Get a single client interest
export function useClientInterest(id: string | undefined) {
  return useQuery({
    queryKey: ['clientInterests', id],
    queryFn: () => (id ? db.getClientInterest(id) : null),
    enabled: !!id,
  });
}

// Get interests by client
export function useInterestsByClient(clientId: string | undefined) {
  return useQuery({
    queryKey: ['clientInterests', 'byClient', clientId],
    queryFn: () => (clientId ? db.getInterestsByClient(clientId) : []),
    enabled: !!clientId,
  });
}

// Get interests by dog
export function useInterestsByDog(dogId: string | undefined) {
  return useQuery({
    queryKey: ['clientInterests', 'byDog', dogId],
    queryFn: () => (dogId ? db.getInterestsByDog(dogId) : []),
    enabled: !!dogId,
  });
}

// Create a new client interest
export function useCreateClientInterest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateClientInterestInput) => db.createClientInterest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientInterests'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      toast({
        title: 'Interest recorded',
        description: 'The client interest has been recorded successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to record interest. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to create client interest:', error);
    },
  });
}

// Update a client interest
export function useUpdateClientInterest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientInterestInput }) =>
      db.updateClientInterest(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientInterests'] });
      queryClient.invalidateQueries({ queryKey: ['clientInterests', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Interest updated',
        description: 'The client interest has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update interest. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to update client interest:', error);
    },
  });
}

// Delete a client interest
export function useDeleteClientInterest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteClientInterest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientInterests'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Interest deleted',
        description: 'The client interest has been removed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete interest. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to delete client interest:', error);
    },
  });
}

// Convert an interest to a sale
export function useConvertInterestToSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ interestId, saleInput }: { interestId: string; saleInput: CreateSaleInput }) => {
      // First create the sale
      const sale = await db.createSale(saleInput);
      // Then convert the interest to link it to the sale
      return db.convertInterestToSale(interestId, sale.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientInterests'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
      toast({
        title: 'Interest converted to sale',
        description: 'The interest has been converted to a sale successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to convert interest to sale. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to convert interest to sale:', error);
    },
  });
}


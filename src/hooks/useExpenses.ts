import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import type { CreateExpenseInput, UpdateExpenseInput } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/lib/errorTracking';

interface ExpenseFilters {
  dogId?: string;
  litterId?: string;
  category?: string;
}

export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => db.getExpenses(filters),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateExpenseInput) => db.createExpense(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Also invalidate transports if this was a transport expense
      // (a linked transport record is created automatically)
      if (variables.category === 'transport') {
        queryClient.invalidateQueries({ queryKey: ['transports'] });
      }
      toast({
        title: 'Expense recorded',
        description: 'The expense has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to record expense. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to create expense', error as Error);
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseInput }) =>
      db.updateExpense(id, data),
    onMutate: async () => {
      // Cancel any outgoing refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['expenses'] });

      // Snapshot the previous value for potential rollback
      const previousExpenses = queryClient.getQueryData(['expenses']);

      return { previousExpenses };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Expense updated',
        description: 'The expense has been updated successfully.',
      });
    },
    onError: (error, variables, context) => {
      // Rollback to previous state on error
      if (context?.previousExpenses) {
        queryClient.setQueryData(['expenses'], context.previousExpenses);
      }
      // Force refetch to ensure sync with server state
      queryClient.invalidateQueries({ queryKey: ['expenses'] });

      toast({
        title: 'Error',
        description: 'Failed to update expense. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to update expense', error as Error, { variables });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Also invalidate transports (linked transport records are deleted automatically)
      queryClient.invalidateQueries({ queryKey: ['transports'] });
      toast({
        title: 'Expense deleted',
        description: 'The expense has been removed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete expense. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to delete expense', error as Error);
    },
  });
}


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import type { CreateExpenseCategoryInput, UpdateExpenseCategoryInput } from '@/lib/db/expenseCategories';
import { toast } from '@/components/ui/use-toast';

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['expenseCategories'],
    queryFn: () => db.getExpenseCategories(),
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateExpenseCategoryInput) => db.createExpenseCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
      toast({
        title: 'Category created',
        description: 'The expense category has been added successfully.',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to create expense category:', error);
      
      let description = 'Failed to create category. Please try again.';
      
      if (errorMessage.includes('UNIQUE') || errorMessage.includes('unique')) {
        description = 'A category with this name already exists.';
      } else if (errorMessage.includes('no such table') || errorMessage.includes('expense_categories')) {
        description = 'Database migration required. Please restart the application.';
      } else if (errorMessage) {
        description = `Error: ${errorMessage}`;
      }
      
      toast({
        title: 'Error',
        description,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseCategoryInput }) =>
      db.updateExpenseCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: 'Category updated',
        description: 'The expense category has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update category. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to update expense category:', error);
    },
  });
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteExpenseCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
      toast({
        title: 'Category deleted',
        description: 'The expense category has been removed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete category. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to delete expense category:', error);
    },
  });
}


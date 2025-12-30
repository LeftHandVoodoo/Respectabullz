import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import type { CreatePuppyHealthTaskInput, UpdatePuppyHealthTaskInput } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/lib/errorTracking';

export function usePuppyHealthTasks(litterId?: string, puppyId?: string) {
  return useQuery({
    queryKey: ['puppyHealthTasks', litterId, puppyId],
    queryFn: () => db.getPuppyHealthTasks(litterId, puppyId),
  });
}

export function usePuppyHealthTask(id: string | undefined) {
  return useQuery({
    queryKey: ['puppyHealthTasks', id],
    queryFn: () => (id ? db.getPuppyHealthTask(id) : null),
    enabled: !!id,
  });
}

export function usePuppyHealthTasksDueThisWeek() {
  return useQuery({
    queryKey: ['puppyHealthTasks', 'dueThisWeek'],
    queryFn: db.getPuppyHealthTasksDueThisWeek,
  });
}

export function useOverduePuppyHealthTasks() {
  return useQuery({
    queryKey: ['puppyHealthTasks', 'overdue'],
    queryFn: db.getOverduePuppyHealthTasks,
  });
}

export function useCreatePuppyHealthTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePuppyHealthTaskInput) => db.createPuppyHealthTask(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['puppyHealthTasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Task created',
        description: 'The health task has been added.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to create puppy health task', error as Error);
    },
  });
}

export function useUpdatePuppyHealthTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePuppyHealthTaskInput }) =>
      db.updatePuppyHealthTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['puppyHealthTasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Task updated',
        description: 'The health task has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to update puppy health task', error as Error);
    },
  });
}

export function useCompletePuppyHealthTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      db.completePuppyHealthTask(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['puppyHealthTasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Task completed',
        description: 'The health task has been marked as complete.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to complete task. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to complete puppy health task', error as Error);
    },
  });
}

export function useUncompletePuppyHealthTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.uncompletePuppyHealthTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['puppyHealthTasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      logger.error('Failed to uncomplete puppy health task', error as Error);
    },
  });
}

export function useDeletePuppyHealthTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deletePuppyHealthTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['puppyHealthTasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Task deleted',
        description: 'The health task has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete task. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to delete puppy health task', error as Error);
    },
  });
}

export function useGeneratePuppyHealthTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ litterId, whelpDate, templateId }: { 
      litterId: string; 
      whelpDate: Date; 
      templateId?: string 
    }) => db.generatePuppyHealthTasksForLitter(litterId, whelpDate, templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['puppyHealthTasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Tasks generated',
        description: 'Health tasks have been created for this litter.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to generate tasks. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to generate puppy health tasks', error as Error);
    },
  });
}

// Health Schedule Template hooks
export function useHealthScheduleTemplates() {
  return useQuery({
    queryKey: ['healthScheduleTemplates'],
    queryFn: db.getHealthScheduleTemplates,
  });
}

export function useDefaultHealthScheduleTemplate() {
  return useQuery({
    queryKey: ['healthScheduleTemplates', 'default'],
    queryFn: db.getDefaultHealthScheduleTemplate,
  });
}


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import { toast } from '@/components/ui/use-toast';
import {
  exportPartialDataWithPhotos,
  getPartialExportInfo,
  isTauriEnvironment
} from '@/lib/backupUtils';
import { logger } from '@/lib/errorTracking';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: db.getSettings,
  });
}

export function useSetting(key: string) {
  return useQuery({
    queryKey: ['settings', key],
    queryFn: () => db.getSetting(key),
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      db.setSetting(key, value),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['settings', variables.key] });
    },
  });
}

export function useExportDatabase() {
  return useMutation({
    mutationFn: db.exportDatabase,
    onSuccess: (data) => {
      // Create and download file
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `respectabullz-partial-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Partial data export created',
        description: 'The supported record subset was exported without photos.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to export database. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to export database', error as Error);
    },
  });
}

// ============================================
// PARTIAL DATA EXPORT WITH PHOTOS (ZIP)
// ============================================

export function usePartialExportInfo() {
  return useQuery({
    queryKey: ['partialExportInfo'],
    queryFn: getPartialExportInfo,
    enabled: isTauriEnvironment(),
    staleTime: 30000, // Cache for 30 seconds
  });
}

export function useExportPartialDataWithPhotos() {
  return useMutation({
    mutationFn: async () => {
      const databaseJson = await db.exportDatabase();
      return exportPartialDataWithPhotos(databaseJson);
    },
    onSuccess: (saved) => {
      if (saved) {
        toast({
          title: 'Partial data export created',
          description: 'The supported record subset and every enumerated managed photo were exported to a ZIP file.',
        });
      }
      // If not saved, user cancelled - no need for a message
    },
    onError: (error) => {
      toast({
        title: 'Partial export failed',
        description: 'No successful ZIP was reported. A managed photo or the selected destination could not be read or written.',
        variant: 'destructive',
      });
      logger.error('Failed to create partial export with photos', error as Error);
    },
  });
}

export function useSeedDatabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: db.seedDatabase,
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: 'Database seeded',
        description: 'Test data has been populated successfully.',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to seed database. Please try again.';
      
      toast({
        title: 'Cannot Seed Test Data',
        description: errorMessage,
        variant: 'destructive',
      });
      logger.error('Failed to seed database', error as Error);
    },
  });
}


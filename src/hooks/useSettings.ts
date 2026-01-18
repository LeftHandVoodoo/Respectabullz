import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import { toast } from '@/components/ui/use-toast';
import {
  exportBackupWithPhotos,
  importBackupWithPhotos,
  getBackupInfo,
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
      a.download = `respectabullz-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Backup created',
        description: 'Your database has been exported successfully.',
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

export function useImportDatabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: string) => db.importDatabase(data),
    onSuccess: (success) => {
      if (success) {
        queryClient.invalidateQueries();
        toast({
          title: 'Backup restored',
          description: 'Your database has been restored successfully.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to restore database. Invalid backup file.',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to restore database. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to import database', error as Error);
    },
  });
}

export function useClearDatabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: db.clearDatabase,
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: 'Database cleared',
        description: 'All data has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to clear database. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to clear database', error as Error);
    },
  });
}

// ============================================
// FULL BACKUP WITH PHOTOS (ZIP)
// ============================================

export function useBackupInfo() {
  return useQuery({
    queryKey: ['backupInfo'],
    queryFn: getBackupInfo,
    enabled: isTauriEnvironment(),
    staleTime: 30000, // Cache for 30 seconds
  });
}

export function useExportBackupWithPhotos() {
  return useMutation({
    mutationFn: async () => {
      const databaseJson = await db.exportDatabase();
      return exportBackupWithPhotos(databaseJson);
    },
    onSuccess: (saved) => {
      if (saved) {
        toast({
          title: 'Full backup created',
          description: 'Database and all photos have been exported to a ZIP file.',
        });
      }
      // If not saved, user cancelled - no need for a message
    },
    onError: (error) => {
      toast({
        title: 'Backup failed',
        description: 'Failed to create backup. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to export backup with photos', error as Error);
    },
  });
}

export function useImportBackupWithPhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importBackupWithPhotos,
    onSuccess: async (result) => {
      // Show metadata validation warnings first if present
      if (result.metadataValidationErrors && result.metadataValidationErrors.length > 0) {
        const errorSummary = result.metadataValidationErrors.length > 3
          ? `${result.metadataValidationErrors.slice(0, 3).join('; ')} (and ${result.metadataValidationErrors.length - 3} more)`
          : result.metadataValidationErrors.join('; ');
        toast({
          title: 'Backup metadata warning',
          description: `Backup metadata validation failed: ${errorSummary}. Restore will continue without metadata.`,
          variant: 'destructive',
        });
      }

      if (result.databaseJson) {
        // Import the database - await to prevent race condition
        const success = await db.importDatabase(result.databaseJson);
        if (success) {
          await queryClient.invalidateQueries();

          // Build success message with photo restore details
          let description = `Database and ${result.photoCount || 0} photo(s) restored successfully.`;

          if (result.failedPhotos && result.failedPhotos.length > 0) {
            const failedCount = result.failedPhotos.length;
            const failedList = result.failedPhotos.length > 3
              ? `${result.failedPhotos.slice(0, 3).join(', ')} (and ${failedCount - 3} more)`
              : result.failedPhotos.join(', ');
            description = `Database restored successfully. ${result.photoCount || 0} photo(s) restored, but ${failedCount} photo(s) failed: ${failedList}`;

            toast({
              title: 'Partial restore completed',
              description,
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Backup restored',
              description,
            });
          }
        } else {
          // Database import failed
          let description = `Photos restored (${result.photoCount || 0}), but database import failed.`;
          if (result.failedPhotos && result.failedPhotos.length > 0) {
            description += ` Additionally, ${result.failedPhotos.length} photo(s) failed to restore.`;
          }
          toast({
            title: 'Partial restore',
            description,
            variant: 'destructive',
          });
        }
      } else if (result.error === 'cancelled') {
        // User cancelled - no message needed
      } else {
        // Complete failure
        let description = result.error || 'Failed to restore backup.';
        if (result.failedPhotos && result.failedPhotos.length > 0) {
          description += ` ${result.failedPhotos.length} photo(s) also failed to restore.`;
        }
        toast({
          title: 'Restore failed',
          description,
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Restore failed',
        description: 'Failed to restore backup. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to import backup with photos', error as Error);
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

export function useUnseedDatabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: db.unseedDatabase,
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: 'Test data removed',
        description: 'All seeded test data has been cleared.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to remove test data. Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to unseed database', error as Error);
    },
  });
}


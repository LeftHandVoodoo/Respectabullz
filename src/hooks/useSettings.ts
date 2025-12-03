import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import { toast } from '@/components/ui/use-toast';
import { 
  exportBackupWithPhotos, 
  importBackupWithPhotos, 
  getBackupInfo,
  isTauriEnvironment 
} from '@/lib/backupUtils';

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
      console.error('Failed to export database:', error);
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
      console.error('Failed to import database:', error);
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
      console.error('Failed to clear database:', error);
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
      console.error('Failed to export backup with photos:', error);
    },
  });
}

export function useImportBackupWithPhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importBackupWithPhotos,
    onSuccess: (result) => {
      if (result.success && result.databaseJson) {
        // Import the database
        db.importDatabase(result.databaseJson).then((success) => {
          if (success) {
            queryClient.invalidateQueries();
            toast({
              title: 'Backup restored',
              description: `Database and ${result.photoCount || 0} photos have been restored.`,
            });
          } else {
            toast({
              title: 'Partial restore',
              description: `Photos restored (${result.photoCount || 0}), but database import failed.`,
              variant: 'destructive',
            });
          }
        });
      } else if (result.error === 'cancelled') {
        // User cancelled - no message needed
      } else {
        toast({
          title: 'Restore failed',
          description: result.error || 'Failed to restore backup.',
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
      console.error('Failed to import backup with photos:', error);
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
      console.error('Failed to seed database:', error);
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
      console.error('Failed to unseed database:', error);
    },
  });
}


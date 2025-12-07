import { useState, useEffect } from 'react';
import { Dog, Database, Sparkles, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { initializeAppDatabase, checkFirstLaunch } from '@/lib/db/init';

const FIRST_LAUNCH_KEY = 'respectabullz_first_launch_complete';

export function FirstLaunchDialog() {
  const [open, setOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [migrationProgress, setMigrationProgress] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    // Initialize database on mount
    // Add a small delay to ensure Tauri is fully initialized
    const initDatabase = async () => {
      setIsInitializing(true);
      
      // Small delay to ensure Tauri plugins are ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        console.log('[FirstLaunch] Starting database initialization...');
        const result = await initializeAppDatabase((stage, current, total) => {
          setMigrationProgress(`Migrating ${stage}: ${current} of ${total}...`);
        });
        
        if (!result.success) {
          const errorMsg = result.error || 'Unknown error occurred';
          console.error('[FirstLaunch] Database initialization failed:', errorMsg);
          toast({
            title: 'Database initialization failed',
            description: `${errorMsg}. Please check the console for details and restart the application.`,
            variant: 'destructive',
          });
          setIsInitializing(false);
          return;
        }
        
        if (result.migrated && result.migratedCounts) {
          const totalMigrated = Object.values(result.migratedCounts).reduce((a, b) => a + b, 0);
          toast({
            title: 'Data migrated successfully',
            description: `Migrated ${totalMigrated} records from localStorage to SQLite.`,
          });
        }
        
        // Check if this is the first launch (no breeder settings)
        const isFirst = await checkFirstLaunch();
        const hasLaunched = localStorage.getItem(FIRST_LAUNCH_KEY);
        
        if (isFirst && !hasLaunched) {
          setOpen(true);
        }
        
        // Initialization complete - hide the loading dialog
        setIsInitializing(false);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error('[FirstLaunch] Database initialization error:', errorMsg);
        console.error('[FirstLaunch] Error stack:', errorStack);
        toast({
          title: 'Initialization error',
          description: `${errorMsg}. Please check the console for details and restart the application.`,
          variant: 'destructive',
        });
        setIsInitializing(false);
      }
    };
    
    initDatabase();
  }, [toast]);

  const handleStartFresh = () => {
    localStorage.setItem(FIRST_LAUNCH_KEY, 'true');
    setOpen(false);
    toast({
      title: 'Welcome to Respectabullz!',
      description: 'Your database is ready. Start by adding your first dog.',
    });
  };

  const handleLoadSampleData = () => {
    // Sample data seeding for SQLite is not yet implemented
    // Users can add data manually through the application
    toast({
      title: 'Sample data coming soon',
      description: 'Sample data seeding for SQLite is being developed. Please start by adding your own dogs and litters.',
    });
    localStorage.setItem(FIRST_LAUNCH_KEY, 'true');
    setOpen(false);
  };

  // Show initialization screen while database is being set up
  if (isInitializing) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue/10">
              <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
            </div>
            <DialogTitle className="text-xl">Initializing Database</DialogTitle>
            <DialogDescription>
              {migrationProgress || 'Setting up your database...'}
            </DialogDescription>
          </DialogHeader>
          {migrationProgress && (
            <div className="py-4">
              <Progress value={50} className="w-full" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue/10">
            <Dog className="h-8 w-8 text-brand-blue" />
          </div>
          <DialogTitle className="text-2xl font-display">
            Welcome to Respectabullz
          </DialogTitle>
          <DialogDescription className="text-base">
            Your professional breeder management system is ready to go.
            How would you like to get started?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-6">
          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-2 p-4 text-left"
            onClick={handleStartFresh}
          >
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-brand-brown" />
              <span className="font-semibold">Start Fresh</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Begin with an empty database. Perfect if you're ready to add your own dogs and litters.
            </span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-2 p-4 text-left"
            onClick={handleLoadSampleData}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-blue" />
              <span className="font-semibold">Load Sample Data</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Explore with demo data including dogs, litters, health records, and more.
              You can clear this later in Settings.
            </span>
          </Button>
        </div>

        <DialogFooter className="sm:justify-center">
          <p className="text-xs text-muted-foreground text-center">
            You can always add sample data later from Settings → Seed Test Data
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


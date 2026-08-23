import { useState, useEffect, type ReactNode } from 'react';
import { Dog, Database, Loader2 } from 'lucide-react';
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
import { initializeAppDatabase, checkFirstLaunch } from '@/lib/db/init';
import { logger } from '@/lib/errorTracking';
import { invoke } from '@tauri-apps/api/core';

const FIRST_LAUNCH_KEY = 'respectabullz_first_launch_complete';

interface FirstLaunchDialogProps {
  children: ReactNode;
}

type BootstrapStatus = 'initializing' | 'ready' | 'error';

export function FirstLaunchDialog({ children }: FirstLaunchDialogProps) {
  const [open, setOpen] = useState(false);
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus>('initializing');
  const [bootstrapError, setBootstrapError] = useState('');
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize database on mount
    // Add a small delay to ensure Tauri is fully initialized
    const initDatabase = async () => {
      setBootstrapStatus('initializing');
      setBootstrapError('');
      
      // Small delay to ensure Tauri plugins are ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        const result = await initializeAppDatabase();
        
        if (!result.success) {
          const errorMsg = result.error || 'Unknown error occurred';
          logger.error('First-launch database initialization failed', undefined, {
            error: errorMsg,
          });
          toast({
            title: 'Database initialization failed',
            description: `${errorMsg}. Please check the console for details and restart the application.`,
            variant: 'destructive',
          });
          setBootstrapError(errorMsg);
          setBootstrapStatus('error');
          return;
        }
        
        // Check if this is the first launch (no breeder settings)
        const isFirst = await checkFirstLaunch();
        const hasLaunched = localStorage.getItem(FIRST_LAUNCH_KEY);
        
        if (isFirst && !hasLaunched) {
          setOpen(true);
        }

        // CI waits for this native marker before treating process liveness as
        // application readiness. Outside GitHub Actions the command is a no-op.
        await invoke('report_application_ready');
        setBootstrapStatus('ready');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error(
          'First-launch database initialization error',
          error instanceof Error ? error : undefined,
        );
        toast({
          title: 'Initialization error',
          description: `${errorMsg}. Please check the console for details and restart the application.`,
          variant: 'destructive',
        });
        setBootstrapError(errorMsg);
        setBootstrapStatus('error');
      }
    };
    
    initDatabase();
  }, [bootstrapAttempt, toast]);

  const handleStartFresh = () => {
    localStorage.setItem(FIRST_LAUNCH_KEY, 'true');
    setOpen(false);
    toast({
      title: 'Welcome to Respectabullz!',
      description: 'Your database is ready. Start by adding your first dog.',
    });
  };

  // Show initialization screen while database is being set up
  if (bootstrapStatus === 'initializing') {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue/10">
              <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
            </div>
            <DialogTitle className="text-xl">Initializing Database</DialogTitle>
            <DialogDescription>Setting up and verifying your database...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (bootstrapStatus === 'error') {
    return (
      <Dialog open onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Database integrity check failed</DialogTitle>
            <DialogDescription>
              Respectabullz did not open the workspace because database setup or document
              reconciliation could not finish safely. No operational screens are available until
              this check succeeds.
            </DialogDescription>
          </DialogHeader>
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            {bootstrapError || 'The database could not be initialized safely.'}
          </p>
          <DialogFooter>
            <Button onClick={() => setBootstrapAttempt((attempt) => attempt + 1)}>
              Retry integrity check
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      {children}
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

          <div className="py-6">
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
          </div>

          <DialogFooter className="sm:justify-center">
            <p className="text-xs text-muted-foreground text-center">
              Development builds may provide a separate guarded synthetic-data tool.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


import { useState, useEffect } from 'react';
import { Dog, Database, Sparkles } from 'lucide-react';
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
import * as db from '@/lib/db';

const FIRST_LAUNCH_KEY = 'respectabullz_first_launch_complete';

export function FirstLaunchDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if this is the first launch
    const hasLaunched = localStorage.getItem(FIRST_LAUNCH_KEY);
    if (!hasLaunched) {
      setOpen(true);
    }
  }, []);

  const handleStartFresh = () => {
    localStorage.setItem(FIRST_LAUNCH_KEY, 'true');
    setOpen(false);
    toast({
      title: 'Welcome to Respectabullz!',
      description: 'Your database is ready. Start by adding your first dog.',
    });
  };

  const handleLoadSampleData = async () => {
    setIsLoading(true);
    try {
      await db.seedDatabase();
      localStorage.setItem(FIRST_LAUNCH_KEY, 'true');
      setOpen(false);
      toast({
        title: 'Sample data loaded!',
        description: 'Explore the app with demo dogs, litters, and more.',
      });
      // Refresh the page to load the seeded data
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error loading sample data',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            disabled={isLoading}
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
            disabled={isLoading}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-blue" />
              <span className="font-semibold">
                {isLoading ? 'Loading...' : 'Load Sample Data'}
              </span>
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


import { useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { RefreshCw, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { VERSION } from '@/lib/version';

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'up-to-date' | 'error';

interface UpdateInfo {
  version: string;
  notes?: string;
  date?: string;
}

export function UpdateChecker() {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [updateInstance, setUpdateInstance] = useState<Awaited<ReturnType<typeof check>> | null>(null);

  const checkForUpdates = async () => {
    setStatus('checking');
    setError(null);
    setUpdateInfo(null);

    try {
      const update = await check();

      if (update) {
        setUpdateInfo({
          version: update.version,
          notes: update.body || undefined,
          date: update.date || undefined,
        });
        setUpdateInstance(update);
        setStatus('available');
      } else {
        setStatus('up-to-date');
      }
    } catch (err) {
      console.error('Update check failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to check for updates');
      setStatus('error');
    }
  };

  const downloadAndInstall = async () => {
    if (!updateInstance) return;

    setStatus('downloading');
    setProgress(0);

    try {
      let downloaded = 0;
      let contentLength = 0;

      await updateInstance.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setProgress(Math.round((downloaded / contentLength) * 100));
            }
            break;
          case 'Finished':
            setProgress(100);
            break;
        }
      });

      setStatus('ready');
      setShowConfirmDialog(true);
    } catch (err) {
      console.error('Download failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to download update');
      setStatus('error');
    }
  };

  const handleRelaunch = async () => {
    try {
      await relaunch();
    } catch (err) {
      console.error('Relaunch failed:', err);
      setError('Failed to restart application. Please restart manually.');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
      case 'downloading':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'available':
        return <Download className="h-5 w-5 text-blue-500" />;
      case 'up-to-date':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <RefreshCw className="h-5 w-5" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'checking':
        return 'Checking for updates...';
      case 'available':
        return `Version ${updateInfo?.version} is available!`;
      case 'downloading':
        return `Downloading update... ${progress}%`;
      case 'ready':
        return 'Update downloaded! Ready to install.';
      case 'up-to-date':
        return 'You have the latest version.';
      case 'error':
        return error || 'An error occurred.';
      default:
        return `Current version: ${VERSION}`;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Application Updates
          </CardTitle>
          <CardDescription>
            Check for and install application updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{getStatusMessage()}</p>
              {updateInfo?.notes && status === 'available' && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="text-xs font-medium mb-1">Release Notes:</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {updateInfo.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {status === 'downloading' && (
            <Progress value={progress} className="w-full" />
          )}

          <div className="flex gap-2">
            {(status === 'idle' || status === 'up-to-date' || status === 'error') && (
              <Button
                onClick={checkForUpdates}
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Check for Updates
              </Button>
            )}

            {status === 'available' && (
              <Button onClick={downloadAndInstall}>
                <Download className="h-4 w-4 mr-2" />
                Download & Install
              </Button>
            )}

            {status === 'ready' && (
              <Button onClick={() => setShowConfirmDialog(true)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Restart Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restart to Apply Update</AlertDialogTitle>
            <AlertDialogDescription>
              The update has been downloaded and is ready to install.
              The application will restart to apply the update.
              Make sure to save any unsaved work before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Later</AlertDialogCancel>
            <AlertDialogAction onClick={handleRelaunch}>
              Restart Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import { useState } from 'react';
import { Moon, Sun, Download, Upload, Trash2, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTheme } from '@/components/theme-provider';
import {
  useSettings,
  useUpdateSetting,
  useExportDatabase,
  useImportDatabase,
  useClearDatabase,
} from '@/hooks/useSettings';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data: settings } = useSettings();
  const updateSetting = useUpdateSetting();
  const exportDb = useExportDatabase();
  const importDb = useImportDatabase();
  const clearDb = useClearDatabase();

  const weightUnit = settings?.weightUnit || 'lbs';
  const notificationsEnabled = settings?.notificationsEnabled === 'true';

  const handleWeightUnitChange = (value: string) => {
    updateSetting.mutate({ key: 'weightUnit', value });
  };

  const handleNotificationsChange = (checked: boolean) => {
    updateSetting.mutate({ key: 'notificationsEnabled', value: String(checked) });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        importDb.mutate(text);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your application preferences
        </p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appearance</CardTitle>
          <CardDescription>
            Customize how the app looks and feels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">
                Choose your preferred color scheme
              </p>
            </div>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preferences</CardTitle>
          <CardDescription>
            Configure app behavior and units
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weight Unit</Label>
              <p className="text-sm text-muted-foreground">
                Display weights in pounds or kilograms
              </p>
            </div>
            <Select value={weightUnit} onValueChange={handleWeightUnitChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                <SelectItem value="kg">Kilograms (kg)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Enable reminders for vaccinations and due dates
              </p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationsChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Backup, restore, or clear your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              onClick={() => exportDb.mutate()}
              disabled={exportDb.isPending}
            >
              <Download className="mr-2 h-4 w-4" />
              {exportDb.isPending ? 'Exporting...' : 'Export Backup'}
            </Button>

            <Button
              variant="outline"
              onClick={handleImport}
              disabled={importDb.isPending}
            >
              <Upload className="mr-2 h-4 w-4" />
              {importDb.isPending ? 'Importing...' : 'Import Backup'}
            </Button>
          </div>

          <div className="pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your data including dogs,
                    litters, health records, expenses, and clients. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => clearDb.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, delete everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-sm text-muted-foreground mt-2">
              This will permanently delete all your data. Make sure to export a
              backup first.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span>0.1.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Application</span>
              <span>Respectabullz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">License</span>
              <span>Private</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


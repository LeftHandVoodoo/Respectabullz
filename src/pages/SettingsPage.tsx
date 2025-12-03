import { useState } from 'react';
import { Moon, Sun, Download, Upload, Trash2, Database, Building2, Save, FileArchive, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  useExportBackupWithPhotos,
  useImportBackupWithPhotos,
  useBackupInfo,
} from '@/hooks/useSettings';
import { useBreederSettings } from '@/hooks/useBreederSettings';
import { toast } from '@/components/ui/use-toast';
import { VERSION } from '@/lib/version';
import { formatBytes, isTauriEnvironment } from '@/lib/backupUtils';
import type { BreederSettings } from '@/types';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data: settings } = useSettings();
  const updateSetting = useUpdateSetting();
  const exportDb = useExportDatabase();
  const importDb = useImportDatabase();
  const clearDb = useClearDatabase();
  const exportWithPhotos = useExportBackupWithPhotos();
  const importWithPhotos = useImportBackupWithPhotos();
  const { data: backupInfo } = useBackupInfo();
  const { breederSettings, updateBreederSettings, isPending: isBreederPending } = useBreederSettings();
  const isTauri = isTauriEnvironment();

  // Local state for breeder form
  const [breederForm, setBreederForm] = useState<BreederSettings>(breederSettings);
  const [hasBreederChanges, setHasBreederChanges] = useState(false);

  // Sync form with settings when they load
  useState(() => {
    setBreederForm(breederSettings);
  });

  const weightUnit = settings?.weightUnit || 'lbs';
  const notificationsEnabled = settings?.notificationsEnabled === 'true';

  const handleWeightUnitChange = (value: string) => {
    updateSetting.mutate({ key: 'weightUnit', value });
  };

  const handleNotificationsChange = (checked: boolean) => {
    updateSetting.mutate({ key: 'notificationsEnabled', value: String(checked) });
  };

  const handleBreederFieldChange = (field: keyof BreederSettings, value: string) => {
    setBreederForm(prev => ({ ...prev, [field]: value }));
    setHasBreederChanges(true);
  };

  const handleSaveBreederSettings = async () => {
    try {
      await updateBreederSettings(breederForm);
      setHasBreederChanges(false);
      toast({
        title: 'Settings saved',
        description: 'Breeder information has been updated.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save breeder settings.',
        variant: 'destructive',
      });
    }
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
        <h2 className="text-2xl font-bold tracking-tight font-display">Settings</h2>
        <p className="text-muted-foreground">
          Manage your application preferences
        </p>
      </div>

      {/* Breeder Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Breeder Information
          </CardTitle>
          <CardDescription>
            Your kennel and contact details for contracts and documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kennelName">Kennel Name</Label>
              <Input
                id="kennelName"
                value={breederForm.kennelName}
                onChange={(e) => handleBreederFieldChange('kennelName', e.target.value)}
                placeholder="Respectabullz"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breederName">Breeder/Owner Name *</Label>
              <Input
                id="breederName"
                value={breederForm.breederName}
                onChange={(e) => handleBreederFieldChange('breederName', e.target.value)}
                placeholder="Your full name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address Line 1 *</Label>
            <Input
              id="addressLine1"
              value={breederForm.addressLine1}
              onChange={(e) => handleBreederFieldChange('addressLine1', e.target.value)}
              placeholder="Street address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine2">Address Line 2</Label>
            <Input
              id="addressLine2"
              value={breederForm.addressLine2 || ''}
              onChange={(e) => handleBreederFieldChange('addressLine2', e.target.value)}
              placeholder="Apt, suite, unit, etc. (optional)"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={breederForm.city}
                onChange={(e) => handleBreederFieldChange('city', e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={breederForm.state}
                onChange={(e) => handleBreederFieldChange('state', e.target.value)}
                placeholder="State"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">ZIP Code</Label>
              <Input
                id="postalCode"
                value={breederForm.postalCode}
                onChange={(e) => handleBreederFieldChange('postalCode', e.target.value)}
                placeholder="12345"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={breederForm.phone}
                onChange={(e) => handleBreederFieldChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={breederForm.email}
                onChange={(e) => handleBreederFieldChange('email', e.target.value)}
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kennelRegistration">Kennel Registration (ABKC/UKC)</Label>
              <Input
                id="kennelRegistration"
                value={breederForm.kennelRegistration || ''}
                onChange={(e) => handleBreederFieldChange('kennelRegistration', e.target.value)}
                placeholder="Registration number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kennelPrefix">Kennel Prefix</Label>
              <Input
                id="kennelPrefix"
                value={breederForm.kennelPrefix || ''}
                onChange={(e) => handleBreederFieldChange('kennelPrefix', e.target.value)}
                placeholder="For registered dog names"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="county">County (for legal jurisdiction)</Label>
            <Input
              id="county"
              value={breederForm.county || ''}
              onChange={(e) => handleBreederFieldChange('county', e.target.value)}
              placeholder="Your county"
            />
          </div>

          <div className="pt-2">
            <Button 
              onClick={handleSaveBreederSettings}
              disabled={!hasBreederChanges || isBreederPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {isBreederPending ? 'Saving...' : 'Save Breeder Information'}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              * Required fields for contract generation
            </p>
          </div>
        </CardContent>
      </Card>

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
        <CardContent className="space-y-6">
          {/* Full Backup with Photos (Recommended) */}
          {isTauri && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileArchive className="h-4 w-4 text-primary" />
                <Label className="text-base font-medium">Full Backup (Recommended)</Label>
                <Badge variant="secondary" className="text-xs">ZIP</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Creates a complete backup including database and all photos.
                {backupInfo && backupInfo.photoCount > 0 && (
                  <span className="ml-1">
                    ({backupInfo.photoCount} photos, {formatBytes(backupInfo.photosSize)})
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => exportWithPhotos.mutate()}
                  disabled={exportWithPhotos.isPending}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exportWithPhotos.isPending ? 'Creating backup...' : 'Export Full Backup'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => importWithPhotos.mutate()}
                  disabled={importWithPhotos.isPending}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {importWithPhotos.isPending ? 'Restoring...' : 'Restore Full Backup'}
                </Button>
              </div>
            </div>
          )}

          {/* Data Only Backup */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2">
              <FileJson className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-medium">Data Only Backup</Label>
              <Badge variant="outline" className="text-xs">JSON</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Export only the database (no photos). Useful for quick backups or transferring data.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => exportDb.mutate()}
                disabled={exportDb.isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                {exportDb.isPending ? 'Exporting...' : 'Export Data Only'}
              </Button>

              <Button
                variant="outline"
                onClick={handleImport}
                disabled={importDb.isPending}
              >
                <Upload className="mr-2 h-4 w-4" />
                {importDb.isPending ? 'Importing...' : 'Import Data Only'}
              </Button>
            </div>
          </div>

          {/* Danger Zone */}
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
                    litters, health records, expenses, clients, and photos. This action
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
              <span className="font-mono">v{VERSION}</span>
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


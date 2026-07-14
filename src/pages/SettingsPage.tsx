import { useState, useEffect } from 'react';
import { getIdentifier } from '@tauri-apps/api/app';
import { Moon, Sun, Download, Database, Building2, Save, FileArchive, FileJson, FolderOpen, FileDown, Eraser, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
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
  useExportPartialDataWithPhotos,
  usePartialExportInfo,
  useSeedDatabase,
} from '@/hooks/useSettings';
import { useBreederSettings } from '@/hooks/useBreederSettings';
import { toast } from '@/components/ui/use-toast';
import { VERSION } from '@/lib/version';
import { formatBytes, isTauriEnvironment } from '@/lib/backupUtils';
import { logger } from '@/lib/errorTracking';
import {
  getSessionContractsDirectory,
  setSessionContractsDirectory,
} from '@/lib/contractDestination';
import type { BreederSettings } from '@/types';
import { HelpSection } from '@/components/settings/HelpSection';

const DEMO_APP_IDENTIFIER = 'com.respectabullz.demo';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data: settings } = useSettings();
  const updateSetting = useUpdateSetting();
  const exportDb = useExportDatabase();
  const seedDb = useSeedDatabase();
  const exportWithPhotos = useExportPartialDataWithPhotos();
  const { data: partialExportInfo } = usePartialExportInfo();
  const { breederSettings, updateBreederSettings, isPending: isBreederPending } = useBreederSettings();
  const isTauri = isTauriEnvironment();

  // Local state for breeder form - initialize with defaults if empty
  const getInitialBreederForm = (settings?: BreederSettings): BreederSettings => {
    return {
      kennelName: settings?.kennelName || 'Respectabullz',
      breederName: settings?.breederName || '',
      addressLine1: settings?.addressLine1 || '',
      addressLine2: settings?.addressLine2 || '',
      city: settings?.city || '',
      state: settings?.state || '',
      postalCode: settings?.postalCode || '',
      phone: settings?.phone || '',
      email: settings?.email || '',
      kennelRegistration: settings?.kennelRegistration || '',
      kennelPrefix: settings?.kennelPrefix || '',
      county: settings?.county || '',
    };
  };

  const [breederForm, setBreederForm] = useState<BreederSettings>(getInitialBreederForm(breederSettings));
  const [hasBreederChanges, setHasBreederChanges] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isExportingLogs, setIsExportingLogs] = useState(false);
  const [isClearingLogs, setIsClearingLogs] = useState(false);
  const [isSyntheticDemo, setIsSyntheticDemo] = useState(false);
  const [contractsDirectory, setContractsDirectory] = useState(
    getSessionContractsDirectory,
  );

  // Sync form with settings when they load - but only once on initial load
  useEffect(() => {
    if (breederSettings && !isInitialized && !hasBreederChanges) {
      setBreederForm(getInitialBreederForm(breederSettings));
      setIsInitialized(true);
    }
  }, [breederSettings, isInitialized, hasBreederChanges]);

  useEffect(() => {
    let cancelled = false;

    if (!import.meta.env.DEV || !isTauri) {
      setIsSyntheticDemo(false);
      return () => {
        cancelled = true;
      };
    }

    void getIdentifier()
      .then((identifier) => {
        if (!cancelled) {
          setIsSyntheticDemo(identifier === DEMO_APP_IDENTIFIER);
        }
      })
      .catch((error) => {
        logger.warn('Could not verify the isolated synthetic demo identity', {
          error: error instanceof Error ? error.message : String(error),
        });
        if (!cancelled) {
          setIsSyntheticDemo(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isTauri]);

  const weightUnit = settings?.weightUnit || 'lbs';
  const notificationsEnabled = settings?.notificationsEnabled === 'true';
  const handleWeightUnitChange = (value: string) => {
    updateSetting.mutate({ key: 'weightUnit', value });
  };

  const handleNotificationsChange = (checked: boolean) => {
    updateSetting.mutate({ key: 'notificationsEnabled', value: String(checked) });
  };

  const handleSelectContractsDirectory = async () => {
    if (!isTauri) {
      toast({
        title: 'Not Available',
        description: 'Custom directory selection is only available in the desktop app.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selectedDir = await open({
        directory: true,
        multiple: false,
        title: 'Select Contracts Directory',
      });
      
      if (selectedDir) {
        setSessionContractsDirectory(selectedDir);
        setContractsDirectory(selectedDir);
        toast({
          title: 'Directory Updated',
          description: `Contracts will now be saved to: ${selectedDir}`,
        });
      }
    } catch (error) {
      logger.warn(
        'Failed to select contracts directory',
        { error: error instanceof Error ? error.message : String(error) },
      );
      toast({
        title: 'Error',
        description: 'Failed to open directory picker.',
        variant: 'destructive',
      });
    }
  };

  const handleBreederFieldChange = (field: keyof BreederSettings, value: string) => {
    setBreederForm(prev => ({ ...prev, [field]: value }));
    setHasBreederChanges(true);
  };

  const handleExportLogs = async () => {
    setIsExportingLogs(true);
    try {
      const { exportLogs } = await import('@/lib/errorTracking');
      const data = await exportLogs();
      if (!data) {
        toast({ title: 'No diagnostics available', description: 'No log entries are available to export.' });
        return;
      }

      const blobBytes = new Uint8Array(data.byteLength);
      blobBytes.set(data);
      const url = URL.createObjectURL(new Blob([blobBytes.buffer], { type: 'text/plain' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `respectabullz-diagnostics-${new Date().toISOString().split('T')[0]}.log`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      toast({
        title: 'Diagnostics exported',
        description: 'Review the local file before sharing it. Automated redaction cannot identify every semantic detail.',
      });
    } catch {
      toast({ title: 'Export failed', description: 'Diagnostics could not be exported.', variant: 'destructive' });
    } finally {
      setIsExportingLogs(false);
    }
  };

  const handleClearLogs = async () => {
    setIsClearingLogs(true);
    try {
      const { clearLogFile } = await import('@/lib/errorTracking');
      const cleared = await clearLogFile();
      toast(cleared
        ? { title: 'Diagnostics cleared', description: 'The application log was replaced with a clear marker.' }
        : { title: 'Clear failed', description: 'The application log could not be cleared.', variant: 'destructive' });
    } finally {
      setIsClearingLogs(false);
    }
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
              <PhoneInput
                id="phone"
                value={breederForm.phone || ''}
                onChange={(e) => handleBreederFieldChange('phone', e.target.value)}
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

          {/* Contracts Directory */}
          {isTauri && (
            <div className="space-y-2 pt-4">
              <Label>Contracts Save Location</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Choose where completed contracts are saved for this app session
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={contractsDirectory || 'Default (App Data Directory)'}
                  readOnly
                  className="flex-1"
                  placeholder="Default (App Data Directory)"
                />
                <Button
                  variant="outline"
                  onClick={handleSelectContractsDirectory}
                  className="shrink-0"
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Choose Folder
                </Button>
              </div>
              {contractsDirectory && (
                <p className="text-xs text-muted-foreground">
                  Current session: {contractsDirectory}. Reselect this folder after restarting the app.
                </p>
              )}
            </div>
          )}
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
            Create partial data exports. Restore and factory reset are currently unavailable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            role="status"
            data-testid="recovery-unavailable"
            className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm"
          >
            <p className="font-medium">
              Restore is temporarily unavailable while complete recovery verification is implemented.
            </p>
            <p className="mt-1 text-muted-foreground">
              No factory reset is currently available. The controls remain withdrawn until their
              complete database and file behavior can be verified.
            </p>
          </div>

          {/* Partial data export with photos */}
          {isTauri && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileArchive className="h-4 w-4 text-primary" />
                <Label className="text-base font-medium">Partial Data Export with Photos</Label>
                <Badge variant="secondary" className="text-xs">ZIP</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Includes dogs, litters, expenses, breeder details, dog health records, genetic tests,
                and every enumerated managed photo. If any managed photo cannot be listed or read,
                the export fails instead of silently omitting it.
                {partialExportInfo && partialExportInfo.photoCount > 0 && (
                  <span className="ml-1">
                    ({partialExportInfo.photoCount} photos, {formatBytes(partialExportInfo.photosSize)})
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                Excludes contacts, clients and sales, document records and files, heat-cycle and
                transport records, waitlist and communication records, generated contracts, logs,
                other application settings, and external export files.
              </p>
              <Button
                onClick={() => exportWithPhotos.mutate()}
                disabled={exportWithPhotos.isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                {exportWithPhotos.isPending ? 'Creating export...' : 'Export Partial Data (ZIP)'}
              </Button>
            </div>
          )}

          {/* Partial data-only export */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2">
              <FileJson className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-medium">Partial Data Export</Label>
              <Badge variant="outline" className="text-xs">JSON</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Exports the same limited record set without photos. This is not a complete backup and
              cannot currently be restored by the application.
            </p>
            <Button
              variant="outline"
              onClick={() => exportDb.mutate()}
              disabled={exportDb.isPending}
            >
              <Download className="mr-2 h-4 w-4" />
              {exportDb.isPending ? 'Exporting...' : 'Export Partial Data (JSON)'}
            </Button>
          </div>

          {/* Available only to debug builds using the isolated synthetic-demo identity. */}
          {isSyntheticDemo && (
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Development Testing Tool</h3>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={seedDb.isPending}
                    variant="outline"
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Seed Test Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Seed Test Data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will populate the database with comprehensive dummy test data.
                      Operational dog data must be empty before test data can be added.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => seedDb.mutate()}
                      disabled={seedDb.isPending}
                    >
                      {seedDb.isPending ? 'Seeding...' : 'Seed Test Data'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <p className="text-sm text-muted-foreground mt-2">
                Available only in the isolated synthetic demo development identity. There is no
                automated test-data removal action.
              </p>
            </div>
          )}

          {/* Data deletion containment */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-2">Data deletion</h3>
            <p className="text-sm text-muted-foreground">
              Complete deletion is unavailable while application records, imported photos and
              documents, generated files, logs, configuration, and external exports are being
              inventoried and verified together.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Diagnostics */}
      {isTauri && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              Diagnostics
            </CardTitle>
            <CardDescription>
              Logs stay on this device unless you explicitly export and share them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Common credentials, paths, contact patterns, identifiers, and sensitive context
              fields are redacted before logging. Review exported text because semantic personal
              details may still remain.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleExportLogs} disabled={isExportingLogs}>
                <FileDown className="mr-2 h-4 w-4" />
                {isExportingLogs ? 'Exporting...' : 'Export Diagnostics'}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={isClearingLogs}>
                    <Eraser className="mr-2 h-4 w-4" />
                    {isClearingLogs ? 'Clearing...' : 'Clear Diagnostics'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear application diagnostics?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This replaces the managed application log with a clear marker. It does not
                      remove exported copies or operating-system logs.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearLogs}>Clear Diagnostics</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help & Documentation */}
      <HelpSection />

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


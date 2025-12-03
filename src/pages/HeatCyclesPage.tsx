import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar as CalendarIcon, List, Eye, AlertCircle, Heart, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useHeatCycles } from '@/hooks/useHeatCycles';
import type { HeatCycle, HeatPhase } from '@/types';
import { useDogs } from '@/hooks/useDogs';
import { HeatCycleFormDialog } from '@/components/heat-cycles/HeatCycleFormDialog';
import { formatDate } from '@/lib/utils';

// Phase badge colors
const phaseBadgeVariant: Record<HeatPhase, 'destructive' | 'success' | 'default' | 'secondary'> = {
  proestrus: 'destructive',
  estrus: 'success',
  diestrus: 'default',
  anestrus: 'secondary',
};

const phaseLabels: Record<HeatPhase, string> = {
  proestrus: 'Proestrus',
  estrus: 'Estrus (Fertile)',
  diestrus: 'Diestrus',
  anestrus: 'Anestrus',
};

// Helper to format date for CSV (YYYY-MM-DD)
function formatDateForCSV(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

// Helper to escape CSV values
function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // If the value contains comma, newline, or quote, wrap in quotes and escape existing quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function HeatCyclesPage() {
  const navigate = useNavigate();
  const { data: heatCycles, isLoading } = useHeatCycles();
  const { data: dogs } = useDogs();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const females = dogs?.filter((d) => d.sex === 'F' && d.status === 'active') || [];

  const isActive = (cycle: HeatCycle) => {
    return !cycle.endDate;
  };

  const isInFertileWindow = (cycle: HeatCycle) => {
    if (cycle.endDate) return false;
    const now = new Date();
    if (cycle.optimalBreedingStart && cycle.optimalBreedingEnd) {
      return now >= new Date(cycle.optimalBreedingStart) && now <= new Date(cycle.optimalBreedingEnd);
    }
    // Estimate based on start date (days 10-14)
    const startDate = new Date(cycle.startDate);
    const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceStart >= 9 && daysSinceStart <= 14;
  };

  // Separate active cycles
  const activeCycles = heatCycles?.filter(isActive) || [];

  // Check for cycles in fertile window
  const fertileCycles = activeCycles.filter(isInFertileWindow);

  // Export heat cycles to CSV
  const exportToCSV = () => {
    if (!heatCycles || heatCycles.length === 0) return;

    // CSV headers
    const headers = [
      'Dog Name',
      'Start Date',
      'Standing Heat Start',
      'Standing Heat End',
      'Ovulation Date',
      'Optimal Breeding Start',
      'Optimal Breeding End',
      'End Date',
      'Expected Due Date',
      'Next Heat Estimate',
      'Cycle Length (Days)',
      'Current Phase',
      'Is Bred',
      'Breeding Sire',
      'Breeding Method',
      'Breeding Date(s)',
      'Progesterone Tests',
      'Progesterone Values',
      'Vet Clinic',
      'Notes',
    ];

    // Helper to get breeding events summary
    const getBreedingSummary = (cycle: HeatCycle) => {
      const breedingEvents = cycle.events?.filter(e => 
        ['breeding_natural', 'breeding_ai', 'breeding_surgical'].includes(e.type)
      ) || [];
      
      if (breedingEvents.length === 0) return { sire: '', method: '', dates: '' };
      
      const sireNames = [...new Set(breedingEvents
        .map(e => e.sire?.name)
        .filter(Boolean))].join('; ');
      
      const methods = [...new Set(breedingEvents
        .map(e => e.breedingMethod)
        .filter(Boolean))].join('; ');
      
      const dates = breedingEvents
        .map(e => formatDateForCSV(e.date))
        .join('; ');
      
      return {
        sire: sireNames || '',
        method: methods || '',
        dates: dates || '',
      };
    };

    // Helper to get progesterone test summary
    const getProgesteroneSummary = (cycle: HeatCycle) => {
      const progesteroneTests = cycle.events?.filter(e => e.type === 'progesterone_test') || [];
      
      if (progesteroneTests.length === 0) return { dates: '', values: '', clinics: '' };
      
      const dates = progesteroneTests
        .map(e => formatDateForCSV(e.date))
        .join('; ');
      
      const values = progesteroneTests
        .map(e => e.value && e.unit ? `${e.value} ${e.unit}` : e.value || '')
        .join('; ');
      
      const clinics = [...new Set(progesteroneTests
        .map(e => e.vetClinic)
        .filter(Boolean))].join('; ');
      
      return {
        dates: dates || '',
        values: values || '',
        clinics: clinics || '',
      };
    };

    // Convert heat cycles to CSV rows
    const rows = heatCycles.map((cycle) => {
      const breeding = getBreedingSummary(cycle);
      const progesterone = getProgesteroneSummary(cycle);
      
      return [
        escapeCSV(cycle.bitch?.name || 'Unknown'),
        formatDateForCSV(cycle.startDate),
        formatDateForCSV(cycle.standingHeatStart),
        formatDateForCSV(cycle.standingHeatEnd),
        formatDateForCSV(cycle.ovulationDate),
        formatDateForCSV(cycle.optimalBreedingStart),
        formatDateForCSV(cycle.optimalBreedingEnd),
        formatDateForCSV(cycle.endDate),
        formatDateForCSV(cycle.expectedDueDate),
        formatDateForCSV(cycle.nextHeatEstimate),
        cycle.cycleLength?.toString() || '',
        cycle.currentPhase ? phaseLabels[cycle.currentPhase] : '',
        cycle.isBred ? 'Yes' : 'No',
        escapeCSV(breeding.sire),
        escapeCSV(breeding.method),
        escapeCSV(breeding.dates),
        escapeCSV(progesterone.dates),
        escapeCSV(progesterone.values),
        escapeCSV(progesterone.clinics),
        escapeCSV(cycle.notes),
      ];
    });

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `heat_cycles_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-display">Heat Cycles</h2>
          <p className="text-muted-foreground">
            Track heat cycles and breeding timing for your females
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={!heatCycles || heatCycles.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Record Heat Cycle
          </Button>
        </div>
      </div>

      {/* Alert for fertile cycles */}
      {fertileCycles.length > 0 && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Heart className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">
                  {fertileCycles.length} female{fertileCycles.length > 1 ? 's' : ''} in fertile window!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {fertileCycles.map(c => c.bitch?.name).join(', ')} - optimal breeding time
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Cycles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeCycles.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Fertile Window</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{fertileCycles.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bred This Cycle</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {activeCycles.filter(c => c.isBred).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Recorded</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{heatCycles?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            <AlertCircle className="h-4 w-4 mr-2" />
            Active ({activeCycles.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            <List className="h-4 w-4 mr-2" />
            All Cycles
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeCycles.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-4">
                  No active heat cycles
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  Record Heat Cycle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeCycles.map((cycle) => {
                const daysSinceStart = Math.floor(
                  (new Date().getTime() - new Date(cycle.startDate).getTime()) / (1000 * 60 * 60 * 24)
                );
                const inFertileWindow = isInFertileWindow(cycle);
                
                return (
                  <Card 
                    key={cycle.id} 
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      inFertileWindow ? 'border-green-500 ring-1 ring-green-500' : ''
                    }`}
                    onClick={() => navigate(`/heat-cycles/${cycle.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{cycle.bitch?.name || 'Unknown'}</CardTitle>
                        <div className="flex gap-2">
                          {cycle.currentPhase && (
                            <Badge variant={phaseBadgeVariant[cycle.currentPhase]}>
                              {phaseLabels[cycle.currentPhase]}
                            </Badge>
                          )}
                          {cycle.isBred && <Badge variant="default">Bred</Badge>}
                        </div>
                      </div>
                      <CardDescription>
                        Started {formatDate(cycle.startDate)} • Day {daysSinceStart + 1}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {cycle.standingHeatStart && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Standing Heat:</span>
                            <span>{formatDate(cycle.standingHeatStart)}</span>
                          </div>
                        )}
                        {cycle.ovulationDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ovulation:</span>
                            <span>{formatDate(cycle.ovulationDate)}</span>
                          </div>
                        )}
                        {cycle.expectedDueDate && (
                          <div className="flex justify-between text-blue-600">
                            <span>Expected Due:</span>
                            <span>{formatDate(cycle.expectedDueDate)}</span>
                          </div>
                        )}
                        {inFertileWindow && (
                          <div className="mt-2 p-2 bg-green-100 dark:bg-green-900 rounded text-green-700 dark:text-green-300 text-center">
                            🎯 In Optimal Breeding Window
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Female</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Standing Heat</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : heatCycles?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No heat cycles recorded
                      </p>
                      <Button
                        variant="link"
                        onClick={() => setShowAddDialog(true)}
                      >
                        Record first heat cycle
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  heatCycles?.map((cycle) => (
                    <TableRow 
                      key={cycle.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/heat-cycles/${cycle.id}`)}
                    >
                      <TableCell className="font-medium">
                        {cycle.bitch?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{formatDate(cycle.startDate)}</TableCell>
                      <TableCell>
                        {cycle.standingHeatStart && cycle.standingHeatEnd
                          ? `${formatDate(cycle.standingHeatStart)} - ${formatDate(
                              cycle.standingHeatEnd
                            )}`
                          : cycle.standingHeatStart
                          ? formatDate(cycle.standingHeatStart)
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {cycle.endDate ? formatDate(cycle.endDate) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {isActive(cycle) ? (
                            <>
                              {cycle.currentPhase && (
                                <Badge variant={phaseBadgeVariant[cycle.currentPhase]} className="text-xs">
                                  {phaseLabels[cycle.currentPhase]}
                                </Badge>
                              )}
                              {isInFertileWindow(cycle) && (
                                <Badge variant="success" className="text-xs">Fertile</Badge>
                              )}
                            </>
                          ) : (
                            <Badge variant="secondary">Completed</Badge>
                          )}
                          {cycle.isBred && <Badge variant="outline" className="text-xs">Bred</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>
                Visual timeline of heat cycles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Calendar visualization coming soon. Use the list view to manage
                heat cycles.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reference Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Heat Cycle Quick Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 text-sm">
            <div className="space-y-1">
              <Badge variant="destructive" className="mb-1">Proestrus</Badge>
              <p className="font-medium">Days 1-9</p>
              <p className="text-muted-foreground">
                Bleeding, vulva swelling. Attracts males but not receptive.
              </p>
            </div>
            <div className="space-y-1">
              <Badge variant="success" className="mb-1">Estrus</Badge>
              <p className="font-medium">Days 9-14</p>
              <p className="text-muted-foreground">
                Standing heat, receptive. Optimal breeding window.
              </p>
            </div>
            <div className="space-y-1">
              <Badge variant="default" className="mb-1">Diestrus</Badge>
              <p className="font-medium">Days 14-60+</p>
              <p className="text-muted-foreground">
                Not receptive. Pregnancy or pseudo-pregnancy.
              </p>
            </div>
            <div className="space-y-1">
              <Badge variant="secondary" className="mb-1">Anestrus</Badge>
              <p className="font-medium">2-4 months</p>
              <p className="text-muted-foreground">
                Rest period. No reproductive activity.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <HeatCycleFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        females={females}
      />
    </div>
  );
}

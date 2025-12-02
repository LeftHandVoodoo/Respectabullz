import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Calendar, 
  Clock,
  Droplets,
  Heart,
  TestTube,
  Baby,
  AlertCircle,
  CheckCircle2,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Progress } from '@/components/ui/progress';
import { useHeatCycle, useDeleteHeatEvent } from '@/hooks/useHeatEvents';
import { useDeleteHeatCycle, useUpdateHeatCycle } from '@/hooks/useHeatCycles';
import { HeatEventFormDialog } from '@/components/heat-cycles/HeatEventFormDialog';
import { formatDate } from '@/lib/utils';
import type { HeatEventType, HeatPhase } from '@/types';

// Phase information with colors and descriptions
const phaseInfo: Record<HeatPhase, { 
  label: string; 
  color: string; 
  days: string;
  description: string;
}> = {
  proestrus: {
    label: 'Proestrus',
    color: 'bg-red-500',
    days: 'Days 1-9',
    description: 'Bleeding phase. Attracts males but not receptive. Vulva swelling.',
  },
  estrus: {
    label: 'Estrus (Standing Heat)',
    color: 'bg-green-500',
    days: 'Days 9-14',
    description: 'Fertile phase. Receptive to breeding. Optimal conception window.',
  },
  diestrus: {
    label: 'Diestrus',
    color: 'bg-blue-500',
    days: 'Days 14-60+',
    description: 'Post-estrus phase. If bred, pregnancy develops. If not, pseudo-pregnancy.',
  },
  anestrus: {
    label: 'Anestrus',
    color: 'bg-gray-500',
    days: '2-4 months',
    description: 'Rest period between cycles. No reproductive activity.',
  },
};

// Event type icons and colors
const eventTypeInfo: Record<HeatEventType, { icon: React.ElementType; color: string; label: string }> = {
  bleeding_start: { icon: Droplets, color: 'text-red-500', label: 'Bleeding Started' },
  bleeding_heavy: { icon: Droplets, color: 'text-red-600', label: 'Heavy Bleeding' },
  bleeding_light: { icon: Droplets, color: 'text-pink-400', label: 'Light Bleeding' },
  discharge_straw: { icon: Droplets, color: 'text-yellow-500', label: 'Straw Discharge' },
  vulva_swelling: { icon: AlertCircle, color: 'text-orange-500', label: 'Vulva Swelling' },
  flagging: { icon: Heart, color: 'text-pink-500', label: 'Flagging' },
  standing: { icon: CheckCircle2, color: 'text-green-500', label: 'Standing Heat' },
  end_receptive: { icon: AlertCircle, color: 'text-gray-500', label: 'End Receptive' },
  progesterone_test: { icon: TestTube, color: 'text-purple-500', label: 'Progesterone Test' },
  lh_surge: { icon: Target, color: 'text-blue-500', label: 'LH Surge' },
  ovulation: { icon: Target, color: 'text-green-600', label: 'Ovulation' },
  breeding_natural: { icon: Heart, color: 'text-red-500', label: 'Natural Breeding' },
  breeding_ai: { icon: Baby, color: 'text-blue-500', label: 'AI Breeding' },
  breeding_surgical: { icon: Baby, color: 'text-purple-500', label: 'Surgical AI' },
  cycle_end: { icon: CheckCircle2, color: 'text-gray-500', label: 'Cycle Ended' },
  other: { icon: Calendar, color: 'text-gray-400', label: 'Other' },
};

export function HeatCycleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: cycle, isLoading } = useHeatCycle(id);
  const deleteCycle = useDeleteHeatCycle();
  const deleteEvent = useDeleteHeatEvent();
  const updateCycle = useUpdateHeatCycle();
  
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [defaultEventType, setDefaultEventType] = useState<HeatEventType | undefined>();

  const handleDeleteCycle = async () => {
    if (id) {
      await deleteCycle.mutateAsync(id);
      navigate('/heat-cycles');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteEvent.mutateAsync(eventId);
  };

  const handleEndCycle = async () => {
    if (id) {
      await updateCycle.mutateAsync({
        id,
        data: {
          endDate: new Date(),
          currentPhase: 'anestrus' as HeatPhase,
        },
      });
    }
  };

  const openAddEvent = (eventType?: HeatEventType) => {
    setDefaultEventType(eventType);
    setShowAddEventDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Heat cycle not found</p>
        <Button variant="outline" onClick={() => navigate('/heat-cycles')}>
          Back to Heat Cycles
        </Button>
      </div>
    );
  }

  // Calculate days since start
  const daysSinceStart = Math.floor(
    (new Date().getTime() - new Date(cycle.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate cycle progress (typical cycle is ~21 days)
  const cycleProgress = Math.min((daysSinceStart / 21) * 100, 100);

  // Get phase info
  const currentPhaseInfo = cycle.currentPhase ? phaseInfo[cycle.currentPhase] : null;

  // Check if in optimal breeding window
  const now = new Date();
  const isInBreedingWindow = cycle.optimalBreedingStart && cycle.optimalBreedingEnd
    ? now >= new Date(cycle.optimalBreedingStart) && now <= new Date(cycle.optimalBreedingEnd)
    : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/heat-cycles')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">
            {cycle.bitch?.name || 'Unknown'} - Heat Cycle
          </h2>
          <p className="text-muted-foreground">
            Started {formatDate(cycle.startDate)} • Day {daysSinceStart + 1}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!cycle.endDate && (
            <Badge variant={isInBreedingWindow ? 'success' : 'warning'}>
              {isInBreedingWindow ? 'Optimal Breeding Window' : currentPhaseInfo?.label || 'Active'}
            </Badge>
          )}
          {cycle.endDate && <Badge variant="secondary">Completed</Badge>}
          {cycle.isBred && <Badge variant="default">Bred</Badge>}
          
          {!cycle.endDate && (
            <Button variant="outline" size="sm" onClick={handleEndCycle}>
              End Cycle
            </Button>
          )}
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this heat cycle?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this heat cycle and all associated events.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCycle}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Cycle Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Cycle Progress</CardTitle>
          <CardDescription>
            {currentPhaseInfo?.description || 'Track the progression of this heat cycle'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Day {daysSinceStart + 1} of typical 21-day cycle</span>
              <span>{Math.round(cycleProgress)}%</span>
            </div>
            <div className="relative">
              <Progress value={cycleProgress} className="h-3" />
              {/* Phase markers */}
              <div className="absolute top-0 left-0 w-full h-3 flex">
                <div className="w-[43%] bg-red-200 rounded-l-full opacity-50" title="Proestrus (Days 1-9)" />
                <div className="w-[24%] bg-green-200 opacity-50" title="Estrus (Days 9-14)" />
                <div className="w-[33%] bg-blue-200 rounded-r-full opacity-50" title="Diestrus (Days 14-21+)" />
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Proestrus</span>
              <span>Estrus</span>
              <span>Diestrus</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Dates & Info */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Start Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{formatDate(cycle.startDate)}</p>
            <p className="text-xs text-muted-foreground">Day 1 of cycle</p>
          </CardContent>
        </Card>

        <Card className={cycle.standingHeatStart ? 'border-green-500' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Standing Heat
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cycle.standingHeatStart ? (
              <>
                <p className="font-medium">{formatDate(cycle.standingHeatStart)}</p>
                {cycle.standingHeatEnd && (
                  <p className="text-xs text-muted-foreground">
                    to {formatDate(cycle.standingHeatEnd)}
                  </p>
                )}
              </>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 h-auto"
                onClick={() => openAddEvent('standing')}
              >
                + Record standing heat
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className={cycle.ovulationDate ? 'border-purple-500' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Ovulation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cycle.ovulationDate ? (
              <>
                <p className="font-medium">{formatDate(cycle.ovulationDate)}</p>
                <p className="text-xs text-muted-foreground">Eggs viable 48-72hrs</p>
              </>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 h-auto"
                onClick={() => openAddEvent('progesterone_test')}
              >
                + Add progesterone test
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className={cycle.expectedDueDate ? 'border-blue-500' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Baby className="h-4 w-4" />
              Expected Due Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cycle.expectedDueDate ? (
              <>
                <p className="font-medium">{formatDate(cycle.expectedDueDate)}</p>
                <p className="text-xs text-muted-foreground">63 days from ovulation</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {cycle.isBred ? 'Waiting for ovulation date' : 'Not bred yet'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Breeding Window Alert */}
      {isInBreedingWindow && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">
                  Optimal Breeding Window Active!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Best time to breed is now through {cycle.optimalBreedingEnd ? formatDate(cycle.optimalBreedingEnd) : 'soon'}.
                  Eggs are mature and viable.
                </p>
              </div>
              <Button 
                className="ml-auto"
                onClick={() => openAddEvent('breeding_natural')}
              >
                Record Breeding
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common events to log during a heat cycle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => openAddEvent('progesterone_test')}>
              <TestTube className="h-4 w-4 mr-2" />
              Log Progesterone Test
            </Button>
            <Button variant="outline" size="sm" onClick={() => openAddEvent('standing')}>
              <Heart className="h-4 w-4 mr-2" />
              Record Standing Heat
            </Button>
            <Button variant="outline" size="sm" onClick={() => openAddEvent('breeding_natural')}>
              <Baby className="h-4 w-4 mr-2" />
              Record Breeding
            </Button>
            <Button variant="outline" size="sm" onClick={() => openAddEvent('bleeding_light')}>
              <Droplets className="h-4 w-4 mr-2" />
              Log Discharge Change
            </Button>
            <Button variant="outline" size="sm" onClick={() => openAddEvent()}>
              <Plus className="h-4 w-4 mr-2" />
              Other Event
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Event Timeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Event Timeline</CardTitle>
            <CardDescription>All recorded events for this cycle</CardDescription>
          </div>
          <Button size="sm" onClick={() => openAddEvent()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </CardHeader>
        <CardContent>
          {!cycle.events || cycle.events.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">No events recorded yet</p>
              <Button variant="outline" onClick={() => openAddEvent()}>
                Record first event
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycle.events.map((event) => {
                  const info = eventTypeInfo[event.type] || eventTypeInfo.other;
                  const Icon = info.icon;
                  return (
                    <TableRow key={event.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p>{formatDate(event.date)}</p>
                            {event.time && (
                              <p className="text-xs text-muted-foreground">{event.time}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${info.color}`} />
                          <span>{info.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {event.value && (
                          <span className="font-mono">
                            {event.value} {event.unit}
                          </span>
                        )}
                        {event.sire && (
                          <span className="text-sm">
                            Sire: {event.sire.name}
                          </span>
                        )}
                        {event.vetClinic && (
                          <span className="text-sm text-muted-foreground">
                            @ {event.vetClinic}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {event.notes || '-'}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteEvent(event.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Veterinary Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progesterone Reference Guide</CardTitle>
          <CardDescription>Interpret progesterone levels for optimal breeding timing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="grid grid-cols-3 gap-4 p-2 rounded bg-muted">
              <span className="font-medium">Level (ng/mL)</span>
              <span className="font-medium">Phase</span>
              <span className="font-medium">Action</span>
            </div>
            <div className="grid grid-cols-3 gap-4 p-2">
              <span>&lt; 1.0</span>
              <span>Early Proestrus</span>
              <span className="text-muted-foreground">Retest in 2-3 days</span>
            </div>
            <div className="grid grid-cols-3 gap-4 p-2 bg-blue-50 dark:bg-blue-950 rounded">
              <span>1.0 - 2.0</span>
              <span>Late Proestrus</span>
              <span className="text-blue-600">LH surge imminent, test daily</span>
            </div>
            <div className="grid grid-cols-3 gap-4 p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
              <span>2.0 - 3.0</span>
              <span>LH Surge</span>
              <span className="text-yellow-600">Ovulation in ~48 hours</span>
            </div>
            <div className="grid grid-cols-3 gap-4 p-2 bg-orange-50 dark:bg-orange-950 rounded">
              <span>3.0 - 5.0</span>
              <span>Ovulation</span>
              <span className="text-orange-600">Eggs releasing, prepare to breed</span>
            </div>
            <div className="grid grid-cols-3 gap-4 p-2 bg-green-50 dark:bg-green-950 rounded">
              <span>5.0 - 15.0</span>
              <span className="text-green-700 font-medium">Optimal Breeding</span>
              <span className="text-green-600 font-medium">BREED NOW - eggs mature</span>
            </div>
            <div className="grid grid-cols-3 gap-4 p-2 bg-red-50 dark:bg-red-950 rounded">
              <span>&gt; 25.0</span>
              <span>Diestrus</span>
              <span className="text-red-600">Window closed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {cycle.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{cycle.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Next Heat Prediction */}
      {cycle.nextHeatEstimate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Next Heat Prediction</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Based on this cycle, the next heat is estimated around{' '}
              <strong>{formatDate(cycle.nextHeatEstimate)}</strong>
              <span className="text-muted-foreground"> (approximately 6-7 months from cycle start)</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Event Form Dialog */}
      {id && (
        <HeatEventFormDialog
          open={showAddEventDialog}
          onOpenChange={setShowAddEventDialog}
          heatCycleId={id}
          defaultEventType={defaultEventType}
        />
      )}
    </div>
  );
}


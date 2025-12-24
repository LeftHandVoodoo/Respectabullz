import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateHeatCycle, useUpdateHeatCycle } from '@/hooks/useHeatCycles';
import { parseLocalDate } from '@/lib/utils';
import type { Dog, HeatCycle } from '@/types';
import { Calendar, Info } from 'lucide-react';

const heatCycleSchema = z.object({
  bitchId: z.string().min(1, 'Please select a female'),
  startDate: z.string().min(1, 'Start date is required'),
  standingHeatStart: z.string().optional(),
  standingHeatEnd: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

type HeatCycleFormData = z.infer<typeof heatCycleSchema>;

interface HeatCycleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  females: Dog[];
  cycle?: HeatCycle | null;
}

export function HeatCycleFormDialog({
  open,
  onOpenChange,
  females,
  cycle,
}: HeatCycleFormDialogProps) {
  const createHeatCycle = useCreateHeatCycle();
  const updateHeatCycle = useUpdateHeatCycle();
  const isEditing = !!cycle;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HeatCycleFormData>({
    resolver: zodResolver(heatCycleSchema),
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (cycle) {
      reset({
        bitchId: cycle.bitchId,
        startDate: cycle.startDate 
          ? new Date(cycle.startDate).toISOString().split('T')[0] 
          : '',
        standingHeatStart: cycle.standingHeatStart 
          ? new Date(cycle.standingHeatStart).toISOString().split('T')[0] 
          : '',
        standingHeatEnd: cycle.standingHeatEnd 
          ? new Date(cycle.standingHeatEnd).toISOString().split('T')[0] 
          : '',
        endDate: cycle.endDate 
          ? new Date(cycle.endDate).toISOString().split('T')[0] 
          : '',
        notes: cycle.notes || '',
      });
    } else {
      reset({
        bitchId: '',
        startDate: new Date().toISOString().split('T')[0],
        standingHeatStart: '',
        standingHeatEnd: '',
        endDate: '',
        notes: '',
      });
    }
  }, [cycle, reset, open]);

  const startDate = watch('startDate');
  
  // Calculate estimated dates based on start date
  const estimatedDates = startDate ? {
    standingHeatStart: new Date(new Date(startDate).getTime() + 9 * 24 * 60 * 60 * 1000),
    standingHeatEnd: new Date(new Date(startDate).getTime() + 14 * 24 * 60 * 60 * 1000),
    ovulation: new Date(new Date(startDate).getTime() + 11 * 24 * 60 * 60 * 1000),
    optimalBreedingStart: new Date(new Date(startDate).getTime() + 12 * 24 * 60 * 60 * 1000),
    optimalBreedingEnd: new Date(new Date(startDate).getTime() + 14 * 24 * 60 * 60 * 1000),
    cycleEnd: new Date(new Date(startDate).getTime() + 21 * 24 * 60 * 60 * 1000),
    nextHeat: new Date(new Date(startDate).getTime() + 195 * 24 * 60 * 60 * 1000), // ~6.5 months
  } : null;

  const onSubmit = async (data: HeatCycleFormData) => {
    const payload = {
      bitchId: data.bitchId,
      startDate: parseLocalDate(data.startDate) || new Date(),
      standingHeatStart: parseLocalDate(data.standingHeatStart),
      standingHeatEnd: parseLocalDate(data.standingHeatEnd),
      endDate: parseLocalDate(data.endDate),
      notes: data.notes || null,
      // Set initial phase
      currentPhase: data.endDate ? 'anestrus' as const : 'proestrus' as const,
      // Calculate next heat estimate
      nextHeatEstimate: estimatedDates?.nextHeat || null,
    };

    if (isEditing && cycle) {
      await updateHeatCycle.mutateAsync({ id: cycle.id, data: payload });
    } else {
      await createHeatCycle.mutateAsync(payload);
    }
    
    reset();
    onOpenChange(false);
  };

  const formatEstimatedDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Heat Cycle' : 'Record Heat Cycle'}</DialogTitle>
          <DialogDescription>
            Track heat cycles for breeding management. Dates can be updated as the cycle progresses.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Female *</Label>
            <Select
              value={watch('bitchId')}
              onValueChange={(value) => setValue('bitchId', value)}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select female" />
              </SelectTrigger>
              <SelectContent>
                {females.map((female) => (
                  <SelectItem key={female.id} value={female.id}>
                    {female.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bitchId && (
              <p className="text-sm text-destructive">{errors.bitchId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">First Day of Bleeding *</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && (
                <p className="text-sm text-destructive">
                  {errors.startDate.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Day 1 of proestrus</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Cycle End Date</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
              <p className="text-xs text-muted-foreground">Leave blank if ongoing</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="standingHeatStart">Standing Heat Start</Label>
              <Input
                id="standingHeatStart"
                type="date"
                {...register('standingHeatStart')}
              />
              <p className="text-xs text-muted-foreground">
                When she first accepts male
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="standingHeatEnd">Standing Heat End</Label>
              <Input
                id="standingHeatEnd"
                type="date"
                {...register('standingHeatEnd')}
              />
              <p className="text-xs text-muted-foreground">
                When she stops accepting
              </p>
            </div>
          </div>

          {/* Estimated Timeline */}
          {estimatedDates && !isEditing && (
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Estimated Timeline</span>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Standing Heat:</span>
                  <span>{formatEstimatedDate(estimatedDates.standingHeatStart)} - {formatEstimatedDate(estimatedDates.standingHeatEnd)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Ovulation:</span>
                  <span>{formatEstimatedDate(estimatedDates.ovulation)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Optimal Breeding:</span>
                  <span>{formatEstimatedDate(estimatedDates.optimalBreedingStart)} - {formatEstimatedDate(estimatedDates.optimalBreedingEnd)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Heat Est.:</span>
                  <span>{formatEstimatedDate(estimatedDates.nextHeat)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * These are estimates based on average cycle. Use progesterone testing for accurate breeding timing.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Observations, behavior changes, vet visits..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Cycle' : 'Start Tracking'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

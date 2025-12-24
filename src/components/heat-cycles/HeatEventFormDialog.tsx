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
import { useCreateHeatEvent } from '@/hooks/useHeatEvents';
import { useDogs } from '@/hooks/useDogs';
import { getBreedingRecommendation } from '@/lib/db';
import { parseLocalDate } from '@/lib/utils';
import type { HeatEventType } from '@/types';
import { CheckCircle2, Clock, Calendar } from 'lucide-react';

// Event type definitions with descriptions
const eventTypes: { value: HeatEventType; label: string; category: string; description: string }[] = [
  // Bleeding/Discharge observations
  { value: 'bleeding_start', label: 'Bleeding Started', category: 'Discharge', description: 'First day of visible bleeding (Day 1 of proestrus)' },
  { value: 'bleeding_heavy', label: 'Heavy Bleeding', category: 'Discharge', description: 'Dark red, heavy discharge' },
  { value: 'bleeding_light', label: 'Light/Pink Discharge', category: 'Discharge', description: 'Lightening discharge, may indicate approaching estrus' },
  { value: 'discharge_straw', label: 'Straw-Colored Discharge', category: 'Discharge', description: 'Clear/straw colored - indicates estrus phase' },
  
  // Physical observations
  { value: 'vulva_swelling', label: 'Vulva Swelling', category: 'Physical', description: 'Noticeable vulva swelling' },
  { value: 'flagging', label: 'Flagging Behavior', category: 'Physical', description: 'Tail flagging when touched - indicates receptivity' },
  { value: 'standing', label: 'Standing Heat', category: 'Physical', description: 'Standing firmly for male - peak fertility' },
  { value: 'end_receptive', label: 'No Longer Receptive', category: 'Physical', description: 'Refusing male attention - estrus ending' },
  
  // Testing
  { value: 'progesterone_test', label: 'Progesterone Test', category: 'Testing', description: 'Blood progesterone level measurement' },
  { value: 'lh_surge', label: 'LH Surge Detected', category: 'Testing', description: 'Luteinizing hormone surge (ovulation in ~48hrs)' },
  { value: 'ovulation', label: 'Ovulation (Estimated)', category: 'Testing', description: 'Estimated ovulation date' },
  
  // Breeding
  { value: 'breeding_natural', label: 'Natural Breeding', category: 'Breeding', description: 'Natural mating occurred' },
  { value: 'breeding_ai', label: 'Artificial Insemination', category: 'Breeding', description: 'AI with fresh or chilled semen' },
  { value: 'breeding_surgical', label: 'Surgical AI', category: 'Breeding', description: 'Surgical/transcervical AI' },
  
  // Cycle
  { value: 'cycle_end', label: 'Cycle Ended', category: 'Cycle', description: 'Heat cycle has concluded' },
  { value: 'other', label: 'Other Observation', category: 'Other', description: 'Any other relevant observation' },
];

const heatEventSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  time: z.string().optional(),
  type: z.string().min(1, 'Event type is required'),
  value: z.string().optional(),
  unit: z.string().optional(),
  vetClinic: z.string().optional(),
  sireId: z.string().optional(),
  breedingMethod: z.string().optional(),
  notes: z.string().optional(),
});

type HeatEventFormData = z.infer<typeof heatEventSchema>;

interface HeatEventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  heatCycleId: string;
  defaultEventType?: HeatEventType;
}

export function HeatEventFormDialog({
  open,
  onOpenChange,
  heatCycleId,
  defaultEventType,
}: HeatEventFormDialogProps) {
  const createHeatEvent = useCreateHeatEvent();
  const { data: dogs } = useDogs();
  const males = dogs?.filter(d => d.sex === 'M') || [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HeatEventFormData>({
    resolver: zodResolver(heatEventSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      type: defaultEventType || '',
      unit: 'ng/mL',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        type: defaultEventType || '',
        unit: 'ng/mL',
      });
    }
  }, [open, defaultEventType, reset]);

  const selectedType = watch('type') as HeatEventType;
  const progesteroneValue = watch('value');
  
  const isBreedingEvent = ['breeding_natural', 'breeding_ai', 'breeding_surgical'].includes(selectedType);
  const isProgesteroneTest = selectedType === 'progesterone_test';
  
  // Get breeding recommendation if progesterone test
  const breedingRec = isProgesteroneTest && progesteroneValue 
    ? getBreedingRecommendation(parseFloat(progesteroneValue))
    : null;

  const onSubmit = async (data: HeatEventFormData) => {
    await createHeatEvent.mutateAsync({
      heatCycleId,
      date: parseLocalDate(data.date) || new Date(),
      time: data.time || null,
      type: data.type as HeatEventType,
      value: data.value || null,
      unit: isProgesteroneTest ? data.unit || 'ng/mL' : null,
      vetClinic: data.vetClinic || null,
      sireId: isBreedingEvent && data.sireId ? data.sireId : null,
      breedingMethod: isBreedingEvent ? data.breedingMethod || null : null,
      notes: data.notes || null,
    });
    reset();
    onOpenChange(false);
  };

  // Group event types by category
  const groupedEventTypes = eventTypes.reduce((acc, event) => {
    if (!acc[event.category]) acc[event.category] = [];
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, typeof eventTypes>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Heat Cycle Event</DialogTitle>
          <DialogDescription>
            Record observations, tests, or breeding events for this heat cycle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" {...register('date')} />
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="time" {...register('time')} />
            </div>
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label>Event Type *</Label>
            <Select
              value={selectedType}
              onValueChange={(value) => setValue('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(groupedEventTypes).map(([category, events]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                      {category}
                    </div>
                    {events.map((event) => (
                      <SelectItem key={event.value} value={event.value}>
                        {event.label}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
            {selectedType && (
              <p className="text-xs text-muted-foreground">
                {eventTypes.find(e => e.value === selectedType)?.description}
              </p>
            )}
          </div>

          {/* Progesterone Test Fields */}
          {isProgesteroneTest && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Progesterone Level *</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.1"
                    {...register('value')}
                    placeholder="e.g., 5.2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select
                    value={watch('unit') || 'ng/mL'}
                    onValueChange={(value) => setValue('unit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ng/mL">ng/mL</SelectItem>
                      <SelectItem value="nmol/L">nmol/L</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vetClinic">Vet Clinic</Label>
                <Input
                  id="vetClinic"
                  {...register('vetClinic')}
                  placeholder="Where was the test performed?"
                />
              </div>

              {/* Breeding Recommendation Card */}
              {breedingRec && (
                <div className={`rounded-lg border p-4 ${
                  breedingRec.isOptimal
                    ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                    : breedingRec.daysUntilOptimal !== undefined && breedingRec.daysUntilOptimal <= 1
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                    : 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                }`}>
                  <div className="flex items-start gap-3">
                    {breedingRec.isOptimal ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-semibold">{breedingRec.phase}</p>
                      <p className="text-sm">{breedingRec.recommendation}</p>
                      {breedingRec.daysUntilOptimal !== undefined && (
                        <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {breedingRec.isOptimal 
                              ? 'Breed now' 
                              : `Breed in ${breedingRec.daysUntilOptimal} day${breedingRec.daysUntilOptimal !== 1 ? 's' : ''}`
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Breeding Event Fields */}
          {isBreedingEvent && (
            <>
              <div className="space-y-2">
                <Label>Sire (Male)</Label>
                <Select
                  value={watch('sireId') || 'none'}
                  onValueChange={(value) => setValue('sireId', value === 'none' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sire" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unknown / Not in system</SelectItem>
                    {males.map((male) => (
                      <SelectItem key={male.id} value={male.id}>
                        {male.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedType === 'breeding_ai' && (
                <div className="space-y-2">
                  <Label>Semen Type</Label>
                  <Select
                    value={watch('breedingMethod') || ''}
                    onValueChange={(value) => setValue('breedingMethod', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select semen type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fresh">Fresh</SelectItem>
                      <SelectItem value="chilled">Chilled (shipped)</SelectItem>
                      <SelectItem value="frozen">Frozen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional observations, behavior notes, etc."
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
              {isSubmitting ? 'Saving...' : 'Log Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


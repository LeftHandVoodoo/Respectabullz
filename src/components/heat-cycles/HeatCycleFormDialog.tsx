import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { useCreateHeatCycle } from '@/hooks/useHeatCycles';
import type { Dog } from '@/types';

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
}

export function HeatCycleFormDialog({
  open,
  onOpenChange,
  females,
}: HeatCycleFormDialogProps) {
  const createHeatCycle = useCreateHeatCycle();

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

  const onSubmit = async (data: HeatCycleFormData) => {
    await createHeatCycle.mutateAsync({
      bitchId: data.bitchId,
      startDate: new Date(data.startDate),
      standingHeatStart: data.standingHeatStart
        ? new Date(data.standingHeatStart)
        : null,
      standingHeatEnd: data.standingHeatEnd
        ? new Date(data.standingHeatEnd)
        : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      notes: data.notes || null,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Heat Cycle</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Female *</Label>
            <Select
              value={watch('bitchId')}
              onValueChange={(value) => setValue('bitchId', value)}
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
              <Label htmlFor="startDate">Start Date *</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && (
                <p className="text-sm text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="standingHeatStart">Standing Heat Start</Label>
              <Input
                id="standingHeatStart"
                type="date"
                {...register('standingHeatStart')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="standingHeatEnd">Standing Heat End</Label>
              <Input
                id="standingHeatEnd"
                type="date"
                {...register('standingHeatEnd')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Breeding dates, progesterone tests, observations..."
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
              {isSubmitting ? 'Saving...' : 'Record Heat Cycle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateWeightEntry, useUpdateWeightEntry } from '@/hooks/useHealth';
import type { WeightEntry } from '@/types';

const weightSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  weightLbs: z.string().min(1, 'Weight is required'),
  notes: z.string().optional(),
});

type WeightFormData = z.infer<typeof weightSchema>;

interface WeightFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dogId: string;
  weightEntry?: WeightEntry;
}

export function WeightFormDialog({
  open,
  onOpenChange,
  dogId,
  weightEntry,
}: WeightFormDialogProps) {
  const createWeight = useCreateWeightEntry();
  const updateWeight = useUpdateWeightEntry();
  const isEditing = !!weightEntry;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WeightFormData>({
    resolver: zodResolver(weightSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (weightEntry && open) {
      reset({
        date: new Date(weightEntry.date).toISOString().split('T')[0],
        weightLbs: weightEntry.weightLbs.toString(),
        notes: weightEntry.notes || '',
      });
    } else if (!weightEntry && open) {
      reset({
        date: new Date().toISOString().split('T')[0],
        weightLbs: '',
        notes: '',
      });
    }
  }, [weightEntry, open, reset]);

  const onSubmit = async (data: WeightFormData) => {
    const weightData = {
      dogId,
      date: new Date(data.date),
      weightLbs: parseFloat(data.weightLbs),
      notes: data.notes || null,
    };

    if (isEditing && weightEntry) {
      await updateWeight.mutateAsync({ id: weightEntry.id, data: weightData });
    } else {
      await createWeight.mutateAsync(weightData);
    }
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Weight Entry' : 'Add Weight Entry'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" {...register('date')} />
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weightLbs">Weight (lbs) *</Label>
              <Input
                id="weightLbs"
                type="number"
                step="0.1"
                {...register('weightLbs')}
                placeholder="e.g., 45.5"
              />
              {errors.weightLbs && (
                <p className="text-sm text-destructive">
                  {errors.weightLbs.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes..."
              rows={2}
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Weight'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


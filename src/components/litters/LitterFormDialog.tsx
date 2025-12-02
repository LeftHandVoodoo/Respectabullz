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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateLitter, useUpdateLitter } from '@/hooks/useLitters';
import { useDogs } from '@/hooks/useDogs';
import { generateLitterCode } from '@/lib/utils';
import type { Litter } from '@/types';

const litterSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  nickname: z.string().optional(),
  sireId: z.string().optional(),
  damId: z.string().optional(),
  breedingDate: z.string().optional(),
  dueDate: z.string().optional(),
  whelpDate: z.string().optional(),
  totalBorn: z.string().optional(),
  totalAlive: z.string().optional(),
  notes: z.string().optional(),
});

type LitterFormData = z.infer<typeof litterSchema>;

interface LitterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  litter?: Litter | null;
}

export function LitterFormDialog({
  open,
  onOpenChange,
  litter,
}: LitterFormDialogProps) {
  const createLitter = useCreateLitter();
  const updateLitter = useUpdateLitter();
  const { data: dogs } = useDogs();

  const isEditing = !!litter;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LitterFormData>({
    resolver: zodResolver(litterSchema),
    defaultValues: {
      code: generateLitterCode(new Date()),
    },
  });

  useEffect(() => {
    if (litter) {
      reset({
        code: litter.code,
        nickname: litter.nickname || '',
        sireId: litter.sireId || '',
        damId: litter.damId || '',
        breedingDate: litter.breedingDate
          ? new Date(litter.breedingDate).toISOString().split('T')[0]
          : '',
        dueDate: litter.dueDate
          ? new Date(litter.dueDate).toISOString().split('T')[0]
          : '',
        whelpDate: litter.whelpDate
          ? new Date(litter.whelpDate).toISOString().split('T')[0]
          : '',
        totalBorn: litter.totalBorn?.toString() || '',
        totalAlive: litter.totalAlive?.toString() || '',
        notes: litter.notes || '',
      });
    } else {
      reset({
        code: generateLitterCode(new Date()),
      });
    }
  }, [litter, reset]);

  const onSubmit = async (data: LitterFormData) => {
    const payload = {
      code: data.code,
      nickname: data.nickname || null,
      sireId: data.sireId || null,
      damId: data.damId || null,
      breedingDate: data.breedingDate ? new Date(data.breedingDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      whelpDate: data.whelpDate ? new Date(data.whelpDate) : null,
      totalBorn: data.totalBorn ? parseInt(data.totalBorn) : null,
      totalAlive: data.totalAlive ? parseInt(data.totalAlive) : null,
      notes: data.notes || null,
    };

    if (isEditing && litter) {
      await updateLitter.mutateAsync({ id: litter.id, data: payload });
    } else {
      await createLitter.mutateAsync(payload);
    }

    onOpenChange(false);
  };

  const males = dogs?.filter((d) => d.sex === 'M') || [];
  const females = dogs?.filter((d) => d.sex === 'F') || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Litter' : 'Add New Litter'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Litter Code *</Label>
              <Input id="code" {...register('code')} placeholder="2025-01-ABC" />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                {...register('nickname')}
                placeholder="e.g., Spring Litter"
              />
            </div>

            <div className="space-y-2">
              <Label>Sire</Label>
              <Select
                value={watch('sireId') || 'none'}
                onValueChange={(value) =>
                  setValue('sireId', value === 'none' ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {males.map((male) => (
                    <SelectItem key={male.id} value={male.id}>
                      {male.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dam</Label>
              <Select
                value={watch('damId') || 'none'}
                onValueChange={(value) =>
                  setValue('damId', value === 'none' ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {females.map((female) => (
                    <SelectItem key={female.id} value={female.id}>
                      {female.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="breedingDate">Breeding Date</Label>
              <Input
                id="breedingDate"
                type="date"
                {...register('breedingDate')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whelpDate">Whelp Date</Label>
              <Input id="whelpDate" type="date" {...register('whelpDate')} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="totalBorn">Born</Label>
                <Input
                  id="totalBorn"
                  type="number"
                  {...register('totalBorn')}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalAlive">Alive</Label>
                <Input
                  id="totalAlive"
                  type="number"
                  {...register('totalAlive')}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes..."
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add Litter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


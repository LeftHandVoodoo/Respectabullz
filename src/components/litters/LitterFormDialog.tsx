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
import { generateLitterCode, parseLocalDate } from '@/lib/utils';
import type { Litter, LitterStatus } from '@/types';

const litterStatuses: { value: LitterStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'bred', label: 'Bred' },
  { value: 'ultrasound_confirmed', label: 'Ultrasound Confirmed' },
  { value: 'xray_confirmed', label: 'X-Ray Confirmed' },
  { value: 'whelped', label: 'Whelped' },
  { value: 'weaning', label: 'Weaning' },
  { value: 'ready_to_go', label: 'Ready to Go' },
  { value: 'completed', label: 'Completed' },
];

const ultrasoundResults = [
  { value: 'pregnant', label: 'Pregnant' },
  { value: 'not_pregnant', label: 'Not Pregnant' },
  { value: 'inconclusive', label: 'Inconclusive' },
];

const litterSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  nickname: z.string().optional(),
  sireId: z.string().optional(),
  damId: z.string().optional(),
  status: z.string().optional(),
  breedingDate: z.string().optional(),
  dueDate: z.string().optional(),
  whelpDate: z.string().optional(),
  totalBorn: z.string().optional(),
  totalAlive: z.string().optional(),
  // Pregnancy tracking
  ultrasoundDate: z.string().optional(),
  ultrasoundResult: z.string().optional(),
  ultrasoundPuppyCount: z.string().optional(),
  xrayDate: z.string().optional(),
  xrayPuppyCount: z.string().optional(),
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
        status: litter.status || 'planned',
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
        ultrasoundDate: litter.ultrasoundDate
          ? new Date(litter.ultrasoundDate).toISOString().split('T')[0]
          : '',
        ultrasoundResult: litter.ultrasoundResult || '',
        ultrasoundPuppyCount: litter.ultrasoundPuppyCount?.toString() || '',
        xrayDate: litter.xrayDate
          ? new Date(litter.xrayDate).toISOString().split('T')[0]
          : '',
        xrayPuppyCount: litter.xrayPuppyCount?.toString() || '',
        notes: litter.notes || '',
      });
    } else {
      reset({
        code: generateLitterCode(new Date()),
        status: 'planned',
      });
    }
  }, [litter, reset]);

  const onSubmit = async (data: LitterFormData) => {
    const payload = {
      code: data.code,
      nickname: data.nickname || null,
      sireId: data.sireId || null,
      damId: data.damId || null,
      status: (data.status as LitterStatus) || null,
      breedingDate: parseLocalDate(data.breedingDate),
      dueDate: parseLocalDate(data.dueDate),
      whelpDate: parseLocalDate(data.whelpDate),
      totalBorn: data.totalBorn ? parseInt(data.totalBorn) : null,
      totalAlive: data.totalAlive ? parseInt(data.totalAlive) : null,
      // Pregnancy tracking
      ultrasoundDate: parseLocalDate(data.ultrasoundDate),
      ultrasoundResult: (data.ultrasoundResult as 'pregnant' | 'not_pregnant' | 'inconclusive') || null,
      ultrasoundPuppyCount: data.ultrasoundPuppyCount ? parseInt(data.ultrasoundPuppyCount) : null,
      xrayDate: parseLocalDate(data.xrayDate),
      xrayPuppyCount: data.xrayPuppyCount ? parseInt(data.xrayPuppyCount) : null,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <Label>Status</Label>
              <Select
                value={watch('status') || 'planned'}
                onValueChange={(value) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {litterStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          {/* Pregnancy Tracking Section */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-sm">Pregnancy Confirmation</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ultrasoundDate">Ultrasound Date</Label>
                <Input
                  id="ultrasoundDate"
                  type="date"
                  {...register('ultrasoundDate')}
                />
              </div>
              <div className="space-y-2">
                <Label>Ultrasound Result</Label>
                <Select
                  value={watch('ultrasoundResult') || 'none'}
                  onValueChange={(value) =>
                    setValue('ultrasoundResult', value === 'none' ? '' : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not done</SelectItem>
                    {ultrasoundResults.map((result) => (
                      <SelectItem key={result.value} value={result.value}>
                        {result.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ultrasoundPuppyCount">US Puppy Est.</Label>
                <Input
                  id="ultrasoundPuppyCount"
                  type="number"
                  {...register('ultrasoundPuppyCount')}
                  placeholder="Count"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="xrayDate">X-Ray Date</Label>
                <Input
                  id="xrayDate"
                  type="date"
                  {...register('xrayDate')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="xrayPuppyCount">X-Ray Puppy Count</Label>
                <Input
                  id="xrayPuppyCount"
                  type="number"
                  {...register('xrayPuppyCount')}
                  placeholder="Accurate count"
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


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
import { useCreateMedicalRecord } from '@/hooks/useHealth';
import type { MedicalRecordType } from '@/types';

const recordTypes: { value: MedicalRecordType; label: string }[] = [
  { value: 'exam', label: 'Exam' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'test', label: 'Test/Lab Work' },
  { value: 'medication', label: 'Medication' },
  { value: 'injury', label: 'Injury' },
  { value: 'other', label: 'Other' },
];

const medicalSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  type: z.string().min(1, 'Type is required'),
  description: z.string().min(1, 'Description is required'),
  vetClinic: z.string().optional(),
  notes: z.string().optional(),
});

type MedicalFormData = z.infer<typeof medicalSchema>;

interface MedicalRecordFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dogId: string;
}

export function MedicalRecordFormDialog({
  open,
  onOpenChange,
  dogId,
}: MedicalRecordFormDialogProps) {
  const createRecord = useCreateMedicalRecord();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MedicalFormData>({
    resolver: zodResolver(medicalSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: '',
    },
  });

  const onSubmit = async (data: MedicalFormData) => {
    await createRecord.mutateAsync({
      dogId,
      date: new Date(data.date),
      type: data.type as MedicalRecordType,
      description: data.description,
      vetClinic: data.vetClinic || null,
      attachmentPath: null,
      notes: data.notes || null,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Medical Record</DialogTitle>
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
              <Label>Type *</Label>
              <Select
                value={watch('type')}
                onValueChange={(value) => setValue('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {recordTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe the medical event..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vetClinic">Vet Clinic</Label>
            <Input
              id="vetClinic"
              {...register('vetClinic')}
              placeholder="Clinic name"
            />
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
              {isSubmitting ? 'Saving...' : 'Add Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


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
import { useCreateVaccination } from '@/hooks/useHealth';

const vaccineTypes = [
  'DHPP',
  'Rabies',
  'Bordetella',
  'Leptospirosis',
  'Lyme',
  'Canine Influenza',
  'Parvo',
  'Distemper',
  'Other',
];

const vaccinationSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  vaccineType: z.string().min(1, 'Vaccine type is required'),
  dose: z.string().optional(),
  lotNumber: z.string().optional(),
  vetClinic: z.string().optional(),
  nextDueDate: z.string().optional(),
  notes: z.string().optional(),
});

type VaccinationFormData = z.infer<typeof vaccinationSchema>;

interface VaccinationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dogId: string;
}

export function VaccinationFormDialog({
  open,
  onOpenChange,
  dogId,
}: VaccinationFormDialogProps) {
  const createVaccination = useCreateVaccination();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VaccinationFormData>({
    resolver: zodResolver(vaccinationSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      vaccineType: '',
    },
  });

  const onSubmit = async (data: VaccinationFormData) => {
    await createVaccination.mutateAsync({
      dogId,
      date: new Date(data.date),
      vaccineType: data.vaccineType,
      dose: data.dose || null,
      lotNumber: data.lotNumber || null,
      vetClinic: data.vetClinic || null,
      nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
      notes: data.notes || null,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Vaccination</DialogTitle>
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
              <Label>Vaccine Type *</Label>
              <Select
                value={watch('vaccineType')}
                onValueChange={(value) => setValue('vaccineType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vaccine" />
                </SelectTrigger>
                <SelectContent>
                  {vaccineTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vaccineType && (
                <p className="text-sm text-destructive">
                  {errors.vaccineType.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dose">Dose</Label>
              <Input
                id="dose"
                {...register('dose')}
                placeholder="e.g., 1ml"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lotNumber">Lot Number</Label>
              <Input
                id="lotNumber"
                {...register('lotNumber')}
                placeholder="Lot #"
              />
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
              <Label htmlFor="nextDueDate">Next Due Date</Label>
              <Input
                id="nextDueDate"
                type="date"
                {...register('nextDueDate')}
              />
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
              {isSubmitting ? 'Saving...' : 'Add Vaccination'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


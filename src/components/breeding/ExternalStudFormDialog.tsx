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
import { useCreateExternalStud, useUpdateExternalStud } from '@/hooks/useExternalStuds';
import type { ExternalStud, SemenType } from '@/types';

const semenTypes: { value: SemenType; label: string }[] = [
  { value: 'fresh', label: 'Fresh' },
  { value: 'chilled', label: 'Chilled' },
  { value: 'frozen', label: 'Frozen' },
];

const studSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  breed: z.string().min(1, 'Breed is required'),
  registrationNumber: z.string().optional(),
  ownerName: z.string().optional(),
  ownerEmail: z.string().email().optional().or(z.literal('')),
  ownerPhone: z.string().optional(),
  semenType: z.string().optional(),
  healthTestingNotes: z.string().optional(),
  notes: z.string().optional(),
});

type StudFormData = z.infer<typeof studSchema>;

interface ExternalStudFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stud?: ExternalStud;
}

export function ExternalStudFormDialog({
  open,
  onOpenChange,
  stud,
}: ExternalStudFormDialogProps) {
  const createStud = useCreateExternalStud();
  const updateStud = useUpdateExternalStud();
  const isEditing = !!stud;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StudFormData>({
    resolver: zodResolver(studSchema),
    defaultValues: {
      name: '',
      breed: 'American Bully',
      registrationNumber: '',
      ownerName: '',
      ownerEmail: '',
      ownerPhone: '',
      semenType: '',
      healthTestingNotes: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (stud && open) {
      reset({
        name: stud.name,
        breed: stud.breed,
        registrationNumber: stud.registrationNumber || '',
        ownerName: stud.ownerName || '',
        ownerEmail: stud.ownerEmail || '',
        ownerPhone: stud.ownerPhone || '',
        semenType: stud.semenType || '',
        healthTestingNotes: stud.healthTestingNotes || '',
        notes: stud.notes || '',
      });
    } else if (!stud && open) {
      reset({
        name: '',
        breed: 'American Bully',
        registrationNumber: '',
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        semenType: '',
        healthTestingNotes: '',
        notes: '',
      });
    }
  }, [stud, open, reset]);

  const onSubmit = async (data: StudFormData) => {
    const payload = {
      name: data.name,
      breed: data.breed,
      registrationNumber: data.registrationNumber || null,
      ownerName: data.ownerName || null,
      ownerEmail: data.ownerEmail || null,
      ownerPhone: data.ownerPhone || null,
      semenType: (data.semenType as SemenType) || null,
      healthTestingNotes: data.healthTestingNotes || null,
      notes: data.notes || null,
    };

    if (isEditing && stud) {
      await updateStud.mutateAsync({ id: stud.id, data: payload });
    } else {
      await createStud.mutateAsync(payload);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit External Stud' : 'Add External Stud'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Stud Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Dog's name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="breed">Breed *</Label>
              <Input
                id="breed"
                {...register('breed')}
                placeholder="Breed"
              />
              {errors.breed && (
                <p className="text-sm text-destructive">{errors.breed.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Registration #</Label>
              <Input
                id="registrationNumber"
                {...register('registrationNumber')}
                placeholder="UKC/ABKC #"
              />
            </div>

            <div className="space-y-2">
              <Label>Semen Type</Label>
              <Select
                value={watch('semenType') || 'none'}
                onValueChange={(value) => setValue('semenType', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  {semenTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input
                id="ownerName"
                {...register('ownerName')}
                placeholder="Stud owner's name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Owner Email</Label>
              <Input
                id="ownerEmail"
                type="email"
                {...register('ownerEmail')}
                placeholder="email@example.com"
              />
              {errors.ownerEmail && (
                <p className="text-sm text-destructive">{errors.ownerEmail.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerPhone">Owner Phone</Label>
              <Input
                id="ownerPhone"
                {...register('ownerPhone')}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="healthTestingNotes">Health Testing</Label>
            <Textarea
              id="healthTestingNotes"
              {...register('healthTestingNotes')}
              placeholder="Health testing results (DM, CMR1, etc.)"
              rows={2}
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add Stud'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


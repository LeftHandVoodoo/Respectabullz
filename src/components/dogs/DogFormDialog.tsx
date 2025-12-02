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
import { useCreateDog, useUpdateDog, useDogs } from '@/hooks/useDogs';
import type { Dog, DogStatus, DogSex } from '@/types';

const dogSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sex: z.enum(['M', 'F']),
  breed: z.string().min(1, 'Breed is required'),
  registrationNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  color: z.string().optional(),
  microchipNumber: z.string().optional(),
  status: z.enum(['active', 'sold', 'retired', 'deceased']),
  sireId: z.string().optional(),
  damId: z.string().optional(),
  notes: z.string().optional(),
});

type DogFormData = z.infer<typeof dogSchema>;

interface DogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dog?: Dog | null;
}

export function DogFormDialog({ open, onOpenChange, dog }: DogFormDialogProps) {
  const createDog = useCreateDog();
  const updateDog = useUpdateDog();
  const { data: allDogs } = useDogs();

  const isEditing = !!dog;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DogFormData>({
    resolver: zodResolver(dogSchema),
    defaultValues: {
      name: '',
      sex: 'M',
      breed: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (dog) {
      reset({
        name: dog.name,
        sex: dog.sex,
        breed: dog.breed,
        registrationNumber: dog.registrationNumber || '',
        dateOfBirth: dog.dateOfBirth
          ? new Date(dog.dateOfBirth).toISOString().split('T')[0]
          : '',
        color: dog.color || '',
        microchipNumber: dog.microchipNumber || '',
        status: dog.status,
        sireId: dog.sireId || '',
        damId: dog.damId || '',
        notes: dog.notes || '',
      });
    } else {
      reset({
        name: '',
        sex: 'M',
        breed: '',
        status: 'active',
      });
    }
  }, [dog, reset]);

  const onSubmit = async (data: DogFormData) => {
    const payload = {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      registrationNumber: data.registrationNumber || null,
      color: data.color || null,
      microchipNumber: data.microchipNumber || null,
      sireId: data.sireId || null,
      damId: data.damId || null,
      notes: data.notes || null,
      profilePhotoPath: dog?.profilePhotoPath || null,
      litterId: dog?.litterId || null,
    };

    if (isEditing && dog) {
      await updateDog.mutateAsync({ id: dog.id, data: payload });
    } else {
      await createDog.mutateAsync(payload);
    }

    onOpenChange(false);
  };

  const males = allDogs?.filter((d) => d.sex === 'M' && d.id !== dog?.id) || [];
  const females = allDogs?.filter((d) => d.sex === 'F' && d.id !== dog?.id) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Dog' : 'Add New Dog'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter dog name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Sex */}
            <div className="space-y-2">
              <Label>Sex *</Label>
              <Select
                value={watch('sex')}
                onValueChange={(value: DogSex) => setValue('sex', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Breed */}
            <div className="space-y-2">
              <Label htmlFor="breed">Breed *</Label>
              <Input
                id="breed"
                {...register('breed')}
                placeholder="e.g., American Bully"
              />
              {errors.breed && (
                <p className="text-sm text-destructive">{errors.breed.message}</p>
              )}
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                {...register('color')}
                placeholder="e.g., Blue Tri"
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register('dateOfBirth')}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value: DogStatus) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                  <SelectItem value="deceased">Deceased</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Registration Number */}
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Registration Number</Label>
              <Input
                id="registrationNumber"
                {...register('registrationNumber')}
                placeholder="AKC/UKC number"
              />
            </div>

            {/* Microchip */}
            <div className="space-y-2">
              <Label htmlFor="microchipNumber">Microchip Number</Label>
              <Input
                id="microchipNumber"
                {...register('microchipNumber')}
                placeholder="Microchip ID"
              />
            </div>

            {/* Sire */}
            <div className="space-y-2">
              <Label>Sire (Father)</Label>
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

            {/* Dam */}
            <div className="space-y-2">
              <Label>Dam (Mother)</Label>
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
          </div>

          {/* Notes */}
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add Dog'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


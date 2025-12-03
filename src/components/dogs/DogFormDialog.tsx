import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, X } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useCreateDog, useUpdateDog, useDogs } from '@/hooks/useDogs';
import { useLitters } from '@/hooks/useLitters';
import { selectAndCopyImage, getPhotoUrlAsync, initPhotoBasePath } from '@/lib/photoUtils';
import type { Dog, DogStatus, DogSex } from '@/types';

// Standard dog breeds
const standardBreeds = [
  'American Bully',
  'American Pit Bull Terrier',
  'American Staffordshire Terrier',
  'Staffordshire Bull Terrier',
  'English Bulldog',
  'French Bulldog',
  'American Bulldog',
];

// Standard dog colors (common in bully breeds and general dog colors)
const standardColors = [
  'Black',
  'Blue',
  'Brindle',
  'Brown',
  'Chocolate',
  'Fawn',
  'Lilac',
  'Merle',
  'Red',
  'White',
  'Black & White',
  'Blue & White',
  'Brindle & White',
  'Fawn & White',
  'Red & White',
  'Tri-Color',
  'Blue Tri',
  'Chocolate Tri',
  'Lilac Tri',
  'Black Tri',
  'Seal',
  'Isabella',
  'Platinum',
  'Ghost',
  'Champagne',
];

const dogSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sex: z.enum(['M', 'F']),
  breed: z.string().min(1, 'Breed is required'),
  customBreed: z.string().optional(),
  registrationNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  color: z.string().optional(),
  customColor: z.string().optional(),
  microchipNumber: z.string().optional(),
  status: z.enum(['active', 'sold', 'retired', 'deceased']),
  sireId: z.string().optional(),
  damId: z.string().optional(),
  litterId: z.string().optional(),
  notes: z.string().optional(),
});

type DogFormData = z.infer<typeof dogSchema>;

interface DogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dog?: Dog | null;
  defaultLitterId?: string | null;  // Pre-fill litter when adding puppy from litter page
}

export function DogFormDialog({ open, onOpenChange, dog, defaultLitterId }: DogFormDialogProps) {
  const { toast } = useToast();
  const createDog = useCreateDog();
  const updateDog = useUpdateDog();
  const { data: allDogs } = useDogs();
  const { data: litters } = useLitters();
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [isCustomBreed, setIsCustomBreed] = useState(false);
  const [profilePhotoPath, setProfilePhotoPath] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const isEditing = !!dog;

  // Initialize photo base path on mount
  useEffect(() => {
    initPhotoBasePath();
  }, []);

  // Update photo URL when profile photo path changes
  useEffect(() => {
    let cancelled = false;
    
    async function loadPhotoUrl() {
      if (profilePhotoPath) {
        const url = await getPhotoUrlAsync(profilePhotoPath);
        if (!cancelled) {
          setPhotoUrl(url);
        }
      } else {
        setPhotoUrl(null);
      }
    }
    
    loadPhotoUrl();
    
    return () => {
      cancelled = true;
    };
  }, [profilePhotoPath]);

  const handlePhotoUpload = async () => {
    setIsUploadingPhoto(true);
    try {
      console.log('Starting photo upload...');
      const filename = await selectAndCopyImage();
      console.log('Photo upload result:', filename);
      if (filename) {
        console.log('Setting profile photo path to:', filename);
        setProfilePhotoPath(filename);
        // Force reload photo URL after setting path
        const url = await getPhotoUrlAsync(filename);
        console.log('Photo URL generated:', url);
        setPhotoUrl(url);
        toast({
          title: 'Photo uploaded',
          description: 'Profile photo has been uploaded successfully.',
        });
      } else {
        console.log('No filename returned from photo upload (user cancelled or error)');
        // Only show error if user didn't just cancel the dialog
        // We can't easily tell the difference, so just log it
      }
    } catch (error) {
      console.error('Failed to upload photo:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload photo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhotoPath(null);
    setPhotoUrl(null);
  };

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
      const dogColor = dog.color || '';
      const isStandardColor = standardColors.includes(dogColor);
      setIsCustomColor(!isStandardColor && dogColor !== '');
      
      const dogBreed = dog.breed || '';
      const isStandardBreed = standardBreeds.includes(dogBreed);
      setIsCustomBreed(!isStandardBreed && dogBreed !== '');
      
      // Set profile photo
      setProfilePhotoPath(dog.profilePhotoPath || null);
      
      reset({
        name: dog.name,
        sex: dog.sex,
        breed: isStandardBreed ? dogBreed : (dogBreed ? '__custom__' : ''),
        customBreed: isStandardBreed ? '' : dogBreed,
        registrationNumber: dog.registrationNumber || '',
        dateOfBirth: dog.dateOfBirth
          ? new Date(dog.dateOfBirth).toISOString().split('T')[0]
          : '',
        color: isStandardColor ? dogColor : (dogColor ? '__custom__' : ''),
        customColor: isStandardColor ? '' : dogColor,
        microchipNumber: dog.microchipNumber || '',
        status: dog.status,
        sireId: dog.sireId || '',
        damId: dog.damId || '',
        litterId: dog.litterId || '',
        notes: dog.notes || '',
      });
    } else {
      reset({
        name: '',
        sex: 'M',
        breed: '',
        customBreed: '',
        status: 'active',
        color: '',
        customColor: '',
        litterId: defaultLitterId || '',
      });
      setIsCustomColor(false);
      setIsCustomBreed(false);
      setProfilePhotoPath(null);
      setPhotoUrl(null);
    }
  }, [dog, reset, defaultLitterId]);

  const onSubmit = async (data: DogFormData) => {
    // Use custom color if "Custom" is selected, otherwise use selected standard color
    const color = data.color === '__custom__' && data.customColor
      ? data.customColor
      : data.color === '__custom__' ? null
      : data.color || null;

    // Use custom breed if "Custom" is selected, otherwise use selected standard breed
    const breed = data.breed === '__custom__' && data.customBreed
      ? data.customBreed
      : data.breed === '__custom__' ? ''
      : data.breed || '';

    const payload = {
      ...data,
      breed,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      registrationNumber: data.registrationNumber || null,
      color,
      microchipNumber: data.microchipNumber || null,
      sireId: data.sireId || null,
      damId: data.damId || null,
      litterId: data.litterId || null,
      notes: data.notes || null,
      profilePhotoPath: profilePhotoPath,
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
          {/* Profile Photo */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-dashed border-muted-foreground/50">
                {photoUrl ? (
                  <AvatarImage 
                    src={photoUrl} 
                    alt="Profile photo" 
                    className="object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', photoUrl);
                      console.error('Error event:', e);
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', photoUrl);
                    }}
                  />
                ) : null}
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <Camera className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              {photoUrl && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full"
                  onClick={handleRemovePhoto}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePhotoUpload}
                disabled={isUploadingPhoto}
              >
                <Camera className="mr-2 h-4 w-4" />
                {isUploadingPhoto ? 'Uploading...' : photoUrl ? 'Change Photo' : 'Add Photo'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Profile photo (JPG, PNG, GIF, WebP)
              </p>
            </div>
          </div>

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
              <Label>Breed *</Label>
              {isCustomBreed ? (
                <div className="space-y-2">
                  <Input
                    id="customBreed"
                    {...register('customBreed')}
                    placeholder="Enter custom breed"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      setIsCustomBreed(false);
                      setValue('breed', '');
                      setValue('customBreed', '');
                    }}
                  >
                    Use standard breed
                  </Button>
                </div>
              ) : (
                <Select
                  value={watch('breed') || ''}
                  onValueChange={(value) => {
                    if (value === '__custom__') {
                      setIsCustomBreed(true);
                      setValue('breed', '__custom__');
                    } else {
                      setValue('breed', value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select breed" />
                  </SelectTrigger>
                  <SelectContent>
                    {standardBreeds.map((breed) => (
                      <SelectItem key={breed} value={breed}>
                        {breed}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">Custom...</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {errors.breed && (
                <p className="text-sm text-destructive">{errors.breed.message}</p>
              )}
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Color</Label>
              {isCustomColor ? (
                <div className="space-y-2">
                  <Input
                    id="customColor"
                    {...register('customColor')}
                    placeholder="Enter custom color"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      setIsCustomColor(false);
                      setValue('color', '');
                      setValue('customColor', '');
                    }}
                  >
                    Use standard color
                  </Button>
                </div>
              ) : (
                <Select
                  value={watch('color') || ''}
                  onValueChange={(value) => {
                    if (value === '__custom__') {
                      setIsCustomColor(true);
                      setValue('color', '__custom__');
                    } else {
                      setValue('color', value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {standardColors.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">Custom...</SelectItem>
                  </SelectContent>
                </Select>
              )}
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

            {/* Birth Litter */}
            <div className="space-y-2 col-span-2">
              <Label>Birth Litter</Label>
              <Select
                value={watch('litterId') || 'none'}
                onValueChange={(value) =>
                  setValue('litterId', value === 'none' ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select litter (if puppy)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {litters?.map((litter) => (
                    <SelectItem key={litter.id} value={litter.id}>
                      {litter.code}{litter.nickname ? ` - ${litter.nickname}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Assign this dog to a litter if it was born from your breeding program
              </p>
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


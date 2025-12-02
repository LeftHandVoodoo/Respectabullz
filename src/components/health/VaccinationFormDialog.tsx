import { useState, useEffect } from 'react';
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

// Typical dosages for common vaccines
const typicalDosages: Record<string, string[]> = {
  'DHPP': ['1ml (adult)', '1ml (puppy - initial)', '1ml (puppy - booster)'],
  'Rabies': ['1ml (1 year)', '1ml (3 year)'],
  'Bordetella': ['0.5ml (intranasal)', '1ml (injection)', '1ml (puppy)'],
  'Leptospirosis': ['1ml (adult)', '1ml (puppy)'],
  'Lyme': ['1ml (adult)', '1ml (puppy)'],
  'Canine Influenza': ['1ml (H3N8)', '1ml (H3N2)', '1ml (bivalent)', '1ml (puppy)'],
  'Parvo': ['1ml (adult)', '1ml (puppy - initial)', '1ml (puppy - booster)'],
  'Distemper': ['1ml (adult)', '1ml (puppy - initial)', '1ml (puppy - booster)'],
  'Other': [],
};

// Typical next due date intervals in months (based on veterinary best practices)
// Puppy intervals are shorter for initial series (typically 3-4 weeks)
const vaccineIntervals: Record<string, { adult: number; puppy: number }> = {
  'DHPP': { adult: 12, puppy: 1 }, // Puppies: 3-4 weeks (1 month), Adults: annual
  'Rabies': { adult: 36, puppy: 12 }, // Puppies: 1 year, Adults: 3 years (or 1 year)
  'Bordetella': { adult: 12, puppy: 1 }, // Puppies: 3-4 weeks, Adults: annual
  'Leptospirosis': { adult: 12, puppy: 1 }, // Puppies: 3-4 weeks, Adults: annual
  'Lyme': { adult: 12, puppy: 1 }, // Puppies: 3-4 weeks, Adults: annual
  'Canine Influenza': { adult: 12, puppy: 1 }, // Puppies: 3-4 weeks, Adults: annual
  'Parvo': { adult: 12, puppy: 1 }, // Puppies: 3-4 weeks, Adults: annual
  'Distemper': { adult: 12, puppy: 1 }, // Puppies: 3-4 weeks, Adults: annual
  'Other': { adult: 12, puppy: 1 }, // Default
};

const vaccinationSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  vaccineType: z.string().min(1, 'Vaccine type is required'),
  customVaccineType: z.string().optional(),
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
  const [isCustomDose, setIsCustomDose] = useState(false);

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
      customVaccineType: '',
      dose: '',
    },
  });

  const selectedVaccine = watch('vaccineType');
  const currentDose = watch('dose');
  const doseOptions = selectedVaccine ? typicalDosages[selectedVaccine] || [] : [];

  // Reset custom dose state when vaccine changes
  useEffect(() => {
    if (selectedVaccine) {
      const options = typicalDosages[selectedVaccine] || [];
      // Check if current dose is in the options
      setIsCustomDose(currentDose ? !options.includes(currentDose) : false);
      // Auto-select first option if dose is empty and options exist
      if (!currentDose && options.length > 0) {
        setValue('dose', options[0]);
      }
    } else {
      setIsCustomDose(false);
    }
  }, [selectedVaccine, currentDose, setValue]);

  // Check if dose is for a puppy
  const isPuppyDose = (dose: string | undefined): boolean => {
    if (!dose) return false;
    const lowerDose = dose.toLowerCase();
    return lowerDose.includes('puppy') || lowerDose.includes('initial') || lowerDose.includes('booster');
  };

  // Calculate next due date based on vaccine type, vaccination date, and dose (puppy vs adult)
  const calculateNextDueDate = (vaccineType: string, vaccinationDate: string, currentDose?: string) => {
    if (!vaccinationDate) return '';
    
    const intervals = vaccineIntervals[vaccineType] || { adult: 12, puppy: 1 };
    const isPuppy = isPuppyDose(currentDose);
    let intervalMonths = isPuppy ? intervals.puppy : intervals.adult;
    
    // Special handling for Rabies - check if it's a 1-year or 3-year vaccine based on dose
    if (vaccineType === 'Rabies' && currentDose) {
      if (currentDose.includes('1 year')) {
        intervalMonths = 12; // 1-year rabies vaccine
      } else if (currentDose.includes('3 year')) {
        intervalMonths = 36; // 3-year rabies vaccine
      }
    }
    
    const date = new Date(vaccinationDate);
    date.setMonth(date.getMonth() + intervalMonths);
    
    return date.toISOString().split('T')[0];
  };

  // Auto-fill dose when vaccine type changes (if not already filled)
  const handleVaccineChange = (value: string) => {
    setValue('vaccineType', value);
    // Clear custom vaccine type when switching away from "Other"
    if (value !== 'Other') {
      setValue('customVaccineType', '');
    }
    
    const options = typicalDosages[value] || [];
    const current = watch('dose');
    const vaccinationDate = watch('date');
    
    if (options.length === 0) {
      // No typical doses for this vaccine (e.g., "Other")
      setIsCustomDose(true);
      if (!current) {
        setValue('dose', '');
      }
    } else if (!current) {
      // No dose selected yet, auto-select first option
      setValue('dose', options[0]);
      setIsCustomDose(false);
    } else if (options.includes(current)) {
      // Current dose is valid for this vaccine, keep it
      setIsCustomDose(false);
    } else {
      // Current dose doesn't match new vaccine options, reset to first option
      setValue('dose', options[0]);
      setIsCustomDose(false);
    }
    
    // Auto-calculate next due date if vaccination date is set
    if (vaccinationDate) {
      const nextDue = calculateNextDueDate(value, vaccinationDate, current);
      if (nextDue) {
        setValue('nextDueDate', nextDue);
      }
    }
  };

  // Auto-calculate next due date when vaccination date changes
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setValue('date', date);
    
    if (selectedVaccine && date) {
      const nextDue = calculateNextDueDate(selectedVaccine, date, currentDose);
      if (nextDue) {
        setValue('nextDueDate', nextDue);
      }
    }
  };

  // Update next due date when dose changes (for Rabies 1-year vs 3-year)
  const handleDoseSelect = (value: string) => {
    if (value === '__custom__') {
      setIsCustomDose(true);
      setValue('dose', '');
    } else {
      setIsCustomDose(false);
      setValue('dose', value);
      
      // Recalculate next due date if vaccination date is set
      const vaccinationDate = watch('date');
      if (selectedVaccine && vaccinationDate) {
        const nextDue = calculateNextDueDate(selectedVaccine, vaccinationDate, value);
        if (nextDue) {
          setValue('nextDueDate', nextDue);
        }
      }
    }
  };


  const onSubmit = async (data: VaccinationFormData) => {
    // Use custom vaccine type if "Other" is selected
    const vaccineType = data.vaccineType === 'Other' && data.customVaccineType
      ? data.customVaccineType
      : data.vaccineType;

    await createVaccination.mutateAsync({
      dogId,
      date: new Date(data.date),
      vaccineType,
      dose: data.dose || null,
      lotNumber: data.lotNumber || null,
      vetClinic: data.vetClinic || null,
      nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
      notes: data.notes || null,
    });
    reset();
    setIsCustomDose(false);
    onOpenChange(false);
  };

  // Reset custom dose state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsCustomDose(false);
    }
  }, [open]);

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
              <Input 
                id="date" 
                type="date" 
                {...register('date')}
                onChange={(e) => {
                  register('date').onChange(e);
                  handleDateChange(e);
                }}
              />
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Vaccine Type *</Label>
              <Select
                value={watch('vaccineType')}
                onValueChange={handleVaccineChange}
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

            {selectedVaccine === 'Other' && (
              <div className="space-y-2 col-span-2">
                <Label htmlFor="customVaccineType">Custom Vaccine Name *</Label>
                <Input
                  id="customVaccineType"
                  {...register('customVaccineType', {
                    required: selectedVaccine === 'Other' ? 'Please enter the vaccine name' : false,
                  })}
                  placeholder="Enter vaccine name"
                />
                {errors.customVaccineType && (
                  <p className="text-sm text-destructive">
                    {errors.customVaccineType.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Dose</Label>
              {isCustomDose || (doseOptions.length === 0 && selectedVaccine) ? (
                <Input
                  id="dose"
                  {...register('dose')}
                  placeholder="Enter custom dose (e.g., 1.5ml)"
                />
              ) : (
                <Select
                  key={`dose-${selectedVaccine}`}
                  value={currentDose || ''}
                  onValueChange={handleDoseSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select dose" />
                  </SelectTrigger>
                  <SelectContent>
                    {doseOptions.map((dose) => (
                      <SelectItem key={dose} value={dose}>
                        {dose}
                      </SelectItem>
                    ))}
                    {doseOptions.length > 0 && (
                      <SelectItem value="__custom__">Custom...</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
              {isCustomDose && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => {
                    setIsCustomDose(false);
                    if (doseOptions.length > 0) {
                      setValue('dose', doseOptions[0]);
                    } else {
                      setValue('dose', '');
                    }
                  }}
                >
                  Use typical dose
                </Button>
              )}
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


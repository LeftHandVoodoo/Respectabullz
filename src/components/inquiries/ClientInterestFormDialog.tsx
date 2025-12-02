import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateClientInterest, useUpdateClientInterest } from '@/hooks/useClientInterests';
import { useClients } from '@/hooks/useClients';
import { useDogs } from '@/hooks/useDogs';
import type { ClientInterest, ContactMethod, InterestStatus } from '@/types';
import { format } from 'date-fns';

const interestSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  dogId: z.string().min(1, 'Puppy is required'),
  interestDate: z.string().min(1, 'Interest date is required'),
  contactMethod: z.enum(['phone', 'email', 'website', 'social_media', 'referral', 'other'] as const),
  status: z.enum(['interested', 'contacted', 'scheduled_visit', 'converted', 'lost'] as const),
  notes: z.string().optional(),
});

type InterestFormData = z.infer<typeof interestSchema>;

interface ClientInterestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interest?: ClientInterest;
  preselectedClientId?: string;
  preselectedDogId?: string;
}

const CONTACT_METHOD_OPTIONS: { value: ContactMethod; label: string }[] = [
  { value: 'phone', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'website', label: 'Website Inquiry' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS: { value: InterestStatus; label: string }[] = [
  { value: 'interested', label: 'Interested' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'scheduled_visit', label: 'Visit Scheduled' },
  { value: 'converted', label: 'Converted to Sale' },
  { value: 'lost', label: 'Lost / Not Interested' },
];

export function ClientInterestFormDialog({
  open,
  onOpenChange,
  interest,
  preselectedClientId,
  preselectedDogId,
}: ClientInterestFormDialogProps) {
  const createInterest = useCreateClientInterest();
  const updateInterest = useUpdateClientInterest();
  const { data: clients } = useClients();
  const { data: dogs } = useDogs();
  const isEditing = !!interest;

  // Filter dogs to show only active/available puppies (not sold or deceased)
  const availableDogs = dogs?.filter(d => d.status === 'active' || d.status === 'retired') || [];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InterestFormData>({
    resolver: zodResolver(interestSchema),
    defaultValues: {
      clientId: '',
      dogId: '',
      interestDate: format(new Date(), 'yyyy-MM-dd'),
      contactMethod: 'phone',
      status: 'interested',
      notes: '',
    },
  });

  // Populate form when editing or with preselected values
  useEffect(() => {
    if (interest && open) {
      reset({
        clientId: interest.clientId,
        dogId: interest.dogId,
        interestDate: format(new Date(interest.interestDate), 'yyyy-MM-dd'),
        contactMethod: interest.contactMethod,
        status: interest.status,
        notes: interest.notes || '',
      });
    } else if (open) {
      reset({
        clientId: preselectedClientId || '',
        dogId: preselectedDogId || '',
        interestDate: format(new Date(), 'yyyy-MM-dd'),
        contactMethod: 'phone',
        status: 'interested',
        notes: '',
      });
    }
  }, [interest, open, reset, preselectedClientId, preselectedDogId]);

  const onSubmit = async (data: InterestFormData) => {
    const interestData = {
      clientId: data.clientId,
      dogId: data.dogId,
      interestDate: new Date(data.interestDate),
      contactMethod: data.contactMethod as ContactMethod,
      status: data.status as InterestStatus,
      notes: data.notes || null,
      convertedToSaleId: interest?.convertedToSaleId || null,
    };

    if (isEditing && interest) {
      await updateInterest.mutateAsync({ id: interest.id, data: interestData });
    } else {
      await createInterest.mutateAsync(interestData);
    }
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Interest' : 'Record Client Interest'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="clientId">Client *</Label>
            <Controller
              name="clientId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                        {client.city && client.state && (
                          <span className="text-muted-foreground ml-2">
                            ({client.city}, {client.state})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.clientId && (
              <p className="text-sm text-destructive">{errors.clientId.message}</p>
            )}
          </div>

          {/* Puppy Selection */}
          <div className="space-y-2">
            <Label htmlFor="dogId">Puppy *</Label>
            <Controller
              name="dogId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a puppy" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDogs.map((dog) => (
                      <SelectItem key={dog.id} value={dog.id}>
                        {dog.name}
                        {dog.color && (
                          <span className="text-muted-foreground ml-2">
                            ({dog.color})
                          </span>
                        )}
                        {dog.sex && (
                          <span className="text-muted-foreground ml-1">
                            - {dog.sex === 'M' ? 'Male' : 'Female'}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                    {/* Also show the dog if editing and it's sold (to keep current selection) */}
                    {isEditing && interest?.dog && !availableDogs.find(d => d.id === interest.dogId) && (
                      <SelectItem key={interest.dogId} value={interest.dogId}>
                        {interest.dog.name} (Sold)
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.dogId && (
              <p className="text-sm text-destructive">{errors.dogId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Interest Date */}
            <div className="space-y-2">
              <Label htmlFor="interestDate">Interest Date *</Label>
              <Controller
                name="interestDate"
                control={control}
                render={({ field }) => (
                  <input
                    type="date"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  />
                )}
              />
              {errors.interestDate && (
                <p className="text-sm text-destructive">{errors.interestDate.message}</p>
              )}
            </div>

            {/* Contact Method */}
            <div className="space-y-2">
              <Label htmlFor="contactMethod">Contact Method *</Label>
              <Controller
                name="contactMethod"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_METHOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                  disabled={interest?.status === 'converted'} // Can't change status if already converted
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        disabled={option.value === 'converted' && !interest?.convertedToSaleId}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {interest?.status === 'converted' && (
              <p className="text-sm text-muted-foreground">
                This interest has been converted to a sale and cannot be changed.
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Additional notes about this interest..."
                  rows={3}
                />
              )}
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Record Interest'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


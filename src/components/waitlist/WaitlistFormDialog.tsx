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
import { useCreateWaitlistEntry, useUpdateWaitlistEntry } from '@/hooks/useWaitlist';
import { useClients } from '@/hooks/useClients';
import { useLitters } from '@/hooks/useLitters';
import type { WaitlistEntry, SexPreference, DepositStatus } from '@/types';

const sexPreferences: { value: SexPreference; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'either', label: 'Either' },
];

const depositStatuses: { value: DepositStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'applied_to_sale', label: 'Applied to Sale' },
];

const waitlistSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  litterId: z.string().optional(),
  preference: z.string().min(1, 'Preference is required'),
  colorPreference: z.string().optional(),
  depositAmount: z.string().optional(),
  depositDate: z.string().optional(),
  depositStatus: z.string().optional(),
  notes: z.string().optional(),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

interface WaitlistFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: WaitlistEntry;
  defaultLitterId?: string;
}

export function WaitlistFormDialog({
  open,
  onOpenChange,
  entry,
  defaultLitterId,
}: WaitlistFormDialogProps) {
  const createEntry = useCreateWaitlistEntry();
  const updateEntry = useUpdateWaitlistEntry();
  const { data: clients } = useClients();
  const { data: litters } = useLitters();
  const isEditing = !!entry;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      preference: 'either',
      depositStatus: 'pending',
      litterId: defaultLitterId || '',
    },
  });

  useEffect(() => {
    if (entry && open) {
      reset({
        clientId: entry.clientId,
        litterId: entry.litterId || '',
        preference: entry.preference,
        colorPreference: entry.colorPreference || '',
        depositAmount: entry.depositAmount?.toString() || '',
        depositDate: entry.depositDate 
          ? new Date(entry.depositDate).toISOString().split('T')[0]
          : '',
        depositStatus: entry.depositStatus,
        notes: entry.notes || '',
      });
    } else if (!entry && open) {
      reset({
        clientId: '',
        litterId: defaultLitterId || '',
        preference: 'either',
        depositStatus: 'pending',
        colorPreference: '',
        depositAmount: '',
        depositDate: '',
        notes: '',
      });
    }
  }, [entry, open, defaultLitterId, reset]);

  const onSubmit = async (data: WaitlistFormData) => {
    const payload = {
      clientId: data.clientId,
      litterId: data.litterId || null,
      preference: data.preference as SexPreference,
      colorPreference: data.colorPreference || null,
      depositAmount: data.depositAmount ? parseFloat(data.depositAmount) : null,
      depositDate: data.depositDate ? new Date(data.depositDate) : null,
      depositStatus: (data.depositStatus as DepositStatus) || 'pending',
      status: 'waiting' as const,
      position: 0, // Will be set by the create function
      notes: data.notes || null,
    };

    if (isEditing && entry) {
      await updateEntry.mutateAsync({ id: entry.id, data: payload });
    } else {
      await createEntry.mutateAsync(payload);
    }

    onOpenChange(false);
  };

  // Filter to upcoming litters (not completed)
  const upcomingLitters = litters?.filter(l => 
    l.status !== 'completed' || !l.status
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Waitlist Entry' : 'Add to Waitlist'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Client *</Label>
              <Select
                value={watch('clientId') || ''}
                onValueChange={(value) => setValue('clientId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && (
                <p className="text-sm text-destructive">{errors.clientId.message}</p>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Litter (Optional)</Label>
              <Select
                value={watch('litterId') || 'general'}
                onValueChange={(value) => setValue('litterId', value === 'general' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="General waitlist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Waitlist</SelectItem>
                  {upcomingLitters.map((litter) => (
                    <SelectItem key={litter.id} value={litter.id}>
                      {litter.code} {litter.nickname ? `- ${litter.nickname}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Leave as "General Waitlist" if not for a specific litter
              </p>
            </div>

            <div className="space-y-2">
              <Label>Sex Preference *</Label>
              <Select
                value={watch('preference')}
                onValueChange={(value) => setValue('preference', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sexPreferences.map((pref) => (
                    <SelectItem key={pref.value} value={pref.value}>
                      {pref.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.preference && (
                <p className="text-sm text-destructive">{errors.preference.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="colorPreference">Color Preference</Label>
              <Input
                id="colorPreference"
                {...register('colorPreference')}
                placeholder="e.g., Blue, Fawn"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="depositAmount">Deposit Amount</Label>
              <Input
                id="depositAmount"
                type="number"
                step="0.01"
                {...register('depositAmount')}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="depositDate">Deposit Date</Label>
              <Input
                id="depositDate"
                type="date"
                {...register('depositDate')}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Deposit Status</Label>
              <Select
                value={watch('depositStatus')}
                onValueChange={(value) => setValue('depositStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {depositStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add to Waitlist'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


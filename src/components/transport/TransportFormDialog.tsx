import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTransport, useUpdateTransport } from '@/hooks/useTransport';
import { useDogs } from '@/hooks/useDogs';
import { parseLocalDate } from '@/lib/utils';
import type { Transport, TransportMode } from '@/types';

const transportSchema = z.object({
  dogId: z.string().min(1, 'Please select a dog'),
  date: z.string().min(1, 'Date is required'),
  mode: z.string().min(1, 'Mode is required'),
  shipperBusinessName: z.string().optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  originCity: z.string().optional(),
  originState: z.string().optional(),
  destinationCity: z.string().optional(),
  destinationState: z.string().optional(),
  trackingNumber: z.string().optional(),
  cost: z.string().optional(),
  notes: z.string().optional(),
});

type TransportFormData = z.infer<typeof transportSchema>;

interface TransportFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transport?: Transport;
  defaultDogId?: string;
}

export function TransportFormDialog({
  open,
  onOpenChange,
  transport,
  defaultDogId,
}: TransportFormDialogProps) {
  const createTransport = useCreateTransport();
  const updateTransport = useUpdateTransport();
  const { data: dogs } = useDogs();
  const isEditing = !!transport;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransportFormData>({
    resolver: zodResolver(transportSchema),
    defaultValues: {
      dogId: defaultDogId || '',
      date: new Date().toISOString().split('T')[0],
      mode: 'ground',
    },
  });

  // Populate form when editing or set defaults
  useEffect(() => {
    if (transport && open) {
      setValue('dogId', transport.dogId);
      setValue('date', new Date(transport.date).toISOString().split('T')[0]);
      setValue('mode', transport.mode);
      setValue('shipperBusinessName', transport.shipperBusinessName || '');
      setValue('contactName', transport.contactName || '');
      setValue('phone', transport.phone || '');
      setValue('email', transport.email || '');
      setValue('originCity', transport.originCity || '');
      setValue('originState', transport.originState || '');
      setValue('destinationCity', transport.destinationCity || '');
      setValue('destinationState', transport.destinationState || '');
      setValue('trackingNumber', transport.trackingNumber || '');
      setValue('cost', transport.cost?.toString() || '');
      setValue('notes', transport.notes || '');
    } else if (!transport && open) {
      reset({
        dogId: defaultDogId || '',
        date: new Date().toISOString().split('T')[0],
        mode: 'ground',
      });
    }
  }, [transport, open, setValue, reset, defaultDogId]);

  const onSubmit = async (data: TransportFormData) => {
    const transportData = {
      dogId: data.dogId,
      date: parseLocalDate(data.date) || new Date(),
      mode: data.mode as TransportMode,
      shipperBusinessName: data.shipperBusinessName || null,
      contactName: data.contactName || null,
      phone: data.phone || null,
      email: data.email || null,
      originCity: data.originCity || null,
      originState: data.originState || null,
      destinationCity: data.destinationCity || null,
      destinationState: data.destinationState || null,
      trackingNumber: data.trackingNumber || null,
      cost: data.cost ? parseFloat(data.cost) : null,
      notes: data.notes || null,
      expenseId: null,
    };

    if (isEditing && transport) {
      await updateTransport.mutateAsync({ id: transport.id, data: transportData });
    } else {
      await createTransport.mutateAsync(transportData);
    }
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Transport Record' : 'Add Transport Record'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the transport details below.' : 'Enter the transport details for this shipment.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dog *</Label>
              <Select
                value={watch('dogId')}
                onValueChange={(value) => setValue('dogId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dog" />
                </SelectTrigger>
                <SelectContent>
                  {dogs?.map((dog) => (
                    <SelectItem key={dog.id} value={dog.id}>
                      {dog.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.dogId && (
                <p className="text-sm text-destructive">{errors.dogId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" {...register('date')} />
            </div>

            <div className="space-y-2">
              <Label>Mode *</Label>
              <Select
                value={watch('mode')}
                onValueChange={(value) => setValue('mode', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flight">Flight</SelectItem>
                  <SelectItem value="ground">Ground</SelectItem>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                {...register('cost')}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Shipper Info */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-4">Shipper Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shipperBusinessName">Business Name</Label>
                <Input
                  id="shipperBusinessName"
                  {...register('shipperBusinessName')}
                  placeholder="Shipper company"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  {...register('contactName')}
                  placeholder="Contact person"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <PhoneInput
                  id="phone"
                  {...register('phone')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="shipper@example.com"
                />
              </div>
            </div>
          </div>

          {/* Route Info */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-4">Route</h4>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="originCity">Origin City</Label>
                <Input id="originCity" {...register('originCity')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="originState">State</Label>
                <Input id="originState" {...register('originState')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinationCity">Destination City</Label>
                <Input id="destinationCity" {...register('destinationCity')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinationState">State</Label>
                <Input id="destinationState" {...register('destinationState')} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trackingNumber">Tracking Number</Label>
            <Input
              id="trackingNumber"
              {...register('trackingNumber')}
              placeholder="Tracking #"
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Transport'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


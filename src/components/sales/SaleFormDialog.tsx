import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateSale, useUpdateSale, useClients } from '@/hooks/useClients';
import { useDogs } from '@/hooks/useDogs';
import { useTransports } from '@/hooks/useTransport';
import type { Sale, PaymentStatus } from '@/types';
import { format } from 'date-fns';

const puppySchema = z.object({
  dogId: z.string().min(1, 'Puppy is required'),
  price: z.coerce.number().min(0, 'Price must be positive'),
});

const saleSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  saleDate: z.string().min(1, 'Sale date is required'),
  price: z.coerce.number().min(0, 'Total price must be positive'),
  depositAmount: z.coerce.number().optional(),
  depositDate: z.string().optional(),
  paymentStatus: z.enum(['deposit_only', 'partial', 'paid_in_full', 'refunded'] as const),
  shippedDate: z.string().optional(),
  receivedDate: z.string().optional(),
  isLocalPickup: z.boolean(),
  transportId: z.string().optional(),
  warrantyInfo: z.string().optional(),
  registrationTransferDate: z.string().optional(),
  contractPath: z.string().optional(),
  notes: z.string().optional(),
  puppies: z.array(puppySchema).min(1, 'At least one puppy is required'),
});

type SaleFormData = z.infer<typeof saleSchema>;

interface SaleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale?: Sale;
  preselectedClientId?: string;
  preselectedPuppies?: { dogId: string; price: number }[];
}

const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'deposit_only', label: 'Deposit Only' },
  { value: 'partial', label: 'Partial Payment' },
  { value: 'paid_in_full', label: 'Paid in Full' },
  { value: 'refunded', label: 'Refunded' },
];

export function SaleFormDialog({
  open,
  onOpenChange,
  sale,
  preselectedClientId,
  preselectedPuppies,
}: SaleFormDialogProps) {
  const createSale = useCreateSale();
  const updateSale = useUpdateSale();
  const { data: clients } = useClients();
  const { data: dogs } = useDogs();
  const { data: transports } = useTransports();
  const isEditing = !!sale;

  // Filter dogs to show only active/available puppies (not sold or deceased)
  // But also include dogs that are already in this sale when editing
  const existingPuppyIds = sale?.puppies?.map(p => p.dogId) || [];
  const availableDogs = dogs?.filter(d => 
    d.status === 'active' || 
    d.status === 'retired' || 
    existingPuppyIds.includes(d.id)
  ) || [];

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      clientId: '',
      saleDate: format(new Date(), 'yyyy-MM-dd'),
      price: 0,
      depositAmount: undefined,
      depositDate: '',
      paymentStatus: 'deposit_only',
      shippedDate: '',
      receivedDate: '',
      isLocalPickup: false,
      transportId: '',
      warrantyInfo: '',
      registrationTransferDate: '',
      contractPath: '',
      notes: '',
      puppies: [{ dogId: '', price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'puppies',
  });

  const watchIsLocalPickup = watch('isLocalPickup');
  const watchPuppies = watch('puppies');

  // Auto-calculate total price from puppies
  useEffect(() => {
    const total = watchPuppies.reduce((sum, p) => sum + (p.price || 0), 0);
    setValue('price', total);
  }, [watchPuppies, setValue]);

  // Populate form when editing or with preselected values
  useEffect(() => {
    if (sale && open) {
      reset({
        clientId: sale.clientId,
        saleDate: format(new Date(sale.saleDate), 'yyyy-MM-dd'),
        price: sale.price,
        depositAmount: sale.depositAmount ?? undefined,
        depositDate: sale.depositDate ? format(new Date(sale.depositDate), 'yyyy-MM-dd') : '',
        paymentStatus: sale.paymentStatus,
        shippedDate: sale.shippedDate ? format(new Date(sale.shippedDate), 'yyyy-MM-dd') : '',
        receivedDate: sale.receivedDate ? format(new Date(sale.receivedDate), 'yyyy-MM-dd') : '',
        isLocalPickup: sale.isLocalPickup,
        transportId: sale.transportId || '',
        warrantyInfo: sale.warrantyInfo || '',
        registrationTransferDate: sale.registrationTransferDate 
          ? format(new Date(sale.registrationTransferDate), 'yyyy-MM-dd') 
          : '',
        contractPath: sale.contractPath || '',
        notes: sale.notes || '',
        puppies: sale.puppies?.map(p => ({ dogId: p.dogId, price: p.price })) || [{ dogId: '', price: 0 }],
      });
    } else if (open) {
      reset({
        clientId: preselectedClientId || '',
        saleDate: format(new Date(), 'yyyy-MM-dd'),
        price: 0,
        depositAmount: undefined,
        depositDate: '',
        paymentStatus: 'deposit_only',
        shippedDate: '',
        receivedDate: '',
        isLocalPickup: false,
        transportId: '',
        warrantyInfo: '',
        registrationTransferDate: '',
        contractPath: '',
        notes: '',
        puppies: preselectedPuppies?.length 
          ? preselectedPuppies 
          : [{ dogId: '', price: 0 }],
      });
    }
  }, [sale, open, reset, preselectedClientId, preselectedPuppies]);

  const onSubmit = async (data: SaleFormData) => {
    const saleData = {
      clientId: data.clientId,
      saleDate: new Date(data.saleDate),
      price: data.price,
      depositAmount: data.depositAmount || null,
      depositDate: data.depositDate ? new Date(data.depositDate) : null,
      paymentStatus: data.paymentStatus as PaymentStatus,
      shippedDate: data.shippedDate ? new Date(data.shippedDate) : null,
      receivedDate: data.receivedDate ? new Date(data.receivedDate) : null,
      isLocalPickup: data.isLocalPickup,
      transportId: data.isLocalPickup ? null : (data.transportId || null),
      warrantyInfo: data.warrantyInfo || null,
      registrationTransferDate: data.registrationTransferDate 
        ? new Date(data.registrationTransferDate) 
        : null,
      contractPath: data.contractPath || null,
      notes: data.notes || null,
      puppies: data.puppies,
    };

    if (isEditing && sale) {
      await updateSale.mutateAsync({ id: sale.id, data: saleData });
    } else {
      await createSale.mutateAsync(saleData);
    }
    reset();
    onOpenChange(false);
  };

  // Get already selected puppy IDs to filter them out from other dropdowns
  const selectedPuppyIds = watchPuppies.map(p => p.dogId).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Sale' : 'Record Sale'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          {/* Puppies Section */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Puppies in Sale *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ dogId: '', price: 0 })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Puppy
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-start">
                <div className="flex-1 space-y-2">
                  <Label>Puppy</Label>
                  <Controller
                    name={`puppies.${index}.dogId`}
                    control={control}
                    render={({ field: selectField }) => (
                      <Select onValueChange={selectField.onChange} value={selectField.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a puppy" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDogs
                            .filter(dog => 
                              !selectedPuppyIds.includes(dog.id) || 
                              dog.id === selectField.value
                            )
                            .map((dog) => (
                              <SelectItem key={dog.id} value={dog.id}>
                                {dog.name}
                                {dog.color && ` (${dog.color})`}
                                {dog.sex && ` - ${dog.sex === 'M' ? 'Male' : 'Female'}`}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.puppies?.[index]?.dogId && (
                    <p className="text-sm text-destructive">
                      {errors.puppies[index]?.dogId?.message}
                    </p>
                  )}
                </div>

                <div className="w-32 space-y-2">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register(`puppies.${index}.price`)}
                  />
                  {errors.puppies?.[index]?.price && (
                    <p className="text-sm text-destructive">
                      {errors.puppies[index]?.price?.message}
                    </p>
                  )}
                </div>

                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-8"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}

            {errors.puppies?.root && (
              <p className="text-sm text-destructive">{errors.puppies.root.message}</p>
            )}
          </div>

          {/* Sale Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="saleDate">Sale Date *</Label>
              <Controller
                name="saleDate"
                control={control}
                render={({ field }) => (
                  <input
                    type="date"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    {...field}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Total Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('price')}
                className="bg-muted"
                readOnly
              />
              <p className="text-xs text-muted-foreground">Auto-calculated from puppies</p>
            </div>
          </div>

          {/* Deposit Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="depositAmount">Deposit Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('depositAmount')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="depositDate">Deposit Date</Label>
              <Controller
                name="depositDate"
                control={control}
                render={({ field }) => (
                  <input
                    type="date"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    {...field}
                  />
                )}
              />
            </div>
          </div>

          {/* Payment Status */}
          <div className="space-y-2">
            <Label htmlFor="paymentStatus">Payment Status *</Label>
            <Controller
              name="paymentStatus"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Shipping Section */}
          <div className="border rounded-lg p-4 space-y-4">
            <Label className="text-base font-semibold">Shipping / Pickup</Label>

            <div className="flex items-center space-x-2">
              <Controller
                name="isLocalPickup"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="isLocalPickup"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="isLocalPickup" className="font-normal">
                Local Pickup (no shipping required)
              </Label>
            </div>

            {!watchIsLocalPickup && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shippedDate">Shipped Date</Label>
                    <Controller
                      name="shippedDate"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="date"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          {...field}
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receivedDate">Received Date</Label>
                    <Controller
                      name="receivedDate"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="date"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          {...field}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transportId">Link to Transport Record</Label>
                  <Controller
                    name="transportId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transport (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {transports?.map((transport) => (
                            <SelectItem key={transport.id} value={transport.id}>
                              {format(new Date(transport.date), 'MMM d, yyyy')} - {transport.mode}
                              {transport.destinationCity && ` to ${transport.destinationCity}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </>
            )}
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="warrantyInfo">Warranty / Health Guarantee</Label>
              <Textarea
                {...register('warrantyInfo')}
                placeholder="Health guarantee details, warranty terms..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registrationTransferDate">Registration Transfer Date</Label>
                <Controller
                  name="registrationTransferDate"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="date"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      {...field}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractPath">Contract File Path</Label>
                <Input
                  {...register('contractPath')}
                  placeholder="/path/to/contract.pdf"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                {...register('notes')}
                placeholder="Additional notes about this sale..."
                rows={2}
              />
            </div>
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Record Sale'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


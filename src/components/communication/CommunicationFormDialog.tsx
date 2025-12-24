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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateCommunicationLog, useUpdateCommunicationLog } from '@/hooks/useCommunicationLogs';
import { useLitters } from '@/hooks/useLitters';
import { parseLocalDate } from '@/lib/utils';
import type { CommunicationLog, CommunicationType, CommunicationDirection } from '@/types';

const communicationTypes: { value: CommunicationType; label: string }[] = [
  { value: 'phone', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'text', label: 'Text Message' },
  { value: 'in_person', label: 'In Person' },
  { value: 'video_call', label: 'Video Call' },
  { value: 'social_media', label: 'Social Media' },
];

const directions: { value: CommunicationDirection; label: string }[] = [
  { value: 'inbound', label: 'From Client' },
  { value: 'outbound', label: 'To Client' },
];

const communicationSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  type: z.string().min(1, 'Type is required'),
  direction: z.string().min(1, 'Direction is required'),
  summary: z.string().min(1, 'Summary is required'),
  followUpNeeded: z.boolean().optional(),
  followUpDate: z.string().optional(),
  relatedLitterId: z.string().optional(),
  notes: z.string().optional(),
});

type CommunicationFormData = z.infer<typeof communicationSchema>;

interface CommunicationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  log?: CommunicationLog;
}

export function CommunicationFormDialog({
  open,
  onOpenChange,
  clientId,
  log,
}: CommunicationFormDialogProps) {
  const createLog = useCreateCommunicationLog();
  const updateLog = useUpdateCommunicationLog();
  const { data: litters } = useLitters();
  const isEditing = !!log;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CommunicationFormData>({
    resolver: zodResolver(communicationSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: 'phone',
      direction: 'outbound',
      summary: '',
      followUpNeeded: false,
      followUpDate: '',
      relatedLitterId: '',
      notes: '',
    },
  });

  const followUpNeeded = watch('followUpNeeded');

  useEffect(() => {
    if (log && open) {
      reset({
        date: new Date(log.date).toISOString().split('T')[0],
        type: log.type,
        direction: log.direction,
        summary: log.summary,
        followUpNeeded: log.followUpNeeded,
        followUpDate: log.followUpDate 
          ? new Date(log.followUpDate).toISOString().split('T')[0]
          : '',
        relatedLitterId: log.relatedLitterId || '',
        notes: log.notes || '',
      });
    } else if (!log && open) {
      reset({
        date: new Date().toISOString().split('T')[0],
        type: 'phone',
        direction: 'outbound',
        summary: '',
        followUpNeeded: false,
        followUpDate: '',
        relatedLitterId: '',
        notes: '',
      });
    }
  }, [log, open, reset]);

  const onSubmit = async (data: CommunicationFormData) => {
    const payload = {
      clientId,
      date: parseLocalDate(data.date) || new Date(),
      type: data.type as CommunicationType,
      direction: data.direction as CommunicationDirection,
      summary: data.summary,
      followUpNeeded: data.followUpNeeded || false,
      followUpDate: parseLocalDate(data.followUpDate),
      relatedLitterId: data.relatedLitterId || null,
      notes: data.notes || null,
    };

    if (isEditing && log) {
      await updateLog.mutateAsync({ id: log.id, data: payload });
    } else {
      await createLog.mutateAsync(payload);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Communication' : 'Log Communication'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                {...register('date')}
              />
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {communicationTypes.map((type) => (
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

            <div className="space-y-2 col-span-2">
              <Label>Direction *</Label>
              <Select
                value={watch('direction')}
                onValueChange={(value) => setValue('direction', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {directions.map((dir) => (
                    <SelectItem key={dir.value} value={dir.value}>
                      {dir.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="summary">Summary *</Label>
              <Textarea
                id="summary"
                {...register('summary')}
                placeholder="Brief summary of the communication..."
                rows={2}
              />
              {errors.summary && (
                <p className="text-sm text-destructive">{errors.summary.message}</p>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Related Litter (Optional)</Label>
              <Select
                value={watch('relatedLitterId') || 'none'}
                onValueChange={(value) => setValue('relatedLitterId', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Not litter-specific" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not litter-specific</SelectItem>
                  {litters?.map((litter) => (
                    <SelectItem key={litter.id} value={litter.id}>
                      {litter.code} {litter.nickname ? `- ${litter.nickname}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <Checkbox
                id="followUpNeeded"
                checked={followUpNeeded}
                onCheckedChange={(checked) => setValue('followUpNeeded', !!checked)}
              />
              <Label htmlFor="followUpNeeded" className="cursor-pointer">
                Follow-up needed
              </Label>
            </div>

            {followUpNeeded && (
              <div className="space-y-2 col-span-2">
                <Label htmlFor="followUpDate">Follow-up Date</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  {...register('followUpDate')}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional details..."
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Log Communication'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


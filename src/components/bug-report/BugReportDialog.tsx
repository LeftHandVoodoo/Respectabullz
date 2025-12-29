import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bug } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSubmitBugReport } from '@/hooks/useBugReport';
import { bugReportSeverity, type BugReportFormData } from '@/types';

interface BugReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const bugReportSchema = z.object({
  title: z.string().min(1, 'Title is required').max(256, 'Title too long'),
  description: z.string().min(10, 'Please provide a detailed description'),
  stepsToReproduce: z.string().optional(),
  expectedBehavior: z.string().optional(),
  actualBehavior: z.string().optional(),
  severity: z.enum(bugReportSeverity),
});

const severityLabels: Record<string, { label: string; description: string }> = {
  low: { label: 'Low', description: 'Minor issue, workaround available' },
  medium: { label: 'Medium', description: 'Functional issue, impacts workflow' },
  high: { label: 'High', description: 'Major issue, significant impact' },
  critical: { label: 'Critical', description: 'App crash or data loss' },
};

export function BugReportDialog({ open, onOpenChange }: BugReportDialogProps) {
  const submitBugReport = useSubmitBugReport();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<BugReportFormData>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: {
      title: '',
      description: '',
      stepsToReproduce: '',
      expectedBehavior: '',
      actualBehavior: '',
      severity: 'medium',
    },
  });

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: BugReportFormData) => {
    await submitBugReport.mutateAsync(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Report a Bug
          </DialogTitle>
          <DialogDescription>
            Help us improve by reporting issues you encounter. Your system
            information will be automatically included.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Brief summary of the issue"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe the issue in detail..."
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="stepsToReproduce">Steps to Reproduce</Label>
            <Textarea
              id="stepsToReproduce"
              {...register('stepsToReproduce')}
              placeholder={'1. Go to...\n2. Click on...\n3. Observe...'}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expectedBehavior">Expected Behavior</Label>
              <Textarea
                id="expectedBehavior"
                {...register('expectedBehavior')}
                placeholder="What should happen?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualBehavior">Actual Behavior</Label>
              <Textarea
                id="actualBehavior"
                {...register('actualBehavior')}
                placeholder="What actually happens?"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">
              Severity <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="severity"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {bugReportSeverity.map((severity) => (
                      <SelectItem key={severity} value={severity}>
                        <div className="flex flex-col">
                          <span>{severityLabels[severity].label}</span>
                          <span className="text-xs text-muted-foreground">
                            {severityLabels[severity].description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.severity && (
              <p className="text-sm text-destructive">
                {errors.severity.message}
              </p>
            )}
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
            System information (app version, OS, timestamp) will be
            automatically included in the report.
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitBugReport.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitBugReport.isPending}>
              {submitBugReport.isPending ? 'Submitting...' : 'Submit Bug Report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

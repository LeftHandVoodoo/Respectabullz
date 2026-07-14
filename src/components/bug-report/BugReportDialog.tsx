import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bug, ExternalLink } from 'lucide-react';
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
import { usePrepareBugReport } from '@/hooks/useBugReport';
import { collectSystemInfo, createGitHubIssueDraft } from '@/lib/github';
import { bugReportSeverity, type BugReportFormData, type BugReportPayload } from '@/types';

interface BugReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const bugReportSchema = z.object({
  title: z.string().min(1, 'Title is required').max(256, 'Title too long'),
  description: z.string().min(10, 'Please provide a detailed description').max(4000, 'Description is too long'),
  stepsToReproduce: z.string().max(4000, 'Steps are too long').optional(),
  expectedBehavior: z.string().max(4000, 'Expected behavior is too long').optional(),
  actualBehavior: z.string().max(4000, 'Actual behavior is too long').optional(),
  severity: z.enum(bugReportSeverity),
});

const severityLabels: Record<string, { label: string; description: string }> = {
  low: { label: 'Low', description: 'Minor issue, workaround available' },
  medium: { label: 'Medium', description: 'Functional issue, impacts workflow' },
  high: { label: 'High', description: 'Major issue, significant impact' },
  critical: { label: 'Critical', description: 'App crash or data loss' },
};

export function BugReportDialog({ open, onOpenChange }: BugReportDialogProps) {
  const prepareBugReport = usePrepareBugReport();
  const [systemInfo, setSystemInfo] = useState(() => collectSystemInfo());

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
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
    } else {
      setSystemInfo(collectSystemInfo());
    }
  }, [open, reset]);

  const title = watch('title');
  const description = watch('description');
  const stepsToReproduce = watch('stepsToReproduce');
  const expectedBehavior = watch('expectedBehavior');
  const actualBehavior = watch('actualBehavior');
  const severity = watch('severity');

  const visibleDraft = useMemo(() => {
    const payload: BugReportPayload = {
      title: title || '',
      description: description || '',
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      severity: severity || 'medium',
      systemInfo,
    };

    return createGitHubIssueDraft(payload);
  }, [
    actualBehavior,
    description,
    expectedBehavior,
    severity,
    stepsToReproduce,
    systemInfo,
    title,
  ]);

  const onSubmit = async (data: BugReportFormData) => {
    const draft = createGitHubIssueDraft({ ...data, systemInfo });
    await prepareBugReport.mutateAsync(draft);
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
            Prepare a sanitized report locally, then review and submit it yourself on GitHub.
            Nothing is sent automatically.
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

          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-foreground">
            <p className="font-semibold">GitHub issues are public.</p>
            <p className="mt-1 text-muted-foreground">
              Review the complete sanitized preview below. Continuing copies this exact report and
              opens GitHub, but nothing is published until you submit it there. No app credential is
              used. Remove any animal or client names, record details, or other information you do not
              want to make public.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bug-report-preview">Public issue preview</Label>
            <Textarea
              id="bug-report-preview"
              aria-label="Public issue preview"
              value={`Title: ${visibleDraft.title}\n\n${visibleDraft.body}`}
              readOnly
              rows={14}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Paths, common credential formats, contact details, and UUID-style identifiers are
              redacted automatically. The preview is the final check before anything is copied.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={prepareBugReport.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={prepareBugReport.isPending}>
              <ExternalLink className="mr-2 h-4 w-4" />
              {prepareBugReport.isPending ? 'Preparing...' : 'Copy Report & Open GitHub'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

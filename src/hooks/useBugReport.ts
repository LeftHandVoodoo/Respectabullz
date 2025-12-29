import { useMutation } from '@tanstack/react-query';
import { createGitHubIssue, collectSystemInfo } from '@/lib/github';
import { toast } from '@/components/ui/use-toast';
import type { BugReportFormData, BugReportPayload } from '@/types';

export function useSubmitBugReport() {
  return useMutation({
    mutationFn: async (formData: BugReportFormData) => {
      const systemInfo = collectSystemInfo();

      const payload: BugReportPayload = {
        ...formData,
        systemInfo,
      };

      return createGitHubIssue(payload);
    },
    onSuccess: (data) => {
      toast({
        title: 'Bug Report Submitted',
        description: `Issue #${data.number} has been created. Thank you for your feedback!`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Submit Bug Report',
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

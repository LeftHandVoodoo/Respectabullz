import { useMutation } from '@tanstack/react-query';
import { copyBugReportDraft, openGitHubIssue } from '@/lib/github';
import { toast } from '@/components/ui/use-toast';
import type { BugReportDraft } from '@/types';

interface PreparedBugReportResult {
  browserOpened: boolean;
}

/**
 * Copies an already-reviewed report and opens its public GitHub draft.
 * Nothing is submitted automatically and no repository credential is used.
 */
export function usePrepareBugReport() {
  return useMutation<PreparedBugReportResult, Error, BugReportDraft>({
    mutationFn: async (draft) => {
      // Open synchronously from the user's click so popup blockers are less
      // likely to intercept it, then place the exact preview on the clipboard.
      const browserOpened = await openGitHubIssue(draft);
      await copyBugReportDraft(draft);
      return { browserOpened };
    },
    onSuccess: ({ browserOpened }) => {
      toast({
        title: 'Public report draft prepared',
        description: browserOpened
          ? 'The sanitized report was copied and opened on GitHub. Review it there before submitting.'
          : 'The sanitized report was copied. Open the project GitHub Issues page and review it before submitting.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Could not prepare bug report',
        description: error.message || 'Copy the visible preview manually and open GitHub Issues.',
        variant: 'destructive',
      });
    },
  });
}

import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BugReportDialog } from '../BugReportDialog';

const hookMocks = vi.hoisted(() => ({
  mutateAsync: vi.fn().mockResolvedValue({ browserOpened: true }),
}));

vi.mock('@/hooks/useBugReport', () => ({
  usePrepareBugReport: () => ({
    mutateAsync: hookMocks.mutateAsync,
    isPending: false,
  }),
}));

describe('BugReportDialog', () => {
  it('shows a sanitized full public preview before copying or opening GitHub', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const testCredential = [
      'github',
      'pat',
      'DIALOG',
      'TEST',
      '1234567890abcdefghijklmnopqrstuvwxyz',
    ].join('_');

    render(<BugReportDialog open onOpenChange={onOpenChange} />);

    expect(screen.getByText('GitHub issues are public.')).toBeInTheDocument();
    expect(screen.getByText(/nothing is published until you submit it there/i)).toBeInTheDocument();
    expect(screen.getByText(/No app credential is used/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Title/), 'Crash in settings');
    await user.type(
      screen.getByLabelText(/Description/),
      `Failure at C:\\Users\\Alice\\client.json using ${testCredential}`
    );

    const preview = screen.getByLabelText('Public issue preview') as HTMLTextAreaElement;
    expect(preview.value).toContain('Title: [Bug Report] Crash in settings');
    expect(preview.value).toContain('[redacted filesystem path]');
    expect(preview.value).toContain('[redacted credential]');
    expect(preview.value).not.toContain('Alice');
    expect(preview.value).not.toContain(testCredential);

    await user.click(screen.getByRole('button', { name: 'Copy Report & Open GitHub' }));

    await waitFor(() => expect(hookMocks.mutateAsync).toHaveBeenCalledTimes(1));
    const submittedDraft = hookMocks.mutateAsync.mock.calls[0][0];
    expect(submittedDraft.body).toContain('[redacted filesystem path]');
    expect(submittedDraft.body).toContain('[redacted credential]');
    expect(submittedDraft.body).not.toContain(testCredential);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

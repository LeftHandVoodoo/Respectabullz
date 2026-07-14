import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FirstLaunchDialog } from '../FirstLaunchDialog';
import { checkFirstLaunch, initializeAppDatabase } from '@/lib/db/init';

vi.mock('@/lib/db/init', () => ({
  initializeAppDatabase: vi.fn().mockResolvedValue({
    success: true,
    migrated: false,
  }),
  checkFirstLaunch: vi.fn().mockResolvedValue(true),
}));

describe('FirstLaunchDialog containment', () => {
  beforeEach(() => {
    vi.mocked(initializeAppDatabase).mockReset().mockResolvedValue({
      success: true,
      migrated: false,
    });
    vi.mocked(checkFirstLaunch).mockReset().mockResolvedValue(true);
  });

  it('does not advertise a nonfunctional or destructively clearable sample-data path', async () => {
    localStorage.clear();
    render(
      <FirstLaunchDialog>
        <div>Protected application</div>
      </FirstLaunchDialog>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start fresh/i })).toBeInTheDocument();
    });

    expect(screen.queryByText(/load sample data/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/clear this later/i)).not.toBeInTheDocument();
    expect(screen.getByText('Protected application')).toBeInTheDocument();
  });

  it('blocks operational screens after a failed integrity check and supports retry', async () => {
    const user = userEvent.setup();
    vi.mocked(initializeAppDatabase)
      .mockResolvedValueOnce({ success: false, migrated: false, error: 'reconciliation failed' })
      .mockResolvedValueOnce({ success: true, migrated: false });
    localStorage.setItem('respectabullz_first_launch_complete', 'true');

    render(
      <FirstLaunchDialog>
        <div>Protected application</div>
      </FirstLaunchDialog>,
    );

    expect(
      await screen.findByRole('heading', { name: /database integrity check failed/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Protected application')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /retry integrity check/i }));

    expect(await screen.findByText('Protected application')).toBeInTheDocument();
  });

  it('preserves and surfaces the legacy browser-storage recovery block', async () => {
    vi.mocked(initializeAppDatabase).mockResolvedValueOnce({
      success: false,
      migrated: false,
      error:
        'Legacy browser-storage data was detected. Automatic import is withdrawn because it is not transactional. Preserve this browser profile; no legacy data was changed.',
    });

    render(
      <FirstLaunchDialog>
        <div>Protected application</div>
      </FirstLaunchDialog>,
    );

    expect(
      await screen.findByText(/Preserve this browser profile; no legacy data was changed/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('Protected application')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /start fresh/i })).not.toBeInTheDocument();
  });
});

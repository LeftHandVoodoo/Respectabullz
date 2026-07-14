import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SettingsPage } from '../SettingsPage';

const { getIdentifierMock } = vi.hoisted(() => ({
  getIdentifierMock: vi.fn(),
}));

vi.mock('@tauri-apps/api/app', () => ({
  getIdentifier: getIdentifierMock,
}));

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    data: {
      weightUnit: 'lbs',
      notificationsEnabled: 'false',
      contractsDirectory: '',
    },
  }),
  useUpdateSetting: () => ({ mutate: vi.fn(), isPending: false }),
  useExportDatabase: () => ({ mutate: vi.fn(), isPending: false }),
  useExportPartialDataWithPhotos: () => ({ mutate: vi.fn(), isPending: false }),
  usePartialExportInfo: () => ({ data: { photoCount: 2, photosSize: 2048 } }),
  useSeedDatabase: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/useBreederSettings', () => ({
  useBreederSettings: () => ({
    breederSettings: undefined,
    updateBreederSettings: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/components/theme-provider', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

vi.mock('@/lib/backupUtils', () => ({
  formatBytes: () => '2 KB',
  isTauriEnvironment: () => true,
}));

vi.mock('@/components/settings/HelpSection', () => ({
  HelpSection: () => null,
}));

describe('SettingsPage containment', () => {
  beforeEach(() => {
    getIdentifierMock.mockReset();
    getIdentifierMock.mockResolvedValue('com.respectabullz.app');
  });

  it('withdraws restore, destructive clearing, and test-data controls from the production identity', async () => {
    render(<SettingsPage />);

    await waitFor(() => expect(getIdentifierMock).toHaveBeenCalledOnce());

    expect(screen.getByTestId('recovery-unavailable')).toHaveTextContent(
      'Restore is temporarily unavailable while complete recovery verification is implemented.'
    );
    expect(screen.getByTestId('recovery-unavailable')).toHaveTextContent(
      'No factory reset is currently available.'
    );

    expect(screen.queryByRole('button', { name: /restore/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /import/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /clear all data/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete everything/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remove test data/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Seed Test Data' })).not.toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Export Partial Data (ZIP)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export Partial Data (JSON)' })).toBeInTheDocument();
    expect(screen.getByText(/Excludes contacts, clients and sales/i)).toBeInTheDocument();
    expect(screen.queryByText(/Full Backup/)).not.toBeInTheDocument();
  });

  it('shows synthetic seeding only for the isolated demo identity', async () => {
    getIdentifierMock.mockResolvedValue('com.respectabullz.demo');

    render(<SettingsPage />);

    expect(await screen.findByRole('button', { name: 'Seed Test Data' })).toBeInTheDocument();
    expect(
      screen.getByText(/Available only in the isolated synthetic demo development identity/i),
    ).toBeInTheDocument();
  });
});

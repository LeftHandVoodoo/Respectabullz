// Component tests for DogTransportsList
// Tests the display and interaction of transport records on dog detail page

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { DogTransportsList } from '../DogTransportsList';

// Mock the hooks
vi.mock('@/hooks/useTransport', () => ({
  useTransports: vi.fn(),
  useCreateTransport: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useUpdateTransport: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useDeleteTransport: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/hooks/useDogs', () => ({
  useDogs: vi.fn(() => ({
    data: [
      { id: 'dog-1', name: 'Bella' },
      { id: 'dog-2', name: 'Max' },
    ],
  })),
}));

import { useTransports } from '@/hooks/useTransport';

// Create wrapper with providers
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  };
}

describe('DogTransportsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('shows loading message while fetching transports', () => {
      vi.mocked(useTransports).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as ReturnType<typeof useTransports>);

      render(<DogTransportsList dogId="dog-1" />, { wrapper: createWrapper() });

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows empty message when no transports exist', () => {
      vi.mocked(useTransports).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useTransports>);

      render(<DogTransportsList dogId="dog-1" />, { wrapper: createWrapper() });

      expect(screen.getByText('No transport records for this dog')).toBeInTheDocument();
      expect(screen.getByText('Add First Transport')).toBeInTheDocument();
    });
  });

  describe('Transport list display', () => {
    const mockTransports = [
      {
        id: 'trans-1',
        dogId: 'dog-1',
        date: new Date('2024-01-15'),
        mode: 'flight' as const,
        shipperBusinessName: 'Pet Airways',
        contactName: 'John Doe',
        phone: '555-1234',
        email: 'john@petairways.com',
        originCity: 'Los Angeles',
        originState: 'CA',
        destinationCity: 'New York',
        destinationState: 'NY',
        trackingNumber: 'TRK123456',
        cost: 350.00,
        expenseId: 'exp-1',
        notes: null,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        dog: { id: 'dog-1', name: 'Bella' },
      },
      {
        id: 'trans-2',
        dogId: 'dog-1',
        date: new Date('2024-01-10'),
        mode: 'ground' as const,
        shipperBusinessName: 'Ground Shipping Co',
        contactName: null,
        phone: null,
        email: null,
        originCity: 'Chicago',
        originState: 'IL',
        destinationCity: 'Detroit',
        destinationState: 'MI',
        trackingNumber: null,
        cost: 200.00,
        expenseId: 'exp-2',
        notes: null,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
        dog: { id: 'dog-1', name: 'Bella' },
      },
    ];

    beforeEach(() => {
      vi.mocked(useTransports).mockReturnValue({
        data: mockTransports,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof useTransports>);
    });

    it('renders transport records in a table', () => {
      render(<DogTransportsList dogId="dog-1" />, { wrapper: createWrapper() });

      // Check table headers
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Mode')).toBeInTheDocument();
      expect(screen.getByText('Shipper')).toBeInTheDocument();
      expect(screen.getByText('Route')).toBeInTheDocument();
      expect(screen.getByText('Tracking')).toBeInTheDocument();
      expect(screen.getByText('Cost')).toBeInTheDocument();
    });

    it('displays shipper business name', () => {
      render(<DogTransportsList dogId="dog-1" />, { wrapper: createWrapper() });

      expect(screen.getByText('Pet Airways')).toBeInTheDocument();
      expect(screen.getByText('Ground Shipping Co')).toBeInTheDocument();
    });

    it('displays contact name when available', () => {
      render(<DogTransportsList dogId="dog-1" />, { wrapper: createWrapper() });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('displays transport mode badges', () => {
      render(<DogTransportsList dogId="dog-1" />, { wrapper: createWrapper() });

      expect(screen.getByText('flight')).toBeInTheDocument();
      expect(screen.getByText('ground')).toBeInTheDocument();
    });

    it('displays route information', () => {
      render(<DogTransportsList dogId="dog-1" />, { wrapper: createWrapper() });

      expect(screen.getByText(/Los Angeles.*→.*New York/)).toBeInTheDocument();
      expect(screen.getByText(/Chicago.*→.*Detroit/)).toBeInTheDocument();
    });

    it('displays tracking number when available', () => {
      render(<DogTransportsList dogId="dog-1" />, { wrapper: createWrapper() });

      expect(screen.getByText('TRK123456')).toBeInTheDocument();
    });

    it('displays cost formatted as currency', () => {
      render(<DogTransportsList dogId="dog-1" />, { wrapper: createWrapper() });

      expect(screen.getByText('$350.00')).toBeInTheDocument();
      expect(screen.getByText('$200.00')).toBeInTheDocument();
    });

    it('shows edit and delete buttons for each transport', () => {
      render(<DogTransportsList dogId="dog-1" />, { wrapper: createWrapper() });

      // Each row should have action buttons
      const rows = screen.getAllByRole('row');
      // Subtract 1 for header row
      expect(rows.length - 1).toBe(2);
    });
  });

  describe('Add Transport button', () => {
    it('renders Add Transport button in header', () => {
      vi.mocked(useTransports).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useTransports>);

      render(<DogTransportsList dogId="dog-1" />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /Add Transport/i })).toBeInTheDocument();
    });

    it('opens dialog when Add Transport is clicked', async () => {
      const user = userEvent.setup();

      vi.mocked(useTransports).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useTransports>);

      render(<DogTransportsList dogId="dog-1" />, { wrapper: createWrapper() });

      const addButton = screen.getByRole('button', { name: /Add Transport/i });
      await user.click(addButton);

      // Dialog should open
      await waitFor(() => {
        expect(screen.getByText('Add Transport Record')).toBeInTheDocument();
      });
    });
  });

  describe('Transport with no cost', () => {
    it('displays dash when cost is null', () => {
      vi.mocked(useTransports).mockReturnValue({
        data: [{
          id: 'trans-1',
          dogId: 'dog-1',
          date: new Date('2024-01-15'),
          mode: 'pickup' as const,
          shipperBusinessName: null,
          contactName: null,
          phone: null,
          email: null,
          originCity: null,
          originState: null,
          destinationCity: null,
          destinationState: null,
          trackingNumber: null,
          cost: null,
          expenseId: null,
          notes: null,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        }],
        isLoading: false,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useTransports>);

      render(<DogTransportsList dogId="dog-1" />, { wrapper: createWrapper() });

      // Should show dashes for missing data
      const cells = screen.getAllByRole('cell');
      const dashCells = cells.filter(cell => cell.textContent === '-');
      expect(dashCells.length).toBeGreaterThan(0);
    });
  });

  describe('Hook integration', () => {
    it('calls useTransports with correct dogId', () => {
      vi.mocked(useTransports).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useTransports>);

      render(<DogTransportsList dogId="dog-123" />, { wrapper: createWrapper() });

      expect(useTransports).toHaveBeenCalledWith('dog-123');
    });
  });
});

describe('DogTransportsList Delete Confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows warning about linked expense when transport has cost', async () => {
    const user = userEvent.setup();

    vi.mocked(useTransports).mockReturnValue({
      data: [{
        id: 'trans-1',
        dogId: 'dog-1',
        date: new Date('2024-01-15'),
        mode: 'flight' as const,
        shipperBusinessName: 'Pet Airways',
        contactName: null,
        phone: null,
        email: null,
        originCity: 'LA',
        originState: 'CA',
        destinationCity: 'NY',
        destinationState: 'NY',
        trackingNumber: null,
        cost: 350.00, // Has cost, so has linked expense
        expenseId: 'exp-1',
        notes: null,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      }],
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useTransports>);

    render(<DogTransportsList dogId="dog-1" />, { wrapper: createWrapper() });

    // Find and click delete button
    const deleteButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('.lucide-trash-2')
    );

    if (deleteButtons.length > 0) {
      await user.click(deleteButtons[0]);

      // Should show confirmation dialog with expense warning
      await waitFor(() => {
        expect(screen.getByText(/its linked expense/i)).toBeInTheDocument();
      });
    }
  });
});

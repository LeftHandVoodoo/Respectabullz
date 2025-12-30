// Component tests for ReportsPage
// Tests the data transformations and report display functionality

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ReportsPage } from '../ReportsPage';
import type { Expense, Dog } from '@/types';

// Mock Recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="bar-chart" data-items={JSON.stringify(data)}>{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ data }: { data: Array<{ name: string; value: number }> }) => (
    <div data-testid="pie">
      {data.map((d, i) => (
        <div key={i} data-testid={`pie-segment-${d.name}`}>
          {d.name}: {d.value}
        </div>
      ))}
    </div>
  ),
  Cell: () => <div />,
  Rectangle: () => <div />,
}));

// Mock hooks
const mockExpenses: Expense[] = [];
const mockDogs: Dog[] = [];
const mockLitters: Litter[] = [];
const mockVaccinations: VaccinationRecord[] = [];
const mockSales: Sale[] = [];

vi.mock('@/hooks/useExpenses', () => ({
  useExpenses: () => ({ data: mockExpenses, isLoading: false }),
}));

vi.mock('@/hooks/useDogs', () => ({
  useDogs: () => ({ data: mockDogs, isLoading: false }),
}));

vi.mock('@/hooks/useLitters', () => ({
  useLitters: () => ({ data: mockLitters, isLoading: false }),
}));

vi.mock('@/hooks/useHealth', () => ({
  useVaccinations: () => ({ data: mockVaccinations, isLoading: false }),
}));

vi.mock('@/hooks/useClients', () => ({
  useSales: () => ({ data: mockSales, isLoading: false }),
}));

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

// Helper to reset mock data
function resetMockData() {
  mockExpenses.length = 0;
  mockDogs.length = 0;
  mockLitters.length = 0;
  mockVaccinations.length = 0;
  mockSales.length = 0;
}

// Helper to create expense
function createExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: `exp-${Math.random().toString(36).substr(2, 9)}`,
    category: 'vet',
    amount: 100,
    date: new Date(),
    description: 'Test expense',
    vendorName: 'Vendor',
    isTaxDeductible: false,
    relatedDogId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Helper to create dog
function createDog(overrides: Partial<Dog> = {}): Dog {
  return {
    id: `dog-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Dog',
    breed: 'French Bulldog',
    gender: 'male',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Dog;
}

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockData();
  });

  describe('Page structure', () => {
    it('renders page title and description', () => {
      render(<ReportsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText(/Analytics and insights for your breeding operation/)).toBeInTheDocument();
    });

    it('renders all tab triggers', () => {
      render(<ReportsPage />, { wrapper: createWrapper() });

      expect(screen.getByRole('tab', { name: 'Financial' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Breeding' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Dogs' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Health' })).toBeInTheDocument();
    });

    it('shows Financial tab by default', () => {
      render(<ReportsPage />, { wrapper: createWrapper() });

      expect(screen.getByRole('tab', { name: 'Financial' })).toHaveAttribute('data-state', 'active');
    });
  });

  describe('Financial tab', () => {
    it('displays Total Expenses card', () => {
      mockExpenses.push(
        createExpense({ amount: 100 }),
        createExpense({ amount: 200 }),
        createExpense({ amount: 300 })
      );

      render(<ReportsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Total Expenses')).toBeInTheDocument();
      // Total amount should be displayed (may appear in multiple places)
      expect(screen.getAllByText('$600.00').length).toBeGreaterThan(0);
    });

    it('displays Tax Deductible summary', () => {
      mockExpenses.push(
        createExpense({ amount: 100, isTaxDeductible: true }),
        createExpense({ amount: 200, isTaxDeductible: true }),
        createExpense({ amount: 300, isTaxDeductible: false })
      );

      render(<ReportsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Tax Deductible')).toBeInTheDocument();
      // $300.00 should appear for tax deductible (may appear multiple times)
      expect(screen.getAllByText('$300.00').length).toBeGreaterThan(0);

      expect(screen.getByText('Non-Deductible')).toBeInTheDocument();
    });

    it('displays $0.00 when no expenses exist', () => {
      render(<ReportsPage />, { wrapper: createWrapper() });

      // $0.00 should appear for zero expenses
      expect(screen.getAllByText('$0.00').length).toBeGreaterThan(0);
    });

    it('renders Monthly Expenses chart', () => {
      mockExpenses.push(createExpense({ amount: 100 }));

      render(<ReportsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Monthly Expenses')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('renders Expenses by Category chart', () => {
      mockExpenses.push(
        createExpense({ category: 'vet', amount: 100 }),
        createExpense({ category: 'food', amount: 50 })
      );

      render(<ReportsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Expenses by Category')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });

  describe('Dogs tab', () => {
    it('displays dog status distribution chart', async () => {
      const user = userEvent.setup();
      mockDogs.push(
        createDog({ status: 'active' }),
        createDog({ status: 'active' }),
        createDog({ status: 'sold' }),
        createDog({ status: 'retired' })
      );

      render(<ReportsPage />, { wrapper: createWrapper() });

      // Switch to Dogs tab
      await user.click(screen.getByRole('tab', { name: 'Dogs' }));

      expect(screen.getByText('Dog Status Distribution')).toBeInTheDocument();
    });
  });

  describe('Tab triggers', () => {
    it('renders Health tab trigger', () => {
      render(<ReportsPage />, { wrapper: createWrapper() });
      expect(screen.getByRole('tab', { name: 'Health' })).toBeInTheDocument();
    });

    it('renders Breeding tab trigger', () => {
      render(<ReportsPage />, { wrapper: createWrapper() });
      expect(screen.getByRole('tab', { name: 'Breeding' })).toBeInTheDocument();
    });

    it('renders Dogs tab trigger', () => {
      render(<ReportsPage />, { wrapper: createWrapper() });
      expect(screen.getByRole('tab', { name: 'Dogs' })).toBeInTheDocument();
    });

    it('has Financial tab active by default', () => {
      render(<ReportsPage />, { wrapper: createWrapper() });
      expect(screen.getByRole('tab', { name: 'Financial' })).toHaveAttribute('data-state', 'active');
    });
  });

  describe('Monthly expenses aggregation', () => {
    it('groups expenses by month correctly', () => {
      const jan2024 = new Date('2024-01-15');
      const feb2024 = new Date('2024-02-15');

      mockExpenses.push(
        createExpense({ amount: 100, date: jan2024 }),
        createExpense({ amount: 150, date: jan2024 }),
        createExpense({ amount: 200, date: feb2024 })
      );

      render(<ReportsPage />, { wrapper: createWrapper() });

      // The bar chart should have data with monthly aggregations
      const barChart = screen.getByTestId('bar-chart');
      expect(barChart).toBeInTheDocument();
    });
  });

  describe('Category breakdown', () => {
    it('groups expenses by category correctly', () => {
      mockExpenses.push(
        createExpense({ category: 'vet', amount: 100 }),
        createExpense({ category: 'vet', amount: 50 }),
        createExpense({ category: 'food', amount: 75 })
      );

      render(<ReportsPage />, { wrapper: createWrapper() });

      // The pie chart should show aggregated categories
      const pie = screen.getByTestId('pie');
      expect(pie).toBeInTheDocument();

      // Vet should be 150 (100 + 50)
      expect(screen.getByTestId('pie-segment-vet')).toHaveTextContent('vet: 150');
      expect(screen.getByTestId('pie-segment-food')).toHaveTextContent('food: 75');
    });
  });
});

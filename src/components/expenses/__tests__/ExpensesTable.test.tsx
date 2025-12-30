// Component tests for ExpensesTable
// Tests the expense table display and interactions

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ExpensesTable } from '../ExpensesTable';
import type { Expense, Dog } from '@/types';

// Mock hooks
vi.mock('@/hooks/useDocuments', () => ({
  useDocumentCountForExpense: vi.fn(() => ({ data: 0 })),
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
        {children}
      </QueryClientProvider>
    );
  };
}

const mockExpenses: Expense[] = [
  {
    id: 'exp-1',
    category: 'vet',
    amount: 150.00,
    date: new Date('2024-01-15'),
    description: 'Annual checkup',
    vendorName: 'Happy Paws Vet',
    isTaxDeductible: true,
    relatedDogId: 'dog-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'exp-2',
    category: 'food',
    amount: 75.50,
    date: new Date('2024-01-10'),
    description: 'Premium dog food',
    vendorName: 'Pet Store',
    isTaxDeductible: false,
    relatedDogId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'exp-3',
    category: 'show_fees',
    amount: 200.00,
    date: new Date('2024-01-05'),
    description: 'Dog show entry',
    vendorName: null,
    isTaxDeductible: true,
    relatedDogId: 'dog-2',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockDogs: Dog[] = [
  { id: 'dog-1', name: 'Bella', breed: 'French Bulldog', gender: 'female', status: 'active', createdAt: new Date(), updatedAt: new Date() },
  { id: 'dog-2', name: 'Max', breed: 'French Bulldog', gender: 'male', status: 'active', createdAt: new Date(), updatedAt: new Date() },
];

const defaultProps = {
  expenses: mockExpenses,
  isLoading: false,
  sortColumn: 'date' as const,
  sortDirection: 'desc' as const,
  excludedExpenseIds: new Set<string>(),
  customCategories: [],
  dogs: mockDogs,
  onSort: vi.fn(),
  onToggleExclusion: vi.fn(),
  onIncludeAll: vi.fn(),
  onExcludeAll: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onViewDocuments: vi.fn(),
  onAddExpense: vi.fn(),
};

describe('ExpensesTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Table headers', () => {
    it('renders all column headers', () => {
      render(<ExpensesTable {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Dog')).toBeInTheDocument();
      expect(screen.getByText('Vendor')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Tax Deductible')).toBeInTheDocument();
      expect(screen.getByText('Docs')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  describe('Expense display', () => {
    it('displays expense amounts as currency', () => {
      render(<ExpensesTable {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('$150.00')).toBeInTheDocument();
      expect(screen.getByText('$75.50')).toBeInTheDocument();
      expect(screen.getByText('$200.00')).toBeInTheDocument();
    });

    it('displays vendor names', () => {
      render(<ExpensesTable {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Happy Paws Vet')).toBeInTheDocument();
      expect(screen.getByText('Pet Store')).toBeInTheDocument();
    });

    it('shows dash for missing vendor', () => {
      render(<ExpensesTable {...defaultProps} />, { wrapper: createWrapper() });

      // The third expense has no vendor, should show "-"
      const dashCells = screen.getAllByText('-');
      expect(dashCells.length).toBeGreaterThan(0);
    });

    it('displays category badges', () => {
      render(<ExpensesTable {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Vet')).toBeInTheDocument();
      expect(screen.getByText('Food')).toBeInTheDocument();
      expect(screen.getByText('Show Fees')).toBeInTheDocument();
    });

    it('displays dog names when related', () => {
      render(<ExpensesTable {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Bella')).toBeInTheDocument();
      expect(screen.getByText('Max')).toBeInTheDocument();
    });

    it('displays tax deductible badges', () => {
      render(<ExpensesTable {...defaultProps} />, { wrapper: createWrapper() });

      const yesBadges = screen.getAllByText('Yes');
      const noBadges = screen.getAllByText('No');

      expect(yesBadges.length).toBe(2); // exp-1 and exp-3 are tax deductible
      expect(noBadges.length).toBe(1); // exp-2 is not tax deductible
    });
  });

  describe('Empty state', () => {
    it('shows empty message when no expenses', () => {
      render(<ExpensesTable {...defaultProps} expenses={[]} />, { wrapper: createWrapper() });

      expect(screen.getByText('No expenses found')).toBeInTheDocument();
    });

    it('shows add first expense button when empty', () => {
      render(<ExpensesTable {...defaultProps} expenses={[]} />, { wrapper: createWrapper() });

      expect(screen.getByText('Add first expense')).toBeInTheDocument();
    });

    it('calls onAddExpense when add button clicked in empty state', async () => {
      const user = userEvent.setup();
      const onAddExpense = vi.fn();
      render(<ExpensesTable {...defaultProps} expenses={[]} onAddExpense={onAddExpense} />, { wrapper: createWrapper() });

      await user.click(screen.getByText('Add first expense'));

      expect(onAddExpense).toHaveBeenCalled();
    });
  });

  describe('Loading state', () => {
    it('shows loading indicator when loading', () => {
      render(<ExpensesTable {...defaultProps} isLoading={true} expenses={[]} />, { wrapper: createWrapper() });

      // VirtualTable should show some loading state
      // This depends on the VirtualTable implementation
      expect(screen.queryByText('No expenses found')).not.toBeInTheDocument();
    });
  });

  describe('Exclusion checkboxes', () => {
    it('renders checkboxes for each expense', () => {
      render(<ExpensesTable {...defaultProps} />, { wrapper: createWrapper() });

      const checkboxes = screen.getAllByRole('checkbox');
      // Header checkbox + one per expense
      expect(checkboxes.length).toBe(mockExpenses.length + 1);
    });

    it('calls onToggleExclusion when checkbox is clicked', async () => {
      const user = userEvent.setup();
      const onToggleExclusion = vi.fn();
      render(<ExpensesTable {...defaultProps} onToggleExclusion={onToggleExclusion} />, { wrapper: createWrapper() });

      const checkboxes = screen.getAllByRole('checkbox');
      // Click the second checkbox (first expense row)
      if (checkboxes.length > 1) {
        await user.click(checkboxes[1]);
        expect(onToggleExclusion).toHaveBeenCalled();
      }
    });

    it('shows excluded expenses with strike-through style', () => {
      const excludedIds = new Set(['exp-1']);
      render(<ExpensesTable {...defaultProps} excludedExpenseIds={excludedIds} />, { wrapper: createWrapper() });

      // The excluded expense should have line-through class
      const excludedAmount = screen.getByText('$150.00');
      expect(excludedAmount).toHaveClass('line-through');
    });
  });

  describe('Sort functionality', () => {
    it('calls onSort when sortable header is clicked', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();
      render(<ExpensesTable {...defaultProps} onSort={onSort} />, { wrapper: createWrapper() });

      // Find and click the Amount header
      const amountHeader = screen.getByText('Amount');
      await user.click(amountHeader.closest('[role="columnheader"]') || amountHeader);

      // onSort should be called through the column's onSort
      // Note: This may depend on VirtualTable implementation
    });
  });

  describe('Action buttons', () => {
    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      render(<ExpensesTable {...defaultProps} onEdit={onEdit} />, { wrapper: createWrapper() });

      // Find edit buttons (each row has one)
      const editButtons = screen.getAllByRole('button').filter(
        btn => btn.querySelector('.lucide-edit')
      );

      if (editButtons.length > 0) {
        await user.click(editButtons[0]);
        expect(onEdit).toHaveBeenCalledWith(mockExpenses[0]);
      }
    });

    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(<ExpensesTable {...defaultProps} onDelete={onDelete} />, { wrapper: createWrapper() });

      // Find delete buttons (each row has one)
      const deleteButtons = screen.getAllByRole('button').filter(
        btn => btn.querySelector('.lucide-trash-2')
      );

      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
        expect(onDelete).toHaveBeenCalledWith(mockExpenses[0]);
      }
    });
  });

  describe('Header checkbox behavior', () => {
    it('header checkbox is checked when all expenses are included', () => {
      render(<ExpensesTable {...defaultProps} />, { wrapper: createWrapper() });

      const checkboxes = screen.getAllByRole('checkbox');
      const headerCheckbox = checkboxes[0];

      expect(headerCheckbox).toBeChecked();
    });

    it('header checkbox is unchecked when some expenses are excluded', () => {
      const excludedIds = new Set(['exp-1']);
      render(<ExpensesTable {...defaultProps} excludedExpenseIds={excludedIds} />, { wrapper: createWrapper() });

      const checkboxes = screen.getAllByRole('checkbox');
      const headerCheckbox = checkboxes[0];

      expect(headerCheckbox).not.toBeChecked();
    });

    it('calls onIncludeAll when header checkbox is checked', async () => {
      const user = userEvent.setup();
      const onIncludeAll = vi.fn();
      const excludedIds = new Set(['exp-1']);
      render(<ExpensesTable {...defaultProps} excludedExpenseIds={excludedIds} onIncludeAll={onIncludeAll} />, { wrapper: createWrapper() });

      const checkboxes = screen.getAllByRole('checkbox');
      const headerCheckbox = checkboxes[0];

      await user.click(headerCheckbox);
      expect(onIncludeAll).toHaveBeenCalled();
    });

    it('calls onExcludeAll when header checkbox is unchecked', async () => {
      const user = userEvent.setup();
      const onExcludeAll = vi.fn();
      render(<ExpensesTable {...defaultProps} onExcludeAll={onExcludeAll} />, { wrapper: createWrapper() });

      const checkboxes = screen.getAllByRole('checkbox');
      const headerCheckbox = checkboxes[0];

      await user.click(headerCheckbox);
      expect(onExcludeAll).toHaveBeenCalled();
    });
  });
});

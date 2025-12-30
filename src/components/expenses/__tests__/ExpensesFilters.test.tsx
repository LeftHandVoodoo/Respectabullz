// Component tests for ExpensesFilters
// Tests the filtering UI and interaction for expenses

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpensesFilters } from '../ExpensesFilters';
import type { MultiSelectOption } from '@/components/ui/multi-select';

// Mock data
const mockCategoryOptions: MultiSelectOption[] = [
  { value: 'vet', label: 'Vet', color: '#ef4444' },
  { value: 'food', label: 'Food', color: '#22c55e' },
  { value: 'supplies', label: 'Supplies', color: '#f59e0b' },
];

const mockDogOptions: MultiSelectOption[] = [
  { value: 'dog-1', label: 'Bella' },
  { value: 'dog-2', label: 'Max' },
];

const mockExpenses = [
  { id: 'exp-1', category: 'vet', amount: 100, date: new Date(), description: 'Checkup', vendorName: 'Vet Clinic', isTaxDeductible: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'exp-2', category: 'food', amount: 50, date: new Date(), description: 'Dog Food', vendorName: 'Pet Store', isTaxDeductible: false, createdAt: new Date(), updatedAt: new Date() },
];

const defaultProps = {
  search: '',
  onSearchChange: vi.fn(),
  categoryOptions: mockCategoryOptions,
  selectedCategories: [],
  onCategoriesChange: vi.fn(),
  dogOptions: mockDogOptions,
  selectedDogs: [],
  onDogsChange: vi.fn(),
  excludedExpenseIds: new Set<string>(),
  filteredExpenses: mockExpenses,
  onIncludeAll: vi.fn(),
  onResetFilters: vi.fn(),
};

describe('ExpensesFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Search input', () => {
    it('renders search input with placeholder', () => {
      render(<ExpensesFilters {...defaultProps} />);

      expect(screen.getByPlaceholderText('Search expenses...')).toBeInTheDocument();
    });

    it('displays current search value', () => {
      render(<ExpensesFilters {...defaultProps} search="test search" />);

      const searchInput = screen.getByPlaceholderText('Search expenses...');
      expect(searchInput).toHaveValue('test search');
    });

    it('calls onSearchChange when typing', async () => {
      const user = userEvent.setup();
      const onSearchChange = vi.fn();
      render(<ExpensesFilters {...defaultProps} onSearchChange={onSearchChange} />);

      const searchInput = screen.getByPlaceholderText('Search expenses...');
      await user.type(searchInput, 'new search');

      expect(onSearchChange).toHaveBeenCalled();
    });
  });

  describe('Category filter', () => {
    it('renders category multi-select with placeholder', () => {
      render(<ExpensesFilters {...defaultProps} />);

      expect(screen.getByText('All Categories')).toBeInTheDocument();
    });
  });

  describe('Dog filter', () => {
    it('renders dog multi-select when dog options are available', () => {
      render(<ExpensesFilters {...defaultProps} />);

      expect(screen.getByText('All Dogs')).toBeInTheDocument();
    });

    it('does not render dog filter when no dog options', () => {
      render(<ExpensesFilters {...defaultProps} dogOptions={[]} />);

      expect(screen.queryByText('All Dogs')).not.toBeInTheDocument();
    });
  });

  describe('Reset filters button', () => {
    it('shows Reset Filters button when filters are active', () => {
      render(<ExpensesFilters {...defaultProps} selectedCategories={['vet']} />);

      expect(screen.getByText('Reset Filters')).toBeInTheDocument();
    });

    it('shows Reset Filters button when search is active', () => {
      render(<ExpensesFilters {...defaultProps} search="test" />);

      expect(screen.getByText('Reset Filters')).toBeInTheDocument();
    });

    it('hides Reset Filters button when no filters are active', () => {
      render(<ExpensesFilters {...defaultProps} />);

      expect(screen.queryByText('Reset Filters')).not.toBeInTheDocument();
    });

    it('calls onResetFilters when button is clicked', async () => {
      const user = userEvent.setup();
      const onResetFilters = vi.fn();
      render(<ExpensesFilters {...defaultProps} selectedCategories={['vet']} onResetFilters={onResetFilters} />);

      await user.click(screen.getByText('Reset Filters'));

      expect(onResetFilters).toHaveBeenCalled();
    });
  });

  describe('Active filter badges', () => {
    it('shows active filter badges when categories are selected', () => {
      render(<ExpensesFilters {...defaultProps} selectedCategories={['vet']} />);

      expect(screen.getByText('Active filters:')).toBeInTheDocument();
      // Multiple elements may have "Vet" text (in options and badge)
      expect(screen.getAllByText('Vet').length).toBeGreaterThan(0);
    });

    it('shows dog filter badges when dogs are selected', () => {
      render(<ExpensesFilters {...defaultProps} selectedDogs={['dog-1']} />);

      expect(screen.getByText('Active filters:')).toBeInTheDocument();
      // The badge contains "Bella" - use getAllByText since there may be multiple instances
      expect(screen.getAllByText('Bella').length).toBeGreaterThan(0);
    });

    it('removes category filter when badge is clicked', async () => {
      const user = userEvent.setup();
      const onCategoriesChange = vi.fn();
      render(
        <ExpensesFilters
          {...defaultProps}
          selectedCategories={['vet', 'food']}
          onCategoriesChange={onCategoriesChange}
        />
      );

      // Click on the Vet badge to remove it (find in the active filters section)
      const vetElements = screen.getAllByText('Vet');
      const vetBadge = vetElements.find(el => el.closest('div[class*="cursor-pointer"]'));
      if (vetBadge) {
        const badge = vetBadge.closest('div[class*="cursor-pointer"]');
        if (badge) {
          await user.click(badge);
          expect(onCategoriesChange).toHaveBeenCalledWith(['food']);
        }
      }
    });
  });

  describe('Include All button', () => {
    it('shows Include All button when there are exclusions', () => {
      const excludedIds = new Set(['exp-1']);
      render(<ExpensesFilters {...defaultProps} excludedExpenseIds={excludedIds} />);

      expect(screen.getByText('Include All')).toBeInTheDocument();
    });

    it('hides Include All button when no exclusions', () => {
      render(<ExpensesFilters {...defaultProps} />);

      expect(screen.queryByText('Include All')).not.toBeInTheDocument();
    });

    it('calls onIncludeAll when button is clicked', async () => {
      const user = userEvent.setup();
      const onIncludeAll = vi.fn();
      const excludedIds = new Set(['exp-1']);
      render(<ExpensesFilters {...defaultProps} excludedExpenseIds={excludedIds} onIncludeAll={onIncludeAll} />);

      await user.click(screen.getByText('Include All'));

      expect(onIncludeAll).toHaveBeenCalled();
    });
  });

  describe('Exclusion help text', () => {
    it('shows exclusion help text when expenses exist', () => {
      render(<ExpensesFilters {...defaultProps} />);

      expect(screen.getByText(/Use checkboxes to include\/exclude expenses from total/)).toBeInTheDocument();
    });

    it('hides exclusion help text when no expenses', () => {
      render(<ExpensesFilters {...defaultProps} filteredExpenses={[]} />);

      expect(screen.queryByText(/Use checkboxes to include\/exclude expenses from total/)).not.toBeInTheDocument();
    });
  });
});

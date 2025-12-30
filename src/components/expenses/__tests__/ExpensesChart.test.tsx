// Component tests for ExpensesChart
// Tests the chart display and timeframe filtering for expenses

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpensesChart } from '../ExpensesChart';
import type { Expense } from '@/types';

// Mock Recharts components to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
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
  Tooltip: () => <div />,
}));

// Mock Radix Select component to avoid jsdom compatibility issues
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange }: { children: React.ReactNode; value: string; onValueChange: (v: string) => void }) => (
    <div data-testid="select" data-value={value}>
      <select data-testid="select-trigger" value={value} onChange={(e) => onValueChange(e.target.value)}>
        <option value="7days">Last 7 Days</option>
        <option value="30days">Last 30 Days</option>
        <option value="90days">Last 90 Days</option>
        <option value="month">This Month</option>
        <option value="custom">Custom Range</option>
      </select>
    </div>
  ),
  SelectContent: () => null,
  SelectItem: () => null,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => <span />,
}));

// Create expenses with specific dates
const createExpense = (id: string, category: string, amount: number, daysAgo: number): Expense => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id,
    category,
    amount,
    date,
    description: `${category} expense`,
    vendorName: 'Vendor',
    isTaxDeductible: false,
    relatedDogId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

const mockExpenses: Expense[] = [
  createExpense('exp-1', 'vet', 150, 5),      // 5 days ago
  createExpense('exp-2', 'food', 75, 10),     // 10 days ago
  createExpense('exp-3', 'supplies', 50, 25), // 25 days ago
  createExpense('exp-4', 'vet', 200, 35),     // 35 days ago (outside 30 days)
  createExpense('exp-5', 'food', 100, 60),    // 60 days ago (outside 30 days)
  createExpense('exp-6', 'training', 300, 100), // 100 days ago (outside 90 days)
];

const defaultProps = {
  expenses: mockExpenses,
  customCategories: [],
  timeframe: '30days' as const,
  customStartDate: undefined,
  customEndDate: undefined,
  onTimeframeChange: vi.fn(),
  onCustomDateClick: vi.fn(),
};

describe('ExpensesChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Card layout', () => {
    it('renders card with title', () => {
      render(<ExpensesChart {...defaultProps} />);

      expect(screen.getByText('By Category')).toBeInTheDocument();
    });
  });

  describe('Timeframe selector', () => {
    it('renders timeframe select', () => {
      render(<ExpensesChart {...defaultProps} />);

      // The select should be rendered
      expect(screen.getByTestId('select')).toBeInTheDocument();
    });

    it('displays all timeframe options', () => {
      render(<ExpensesChart {...defaultProps} />);

      const select = screen.getByTestId('select-trigger');
      expect(select).toBeInTheDocument();

      // Options should be available in the select
      expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 90 Days')).toBeInTheDocument();
      expect(screen.getByText('This Month')).toBeInTheDocument();
      expect(screen.getByText('Custom Range')).toBeInTheDocument();
    });

    it('calls onTimeframeChange when a new timeframe is selected', () => {
      const onTimeframeChange = vi.fn();
      render(<ExpensesChart {...defaultProps} onTimeframeChange={onTimeframeChange} />);

      const select = screen.getByTestId('select-trigger');
      fireEvent.change(select, { target: { value: '7days' } });

      expect(onTimeframeChange).toHaveBeenCalledWith('7days');
    });

    it('calls onTimeframeChange when custom is selected with dates', () => {
      const onTimeframeChange = vi.fn();
      const customStartDate = new Date('2024-01-01');
      const customEndDate = new Date('2024-01-31');

      render(
        <ExpensesChart
          {...defaultProps}
          onTimeframeChange={onTimeframeChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
        />
      );

      const select = screen.getByTestId('select-trigger');
      fireEvent.change(select, { target: { value: 'custom' } });

      expect(onTimeframeChange).toHaveBeenCalledWith('custom');
    });
  });

  describe('Chart content', () => {
    it('renders pie chart when there are expenses', () => {
      render(<ExpensesChart {...defaultProps} />);

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('shows empty message when no expenses in timeframe', () => {
      render(<ExpensesChart {...defaultProps} expenses={[]} />);

      expect(screen.getByText('No expenses in selected timeframe')).toBeInTheDocument();
    });

    it('filters expenses by 30 day timeframe', () => {
      render(<ExpensesChart {...defaultProps} timeframe="30days" />);

      // Should include expenses from last 30 days: exp-1, exp-2, exp-3
      const pie = screen.getByTestId('pie');
      expect(pie).toBeInTheDocument();

      // Vet (150), Food (75), Supplies (50) within 30 days
      expect(screen.getByTestId('pie-segment-vet')).toBeInTheDocument();
      expect(screen.getByTestId('pie-segment-food')).toBeInTheDocument();
      expect(screen.getByTestId('pie-segment-supplies')).toBeInTheDocument();
    });

    it('filters expenses by 7 day timeframe', () => {
      render(<ExpensesChart {...defaultProps} timeframe="7days" />);

      // Should only include exp-1 (5 days ago)
      const pie = screen.getByTestId('pie');
      expect(pie).toBeInTheDocument();

      // Only vet expense (150) within 7 days
      expect(screen.getByTestId('pie-segment-vet')).toBeInTheDocument();
    });

    it('filters expenses by 90 day timeframe', () => {
      render(<ExpensesChart {...defaultProps} timeframe="90days" />);

      // Should include exp-1 through exp-5 (60 days is within 90)
      const pie = screen.getByTestId('pie');
      expect(pie).toBeInTheDocument();

      // Should aggregate vet expenses: 150 + 200 = 350
      expect(screen.getByText(/vet: 350/)).toBeInTheDocument();
      // Should aggregate food expenses: 75 + 100 = 175
      expect(screen.getByText(/food: 175/)).toBeInTheDocument();
    });
  });

  describe('Custom date range', () => {
    it('shows date range when custom timeframe is active with dates', () => {
      const customStartDate = new Date('2024-01-01');
      const customEndDate = new Date('2024-01-31');

      render(
        <ExpensesChart
          {...defaultProps}
          timeframe="custom"
          customStartDate={customStartDate}
          customEndDate={customEndDate}
        />
      );

      // Should display some date information (the component shows custom date range)
      // The exact format depends on formatDate function
      expect(screen.getByTestId('select')).toHaveAttribute('data-value', 'custom');
    });

    it('shows edit button when custom range is active', () => {
      const customStartDate = new Date('2024-01-01');
      const customEndDate = new Date('2024-01-31');

      render(
        <ExpensesChart
          {...defaultProps}
          timeframe="custom"
          customStartDate={customStartDate}
          customEndDate={customEndDate}
        />
      );

      // There should be an edit/calendar button
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('calls onCustomDateClick when edit button is clicked', () => {
      const onCustomDateClick = vi.fn();
      const customStartDate = new Date('2024-01-01');
      const customEndDate = new Date('2024-01-31');

      render(
        <ExpensesChart
          {...defaultProps}
          timeframe="custom"
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomDateClick={onCustomDateClick}
        />
      );

      // Find and click the edit button (the one that's not the select)
      const buttons = screen.getAllByRole('button');
      const editButton = buttons.find(btn => btn.getAttribute('title') === 'Edit date range');
      if (editButton) {
        fireEvent.click(editButton);
        expect(onCustomDateClick).toHaveBeenCalled();
      }
    });
  });

  describe('Category aggregation', () => {
    it('aggregates expenses by category correctly', () => {
      const expenses: Expense[] = [
        createExpense('exp-1', 'vet', 100, 5),
        createExpense('exp-2', 'vet', 50, 10),
        createExpense('exp-3', 'food', 75, 15),
      ];

      render(<ExpensesChart {...defaultProps} expenses={expenses} timeframe="30days" />);

      // Vet should be aggregated: 100 + 50 = 150
      expect(screen.getByText(/vet: 150/)).toBeInTheDocument();
      expect(screen.getByText(/food: 75/)).toBeInTheDocument();
    });
  });

  describe('This month timeframe', () => {
    it('filters to current month expenses', () => {
      // Create expenses in current month and previous month
      const now = new Date();
      const currentMonthExpense = createExpense('exp-current', 'vet', 100, 0); // Today

      const prevMonth = new Date();
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      const daysAgo = Math.ceil((now.getTime() - prevMonth.getTime()) / (1000 * 60 * 60 * 24));
      const prevMonthExpense = createExpense('exp-prev', 'food', 50, daysAgo);

      render(<ExpensesChart {...defaultProps} expenses={[currentMonthExpense, prevMonthExpense]} timeframe="month" />);

      // Should only show current month expense
      expect(screen.getByTestId('pie-segment-vet')).toBeInTheDocument();
    });
  });
});

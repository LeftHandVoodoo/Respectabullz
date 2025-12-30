import { Calendar } from 'lucide-react';
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Expense } from '@/types';
import type { ExpenseCategory } from '@/lib/db/expenseCategories';

type Timeframe = '7days' | '30days' | '90days' | 'month' | 'custom';

interface ExpensesChartProps {
  expenses: Expense[];
  customCategories?: ExpenseCategory[];
  timeframe: Timeframe;
  customStartDate?: Date;
  customEndDate?: Date;
  onTimeframeChange: (timeframe: Timeframe) => void;
  onCustomDateClick: () => void;
}

// Built-in category colors
const BUILT_IN_CATEGORY_COLORS: Record<string, string> = {
  breeding: '#a855f7',
  equipment: '#0ea5e9',
  food: '#22c55e',
  grooming: '#f472b6',
  insurance: '#14b8a6',
  marketing: '#ec4899',
  misc: '#64748b',
  registration: '#8b5cf6',
  show_fees: '#f97316',
  supplies: '#f59e0b',
  training: '#6366f1',
  transport: '#3b82f6',
  utilities: '#6b7280',
  vet: '#ef4444',
};

function getCategoryColor(category: string, customCategories?: ExpenseCategory[]): string {
  // Check if it's a built-in category
  if (BUILT_IN_CATEGORY_COLORS[category]) {
    return BUILT_IN_CATEGORY_COLORS[category];
  }

  // Check if it's a custom category with a color
  const customCat = customCategories?.find(c => c.name === category);
  if (customCat?.color) {
    return customCat.color;
  }

  // Generate a deterministic color from the category name
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

export function ExpensesChart({
  expenses,
  customCategories,
  timeframe,
  customStartDate,
  customEndDate,
  onTimeframeChange,
  onCustomDateClick,
}: ExpensesChartProps) {
  // Calculate date range based on timeframe
  const getDateRange = () => {
    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of today
    
    let startDate: Date;
    let endDate: Date = now;

    switch (timeframe) {
      case '7days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '30days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '90days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 90);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          // Default to all time if custom dates not set
          startDate = new Date(0);
          endDate = now;
        }
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate };
  };

  // Filter expenses by date range for pie chart
  const expensesForChart = expenses.filter((expense) => {
    const { startDate, endDate } = getDateRange();
    const expenseDate = expense.date instanceof Date 
      ? expense.date 
      : new Date(expense.date);
    return expenseDate >= startDate && expenseDate <= endDate;
  });

  const categoryData = expensesForChart.reduce((acc, expense) => {
    const category = expense.category;
    acc[category] = (acc[category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value,
    color: getCategoryColor(name, customCategories),
  }));

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium">By Category</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={timeframe} onValueChange={(value) => {
              const newTimeframe = value as Timeframe;
              if (newTimeframe === 'custom') {
                if (!customStartDate || !customEndDate) {
                  onCustomDateClick();
                } else {
                  onTimeframeChange(newTimeframe);
                }
              } else {
                onTimeframeChange(newTimeframe);
              }
            }}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <Calendar className="mr-2 h-3 w-3" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            {timeframe === 'custom' && customStartDate && customEndDate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={onCustomDateClick}
                title="Edit date range"
              >
                <Calendar className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        {timeframe === 'custom' && customStartDate && customEndDate && (
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(customStartDate)} - {formatDate(customEndDate)}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[150px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No expenses in selected timeframe
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

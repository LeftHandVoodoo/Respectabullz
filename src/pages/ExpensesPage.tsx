import { useState, useMemo, useCallback } from 'react';
import { Plus, Search, Download, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Calendar, Dog, Eye, RotateCcw, FileText, Paperclip } from 'lucide-react';
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { VirtualTable, VirtualTableColumn } from '@/components/ui/virtual-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { useExpenses, useDeleteExpense } from '@/hooks/useExpenses';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { useDogs } from '@/hooks/useDogs';
import { ExpenseFormDialog } from '@/components/expenses/ExpenseFormDialog';
import { ExpenseDocumentsDialog } from '@/components/expenses/ExpenseDocumentsDialog';
import { useDocumentCountForExpense } from '@/hooks/useDocuments';
import { formatDate, formatCurrency } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { isTauriEnvironment } from '@/lib/backupUtils';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import type { Expense } from '@/types';

// Built-in category colors
const BUILT_IN_CATEGORY_COLORS: Record<string, string> = {
  transport: '#3b82f6',
  vet: '#ef4444',
  food: '#22c55e',
  supplies: '#f59e0b',
  registration: '#8b5cf6',
  breeding: '#a855f7',
  marketing: '#ec4899',
  utilities: '#6b7280',
  misc: '#64748b',
};

// Built-in categories with their display names
const BUILT_IN_CATEGORIES: Record<string, string> = {
  transport: 'Transport',
  vet: 'Vet',
  food: 'Food',
  supplies: 'Supplies',
  registration: 'Registration',
  breeding: 'Breeding',
  marketing: 'Marketing',
  utilities: 'Utilities',
  misc: 'Misc',
};

// Generate a color from category name (deterministic)
function getCategoryColor(category: string, customCategories?: Array<{ name: string; color?: string | null }>): string {
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

type SortColumn = 'date' | 'category' | 'dog' | 'vendor' | 'description' | 'amount' | 'taxDeductible' | null;
type SortDirection = 'asc' | 'desc';
type Timeframe = '7days' | '30days' | '90days' | 'month' | 'custom';

// Extracted SortIcon component to avoid recreation during render
function SortIcon({ column, sortColumn, sortDirection }: {
  column: SortColumn;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
}) {
  if (sortColumn !== column) {
    return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
  }
  return sortDirection === 'asc' ? (
    <ArrowUp className="ml-2 h-4 w-4" />
  ) : (
    <ArrowDown className="ml-2 h-4 w-4" />
  );
}

// Component to show document count for an expense
function ExpenseDocumentCount({ expense, onClick }: { expense: Expense; onClick: (expense: Expense) => void }) {
  const { data: count = 0 } = useDocumentCountForExpense(expense.id);
  
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 gap-1 px-2"
      onClick={(e) => {
        e.stopPropagation();
        onClick(expense);
      }}
      title={count > 0 ? `${count} document${count !== 1 ? 's' : ''} attached` : 'Add documents'}
    >
      {count > 0 ? (
        <>
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-xs">{count}</span>
        </>
      ) : (
        <Paperclip className="h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  );
}

export function ExpensesPage() {
  const { data: expenses, isLoading } = useExpenses();
  const { data: customCategories } = useExpenseCategories();
  const { data: dogs } = useDogs();
  const deleteExpense = useDeleteExpense();
  
  // Basic filters
  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Multi-select filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDogs, setSelectedDogs] = useState<string[]>([]);
  
  // Exclusion sets - expenses or dogs to exclude from totals
  const [excludedExpenseIds, setExcludedExpenseIds] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [expenseForDocs, setExpenseForDocs] = useState<Expense | null>(null);
  
  // Timeframe for chart
  const [timeframe, setTimeframe] = useState<Timeframe>('30days');
  const [showCustomDateDialog, setShowCustomDateDialog] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);

  // Build category options for multi-select
  const categoryOptions: MultiSelectOption[] = useMemo(() => {
    const builtIn = Object.entries(BUILT_IN_CATEGORIES).map(([value, label]) => ({
      value,
      label,
      color: BUILT_IN_CATEGORY_COLORS[value],
    }));
    const custom = (customCategories || []).map((cat) => ({
      value: cat.name,
      label: cat.name,
      color: cat.color || getCategoryColor(cat.name),
    }));
    return [...builtIn, ...custom].sort((a, b) => a.label.localeCompare(b.label));
  }, [customCategories]);

  // Build dog options for multi-select (only dogs that have expenses)
  const dogOptions: MultiSelectOption[] = useMemo(() => {
    if (!expenses || !dogs) return [];
    
    // Get unique dog IDs from expenses
    const dogIdsWithExpenses = new Set(
      expenses.filter(e => e.relatedDogId).map(e => e.relatedDogId!)
    );
    
    // Filter dogs to only those with expenses
    return dogs
      .filter(dog => dogIdsWithExpenses.has(dog.id))
      .map(dog => ({
        value: dog.id,
        label: dog.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [expenses, dogs]);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowAddDialog(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setShowAddDialog(open);
    if (!open) {
      setEditingExpense(undefined);
    }
  };

  // Calculate date range based on timeframe
  const getDateRange = useMemo(() => {
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
  }, [timeframe, customStartDate, customEndDate]);

  // Filter expenses by date range for pie chart
  const expensesForChart = useMemo(() => {
    if (!expenses) return [];
    const { startDate, endDate } = getDateRange;
    return expenses.filter((expense) => {
      const expenseDate = expense.date instanceof Date 
        ? expense.date 
        : new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  }, [expenses, getDateRange]);

  // Filter expenses based on all criteria (search, categories, dogs)
  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    
    let filtered = expenses.filter((expense) => {
      // Search filter
      const matchesSearch =
        !search ||
        expense.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
        expense.description?.toLowerCase().includes(search.toLowerCase());

      // Category filter (if no categories selected, show all)
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(expense.category);

      // Dog filter (if no dogs selected, show all; always show expenses without a dog)
      const matchesDog =
        selectedDogs.length === 0 || 
        (expense.relatedDogId && selectedDogs.includes(expense.relatedDogId)) ||
        !expense.relatedDogId; // Always include expenses without a related dog

      return matchesSearch && matchesCategory && matchesDog;
    });

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        
        if (sortColumn === 'date') {
          const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
          const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
          comparison = dateA - dateB;
        } else if (sortColumn === 'amount') {
          comparison = a.amount - b.amount;
        } else if (sortColumn === 'category') {
          comparison = (a.category || '').localeCompare(b.category || '');
        } else if (sortColumn === 'dog') {
          const dogA = dogs?.find(d => d.id === a.relatedDogId)?.name || '';
          const dogB = dogs?.find(d => d.id === b.relatedDogId)?.name || '';
          comparison = dogA.localeCompare(dogB);
        } else if (sortColumn === 'vendor') {
          comparison = (a.vendorName || '').localeCompare(b.vendorName || '');
        } else if (sortColumn === 'description') {
          comparison = (a.description || '').localeCompare(b.description || '');
        } else if (sortColumn === 'taxDeductible') {
          // Sort by tax deductible status (true first, then false)
          comparison = (a.isTaxDeductible ? 1 : 0) - (b.isTaxDeductible ? 1 : 0);
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [expenses, search, selectedCategories, selectedDogs, sortColumn, sortDirection, dogs]);

  // Toggle expense exclusion
  const toggleExpenseExclusion = (expenseId: string) => {
    setExcludedExpenseIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(expenseId)) {
        newSet.delete(expenseId);
      } else {
        newSet.add(expenseId);
      }
      return newSet;
    });
  };

  // Include all / Exclude all handlers
  const includeAllExpenses = () => {
    setExcludedExpenseIds(new Set());
  };

  const excludeAllExpenses = useCallback(() => {
    setExcludedExpenseIds(new Set(filteredExpenses.map(e => e.id)));
  }, [filteredExpenses]);

  // Reset all filters and exclusions
  const resetFilters = () => {
    setSearch('');
    setSelectedCategories([]);
    setSelectedDogs([]);
    setExcludedExpenseIds(new Set());
  };

  const handleSort = useCallback((column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column with default direction
      setSortColumn(column);
      setSortDirection(column === 'date' ? 'desc' : 'desc'); // Default to desc for both
    }
  }, [sortColumn, sortDirection]);

  // Calculate totals - filtered total and included total (excluding excluded items)
  const filteredTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const includedExpenses = filteredExpenses.filter(e => !excludedExpenseIds.has(e.id));
  const includedTotal = includedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const excludedCount = excludedExpenseIds.size;
  const hasExclusions = excludedCount > 0 && filteredExpenses.some(e => excludedExpenseIds.has(e.id));

  const expenseColumns: VirtualTableColumn<Expense>[] = useMemo(() => [
    {
      key: 'include',
      header: (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={filteredExpenses.length > 0 && filteredExpenses.every(e => !excludedExpenseIds.has(e.id))}
            onCheckedChange={(checked) => {
              if (checked) {
                includeAllExpenses();
              } else {
                excludeAllExpenses();
              }
            }}
            aria-label="Toggle all"
          />
        </div>
      ),
      width: '50px',
      cell: (expense) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={!excludedExpenseIds.has(expense.id)}
            onCheckedChange={() => toggleExpenseExclusion(expense.id)}
            aria-label={excludedExpenseIds.has(expense.id) ? 'Include in total' : 'Exclude from total'}
          />
        </div>
      ),
    },
    {
      key: 'date',
      header: (
        <>
          Date
          <SortIcon column="date" sortColumn={sortColumn} sortDirection={sortDirection} />
        </>
      ),
      sortable: true,
      onSort: () => handleSort('date'),
      cell: (expense) => (
        <span className={excludedExpenseIds.has(expense.id) ? 'text-muted-foreground line-through' : ''}>
          {formatDate(expense.date)}
        </span>
      ),
    },
    {
      key: 'category',
      header: (
        <>
          Category
          <SortIcon column="category" sortColumn={sortColumn} sortDirection={sortDirection} />
        </>
      ),
      sortable: true,
      onSort: () => handleSort('category'),
      cell: (expense) => {
        const color = getCategoryColor(expense.category, customCategories);
        return (
          <Badge
            variant="outline"
            style={{
              borderColor: color,
              color: color,
              opacity: excludedExpenseIds.has(expense.id) ? 0.5 : 1,
            }}
          >
            {expense.category}
          </Badge>
        );
      },
    },
    {
      key: 'dog',
      header: (
        <>
          Dog
          <SortIcon column="dog" sortColumn={sortColumn} sortDirection={sortDirection} />
        </>
      ),
      sortable: true,
      onSort: () => handleSort('dog'),
      cell: (expense) => {
        const dog = dogs?.find(d => d.id === expense.relatedDogId);
        return (
          <span className={excludedExpenseIds.has(expense.id) ? 'text-muted-foreground' : ''}>
            {dog?.name || '-'}
          </span>
        );
      },
    },
    {
      key: 'vendor',
      header: (
        <>
          Vendor
          <SortIcon column="vendor" sortColumn={sortColumn} sortDirection={sortDirection} />
        </>
      ),
      sortable: true,
      onSort: () => handleSort('vendor'),
      cell: (expense) => (
        <span className={excludedExpenseIds.has(expense.id) ? 'text-muted-foreground line-through' : ''}>
          {expense.vendorName || '-'}
        </span>
      ),
    },
    {
      key: 'description',
      header: (
        <>
          Description
          <SortIcon column="description" sortColumn={sortColumn} sortDirection={sortDirection} />
        </>
      ),
      cellClassName: 'max-w-[200px] truncate',
      sortable: true,
      onSort: () => handleSort('description'),
      cell: (expense) => (
        <span className={excludedExpenseIds.has(expense.id) ? 'text-muted-foreground' : ''}>
          {expense.description || '-'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: (
        <>
          Amount
          <SortIcon column="amount" sortColumn={sortColumn} sortDirection={sortDirection} />
        </>
      ),
      headerClassName: 'text-right',
      cellClassName: 'text-right font-medium',
      sortable: true,
      onSort: () => handleSort('amount'),
      cell: (expense) => (
        <span className={excludedExpenseIds.has(expense.id) ? 'text-muted-foreground line-through' : ''}>
          {formatCurrency(expense.amount)}
        </span>
      ),
    },
    {
      key: 'taxDeductible',
      header: (
        <>
          Tax Deductible
          <SortIcon column="taxDeductible" sortColumn={sortColumn} sortDirection={sortDirection} />
        </>
      ),
      sortable: true,
      onSort: () => handleSort('taxDeductible'),
      cell: (expense) =>
        expense.isTaxDeductible ? (
          <Badge variant="success" style={{ opacity: excludedExpenseIds.has(expense.id) ? 0.5 : 1 }}>
            Yes
          </Badge>
        ) : (
          <Badge variant="outline" style={{ opacity: excludedExpenseIds.has(expense.id) ? 0.5 : 1 }}>
            No
          </Badge>
        ),
    },
    {
      key: 'documents',
      header: 'Docs',
      width: '60px',
      cell: (expense) => <ExpenseDocumentCount expense={expense} onClick={setExpenseForDocs} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '80px',
      cell: (expense) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(expense);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setExpenseToDelete(expense);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ], [sortColumn, sortDirection, excludedExpenseIds, filteredExpenses, dogs, customCategories, handleSort, excludeAllExpenses]);

  const categoryData = useMemo(() => {
    if (!expensesForChart) return [];
    const grouped = expensesForChart.reduce((acc, expense) => {
      const category = expense.category;
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
      color: getCategoryColor(name, customCategories),
    }));
  }, [expensesForChart, customCategories]);

  const handleExportCSV = async () => {
    // Export only included expenses (not excluded ones)
    const expensesToExport = includedExpenses;
    
    if (!expensesToExport || expensesToExport.length === 0) {
      toast({
        title: 'No expenses to export',
        description: 'There are no expenses to export.',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['Date', 'Category', 'Dog', 'Vendor', 'Description', 'Amount', 'Tax Deductible'];
    const rows = expensesToExport.map((e) => {
      const dog = dogs?.find(d => d.id === e.relatedDogId);
      return [
        formatDate(e.date),
        e.category,
        dog?.name || '',
        e.vendorName || '',
        e.description || '',
        e.amount.toFixed(2),
        e.isTaxDeductible ? 'Yes' : 'No',
      ];
    });

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const filename = `expenses-${new Date().toISOString().split('T')[0]}.csv`;

    // Check if running in Tauri environment
    if (isTauriEnvironment()) {
      try {
        // Prompt user for save location
        const savePath = await save({
          defaultPath: filename,
          filters: [{
            name: 'CSV Files',
            extensions: ['csv']
          }]
        });

        if (!savePath) {
          // User cancelled the dialog
          return;
        }

        // Convert CSV string to Uint8Array
        const encoder = new TextEncoder();
        const csvData = encoder.encode(csv);

        // Write the file
        await writeFile(savePath, csvData);

        // Show success confirmation
        toast({
          title: 'Export successful',
          description: `Expenses exported to ${savePath}`,
        });
      } catch (error) {
        console.error('Failed to export CSV:', error);
        toast({
          title: 'Export failed',
          description: error instanceof Error ? error.message : 'Failed to export expenses. Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      // Fallback to browser download for non-Tauri environments
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export started',
        description: 'Your expenses file is downloading.',
      });
    }
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedDogs.length > 0 || search.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-display">Expenses</h2>
          <p className="text-muted-foreground">
            Track and manage business expenses
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {hasExclusions ? 'Included Total' : 'Total Expenses'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(includedTotal)}</p>
            {hasExclusions && (
              <p className="text-xs text-muted-foreground mt-1">
                {excludedCount} expense{excludedCount !== 1 ? 's' : ''} excluded ({formatCurrency(filteredTotal - includedTotal)})
              </p>
            )}
            {hasActiveFilters && (
              <p className="text-xs text-muted-foreground">
                Showing {filteredExpenses.length} of {expenses?.length || 0} expenses
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-medium">By Category</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={timeframe} onValueChange={(value) => {
                  const newTimeframe = value as Timeframe;
                  if (newTimeframe === 'custom') {
                    if (!customStartDate || !customEndDate) {
                      setShowCustomDateDialog(true);
                    } else {
                      setTimeframe(newTimeframe);
                    }
                  } else {
                    setTimeframe(newTimeframe);
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
                    onClick={() => setShowCustomDateDialog(true)}
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
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
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
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <MultiSelect
            options={categoryOptions}
            selected={selectedCategories}
            onChange={setSelectedCategories}
            placeholder="All Categories"
            className="w-[180px]"
            searchable={false}
          />
          
          {dogOptions.length > 0 && (
            <MultiSelect
              options={dogOptions}
              selected={selectedDogs}
              onChange={setSelectedDogs}
              placeholder="All Dogs"
              className="w-[180px]"
            />
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-10"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Filters
            </Button>
          )}
        </div>

        {/* Active filter badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {selectedCategories.map((cat) => {
              const option = categoryOptions.find(o => o.value === cat);
              return (
                <Badge
                  key={cat}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== cat))}
                >
                  {option?.label || cat}
                  <span className="ml-1">×</span>
                </Badge>
              );
            })}
            {selectedDogs.map((dogId) => {
              const option = dogOptions.find(o => o.value === dogId);
              return (
                <Badge
                  key={dogId}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setSelectedDogs(selectedDogs.filter(d => d !== dogId))}
                >
                  <Dog className="mr-1 h-3 w-3" />
                  {option?.label || dogId}
                  <span className="ml-1">×</span>
                </Badge>
              );
            })}
          </div>
        )}

        {/* Exclusion controls */}
        {filteredExpenses.length > 0 && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              Use checkboxes to include/exclude expenses from total
            </span>
            {hasExclusions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={includeAllExpenses}
                className="h-7 text-xs"
              >
                <Eye className="mr-1 h-3 w-3" />
                Include All
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <VirtualTable<Expense>
        data={filteredExpenses}
        columns={expenseColumns}
        getRowKey={(expense) => expense.id}
        isLoading={isLoading}
        emptyState={
          <div>
            <p className="text-muted-foreground">No expenses found</p>
            <Button
              variant="link"
              onClick={() => setShowAddDialog(true)}
            >
              Add first expense
            </Button>
          </div>
        }
      />

      <ExpenseFormDialog
        open={showAddDialog}
        onOpenChange={handleCloseDialog}
        expense={editingExpense}
      />

      <ConfirmDialog
        open={!!expenseToDelete}
        onOpenChange={(open) => !open && setExpenseToDelete(null)}
        title="Delete this expense?"
        description="This action cannot be undone. This will permanently delete this expense record."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (expenseToDelete) {
            deleteExpense.mutate(expenseToDelete.id);
          }
        }}
      />

      {/* Expense Documents Dialog */}
      {expenseForDocs && (
        <ExpenseDocumentsDialog
          expense={expenseForDocs}
          open={!!expenseForDocs}
          onOpenChange={(open) => !open && setExpenseForDocs(null)}
        />
      )}

      {/* Custom Date Range Dialog */}
      <Dialog open={showCustomDateDialog} onOpenChange={(open) => {
        setShowCustomDateDialog(open);
        if (!open && (!customStartDate || !customEndDate)) {
          // Reset to default timeframe if dialog closed without setting dates
          setTimeframe('30days');
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Custom Date Range</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={customStartDate ? customStartDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      setCustomStartDate(new Date(e.target.value));
                    } else {
                      setCustomStartDate(undefined);
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={customEndDate ? customEndDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      setCustomEndDate(new Date(e.target.value));
                    } else {
                      setCustomEndDate(undefined);
                    }
                  }}
                  min={customStartDate ? customStartDate.toISOString().split('T')[0] : undefined}
                />
              </div>
            </div>
            {customStartDate && customEndDate && customStartDate > customEndDate && (
              <p className="text-sm text-destructive">
                Start date must be before end date
              </p>
            )}
            {customStartDate && customEndDate && customStartDate <= customEndDate && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm font-medium">Selected Range:</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(customStartDate)} to {formatDate(customEndDate)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCustomStartDate(undefined);
                setCustomEndDate(undefined);
                setTimeframe('30days');
                setShowCustomDateDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (customStartDate && customEndDate && customStartDate <= customEndDate) {
                  setTimeframe('custom');
                  setShowCustomDateDialog(false);
                } else if (!customStartDate || !customEndDate) {
                  toast({
                    title: 'Date range incomplete',
                    description: 'Please select both start and end dates.',
                    variant: 'destructive',
                  });
                } else {
                  toast({
                    title: 'Invalid date range',
                    description: 'Start date must be before end date.',
                    variant: 'destructive',
                  });
                }
              }}
              disabled={!customStartDate || !customEndDate || (customStartDate > customEndDate)}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

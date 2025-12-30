import { useState, useMemo, useCallback } from 'react';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MultiSelectOption } from '@/components/ui/multi-select';
import { useExpenses, useDeleteExpense } from '@/hooks/useExpenses';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { useDogs } from '@/hooks/useDogs';
import { ExpenseFormDialog } from '@/components/expenses/ExpenseFormDialog';
import { ExpenseDocumentsDialog } from '@/components/expenses/ExpenseDocumentsDialog';
import { ExpensesChart } from '@/components/expenses/ExpensesChart';
import { ExpensesFilters } from '@/components/expenses/ExpensesFilters';
import { ExpensesTable } from '@/components/expenses/ExpensesTable';
import { formatDate, formatCurrency } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { isTauriEnvironment } from '@/lib/backupUtils';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import ExcelJS from 'exceljs';
import type { Expense } from '@/types';

// Built-in category colors and names (used for category options)
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

const BUILT_IN_CATEGORIES: Record<string, string> = {
  breeding: 'Breeding',
  equipment: 'Equipment',
  food: 'Food',
  grooming: 'Grooming',
  insurance: 'Insurance',
  marketing: 'Marketing',
  misc: 'Misc',
  registration: 'Registration',
  show_fees: 'Show Fees',
  supplies: 'Supplies',
  training: 'Training',
  transport: 'Transport',
  utilities: 'Utilities',
  vet: 'Vet',
};

function getCategoryColor(category: string, customCategories?: Array<{ name: string; color?: string | null }>): string {
  if (BUILT_IN_CATEGORY_COLORS[category]) {
    return BUILT_IN_CATEGORY_COLORS[category];
  }
  const customCat = customCategories?.find(c => c.name === category);
  if (customCat?.color) {
    return customCat.color;
  }
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

function getCategoryDisplayName(category: string): string {
  if (BUILT_IN_CATEGORIES[category]) {
    return BUILT_IN_CATEGORIES[category];
  }
  return category
    .split(/[_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

type SortColumn = 'date' | 'category' | 'dog' | 'vendor' | 'description' | 'amount' | 'taxDeductible' | null;
type SortDirection = 'asc' | 'desc';
type Timeframe = '7days' | '30days' | '90days' | 'month' | 'custom';

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
    const categoryMap = new Map<string, MultiSelectOption>();

    // Add built-in categories first
    Object.entries(BUILT_IN_CATEGORIES).forEach(([value, label]) => {
      categoryMap.set(value.toLowerCase(), {
        value,
        label,
        color: BUILT_IN_CATEGORY_COLORS[value],
      });
    });

    // Add custom categories
    (customCategories || []).forEach((cat) => {
      const key = cat.name.toLowerCase();
      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          value: cat.name,
          label: cat.name,
          color: cat.color || getCategoryColor(cat.name),
        });
      }
    });

    // Add categories from existing expenses
    (expenses || []).forEach((expense) => {
      if (expense.category) {
        const key = expense.category.toLowerCase();
        if (!categoryMap.has(key)) {
          categoryMap.set(key, {
            value: expense.category,
            label: getCategoryDisplayName(expense.category),
            color: getCategoryColor(expense.category, customCategories),
          });
        }
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [customCategories, expenses]);

  // Build dog options for multi-select
  const dogOptions: MultiSelectOption[] = useMemo(() => {
    if (!expenses || !dogs) return [];
    
    const dogIdsWithExpenses = new Set(
      expenses.filter(e => e.relatedDogId).map(e => e.relatedDogId!)
    );
    
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

  // Filter expenses based on all criteria (search, categories, dogs)
  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    
    let filtered = expenses.filter((expense) => {
      const matchesSearch =
        !search ||
        expense.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
        expense.description?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(expense.category);

      const matchesDog =
        selectedDogs.length === 0 || 
        (expense.relatedDogId && selectedDogs.includes(expense.relatedDogId)) ||
        !expense.relatedDogId;

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

  const includeAllExpenses = () => {
    setExcludedExpenseIds(new Set());
  };

  const excludeAllExpenses = useCallback(() => {
    setExcludedExpenseIds(new Set(filteredExpenses.map(e => e.id)));
  }, [filteredExpenses]);

  const resetFilters = () => {
    setSearch('');
    setSelectedCategories([]);
    setSelectedDogs([]);
    setExcludedExpenseIds(new Set());
  };

  const handleSort = useCallback((column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  }, [sortColumn, sortDirection]);

  // Calculate totals
  const filteredTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const includedExpenses = filteredExpenses.filter(e => !excludedExpenseIds.has(e.id));
  const includedTotal = includedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const excludedCount = excludedExpenseIds.size;
  const hasExclusions = excludedCount > 0 && filteredExpenses.some(e => excludedExpenseIds.has(e.id));
  const hasActiveFilters = selectedCategories.length > 0 || selectedDogs.length > 0 || search.length > 0;

  const handleExportExcel = async () => {
    const expensesToExport = includedExpenses;

    if (!expensesToExport || expensesToExport.length === 0) {
      toast({
        title: 'No expenses to export',
        description: 'There are no expenses to export.',
        variant: 'destructive',
      });
      return;
    }

    const capitalizeCategory = (category: string): string => {
      return category
        .split(/[_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    const getCallName = (fullName: string): string => {
      if (!fullName) return '';
      const words = fullName.trim().split(/\s+/);
      return words[words.length - 1];
    };

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Expenses');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Category', key: 'category', width: 14 },
      { header: 'Dog', key: 'dog', width: 12 },
      { header: 'Vendor', key: 'vendor', width: 20 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Tax Deductible', key: 'taxDeductible', width: 14 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, underline: true };
    headerRow.commit();

    expensesToExport.forEach((e) => {
      const dog = dogs?.find(d => d.id === e.relatedDogId);
      worksheet.addRow({
        date: formatDate(e.date),
        category: capitalizeCategory(e.category),
        dog: getCallName(dog?.name || ''),
        vendor: e.vendorName || '',
        description: e.description || '',
        amount: e.amount,
        taxDeductible: e.isTaxDeductible ? 'Yes' : 'No',
      });
    });

    worksheet.getColumn('amount').numFmt = '"$"#,##0.00';

    const excelBuffer = await workbook.xlsx.writeBuffer();
    const filename = `expenses-${new Date().toISOString().split('T')[0]}.xlsx`;

    if (isTauriEnvironment()) {
      try {
        const savePath = await save({
          defaultPath: filename,
          filters: [{
            name: 'Excel Files',
            extensions: ['xlsx']
          }]
        });

        if (!savePath) {
          return;
        }

        await writeFile(savePath, new Uint8Array(excelBuffer));

        toast({
          title: 'Export successful',
          description: `Expenses exported to ${savePath}`,
        });
      } catch (error) {
        console.error('Failed to export Excel:', error);
        toast({
          title: 'Export failed',
          description: error instanceof Error ? error.message : 'Failed to export expenses. Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
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

        <ExpensesChart
          expenses={expenses || []}
          customCategories={customCategories}
          timeframe={timeframe}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onTimeframeChange={setTimeframe}
          onCustomDateClick={() => setShowCustomDateDialog(true)}
        />
      </div>

      {/* Filters */}
      <ExpensesFilters
        search={search}
        onSearchChange={setSearch}
        categoryOptions={categoryOptions}
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
        dogOptions={dogOptions}
        selectedDogs={selectedDogs}
        onDogsChange={setSelectedDogs}
        excludedExpenseIds={excludedExpenseIds}
        filteredExpenses={filteredExpenses}
        onIncludeAll={includeAllExpenses}
        onResetFilters={resetFilters}
      />

      {/* Table */}
      <ExpensesTable
        expenses={filteredExpenses}
        isLoading={isLoading}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        excludedExpenseIds={excludedExpenseIds}
        customCategories={customCategories}
        dogs={dogs}
        onSort={handleSort}
        onToggleExclusion={toggleExpenseExclusion}
        onIncludeAll={includeAllExpenses}
        onExcludeAll={excludeAllExpenses}
        onEdit={handleEdit}
        onDelete={setExpenseToDelete}
        onViewDocuments={setExpenseForDocs}
        onAddExpense={() => setShowAddDialog(true)}
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

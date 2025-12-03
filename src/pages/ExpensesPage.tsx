import { useState, useMemo } from 'react';
import { Plus, Search, Filter, Download, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useExpenses, useDeleteExpense } from '@/hooks/useExpenses';
import { ExpenseFormDialog } from '@/components/expenses/ExpenseFormDialog';
import { formatDate, formatCurrency } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { isTauriEnvironment } from '@/lib/backupUtils';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import type { Expense, ExpenseCategory } from '@/types';

const categoryColors: Record<ExpenseCategory, string> = {
  transport: '#3b82f6',
  vet: '#ef4444',
  food: '#22c55e',
  supplies: '#f59e0b',
  registration: '#8b5cf6',
  marketing: '#ec4899',
  utilities: '#6b7280',
  misc: '#64748b',
};

type SortColumn = 'date' | 'amount' | null;
type SortDirection = 'asc' | 'desc';

export function ExpensesPage() {
  const { data: expenses, isLoading } = useExpenses();
  const deleteExpense = useDeleteExpense();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();

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

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    
    let filtered = expenses.filter((expense) => {
      const matchesSearch =
        expense.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
        expense.description?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' || expense.category === categoryFilter;

      return matchesSearch && matchesCategory;
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
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [expenses, search, categoryFilter, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column with default direction
      setSortColumn(column);
      setSortDirection(column === 'date' ? 'desc' : 'desc'); // Default to desc for both
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryData = useMemo(() => {
    if (!expenses) return [];
    const grouped = expenses.reduce((acc, expense) => {
      const category = expense.category;
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
      color: categoryColors[name as ExpenseCategory] || '#64748b',
    }));
  }, [expenses]);

  const handleExportCSV = async () => {
    if (!filteredExpenses || filteredExpenses.length === 0) {
      toast({
        title: 'No expenses to export',
        description: 'There are no expenses to export.',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['Date', 'Category', 'Vendor', 'Description', 'Amount', 'Tax Deductible'];
    const rows = filteredExpenses.map((e) => [
      formatDate(e.date),
      e.category,
      e.vendorName || '',
      e.description || '',
      e.amount.toFixed(2),
      e.isTaxDeductible ? 'Yes' : 'No',
    ]);

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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[150px]">
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="transport">Transport</SelectItem>
            <SelectItem value="vet">Vet</SelectItem>
            <SelectItem value="food">Food</SelectItem>
            <SelectItem value="supplies">Supplies</SelectItem>
            <SelectItem value="registration">Registration</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="utilities">Utilities</SelectItem>
            <SelectItem value="misc">Misc</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => handleSort('date')}
                  className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Sort by date"
                >
                  Date
                  <SortIcon column="date" />
                </button>
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort('amount')}
                  className="flex items-center justify-end ml-auto hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Sort by amount"
                >
                  Amount
                  <SortIcon column="amount" />
                </button>
              </TableHead>
              <TableHead>Tax Deductible</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">No expenses found</p>
                  <Button
                    variant="link"
                    onClick={() => setShowAddDialog(true)}
                  >
                    Add first expense
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{formatDate(expense.date)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: categoryColors[expense.category as ExpenseCategory],
                        color: categoryColors[expense.category as ExpenseCategory],
                      }}
                    >
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{expense.vendorName || '-'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {expense.description || '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell>
                    {expense.isTaxDeductible ? (
                      <Badge variant="success">Yes</Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(expense)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete this expense record.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteExpense.mutate(expense.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ExpenseFormDialog
        open={showAddDialog}
        onOpenChange={handleCloseDialog}
        expense={editingExpense}
      />
    </div>
  );
}


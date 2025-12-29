import { useState } from 'react';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/alert-dialog';
import { useExpenses, useDeleteExpense } from '@/hooks/useExpenses';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { ExpenseFormDialog } from './ExpenseFormDialog';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Expense } from '@/types';

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

// Built-in categories with their display names
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

// Get display name for a category (properly capitalized)
function getCategoryDisplayName(category: string): string {
  // Check if it's a built-in category with a display name
  if (BUILT_IN_CATEGORIES[category]) {
    return BUILT_IN_CATEGORIES[category];
  }

  // For custom/unknown categories, capitalize first letter of each word
  return category
    .split(/[_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

interface DogExpensesListProps {
  dogId: string;
}

export function DogExpensesList({ dogId }: DogExpensesListProps) {
  const { data: expenses, isLoading } = useExpenses({ dogId });
  const { data: customCategories } = useExpenseCategories();
  const deleteExpense = useDeleteExpense();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

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

  const handleDelete = async () => {
    if (deletingExpense) {
      await deleteExpense.mutateAsync(deletingExpense.id);
      setDeletingExpense(null);
    }
  };

  const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading expenses...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Records
              </CardTitle>
              <CardDescription>
                Expenses and financial transactions for this dog
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary */}
          {expenses && expenses.length > 0 && (
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Expenses:</span>
                <span className="text-lg font-bold">{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
          )}

          {/* Table */}
          {expenses && expenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Tax Deductible</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDate(expense.date)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: getCategoryColor(expense.category, customCategories),
                          color: getCategoryColor(expense.category, customCategories),
                        }}
                      >
                        {getCategoryDisplayName(expense.category)}
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
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(expense)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeletingExpense(expense)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No expenses recorded</p>
              <p className="text-sm">Add expenses to track financial records for this dog</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ExpenseFormDialog
        open={showAddDialog}
        onOpenChange={handleCloseDialog}
        expense={editingExpense}
        defaultDogId={dogId}
      />

      <AlertDialog open={!!deletingExpense} onOpenChange={(open) => !open && setDeletingExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this expense record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


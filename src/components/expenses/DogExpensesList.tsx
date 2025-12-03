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
import { ExpenseFormDialog } from './ExpenseFormDialog';
import { formatDate, formatCurrency } from '@/lib/utils';
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

interface DogExpensesListProps {
  dogId: string;
}

export function DogExpensesList({ dogId }: DogExpensesListProps) {
  const { data: expenses, isLoading } = useExpenses({ dogId });
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


import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateExpense, useUpdateExpense } from '@/hooks/useExpenses';
import { useDogs } from '@/hooks/useDogs';
import { useLitters } from '@/hooks/useLitters';
import { useExpenseCategories, useCreateExpenseCategory } from '@/hooks/useExpenseCategories';
import type { Expense, ExpenseCategory } from '@/types';

const expenseSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  amount: z.string().min(1, 'Amount is required'),
  category: z.string().min(1, 'Category is required'),
  vendorName: z.string().optional(),
  description: z.string().optional(),
  paymentMethod: z.string().optional(),
  isTaxDeductible: z.boolean(),
  relatedDogId: z.string().optional(),
  relatedLitterId: z.string().optional(),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense;
  defaultDogId?: string;
}

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

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  defaultDogId,
}: ExpenseFormDialogProps) {
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const { data: dogs } = useDogs();
  const { data: litters } = useLitters();
  const { data: customCategories } = useExpenseCategories();
  const createCategory = useCreateExpenseCategory();
  const isEditing = !!expense;
  
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      category: 'misc',
      isTaxDeductible: false,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (expense && open) {
      setValue('date', new Date(expense.date).toISOString().split('T')[0]);
      setValue('amount', expense.amount.toString());
      setValue('category', expense.category);
      setValue('vendorName', expense.vendorName || '');
      setValue('description', expense.description || '');
      setValue('paymentMethod', expense.paymentMethod || '');
      setValue('isTaxDeductible', expense.isTaxDeductible);
      setValue('relatedDogId', expense.relatedDogId || '');
      setValue('relatedLitterId', expense.relatedLitterId || '');
      setValue('notes', expense.notes || '');
    } else if (!expense && open) {
      reset({
        date: new Date().toISOString().split('T')[0],
        category: 'misc',
        isTaxDeductible: false,
        relatedDogId: defaultDogId || '',
      });
      if (defaultDogId) {
        setValue('relatedDogId', defaultDogId);
      }
    }
  }, [expense, open, setValue, reset, defaultDogId]);

  const onSubmit = async (data: ExpenseFormData) => {
    const expenseData = {
      date: new Date(data.date),
      amount: parseFloat(data.amount),
      category: data.category as ExpenseCategory,
      vendorName: data.vendorName || null,
      description: data.description || null,
      paymentMethod: data.paymentMethod || null,
      isTaxDeductible: data.isTaxDeductible,
      receiptPath: null,
      relatedDogId: data.relatedDogId || null,
      relatedLitterId: data.relatedLitterId || null,
      notes: data.notes || null,
    };

    if (isEditing && expense) {
      await updateExpense.mutateAsync({ id: expense.id, data: expenseData });
    } else {
      await createExpense.mutateAsync(expenseData);
    }
    reset();
    onOpenChange(false);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      await createCategory.mutateAsync({ name: newCategoryName.trim() });
      setValue('category', newCategoryName.trim());
      setNewCategoryName('');
      setShowNewCategoryDialog(false);
    } catch {
      // Error is handled by the hook's toast
    }
  };

  // Get all available categories (built-in + custom)
  const allCategories = [
    ...Object.entries(BUILT_IN_CATEGORIES).map(([value, label]) => ({ value, label, isCustom: false })),
    ...(customCategories || []).map((cat) => ({ value: cat.name, label: cat.name, isCustom: true })),
  ].sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" {...register('date')} />
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register('amount')}
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Category *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowNewCategoryDialog(true)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  New Category
                </Button>
              </div>
              <Select
                value={watch('category')}
                onValueChange={(value) => setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={watch('paymentMethod') || ''}
                onValueChange={(value) => setValue('paymentMethod', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorName">Vendor</Label>
              <Input
                id="vendorName"
                {...register('vendorName')}
                placeholder="Vendor name"
              />
            </div>

            <div className="space-y-2">
              <Label>Related Dog</Label>
              <Select
                value={watch('relatedDogId') || 'none'}
                onValueChange={(value) =>
                  setValue('relatedDogId', value === 'none' ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {dogs?.map((dog) => (
                    <SelectItem key={dog.id} value={dog.id}>
                      {dog.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Related Litter</Label>
              <Select
                value={watch('relatedLitterId') || 'none'}
                onValueChange={(value) =>
                  setValue('relatedLitterId', value === 'none' ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {litters?.map((litter) => (
                    <SelectItem key={litter.id} value={litter.id}>
                      {litter.nickname || litter.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="What was this expense for?"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isTaxDeductible"
              checked={watch('isTaxDeductible')}
              onCheckedChange={(checked) =>
                setValue('isTaxDeductible', checked as boolean)
              }
            />
            <Label htmlFor="isTaxDeductible" className="font-normal">
              Tax Deductible
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* New Category Dialog */}
      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name *</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Training, Grooming, Insurance"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateCategory();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowNewCategoryDialog(false);
                setNewCategoryName('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || createCategory.isPending}
            >
              {createCategory.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}


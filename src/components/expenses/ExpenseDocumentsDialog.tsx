import { FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DocumentList } from '@/components/documents';
import { useDocumentsForExpense } from '@/hooks/useDocuments';
import { formatCurrency, formatDate, getCategoryDisplayName } from '@/lib/utils';
import type { Expense } from '@/types';

interface ExpenseDocumentsDialogProps {
  expense: Expense;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseDocumentsDialog({
  expense,
  open,
  onOpenChange,
}: ExpenseDocumentsDialogProps) {
  const { data: documents = [], isLoading } = useDocumentsForExpense(expense.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents for Expense
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            <p>
              {formatDate(expense.date)} • {getCategoryDisplayName(expense.category)} • {formatCurrency(expense.amount)}
            </p>
            {expense.vendorName && <p>Vendor: {expense.vendorName}</p>}
            {expense.description && <p>{expense.description}</p>}
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto mt-4">
          <DocumentList
            documents={documents}
            entityType="expense"
            entityId={expense.id}
            isLoading={isLoading}
            emptyMessage="No documents attached to this expense"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}


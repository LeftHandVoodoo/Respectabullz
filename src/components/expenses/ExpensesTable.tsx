import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, FileText, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { VirtualTable, VirtualTableColumn } from '@/components/ui/virtual-table';
import { useDocumentCountForExpense } from '@/hooks/useDocuments';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Expense, Dog } from '@/types';
import type { ExpenseCategory } from '@/lib/db/expenseCategories';

type SortColumn = 'date' | 'category' | 'dog' | 'vendor' | 'description' | 'amount' | 'taxDeductible' | null;
type SortDirection = 'asc' | 'desc';

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

interface ExpensesTableProps {
  expenses: Expense[];
  isLoading: boolean;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  excludedExpenseIds: Set<string>;
  customCategories?: ExpenseCategory[];
  dogs?: Dog[];
  onSort: (column: SortColumn) => void;
  onToggleExclusion: (expenseId: string) => void;
  onIncludeAll: () => void;
  onExcludeAll: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onViewDocuments: (expense: Expense) => void;
  onAddExpense: () => void;
}

export function ExpensesTable({
  expenses,
  isLoading,
  sortColumn,
  sortDirection,
  excludedExpenseIds,
  customCategories,
  dogs,
  onSort,
  onToggleExclusion,
  onIncludeAll,
  onExcludeAll,
  onEdit,
  onDelete,
  onViewDocuments,
  onAddExpense,
}: ExpensesTableProps) {
  const expenseColumns: VirtualTableColumn<Expense>[] = [
    {
      key: 'include',
      header: (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={expenses.length > 0 && expenses.every(e => !excludedExpenseIds.has(e.id))}
            onCheckedChange={(checked) => {
              if (checked) {
                onIncludeAll();
              } else {
                onExcludeAll();
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
            onCheckedChange={() => onToggleExclusion(expense.id)}
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
      onSort: () => onSort('date'),
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
      onSort: () => onSort('category'),
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
            {getCategoryDisplayName(expense.category)}
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
      onSort: () => onSort('dog'),
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
      onSort: () => onSort('vendor'),
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
      onSort: () => onSort('description'),
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
      onSort: () => onSort('amount'),
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
      onSort: () => onSort('taxDeductible'),
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
      cell: (expense) => <ExpenseDocumentCount expense={expense} onClick={onViewDocuments} />,
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
              onEdit(expense);
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
              onDelete(expense);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <VirtualTable<Expense>
      data={expenses}
      columns={expenseColumns}
      getRowKey={(expense) => expense.id}
      isLoading={isLoading}
      emptyState={
        <div>
          <p className="text-muted-foreground">No expenses found</p>
          <Button
            variant="link"
            onClick={onAddExpense}
          >
            Add first expense
          </Button>
        </div>
      }
    />
  );
}

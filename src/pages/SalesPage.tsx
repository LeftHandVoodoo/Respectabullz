import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Filter, DollarSign, Package, Truck, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useSales, useDeleteSale } from '@/hooks/useClients';
import { SaleFormDialog } from '@/components/sales/SaleFormDialog';
import { formatDate } from '@/lib/utils';
import type { Sale, PaymentStatus } from '@/types';

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  deposit_only: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  partial: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  paid_in_full: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  refunded: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  deposit_only: 'Deposit Only',
  partial: 'Partial',
  paid_in_full: 'Paid in Full',
  refunded: 'Refunded',
};

export function SalesPage() {
  const { data: sales, isLoading } = useSales();
  const deleteSale = useDeleteSale();
  const [search, setSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | undefined>();

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setShowAddDialog(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setShowAddDialog(open);
    if (!open) {
      setEditingSale(undefined);
    }
  };

  // Filter sales
  const filteredSales = sales?.filter((sale) => {
    const matchesSearch = 
      sale.client?.name.toLowerCase().includes(search.toLowerCase()) ||
      sale.puppies?.some(p => p.dog?.name.toLowerCase().includes(search.toLowerCase()));
    
    const matchesPaymentStatus = paymentStatusFilter === 'all' || sale.paymentStatus === paymentStatusFilter;
    
    return matchesSearch && matchesPaymentStatus;
  });

  // Calculate stats
  const stats = {
    total: sales?.length || 0,
    totalRevenue: sales?.reduce((sum, s) => sum + s.price, 0) || 0,
    paidInFull: sales?.filter(s => s.paymentStatus === 'paid_in_full').length || 0,
    pending: sales?.filter(s => s.paymentStatus === 'deposit_only' || s.paymentStatus === 'partial').length || 0,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-display">Sales</h2>
          <p className="text-muted-foreground">View and manage all sales records</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Record Sale
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid in Full</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paidInFull}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by client or puppy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="deposit_only">Deposit Only</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid_in_full">Paid in Full</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sale Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Puppies</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Shipping</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredSales?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">No sales found</p>
                  <Button
                    variant="link"
                    onClick={() => setShowAddDialog(true)}
                  >
                    Record your first sale
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              filteredSales?.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(sale.saleDate)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{sale.client?.name || 'Unknown'}</div>
                    {sale.client?.email && (
                      <div className="text-sm text-muted-foreground">{sale.client.email}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {sale.puppies?.map((puppy) => (
                        <div key={puppy.id} className="text-sm">
                          {puppy.dog?.name || 'Unknown'}
                          {puppy.price > 0 && (
                            <span className="text-muted-foreground ml-2">
                              ({formatCurrency(puppy.price)})
                            </span>
                          )}
                        </div>
                      ))}
                      {(!sale.puppies || sale.puppies.length === 0) && (
                        <span className="text-muted-foreground text-sm">No puppies</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(sale.price)}
                  </TableCell>
                  <TableCell>
                    <Badge className={PAYMENT_STATUS_COLORS[sale.paymentStatus]}>
                      {PAYMENT_STATUS_LABELS[sale.paymentStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sale.isLocalPickup ? (
                      <Badge variant="secondary">Local Pickup</Badge>
                    ) : sale.shippedDate ? (
                      <div className="flex flex-col gap-1">
                        <div className="text-sm">
                          <Truck className="h-3 w-3 inline mr-1" />
                          Shipped {formatDate(sale.shippedDate)}
                        </div>
                        {sale.receivedDate && (
                          <div className="text-xs text-muted-foreground">
                            Received {formatDate(sale.receivedDate)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not shipped</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(sale)}
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
                            <AlertDialogTitle>Delete this sale?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete this sale record.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteSale.mutate(sale.id)}>
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

      {/* Add/Edit Sale Dialog */}
      <SaleFormDialog
        open={showAddDialog}
        onOpenChange={handleCloseDialog}
        sale={editingSale}
      />
    </div>
  );
}


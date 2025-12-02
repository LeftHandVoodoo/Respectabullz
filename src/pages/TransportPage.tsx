import { useState } from 'react';
import { Plus, Search, Filter, Plane, Truck as TruckIcon, User, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useTransports, useDeleteTransport } from '@/hooks/useTransport';
import { TransportFormDialog } from '@/components/transport/TransportFormDialog';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Transport, TransportMode } from '@/types';

const modeIcons: Record<TransportMode, React.ReactNode> = {
  flight: <Plane className="h-4 w-4" />,
  ground: <TruckIcon className="h-4 w-4" />,
  pickup: <User className="h-4 w-4" />,
  other: null,
};

export function TransportPage() {
  const { data: transports, isLoading } = useTransports();
  const deleteTransport = useDeleteTransport();
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTransport, setEditingTransport] = useState<Transport | undefined>();

  const handleEdit = (transport: Transport) => {
    setEditingTransport(transport);
    setShowAddDialog(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setShowAddDialog(open);
    if (!open) {
      setEditingTransport(undefined);
    }
  };

  const filteredTransports = transports?.filter((transport) => {
    const matchesSearch =
      transport.dog?.name.toLowerCase().includes(search.toLowerCase()) ||
      transport.shipperBusinessName?.toLowerCase().includes(search.toLowerCase()) ||
      transport.destinationCity?.toLowerCase().includes(search.toLowerCase());

    const matchesMode = modeFilter === 'all' || transport.mode === modeFilter;

    return matchesSearch && matchesMode;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transport</h2>
          <p className="text-muted-foreground">
            Manage shipping and transport records
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transport
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={modeFilter} onValueChange={setModeFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modes</SelectItem>
            <SelectItem value="flight">Flight</SelectItem>
            <SelectItem value="ground">Ground</SelectItem>
            <SelectItem value="pickup">Pickup</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Dog</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Shipper</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Cost</TableHead>
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
            ) : filteredTransports?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">No transport records</p>
                  <Button
                    variant="link"
                    onClick={() => setShowAddDialog(true)}
                  >
                    Add first transport
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              filteredTransports?.map((transport) => (
                <TableRow key={transport.id}>
                  <TableCell>{formatDate(transport.date)}</TableCell>
                  <TableCell className="font-medium">
                    {transport.dog?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      {modeIcons[transport.mode as TransportMode]}
                      {transport.mode}
                    </Badge>
                  </TableCell>
                  <TableCell>{transport.shipperBusinessName || '-'}</TableCell>
                  <TableCell>
                    {transport.originCity && transport.destinationCity
                      ? `${transport.originCity}, ${transport.originState || ''} → ${transport.destinationCity}, ${transport.destinationState || ''}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {transport.cost ? formatCurrency(transport.cost) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(transport)}
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
                            <AlertDialogTitle>Delete this transport record?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete this transport record.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteTransport.mutate(transport.id)}>
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

      <TransportFormDialog
        open={showAddDialog}
        onOpenChange={handleCloseDialog}
        transport={editingTransport}
      />
    </div>
  );
}


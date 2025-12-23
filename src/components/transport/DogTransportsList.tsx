import { useState } from 'react';
import { Plus, Plane, Truck as TruckIcon, User, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface DogTransportsListProps {
  dogId: string;
}

const modeIcons: Record<TransportMode, React.ReactNode> = {
  flight: <Plane className="h-4 w-4" />,
  ground: <TruckIcon className="h-4 w-4" />,
  pickup: <User className="h-4 w-4" />,
  other: null,
};

export function DogTransportsList({ dogId }: DogTransportsListProps) {
  const { data: transports, isLoading } = useTransports(dogId);
  const deleteTransport = useDeleteTransport();
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transport History</CardTitle>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Transport
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-4">Loading...</p>
        ) : !transports || transports.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No transport records for this dog</p>
            <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Transport
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Shipper</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transports.map((transport) => (
                <TableRow key={transport.id}>
                  <TableCell>{formatDate(transport.date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      {modeIcons[transport.mode as TransportMode]}
                      {transport.mode}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{transport.shipperBusinessName || '-'}</p>
                      {transport.contactName && (
                        <p className="text-xs text-muted-foreground">{transport.contactName}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transport.originCity && transport.destinationCity ? (
                      <span className="text-sm">
                        {transport.originCity}, {transport.originState || ''} → {transport.destinationCity}, {transport.destinationState || ''}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {transport.trackingNumber ? (
                      <span className="font-mono text-xs">{transport.trackingNumber}</span>
                    ) : (
                      '-'
                    )}
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
                              This action cannot be undone. This will permanently delete this transport record
                              {transport.cost ? ' and its linked expense.' : '.'}
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
              ))}
            </TableBody>
          </Table>
        )}

        <TransportFormDialog
          open={showAddDialog}
          onOpenChange={handleCloseDialog}
          transport={editingTransport}
          defaultDogId={dogId}
        />
      </CardContent>
    </Card>
  );
}

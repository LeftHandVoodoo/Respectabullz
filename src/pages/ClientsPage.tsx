import { useState } from 'react';
import { Plus, Search, Mail, Phone, Edit, Trash2, Eye, Package, Truck, CheckCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useClients, useDeleteClient } from '@/hooks/useClients';
import { ClientFormDialog } from '@/components/clients/ClientFormDialog';
import { CommunicationTimeline } from '@/components/communication/CommunicationTimeline';
import { formatDate } from '@/lib/utils';
import type { Client, InterestStatus, PaymentStatus } from '@/types';

const INTEREST_STATUS_COLORS: Record<InterestStatus, string> = {
  interested: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  scheduled_visit: 'bg-purple-100 text-purple-800',
  converted: 'bg-green-100 text-green-800',
  lost: 'bg-gray-100 text-gray-800',
};

const INTEREST_STATUS_LABELS: Record<InterestStatus, string> = {
  interested: 'Interested',
  contacted: 'Contacted',
  scheduled_visit: 'Visit Scheduled',
  converted: 'Converted',
  lost: 'Lost',
};

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  deposit_only: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-orange-100 text-orange-800',
  paid_in_full: 'bg-green-100 text-green-800',
  refunded: 'bg-red-100 text-red-800',
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  deposit_only: 'Deposit Only',
  partial: 'Partial',
  paid_in_full: 'Paid in Full',
  refunded: 'Refunded',
};

export function ClientsPage() {
  const { data: clients, isLoading } = useClients();
  const deleteClient = useDeleteClient();
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<Client | undefined>();

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowAddDialog(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setShowAddDialog(open);
    if (!open) {
      setEditingClient(undefined);
    }
  };

  const filteredClients = clients?.filter((client) => {
    return (
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.email?.toLowerCase().includes(search.toLowerCase()) ||
      client.city?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const selectedClientData = clients?.find((c) => c.id === selectedClient);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-display">Clients</h2>
          <p className="text-muted-foreground">Manage buyers and customers</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Table */}
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Purchases</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredClients?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">No clients found</p>
                      <Button
                        variant="link"
                        onClick={() => setShowAddDialog(true)}
                      >
                        Add first client
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients?.map((client) => (
                    <TableRow
                      key={client.id}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        selectedClient === client.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedClient(client.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {client.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{client.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {client.email && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.city && client.state
                          ? `${client.city}, ${client.state}`
                          : '-'}
                      </TableCell>
                      <TableCell>{client.sales?.length || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(client)}
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
                                <AlertDialogTitle>Delete {client.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete this client record.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteClient.mutate(client.id)}>
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
        </div>

        {/* Client Detail */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Client Details</CardTitle>
              {selectedClientData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(selectedClientData)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {selectedClientData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {selectedClientData.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{selectedClientData.name}</p>
                    </div>
                  </div>

                  {selectedClientData.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p>{selectedClientData.email}</p>
                    </div>
                  )}

                  {selectedClientData.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p>{selectedClientData.phone}</p>
                    </div>
                  )}

                  {(selectedClientData.addressLine1 ||
                    selectedClientData.city) && (
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p>
                        {selectedClientData.addressLine1}
                        {selectedClientData.addressLine2 && (
                          <>
                            <br />
                            {selectedClientData.addressLine2}
                          </>
                        )}
                        {(selectedClientData.city ||
                          selectedClientData.state) && (
                          <>
                            <br />
                            {selectedClientData.city}
                            {selectedClientData.city &&
                              selectedClientData.state &&
                              ', '}
                            {selectedClientData.state}{' '}
                            {selectedClientData.postalCode}
                          </>
                        )}
                      </p>
                    </div>
                  )}

                  {selectedClientData.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="whitespace-pre-wrap">
                        {selectedClientData.notes}
                      </p>
                    </div>
                  )}

                  {/* Tabs for Interests, Sales, and Communications */}
                  <Tabs defaultValue="sales" className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="sales">
                        Sales ({selectedClientData.sales?.length || 0})
                      </TabsTrigger>
                      <TabsTrigger value="interests">
                        Interests ({selectedClientData.interests?.length || 0})
                      </TabsTrigger>
                      <TabsTrigger value="communications">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Comms
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="sales" className="mt-4">
                      {selectedClientData.sales && selectedClientData.sales.length > 0 ? (
                        <div className="space-y-3">
                          {selectedClientData.sales.map((sale) => (
                            <div
                              key={sale.id}
                              className="text-sm border rounded-lg p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  {formatDate(sale.saleDate)}
                                </span>
                                <Badge className={PAYMENT_STATUS_COLORS[sale.paymentStatus]}>
                                  {PAYMENT_STATUS_LABELS[sale.paymentStatus]}
                                </Badge>
                              </div>
                              
                              {/* Puppies in sale */}
                              <div className="space-y-1">
                                {sale.puppies?.map((sp) => (
                                  <div key={sp.id} className="flex items-center justify-between text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Eye className="h-3 w-3" />
                                      {sp.dog?.name || 'Unknown Puppy'}
                                    </span>
                                    <span>${sp.price.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="flex items-center justify-between pt-1 border-t">
                                <span className="font-medium">Total</span>
                                <span className="font-medium">${sale.price.toFixed(2)}</span>
                              </div>

                              {/* Shipping status */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {sale.isLocalPickup ? (
                                  <span className="flex items-center gap-1">
                                    <Package className="h-3 w-3" />
                                    Local Pickup
                                  </span>
                                ) : (
                                  <>
                                    {sale.shippedDate && (
                                      <span className="flex items-center gap-1">
                                        <Truck className="h-3 w-3" />
                                        Shipped {formatDate(sale.shippedDate)}
                                      </span>
                                    )}
                                    {sale.receivedDate && (
                                      <span className="flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                        Received {formatDate(sale.receivedDate)}
                                      </span>
                                    )}
                                    {!sale.shippedDate && !sale.receivedDate && (
                                      <span className="text-yellow-600">Pending shipment</span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No purchases yet
                        </p>
                      )}
                    </TabsContent>

                    <TabsContent value="interests" className="mt-4">
                      {selectedClientData.interests && selectedClientData.interests.length > 0 ? (
                        <div className="space-y-3">
                          {selectedClientData.interests.map((interest) => (
                            <div
                              key={interest.id}
                              className="text-sm border rounded-lg p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  {interest.dog?.name || 'Unknown Puppy'}
                                </span>
                                <Badge className={INTEREST_STATUS_COLORS[interest.status]}>
                                  {INTEREST_STATUS_LABELS[interest.status]}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(interest.interestDate)} via {interest.contactMethod}
                              </div>
                              {interest.notes && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {interest.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No recorded interests
                        </p>
                      )}
                    </TabsContent>

                    <TabsContent value="communications" className="mt-4">
                      <CommunicationTimeline clientId={selectedClientData.id} />
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Select a client to view details
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ClientFormDialog
        open={showAddDialog}
        onOpenChange={handleCloseDialog}
        client={editingClient}
      />
    </div>
  );
}


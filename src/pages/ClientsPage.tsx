import { useState } from 'react';
import { Plus, Search, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useClients } from '@/hooks/useClients';
import { ClientFormDialog } from '@/components/clients/ClientFormDialog';
import { formatDate } from '@/lib/utils';

export function ClientsPage() {
  const { data: clients, isLoading } = useClients();
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

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
          <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredClients?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
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
            <CardHeader>
              <CardTitle className="text-lg">Client Details</CardTitle>
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

                  {selectedClientData.sales &&
                    selectedClientData.sales.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Purchase History
                        </p>
                        <div className="space-y-2">
                          {selectedClientData.sales.map((sale) => (
                            <div
                              key={sale.id}
                              className="text-sm border rounded p-2"
                            >
                              <p className="font-medium">
                                {sale.dog?.name || 'Unknown'}
                              </p>
                              <p className="text-muted-foreground">
                                {formatDate(sale.saleDate)} - $
                                {sale.price.toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}


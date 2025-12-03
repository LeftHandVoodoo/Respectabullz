import { useState } from 'react';
import { Plus, Search, Edit, Trash2, ArrowRight, Filter, Phone, Mail, Globe, Users, MessageSquare } from 'lucide-react';
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
import { useClientInterests, useDeleteClientInterest } from '@/hooks/useClientInterests';
import { ClientInterestFormDialog } from '@/components/inquiries/ClientInterestFormDialog';
import { SaleFormDialog } from '@/components/sales/SaleFormDialog';
import { ContractFormDialog } from '@/components/sales/ContractFormDialog';
import { formatDate } from '@/lib/utils';
import type { ClientInterest, InterestStatus, ContactMethod, ContractData } from '@/types';

const STATUS_COLORS: Record<InterestStatus, string> = {
  interested: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  scheduled_visit: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  converted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  lost: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

const STATUS_LABELS: Record<InterestStatus, string> = {
  interested: 'Interested',
  contacted: 'Contacted',
  scheduled_visit: 'Visit Scheduled',
  converted: 'Converted',
  lost: 'Lost',
};

const CONTACT_METHOD_ICONS: Record<ContactMethod, React.ReactNode> = {
  phone: <Phone className="h-3 w-3" />,
  email: <Mail className="h-3 w-3" />,
  website: <Globe className="h-3 w-3" />,
  social_media: <MessageSquare className="h-3 w-3" />,
  referral: <Users className="h-3 w-3" />,
  other: null,
};

const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  phone: 'Phone',
  email: 'Email',
  website: 'Website',
  social_media: 'Social Media',
  referral: 'Referral',
  other: 'Other',
};

export function InquiriesPage() {
  const { data: interests, isLoading } = useClientInterests();
  const deleteInterest = useDeleteClientInterest();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingInterest, setEditingInterest] = useState<ClientInterest | undefined>();
  const [convertingInterest, setConvertingInterest] = useState<ClientInterest | undefined>();
  
  // Contract flow state
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [showSaleDialog, setShowSaleDialog] = useState(false);
  const [contractData, setContractData] = useState<ContractData | undefined>();

  const handleEdit = (interest: ClientInterest) => {
    setEditingInterest(interest);
    setShowAddDialog(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setShowAddDialog(open);
    if (!open) {
      setEditingInterest(undefined);
    }
  };

  // Start the conversion flow by showing the contract dialog first
  const handleConvertToSale = (interest: ClientInterest) => {
    setConvertingInterest(interest);
    setShowContractDialog(true);
  };

  // Handle when contract is generated and user wants to proceed to sale
  const handleProceedToSale = (data: ContractData) => {
    setContractData(data);
    setShowContractDialog(false);
    setShowSaleDialog(true);
  };

  // Close the contract dialog
  const handleCloseContractDialog = (open: boolean) => {
    if (!open) {
      setShowContractDialog(false);
      // If they just close the contract dialog, don't clear the converting interest
      // in case they want to try again
    }
  };

  // Close the sale dialog and reset the flow
  const handleCloseSaleDialog = (open: boolean) => {
    if (!open) {
      setShowSaleDialog(false);
      setConvertingInterest(undefined);
      setContractData(undefined);
    }
  };

  // Filter interests
  const filteredInterests = interests?.filter((interest) => {
    const matchesSearch = 
      interest.client?.name.toLowerCase().includes(search.toLowerCase()) ||
      interest.dog?.name.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || interest.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: interests?.length || 0,
    interested: interests?.filter(i => i.status === 'interested').length || 0,
    contacted: interests?.filter(i => i.status === 'contacted').length || 0,
    scheduledVisit: interests?.filter(i => i.status === 'scheduled_visit').length || 0,
    converted: interests?.filter(i => i.status === 'converted').length || 0,
    lost: interests?.filter(i => i.status === 'lost').length || 0,
  };

  const conversionRate = stats.total > 0 
    ? Math.round((stats.converted / stats.total) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-display">Client Inquiries</h2>
          <p className="text-muted-foreground">Track client interests and convert them to sales</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Inquiry
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.interested + stats.contacted + stats.scheduledVisit}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visits Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.scheduledVisit}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.converted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="interested">Interested</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="scheduled_visit">Visit Scheduled</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Puppy</TableHead>
              <TableHead>Contact Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
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
            ) : filteredInterests?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">No inquiries found</p>
                  <Button
                    variant="link"
                    onClick={() => setShowAddDialog(true)}
                  >
                    Record first inquiry
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              filteredInterests?.map((interest) => (
                <TableRow key={interest.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(interest.interestDate)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{interest.client?.name || 'Unknown'}</div>
                    {interest.client?.email && (
                      <div className="text-sm text-muted-foreground">{interest.client.email}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{interest.dog?.name || 'Unknown'}</div>
                    {interest.dog?.color && (
                      <div className="text-sm text-muted-foreground">{interest.dog.color}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {CONTACT_METHOD_ICONS[interest.contactMethod]}
                      <span className="text-sm">{CONTACT_METHOD_LABELS[interest.contactMethod]}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[interest.status]}>
                      {STATUS_LABELS[interest.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="truncate text-sm text-muted-foreground">
                      {interest.notes || '-'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {interest.status !== 'converted' && interest.status !== 'lost' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Convert to Sale"
                          onClick={() => handleConvertToSale(interest)}
                        >
                          <ArrowRight className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(interest)}
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
                            <AlertDialogTitle>Delete this inquiry?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete this inquiry record.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteInterest.mutate(interest.id)}>
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

      {/* Add/Edit Interest Dialog */}
      <ClientInterestFormDialog
        open={showAddDialog}
        onOpenChange={handleCloseDialog}
        interest={editingInterest}
      />

      {/* Contract Form Dialog - First step in conversion flow */}
      {convertingInterest && convertingInterest.client && convertingInterest.dog && (
        <ContractFormDialog
          open={showContractDialog}
          onOpenChange={handleCloseContractDialog}
          client={convertingInterest.client}
          dog={convertingInterest.dog}
          sire={convertingInterest.dog.sire}
          dam={convertingInterest.dog.dam}
          onProceedToSale={handleProceedToSale}
        />
      )}

      {/* Sale Form Dialog - Second step in conversion flow */}
      {convertingInterest && convertingInterest.clientId && convertingInterest.dogId && (
        <SaleFormDialog
          open={showSaleDialog}
          onOpenChange={handleCloseSaleDialog}
          preselectedClientId={convertingInterest.clientId}
          preselectedPuppies={[{ 
            dogId: convertingInterest.dogId, 
            price: contractData?.salePrice || 0 
          }]}
          interestId={convertingInterest.id}
        />
      )}
    </div>
  );
}


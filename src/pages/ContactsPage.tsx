import { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Mail,
  Phone,
  Edit,
  Trash2,
  MapPin,
  Facebook,
  Instagram,
  Globe,
  Twitter,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { VirtualTable, VirtualTableColumn } from '@/components/ui/virtual-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import {
  useContacts,
  useDeleteContact,
  useContactCategories,
} from '@/hooks/useContacts';
import { ContactFormDialog } from '@/components/contacts/ContactFormDialog';
import type { ContactWithRelations, ContactCategory } from '@/types';

export function ContactsPage() {
  const { data: contacts, isLoading } = useContacts();
  const { data: categories = [] } = useContactCategories();
  const deleteContact = useDeleteContact();
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<ContactWithRelations | undefined>();
  const [contactToDelete, setContactToDelete] = useState<ContactWithRelations | null>(null);
  const [sortColumn, setSortColumn] = useState<'name' | 'categories' | 'location' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleEdit = (contact: ContactWithRelations) => {
    setEditingContact(contact);
    setShowAddDialog(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setShowAddDialog(open);
    if (!open) {
      setEditingContact(undefined);
    }
  };

  const handleSort = useCallback((column: 'name' | 'categories' | 'location') => {
    setSortColumn((prevColumn) => {
      if (prevColumn === column) {
        // Toggle direction if same column
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        return prevColumn;
      } else {
        // New column, start with ascending
        setSortDirection('asc');
        return column;
      }
    });
  }, []);

  const getSortIcon = useCallback((column: 'name' | 'categories' | 'location') => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 h-3 w-3" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3 w-3" />
      : <ArrowDown className="ml-1 h-3 w-3" />;
  }, [sortColumn, sortDirection]);

  // Build category options for filter
  const categoryOptions: MultiSelectOption[] = useMemo(() => {
    return categories.map((cat: ContactCategory) => ({
      value: cat.id,
      label: cat.name,
      color: cat.color || undefined,
    }));
  }, [categories]);

  // Filter and sort contacts
  const filteredContacts = useMemo(() => {
    let result =
      contacts?.filter((contact) => {
        // Search filter
        const matchesSearch =
          !search ||
          contact.name.toLowerCase().includes(search.toLowerCase()) ||
          contact.companyName?.toLowerCase().includes(search.toLowerCase()) ||
          contact.email?.toLowerCase().includes(search.toLowerCase()) ||
          contact.phonePrimary?.includes(search) ||
          contact.phoneSecondary?.includes(search) ||
          contact.city?.toLowerCase().includes(search.toLowerCase());

        // Category filter
        const matchesCategory =
          selectedCategories.length === 0 ||
          contact.categories?.some((cat) => selectedCategories.includes(cat.id));

        return matchesSearch && matchesCategory;
      }) ?? [];

    // Apply sorting
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let comparison = 0;

        switch (sortColumn) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'categories': {
            // Sort by first category name, or empty string if no categories
            const aCat = a.categories?.[0]?.name ?? '';
            const bCat = b.categories?.[0]?.name ?? '';
            comparison = aCat.localeCompare(bCat);
            break;
          }
          case 'location': {
            // Sort by city, then state
            const aLoc = `${a.city ?? ''}, ${a.state ?? ''}`.trim();
            const bLoc = `${b.city ?? ''}, ${b.state ?? ''}`.trim();
            comparison = aLoc.localeCompare(bLoc);
            break;
          }
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [contacts, search, selectedCategories, sortColumn, sortDirection]);

  const selectedContactData = contacts?.find((c) => c.id === selectedContact);

  const hasActiveFilters = selectedCategories.length > 0 || search.length > 0;

  const resetFilters = () => {
    setSearch('');
    setSelectedCategories([]);
  };

  const contactColumns: VirtualTableColumn<ContactWithRelations>[] = useMemo(
    () => [
      {
        key: 'name',
        header: (
          <span className="flex items-center">
            Name
            {getSortIcon('name')}
          </span>
        ),
        sortable: true,
        onSort: () => handleSort('name'),
        cell: (contact) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {contact.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <span className="font-medium">{contact.name}</span>
              {contact.companyName && (
                <div className="text-xs text-muted-foreground truncate">
                  {contact.companyName}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'categories',
        header: (
          <span className="flex items-center">
            Categories
            {getSortIcon('categories')}
          </span>
        ),
        sortable: true,
        onSort: () => handleSort('categories'),
        cell: (contact) => (
          <div className="flex flex-wrap gap-1">
            {contact.categories?.slice(0, 3).map((cat) => (
              <Badge
                key={cat.id}
                variant="outline"
                style={{
                  borderColor: cat.color || undefined,
                  color: cat.color || undefined,
                }}
              >
                {cat.name}
              </Badge>
            ))}
            {(contact.categories?.length ?? 0) > 3 && (
              <Badge variant="secondary">+{(contact.categories?.length ?? 0) - 3}</Badge>
            )}
          </div>
        ),
      },
      {
        key: 'contact',
        header: 'Contact Info',
        cell: (contact) => (
          <div className="text-sm">
            {contact.email && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{contact.email}</span>
              </div>
            )}
            {contact.phonePrimary && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Phone className="h-3 w-3" />
                {contact.phonePrimary}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'location',
        header: (
          <span className="flex items-center">
            Location
            {getSortIcon('location')}
          </span>
        ),
        sortable: true,
        onSort: () => handleSort('location'),
        cell: (contact) =>
          contact.city && contact.state ? `${contact.city}, ${contact.state}` : '-',
      },
      {
        key: 'social',
        header: 'Social',
        cell: (contact) => {
          const hasSocial =
            contact.facebook ||
            contact.instagram ||
            contact.tiktok ||
            contact.twitter ||
            contact.website;
          if (!hasSocial) return '-';
          return (
            <div className="flex items-center gap-1">
              {contact.facebook && <Facebook className="h-3 w-3 text-blue-600" />}
              {contact.instagram && <Instagram className="h-3 w-3 text-pink-600" />}
              {contact.twitter && <Twitter className="h-3 w-3 text-sky-500" />}
              {contact.website && <Globe className="h-3 w-3 text-gray-600" />}
            </div>
          );
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        width: '80px',
        cell: (contact) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleEdit(contact)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => setContactToDelete(contact)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [getSortIcon, handleSort]
  );

  // Helper to render social link
  const renderSocialLink = (
    value: string | null | undefined,
    icon: React.ReactNode,
    _label: string,
    urlPrefix?: string
  ) => {
    if (!value) return null;
    const href = urlPrefix
      ? value.startsWith('http')
        ? value
        : `${urlPrefix}${value.replace('@', '')}`
      : value.startsWith('http')
      ? value
      : `https://${value}`;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        {icon}
        <span>{value}</span>
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-display">Contacts</h2>
          <p className="text-muted-foreground">
            Manage your business contacts - vets, breeders, suppliers, and more
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <MultiSelect
              options={categoryOptions}
              selected={selectedCategories}
              onChange={setSelectedCategories}
              placeholder="Filter by category"
              className="w-[200px]"
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Reset filters
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
              {hasActiveFilters && ` (filtered from ${contacts?.length ?? 0})`}
            </span>
          </div>

          {/* Table */}
          <VirtualTable<ContactWithRelations>
            data={filteredContacts}
            columns={contactColumns}
            getRowKey={(contact) => contact.id}
            onRowClick={(contact) => setSelectedContact(contact.id)}
            rowClassName={(contact) =>
              selectedContact === contact.id ? 'bg-muted/50' : ''
            }
            isLoading={isLoading}
            emptyState={
              <div className="text-center py-12">
                <p className="text-muted-foreground">No contacts found</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => setShowAddDialog(true)}
                >
                  Add your first contact
                </Button>
              </div>
            }
          />
        </div>

        {/* Right: Detail Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedContactData ? (
                <div className="space-y-6">
                  {/* Name and categories */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {selectedContactData.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {selectedContactData.name}
                        </h3>
                        {selectedContactData.companyName && (
                          <p className="text-sm text-muted-foreground">
                            {selectedContactData.companyName}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedContactData.categories?.map((cat) => (
                            <Badge
                              key={cat.id}
                              variant="outline"
                              style={{
                                borderColor: cat.color || undefined,
                                color: cat.color || undefined,
                              }}
                            >
                              {cat.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Contact Info</h4>
                    {selectedContactData.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${selectedContactData.email}`}
                          className="text-primary hover:underline"
                        >
                          {selectedContactData.email}
                        </a>
                      </div>
                    )}
                    {selectedContactData.phonePrimary && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${selectedContactData.phonePrimary}`}
                          className="text-primary hover:underline"
                        >
                          {selectedContactData.phonePrimary}
                        </a>
                        <span className="text-muted-foreground text-xs">(primary)</span>
                      </div>
                    )}
                    {selectedContactData.phoneSecondary && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${selectedContactData.phoneSecondary}`}
                          className="text-primary hover:underline"
                        >
                          {selectedContactData.phoneSecondary}
                        </a>
                        <span className="text-muted-foreground text-xs">(secondary)</span>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  {(selectedContactData.addressLine1 ||
                    selectedContactData.city ||
                    selectedContactData.state) && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Address</h4>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          {selectedContactData.addressLine1 && (
                            <div>{selectedContactData.addressLine1}</div>
                          )}
                          {selectedContactData.addressLine2 && (
                            <div>{selectedContactData.addressLine2}</div>
                          )}
                          {(selectedContactData.city || selectedContactData.state) && (
                            <div>
                              {[
                                selectedContactData.city,
                                selectedContactData.state,
                                selectedContactData.postalCode,
                              ]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Social Media */}
                  {(selectedContactData.facebook ||
                    selectedContactData.instagram ||
                    selectedContactData.tiktok ||
                    selectedContactData.twitter ||
                    selectedContactData.website) && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Social Media</h4>
                      <div className="space-y-2">
                        {renderSocialLink(
                          selectedContactData.facebook,
                          <Facebook className="h-4 w-4 text-blue-600" />,
                          'Facebook',
                          'https://facebook.com/'
                        )}
                        {renderSocialLink(
                          selectedContactData.instagram,
                          <Instagram className="h-4 w-4 text-pink-600" />,
                          'Instagram',
                          'https://instagram.com/'
                        )}
                        {renderSocialLink(
                          selectedContactData.tiktok,
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                          </svg>,
                          'TikTok',
                          'https://tiktok.com/@'
                        )}
                        {renderSocialLink(
                          selectedContactData.twitter,
                          <Twitter className="h-4 w-4 text-sky-500" />,
                          'Twitter/X',
                          'https://twitter.com/'
                        )}
                        {renderSocialLink(
                          selectedContactData.website,
                          <Globe className="h-4 w-4 text-gray-600" />,
                          'Website'
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedContactData.notes && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Notes</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedContactData.notes}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(selectedContactData)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setContactToDelete(selectedContactData)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Select a contact to view details
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <ContactFormDialog
        open={showAddDialog}
        onOpenChange={handleCloseDialog}
        contact={editingContact}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!contactToDelete}
        onOpenChange={(open) => !open && setContactToDelete(null)}
        title={`Delete ${contactToDelete?.name}?`}
        description="This action cannot be undone. The contact will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (contactToDelete) {
            deleteContact.mutate(contactToDelete.id);
            if (selectedContact === contactToDelete.id) {
              setSelectedContact(null);
            }
            setContactToDelete(null);
          }
        }}
      />
    </div>
  );
}

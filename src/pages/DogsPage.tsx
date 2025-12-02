import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useDogs } from '@/hooks/useDogs';
import { DogFormDialog } from '@/components/dogs/DogFormDialog';
import { calculateAge, formatDate } from '@/lib/utils';
import type { Dog, DogStatus, DogSex } from '@/types';

const statusColors: Record<DogStatus, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  active: 'success',
  sold: 'secondary',
  retired: 'outline',
  deceased: 'destructive',
};

export function DogsPage() {
  const navigate = useNavigate();
  const { data: dogs, isLoading } = useDogs();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sexFilter, setSexFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredDogs = dogs?.filter((dog) => {
    const matchesSearch =
      dog.name.toLowerCase().includes(search.toLowerCase()) ||
      dog.breed.toLowerCase().includes(search.toLowerCase()) ||
      dog.registrationNumber?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus =
      statusFilter === 'all' || dog.status === statusFilter;
    
    const matchesSex = sexFilter === 'all' || dog.sex === sexFilter;

    return matchesSearch && matchesStatus && matchesSex;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dogs</h2>
          <p className="text-muted-foreground">
            Manage your dogs and puppies
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Dog
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search dogs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
            <SelectItem value="deceased">Deceased</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sexFilter} onValueChange={setSexFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sex" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="M">Male</SelectItem>
            <SelectItem value="F">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Sex</TableHead>
              <TableHead>Breed</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Registration</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredDogs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">No dogs found</p>
                  <Button
                    variant="link"
                    onClick={() => setShowAddDialog(true)}
                  >
                    Add your first dog
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              filteredDogs?.map((dog) => (
                <TableRow
                  key={dog.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/dogs/${dog.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {dog.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{dog.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {dog.sex === 'M' ? 'Male' : 'Female'}
                    </Badge>
                  </TableCell>
                  <TableCell>{dog.breed}</TableCell>
                  <TableCell>
                    {dog.dateOfBirth ? calculateAge(dog.dateOfBirth) : '-'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {dog.registrationNumber || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[dog.status]}>
                      {dog.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Dog Dialog */}
      <DogFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}


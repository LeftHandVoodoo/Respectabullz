import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SkeletonTableRow } from '@/components/ui/skeleton';
import { VirtualTable, VirtualTableColumn } from '@/components/ui/virtual-table';
import { useDogs } from '@/hooks/useDogs';
import { DogFormDialog } from '@/components/dogs/DogFormDialog';
import { calculateAge } from '@/lib/utils';
import { getPhotoUrlSync, initPhotoBasePath } from '@/lib/photoUtils';
import type { Dog, DogStatus } from '@/types';

const statusColors: Record<DogStatus, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  active: 'success',
  sold: 'secondary',
  retired: 'outline',
  deceased: 'destructive',
};

type SortColumn = 'name' | 'age' | 'status' | 'sex' | null;
type SortDirection = 'asc' | 'desc';

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

export function DogsPage() {
  const navigate = useNavigate();
  const { data: dogs, isLoading } = useDogs();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sexFilter, setSexFilter] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Initialize photo base path for displaying photos
  useEffect(() => {
    initPhotoBasePath();
  }, []);

  const handleSort = useCallback((column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection((currentDirection) => currentDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column with default direction
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  const filteredDogs = useMemo(() => {
    if (!dogs) return [];
    
    let filtered = dogs.filter((dog) => {
      const matchesSearch =
        dog.name.toLowerCase().includes(search.toLowerCase()) ||
        dog.breed.toLowerCase().includes(search.toLowerCase()) ||
        dog.registrationNumber?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus =
        statusFilter === 'all' || dog.status === statusFilter;
      
      const matchesSex = sexFilter === 'all' || dog.sex === sexFilter;

      return matchesSearch && matchesStatus && matchesSex;
    });

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        
        if (sortColumn === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortColumn === 'age') {
          // Sort by date of birth (older = smaller date value)
          const dateA = a.dateOfBirth ? (a.dateOfBirth instanceof Date ? a.dateOfBirth.getTime() : new Date(a.dateOfBirth).getTime()) : 0;
          const dateB = b.dateOfBirth ? (b.dateOfBirth instanceof Date ? b.dateOfBirth.getTime() : new Date(b.dateOfBirth).getTime()) : 0;
          comparison = dateA - dateB;
        } else if (sortColumn === 'status') {
          comparison = a.status.localeCompare(b.status);
        } else if (sortColumn === 'sex') {
          comparison = a.sex.localeCompare(b.sex);
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [dogs, search, statusFilter, sexFilter, sortColumn, sortDirection]);

  const dogsColumns: VirtualTableColumn<Dog>[] = useMemo(() => [
      {
        key: 'name',
        header: (
          <>
            Name
            <SortIcon column="name" sortColumn={sortColumn} sortDirection={sortDirection} />
          </>
        ),
        sortable: true,
        onSort: () => handleSort('name'),
        cell: (dog) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {dog.profilePhotoPath && (
                <AvatarImage 
                  src={getPhotoUrlSync(dog.profilePhotoPath) || undefined} 
                  alt={dog.name}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {dog.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{dog.name}</span>
          </div>
        ),
      },
      {
        key: 'sex',
        header: (
          <>
            Sex
            <SortIcon column="sex" />
          </>
        ),
        sortable: true,
        onSort: () => handleSort('sex'),
        cell: (dog) => (
          <Badge variant="outline">
            {dog.sex === 'M' ? 'Male' : 'Female'}
          </Badge>
        ),
      },
      {
        key: 'breed',
        header: 'Breed',
        cell: (dog) => dog.breed,
      },
      {
        key: 'age',
        header: (
          <>
            Age
            <SortIcon column="age" />
          </>
        ),
        sortable: true,
        onSort: () => handleSort('age'),
        cell: (dog) => (dog.dateOfBirth ? calculateAge(dog.dateOfBirth) : '-'),
      },
      {
        key: 'registration',
        header: 'Registration',
        cell: (dog) => (
          <span className="font-mono text-sm">
            {dog.registrationNumber || '-'}
          </span>
        ),
      },
      {
        key: 'status',
        header: (
          <>
            Status
            <SortIcon column="status" />
          </>
        ),
        sortable: true,
        onSort: () => handleSort('status'),
        cell: (dog) => (
          <Badge variant={statusColors[dog.status]}>
            {dog.status}
          </Badge>
        ),
      },
    ];
  }, [sortColumn, sortDirection, handleSort]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-display">Dogs</h2>
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
      <div className="animate-slide-up-fade">
        <VirtualTable<Dog>
          data={filteredDogs}
          getRowKey={(dog) => dog.id}
          onRowClick={(dog) => navigate(`/dogs/${dog.id}`)}
          isLoading={isLoading}
          loadingSkeleton={
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonTableRow key={i} columns={6} />
              ))}
            </>
          }
          emptyState={
            <div>
              <p className="text-muted-foreground">No dogs found</p>
              <Button
                variant="link"
                onClick={() => setShowAddDialog(true)}
              >
                Add your first dog
              </Button>
            </div>
          }
          columns={dogsColumns}
        />
      </div>

      {/* Add Dog Dialog */}
      <DogFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}


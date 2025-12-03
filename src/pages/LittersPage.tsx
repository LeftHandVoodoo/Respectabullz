import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useLitters } from '@/hooks/useLitters';
import { LitterFormDialog } from '@/components/litters/LitterFormDialog';
import { formatDate } from '@/lib/utils';
import type { Litter } from '@/types';

export function LittersPage() {
  const navigate = useNavigate();
  const { data: litters, isLoading } = useLitters();
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredLitters = litters?.filter((litter) => {
    return (
      litter.code.toLowerCase().includes(search.toLowerCase()) ||
      litter.nickname?.toLowerCase().includes(search.toLowerCase()) ||
      litter.sire?.name.toLowerCase().includes(search.toLowerCase()) ||
      litter.dam?.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  const getStatus = (litter: Litter) => {
    if (litter.whelpDate) return { label: 'Whelped', variant: 'success' as const };
    if (litter.dueDate && new Date(litter.dueDate) > new Date()) {
      return { label: 'Expecting', variant: 'warning' as const };
    }
    return { label: 'Planned', variant: 'secondary' as const };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-display">Litters</h2>
          <p className="text-muted-foreground">Manage breeding litters</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Litter
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search litters..."
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
              <TableHead>Code</TableHead>
              <TableHead>Nickname</TableHead>
              <TableHead>Sire</TableHead>
              <TableHead>Dam</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Whelp Date</TableHead>
              <TableHead>Puppies</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredLitters?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="text-muted-foreground">No litters found</p>
                  <Button
                    variant="link"
                    onClick={() => setShowAddDialog(true)}
                  >
                    Add your first litter
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              filteredLitters?.map((litter) => {
                const status = getStatus(litter);
                return (
                  <TableRow
                    key={litter.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/litters/${litter.id}`)}
                  >
                    <TableCell className="font-mono font-medium">
                      {litter.code}
                    </TableCell>
                    <TableCell>{litter.nickname || '-'}</TableCell>
                    <TableCell>{litter.sire?.name || '-'}</TableCell>
                    <TableCell>{litter.dam?.name || '-'}</TableCell>
                    <TableCell>
                      {litter.dueDate ? formatDate(litter.dueDate) : '-'}
                    </TableCell>
                    <TableCell>
                      {litter.whelpDate ? formatDate(litter.whelpDate) : '-'}
                    </TableCell>
                    <TableCell>
                      {litter.totalAlive !== null
                        ? `${litter.totalAlive}/${litter.totalBorn || 0}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <LitterFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}


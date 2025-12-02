import { useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
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
import {
  useVaccinations,
  useDeleteVaccination,
} from '@/hooks/useHealth';
import { VaccinationFormDialog } from './VaccinationFormDialog';
import { formatDate } from '@/lib/utils';
import type { VaccinationRecord } from '@/types';

interface VaccinationsListProps {
  dogId: string;
}

export function VaccinationsList({ dogId }: VaccinationsListProps) {
  const { data: vaccinations, isLoading } = useVaccinations(dogId);
  const deleteVaccination = useDeleteVaccination();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingVaccination, setEditingVaccination] = useState<VaccinationRecord | undefined>();

  const handleEdit = (vaccination: VaccinationRecord) => {
    setEditingVaccination(vaccination);
    setShowAddDialog(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setShowAddDialog(open);
    if (!open) {
      setEditingVaccination(undefined);
    }
  };

  const isOverdue = (nextDueDate: Date | null | undefined) => {
    if (!nextDueDate) return false;
    return new Date(nextDueDate) < new Date();
  };

  const isDueSoon = (nextDueDate: Date | null | undefined) => {
    if (!nextDueDate) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const dueDate = new Date(nextDueDate);
    return dueDate > new Date() && dueDate <= thirtyDaysFromNow;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Vaccination Records</CardTitle>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vaccination
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : vaccinations?.length === 0 ? (
          <p className="text-muted-foreground">No vaccination records</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vaccine</TableHead>
                <TableHead>Clinic</TableHead>
                <TableHead>Next Due</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vaccinations?.map((vax) => (
                <TableRow key={vax.id}>
                  <TableCell>{formatDate(vax.date)}</TableCell>
                  <TableCell className="font-medium">{vax.vaccineType}</TableCell>
                  <TableCell>{vax.vetClinic || '-'}</TableCell>
                  <TableCell>
                    {vax.nextDueDate ? (
                      <div className="flex items-center gap-2">
                        <span>{formatDate(vax.nextDueDate)}</span>
                        {isOverdue(vax.nextDueDate) && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                        {isDueSoon(vax.nextDueDate) && (
                          <Badge variant="warning">Due Soon</Badge>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(vax)}
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
                            <AlertDialogTitle>Delete this vaccination?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete this vaccination record.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteVaccination.mutate(vax.id)}>
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
      </CardContent>

      <VaccinationFormDialog
        open={showAddDialog}
        onOpenChange={handleCloseDialog}
        dogId={dogId}
        vaccination={editingVaccination}
      />
    </Card>
  );
}


import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
  useMedicalRecords,
  useDeleteMedicalRecord,
} from '@/hooks/useHealth';
import { MedicalRecordFormDialog } from './MedicalRecordFormDialog';
import { formatDate } from '@/lib/utils';
import type { MedicalRecordType } from '@/types';

interface MedicalRecordsListProps {
  dogId: string;
}

const typeColors: Record<MedicalRecordType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  exam: 'default',
  surgery: 'destructive',
  test: 'secondary',
  medication: 'outline',
  injury: 'destructive',
  other: 'outline',
};

export function MedicalRecordsList({ dogId }: MedicalRecordsListProps) {
  const { data: records, isLoading } = useMedicalRecords(dogId);
  const deleteRecord = useDeleteMedicalRecord();
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Medical Records</CardTitle>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Record
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : records?.length === 0 ? (
          <p className="text-muted-foreground">No medical records</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Clinic</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records?.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(record.date)}</TableCell>
                  <TableCell>
                    <Badge variant={typeColors[record.type as MedicalRecordType]}>
                      {record.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {record.description}
                  </TableCell>
                  <TableCell>{record.vetClinic || '-'}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRecord.mutate(record.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <MedicalRecordFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        dogId={dogId}
      />
    </Card>
  );
}


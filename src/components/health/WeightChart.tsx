import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
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
import { useWeightEntries, useDeleteWeightEntry } from '@/hooks/useHealth';
import { WeightFormDialog } from './WeightFormDialog';
import { formatDate, formatWeight } from '@/lib/utils';

interface WeightChartProps {
  dogId: string;
}

export function WeightChart({ dogId }: WeightChartProps) {
  const { data: weightEntries, isLoading } = useWeightEntries(dogId);
  const deleteWeight = useDeleteWeightEntry();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const chartData = weightEntries?.map((entry) => ({
    date: formatDate(entry.date),
    weight: entry.weightLbs,
  })) || [];

  return (
    <div className="space-y-4">
      {/* Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Weight History</CardTitle>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Weight
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : weightEntries?.length === 0 ? (
            <p className="text-muted-foreground">No weight records</p>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    label={{
                      value: 'Weight (lbs)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 12 },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      {weightEntries && weightEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weight Records</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weightEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell className="font-medium">
                      {formatWeight(entry.weightLbs)}
                    </TableCell>
                    <TableCell>{entry.notes || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteWeight.mutate(entry.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <WeightFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        dogId={dogId}
      />
    </div>
  );
}


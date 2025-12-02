import { useState } from 'react';
import { Plus, Calendar as CalendarIcon, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useHeatCycles } from '@/hooks/useHeatCycles';
import type { HeatCycle } from '@/types';
import { useDogs } from '@/hooks/useDogs';
import { HeatCycleFormDialog } from '@/components/heat-cycles/HeatCycleFormDialog';
import { formatDate } from '@/lib/utils';

export function HeatCyclesPage() {
  const { data: heatCycles, isLoading } = useHeatCycles();
  const { data: dogs } = useDogs();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const females = dogs?.filter((d) => d.sex === 'F' && d.status === 'active') || [];

  const isActive = (cycle: HeatCycle) => {
    return !cycle.endDate;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Heat Cycles</h2>
          <p className="text-muted-foreground">
            Track heat cycles for breeding females
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Record Heat Cycle
        </Button>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            List View
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendar View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Female</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Standing Heat</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : heatCycles?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No heat cycles recorded
                      </p>
                      <Button
                        variant="link"
                        onClick={() => setShowAddDialog(true)}
                      >
                        Record first heat cycle
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  heatCycles?.map((cycle) => (
                    <TableRow key={cycle.id}>
                      <TableCell className="font-medium">
                        {cycle.bitch?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{formatDate(cycle.startDate)}</TableCell>
                      <TableCell>
                        {cycle.standingHeatStart && cycle.standingHeatEnd
                          ? `${formatDate(cycle.standingHeatStart)} - ${formatDate(
                              cycle.standingHeatEnd
                            )}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {cycle.endDate ? formatDate(cycle.endDate) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isActive(cycle) ? 'warning' : 'secondary'}>
                          {isActive(cycle) ? 'Active' : 'Completed'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Calendar visualization coming soon. Use the list view to manage
                heat cycles.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <HeatCycleFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        females={females}
      />
    </div>
  );
}


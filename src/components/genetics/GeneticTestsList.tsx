import { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGeneticTests, useDeleteGeneticTest, useDogGeneticTestSummary } from '@/hooks/useGeneticTests';
import { GeneticTestFormDialog } from './GeneticTestFormDialog';
import { formatDate } from '@/lib/utils';
import { getGeneticTestExplanation, getGeneticTestInfo, getBreedingRecommendation } from '@/lib/geneticTestExplanations';
import type { GeneticTest, GeneticTestStatus } from '@/types';

interface GeneticTestsListProps {
  dogId: string;
}

const statusConfig: Record<GeneticTestStatus, { icon: typeof CheckCircle2; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  clear: {
    icon: CheckCircle2,
    label: 'Clear',
    variant: 'default',
    className: 'bg-green-500 hover:bg-green-600',
  },
  carrier: {
    icon: AlertTriangle,
    label: 'Carrier',
    variant: 'secondary',
    className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  },
  affected: {
    icon: XCircle,
    label: 'Affected',
    variant: 'destructive',
    className: '',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    variant: 'outline',
    className: '',
  },
};

export function GeneticTestsList({ dogId }: GeneticTestsListProps) {
  const { data: tests, isLoading } = useGeneticTests(dogId);
  const { data: summary } = useDogGeneticTestSummary(dogId);
  const deleteMutation = useDeleteGeneticTest();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTest, setEditingTest] = useState<GeneticTest | null>(null);
  const [deletingTest, setDeletingTest] = useState<GeneticTest | null>(null);
  const [explanationTest, setExplanationTest] = useState<GeneticTest | null>(null);

  const handleDelete = async () => {
    if (deletingTest) {
      await deleteMutation.mutateAsync(deletingTest.id);
      setDeletingTest(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading genetic tests...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Genetic Tests
              </CardTitle>
              <CardDescription>
                Health testing results and certifications
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Test
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary badges */}
          {summary && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {summary.clearCount > 0 && (
                <Badge className="bg-green-500 hover:bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {summary.clearCount} Clear
                </Badge>
              )}
              {summary.carrierCount > 0 && (
                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {summary.carrierCount} Carrier
                </Badge>
              )}
              {summary.affectedCount > 0 && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  {summary.affectedCount} Affected
                </Badge>
              )}
              {summary.pendingCount > 0 && (
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {summary.pendingCount} Pending
                </Badge>
              )}
            </div>
          )}

          {tests && tests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Lab</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.map((test) => {
                  const config = statusConfig[test.result];
                  const StatusIcon = config.icon;

                  return (
                    <TableRow key={test.id}>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => setExplanationTest(test)}
                          className="text-left hover:text-primary transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2">
                            <span>{test.testName}</span>
                            <Info className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity text-muted-foreground" />
                          </div>
                          {test.certificateNumber && (
                            <span className="block text-xs text-muted-foreground">
                              Cert #{test.certificateNumber}
                            </span>
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => setExplanationTest(test)}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <Badge className={config.className} variant={config.variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell>
                        {test.testDate ? formatDate(test.testDate) : '-'}
                      </TableCell>
                      <TableCell>
                        {test.labName || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingTest(test)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeletingTest(test)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No genetic tests recorded</p>
              <p className="text-sm">Add test results to track this dog&apos;s health status</p>
            </div>
          )}
        </CardContent>
      </Card>

      <GeneticTestFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        dogId={dogId}
      />

      <GeneticTestFormDialog
        open={!!editingTest}
        onOpenChange={(open) => !open && setEditingTest(null)}
        dogId={dogId}
        test={editingTest}
      />

      <AlertDialog open={!!deletingTest} onOpenChange={(open) => !open && setDeletingTest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Genetic Test</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the {deletingTest?.testName} test result?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test Explanation Dialog */}
      <Dialog open={!!explanationTest} onOpenChange={(open) => !open && setExplanationTest(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              {explanationTest && (
                <>
                  {explanationTest.testName} - {statusConfig[explanationTest.result].label}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {explanationTest && getGeneticTestInfo(explanationTest.testType).description}
            </DialogDescription>
          </DialogHeader>
          {explanationTest && (
            <div className="space-y-4 mt-4">
              <div>
                <h4 className="font-semibold mb-2">Test Result Explanation</h4>
                <p className="text-sm text-muted-foreground">
                  {getGeneticTestExplanation(explanationTest.testType, explanationTest.result)}
                </p>
              </div>
              {explanationTest.result !== 'pending' && getBreedingRecommendation(explanationTest.testType) && (
                <div>
                  <h4 className="font-semibold mb-2">Breeding Recommendation</h4>
                  <p className="text-sm text-muted-foreground">
                    {getBreedingRecommendation(explanationTest.testType)}
                  </p>
                </div>
              )}
              {explanationTest.testDate && (
                <div>
                  <h4 className="font-semibold mb-2">Test Details</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Test Date: {formatDate(explanationTest.testDate)}</p>
                    {explanationTest.labName && <p>Lab: {explanationTest.labName}</p>}
                    {explanationTest.certificateNumber && (
                      <p>Certificate: #{explanationTest.certificateNumber}</p>
                    )}
                  </div>
                </div>
              )}
              {explanationTest.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{explanationTest.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}


import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, GripVertical, Check, X, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useWaitlistEntries,
  useDeleteWaitlistEntry,
  useMatchPuppyToWaitlist,
} from '@/hooks/useWaitlist';
import { WaitlistFormDialog } from './WaitlistFormDialog';
import { formatCurrency } from '@/lib/utils';
import type { WaitlistEntry, Dog, Litter } from '@/types';

const statusColors: Record<string, string> = {
  waiting: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  matched: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  converted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  withdrawn: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

const depositStatusColors: Record<string, string> = {
  pending: 'text-amber-600',
  paid: 'text-green-600',
  refunded: 'text-red-600',
  applied_to_sale: 'text-blue-600',
};

interface WaitlistListProps {
  litter: Litter;
  puppies: Dog[];
}

export function WaitlistList({ litter, puppies }: WaitlistListProps) {
  const navigate = useNavigate();
  const { data: waitlist, isLoading } = useWaitlistEntries(litter.id);
  const deleteEntry = useDeleteWaitlistEntry();
  const matchPuppy = useMatchPuppyToWaitlist();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WaitlistEntry | undefined>();
  const [matchingEntryId, setMatchingEntryId] = useState<string | null>(null);

  // Filter available (unmatched) puppies
  const matchedPuppyIds = waitlist
    ?.filter(w => w.assignedPuppyId)
    .map(w => w.assignedPuppyId) || [];
  
  const availablePuppies = puppies.filter(p => 
    !matchedPuppyIds.includes(p.id) && p.status === 'active'
  );

  // Count by sex preference
  const maleWaiting = waitlist?.filter(w => w.preference === 'male' && w.status === 'waiting').length || 0;
  const femaleWaiting = waitlist?.filter(w => w.preference === 'female' && w.status === 'waiting').length || 0;

  // Count available puppies by sex
  const malePuppies = puppies.filter(p => p.sex === 'M' && p.status === 'active');
  const femalePuppies = puppies.filter(p => p.sex === 'F' && p.status === 'active');
  const availableMales = malePuppies.filter(p => !matchedPuppyIds.includes(p.id)).length;
  const availableFemales = femalePuppies.filter(p => !matchedPuppyIds.includes(p.id)).length;

  const handleMatchPuppy = async (entryId: string, puppyId: string) => {
    await matchPuppy.mutateAsync({ entryId, puppyId });
    setMatchingEntryId(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading waitlist...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Waitlist & Reservations</CardTitle>
              <CardDescription>
                Manage puppy reservations for this litter
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => {
              setEditingEntry(undefined);
              setShowAddDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add to Waitlist
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Availability Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Male Puppies</p>
              <p className="text-lg font-medium">
                {availableMales} available / {malePuppies.length} total
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Female Puppies</p>
              <p className="text-lg font-medium">
                {availableFemales} available / {femalePuppies.length} total
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Waiting for Male</p>
              <p className="text-lg font-medium">{maleWaiting}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Waiting for Female</p>
              <p className="text-lg font-medium">{femaleWaiting}</p>
            </div>
          </div>

          {(!waitlist || waitlist.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">No one on the waitlist yet</p>
              <p className="text-sm">Add clients to start managing reservations</p>
            </div>
          ) : (
            <div className="space-y-2">
              {waitlist.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    entry.status === 'converted' ? 'bg-muted/30 opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                    <span className="font-mono text-sm w-6">#{entry.position}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span 
                        className="font-medium cursor-pointer hover:text-primary"
                        onClick={() => entry.client && navigate(`/clients`)}
                      >
                        {entry.client?.name || 'Unknown Client'}
                      </span>
                      <Badge className={`text-xs ${statusColors[entry.status]}`}>
                        {entry.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {entry.preference === 'male' ? '♂ Male' : 
                         entry.preference === 'female' ? '♀ Female' : 
                         'Either'}
                      </Badge>
                      {entry.colorPreference && (
                        <Badge variant="outline" className="text-xs">
                          {entry.colorPreference}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {entry.depositAmount && entry.depositAmount > 0 && (
                        <span className={`flex items-center gap-1 ${depositStatusColors[entry.depositStatus]}`}>
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(entry.depositAmount)} ({entry.depositStatus.replace('_', ' ')})
                        </span>
                      )}
                      {entry.assignedPuppy && (
                        <span className="flex items-center gap-1 text-purple-600">
                          <Check className="h-3 w-3" />
                          Matched: {entry.assignedPuppy.name}
                        </span>
                      )}
                      {entry.notes && (
                        <span className="truncate max-w-xs">{entry.notes}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {entry.status === 'waiting' && availablePuppies.length > 0 && (
                      matchingEntryId === entry.id ? (
                        <div className="flex items-center gap-1">
                          <Select onValueChange={(puppyId) => handleMatchPuppy(entry.id, puppyId)}>
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue placeholder="Select puppy" />
                            </SelectTrigger>
                            <SelectContent>
                              {availablePuppies
                                .filter(p => 
                                  entry.preference === 'either' ||
                                  (entry.preference === 'male' && p.sex === 'M') ||
                                  (entry.preference === 'female' && p.sex === 'F')
                                )
                                .map((puppy) => (
                                  <SelectItem key={puppy.id} value={puppy.id}>
                                    {puppy.name} ({puppy.sex === 'M' ? '♂' : '♀'})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setMatchingEntryId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => setMatchingEntryId(entry.id)}
                        >
                          Match
                        </Button>
                      )
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingEntry(entry);
                        setShowAddDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove from Waitlist?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove {entry.client?.name || 'this client'} from the waitlist. 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteEntry.mutate(entry.id)}>
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <WaitlistFormDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) setEditingEntry(undefined);
        }}
        entry={editingEntry}
        defaultLitterId={litter.id}
      />
    </div>
  );
}


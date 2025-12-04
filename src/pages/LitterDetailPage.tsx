import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Dog, Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useLitter, useDeleteLitter } from '@/hooks/useLitters';
import { LitterFormDialog } from '@/components/litters/LitterFormDialog';
import { LitterPhotoGallery } from '@/components/litters/LitterPhotoGallery';
import { LitterStatusProgress } from '@/components/litters/LitterStatusProgress';
import { WhelpingChecklist } from '@/components/litters/WhelpingChecklist';
import { DogFormDialog } from '@/components/dogs/DogFormDialog';
import { PuppyHealthTasksList } from '@/components/puppy-health/PuppyHealthTasksList';
import { WaitlistList } from '@/components/waitlist/WaitlistList';
import { LitterRegistrationExport } from '@/components/registry/LitterRegistrationExport';
import { DocumentList } from '@/components/documents';
import { useDocumentsForLitter } from '@/hooks/useDocuments';
import { formatDate } from '@/lib/utils';
import { getPhotoUrlSync, initPhotoBasePath } from '@/lib/photoUtils';

export function LitterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: litter, isLoading } = useLitter(id);
  const { data: documents = [], isLoading: isLoadingDocs } = useDocumentsForLitter(id);
  const deleteLitter = useDeleteLitter();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddPuppyDialog, setShowAddPuppyDialog] = useState(false);

  // Initialize photo base path for displaying photos
  useEffect(() => {
    initPhotoBasePath();
  }, []);

  const handleDelete = async () => {
    if (id) {
      await deleteLitter.mutateAsync(id);
      navigate('/litters');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!litter) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Litter not found</p>
        <Button variant="outline" onClick={() => navigate('/litters')}>
          Back to Litters
        </Button>
      </div>
    );
  }

  const status = litter.whelpDate
    ? 'Whelped'
    : litter.dueDate && new Date(litter.dueDate) > new Date()
    ? 'Expecting'
    : 'Planned';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/litters')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{litter.code}</h2>
          <p className="text-muted-foreground">
            {litter.nickname || 'Breeding Litter'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              status === 'Whelped'
                ? 'success'
                : status === 'Expecting'
                ? 'warning'
                : 'secondary'
            }
          >
            {status}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditDialog(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {litter.code}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Puppies in this litter will no
                  longer be associated with it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Status Progress */}
      {litter.status && (
        <Card>
          <CardContent className="pt-6">
            <LitterStatusProgress status={litter.status} />
          </CardContent>
        </Card>
      )}

      {/* Parents Cards with Photos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sire (Father)</CardTitle>
          </CardHeader>
          <CardContent>
            {litter.sire ? (
              <div 
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/dogs/${litter.sire?.id}`)}
              >
                <Avatar className="h-12 w-12 border-2 border-border">
                  {litter.sire.profilePhotoPath && (
                    <AvatarImage 
                      src={getPhotoUrlSync(litter.sire.profilePhotoPath) || undefined} 
                      alt={litter.sire.name}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {litter.sire.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{litter.sire.name}</p>
                  <p className="text-sm text-muted-foreground">{litter.sire.breed}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Unknown</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dam (Mother)</CardTitle>
          </CardHeader>
          <CardContent>
            {litter.dam ? (
              <div 
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/dogs/${litter.dam?.id}`)}
              >
                <Avatar className="h-12 w-12 border-2 border-border">
                  {litter.dam.profilePhotoPath && (
                    <AvatarImage 
                      src={getPhotoUrlSync(litter.dam.profilePhotoPath) || undefined} 
                      alt={litter.dam.name}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {litter.dam.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{litter.dam.name}</p>
                  <p className="text-sm text-muted-foreground">{litter.dam.breed}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Unknown</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Due Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{litter.dueDate ? formatDate(litter.dueDate) : 'Not set'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Puppies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {litter.totalAlive !== null
                ? `${litter.totalAlive} alive / ${litter.totalBorn || 0} born`
                : 'Not recorded'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Breeding Date</p>
              <p className="font-medium">
                {litter.breedingDate ? formatDate(litter.breedingDate) : 'Not recorded'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">
                {litter.dueDate ? formatDate(litter.dueDate) : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Whelp Date</p>
              <p className="font-medium">
                {litter.whelpDate ? formatDate(litter.whelpDate) : 'Not whelped yet'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pregnancy Confirmation */}
      {(litter.ultrasoundDate || litter.xrayDate) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pregnancy Confirmation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {litter.ultrasoundDate && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Ultrasound</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{formatDate(litter.ultrasoundDate)}</span>
                    </div>
                    {litter.ultrasoundResult && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Result:</span>
                        <Badge variant={
                          litter.ultrasoundResult === 'pregnant' ? 'success' :
                          litter.ultrasoundResult === 'not_pregnant' ? 'destructive' :
                          'secondary'
                        }>
                          {litter.ultrasoundResult.replace('_', ' ')}
                        </Badge>
                      </div>
                    )}
                    {litter.ultrasoundPuppyCount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Est. Puppies:</span>
                        <span>{litter.ultrasoundPuppyCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {litter.xrayDate && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">X-Ray</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{formatDate(litter.xrayDate)}</span>
                    </div>
                    {litter.xrayPuppyCount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Puppy Count:</span>
                        <span className="font-medium">{litter.xrayPuppyCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Whelping Checklist - show when status is before or during whelping */}
      {(!litter.status || ['planned', 'bred', 'ultrasound_confirmed', 'xray_confirmed'].includes(litter.status)) && litter.dueDate && (
        <WhelpingChecklist litter={litter} />
      )}

      {/* Puppies */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Dog className="h-5 w-5" />
            Puppies
          </CardTitle>
          <div className="flex gap-2">
            {litter.puppies && litter.puppies.length > 0 && (
              <LitterRegistrationExport litter={litter} />
            )}
            <Button size="sm" onClick={() => setShowAddPuppyDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Puppy
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!litter.puppies || litter.puppies.length === 0 ? (
            <p className="text-muted-foreground">
              No puppies registered to this litter yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Sex</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {litter.puppies.map((puppy) => (
                  <TableRow
                    key={puppy.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/dogs/${puppy.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          {puppy.profilePhotoPath && (
                            <AvatarImage 
                              src={getPhotoUrlSync(puppy.profilePhotoPath) || undefined} 
                              alt={puppy.name}
                              className="object-cover"
                            />
                          )}
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {puppy.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{puppy.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{puppy.sex === 'M' ? 'Male' : 'Female'}</TableCell>
                    <TableCell>{puppy.color || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{puppy.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Waitlist & Reservations */}
      <WaitlistList litter={litter} puppies={litter.puppies || []} />

      {/* Health Schedule */}
      <PuppyHealthTasksList litter={litter} puppies={litter.puppies || []} />

      {/* Photo Gallery */}
      <LitterPhotoGallery litterId={litter.id} />

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents
            {documents.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {documents.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentList
            documents={documents}
            entityType="litter"
            entityId={litter.id}
            isLoading={isLoadingDocs}
            emptyMessage="No documents attached to this litter"
          />
        </CardContent>
      </Card>

      {/* Notes */}
      {litter.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{litter.notes}</p>
          </CardContent>
        </Card>
      )}

      <LitterFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        litter={litter}
      />

      <DogFormDialog
        open={showAddPuppyDialog}
        onOpenChange={setShowAddPuppyDialog}
        defaultLitterId={litter.id}
      />
    </div>
  );
}


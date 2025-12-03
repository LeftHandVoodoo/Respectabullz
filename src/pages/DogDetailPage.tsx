import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Syringe,
  Scale,
  Stethoscope,
  Heart,
  Truck,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useDog, useDeleteDog } from '@/hooks/useDogs';
import { DogFormDialog } from '@/components/dogs/DogFormDialog';
import { VaccinationsList } from '@/components/health/VaccinationsList';
import { WeightChart } from '@/components/health/WeightChart';
import { MedicalRecordsList } from '@/components/health/MedicalRecordsList';
import { calculateAge, formatDate } from '@/lib/utils';
import { getPhotoUrlSync, initPhotoBasePath } from '@/lib/photoUtils';
import type { DogStatus } from '@/types';

const statusColors: Record<DogStatus, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  active: 'success',
  sold: 'secondary',
  retired: 'outline',
  deceased: 'destructive',
};

export function DogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: dog, isLoading } = useDog(id);
  const deleteDog = useDeleteDog();
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Initialize photo base path for displaying photos
  useEffect(() => {
    initPhotoBasePath();
  }, []);

  const handleDelete = async () => {
    if (id) {
      await deleteDog.mutateAsync(id);
      navigate('/dogs');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!dog) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Dog not found</p>
        <Button variant="outline" onClick={() => navigate('/dogs')}>
          Back to Dogs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dogs')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-border">
              {dog.profilePhotoPath && (
                <AvatarImage 
                  src={getPhotoUrlSync(dog.profilePhotoPath) || undefined} 
                  alt={dog.name}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {dog.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{dog.name}</h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{dog.sex === 'M' ? 'Male' : 'Female'}</span>
                <span>•</span>
                <span>{dog.breed}</span>
                {dog.dateOfBirth && (
                  <>
                    <span>•</span>
                    <span>{calculateAge(dog.dateOfBirth)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusColors[dog.status]}>{dog.status}</Badge>
          <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
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
                <AlertDialogTitle>Delete {dog.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All related records (vaccinations,
                  weight entries, medical records) will also be deleted.
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

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono">{dog.registrationNumber || 'Not registered'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Microchip</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono">{dog.microchipNumber || 'Not chipped'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Date of Birth</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{dog.dateOfBirth ? formatDate(dog.dateOfBirth) : 'Unknown'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lineage */}
      {(dog.sire || dog.dam) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lineage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Sire (Father)</p>
                <p className="font-medium">{dog.sire?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Dam (Mother)</p>
                <p className="font-medium">{dog.dam?.name || 'Unknown'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">
            <Stethoscope className="h-4 w-4 mr-2" />
            Health
          </TabsTrigger>
          <TabsTrigger value="vaccinations">
            <Syringe className="h-4 w-4 mr-2" />
            Vaccinations
          </TabsTrigger>
          <TabsTrigger value="weight">
            <Scale className="h-4 w-4 mr-2" />
            Weight
          </TabsTrigger>
          {dog.sex === 'F' && (
            <TabsTrigger value="breeding">
              <Heart className="h-4 w-4 mr-2" />
              Breeding
            </TabsTrigger>
          )}
          <TabsTrigger value="transport">
            <Truck className="h-4 w-4 mr-2" />
            Transport
          </TabsTrigger>
          <TabsTrigger value="financial">
            <DollarSign className="h-4 w-4 mr-2" />
            Financial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health">
          <MedicalRecordsList dogId={dog.id} />
        </TabsContent>

        <TabsContent value="vaccinations">
          <VaccinationsList dogId={dog.id} />
        </TabsContent>

        <TabsContent value="weight">
          <WeightChart dogId={dog.id} />
        </TabsContent>

        {dog.sex === 'F' && (
          <TabsContent value="breeding">
            <Card>
              <CardHeader>
                <CardTitle>Heat Cycles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Heat cycle tracking coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="transport">
          <Card>
            <CardHeader>
              <CardTitle>Transport History</CardTitle>
            </CardHeader>
            <CardContent>
              {dog.transports?.length === 0 ? (
                <p className="text-muted-foreground">No transport records</p>
              ) : (
                <p className="text-muted-foreground">
                  Transport records will be displayed here...
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>Financial Records</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Financial records will be displayed here...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notes */}
      {dog.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{dog.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <DogFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        dog={dog}
      />
    </div>
  );
}


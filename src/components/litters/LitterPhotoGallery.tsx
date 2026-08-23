import { useState, useEffect } from 'react';
import { Plus, Trash2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  useLitterPhotos,
  useCreateLitterPhoto,
  useUpdateLitterPhoto,
  useDeleteLitterPhoto,
} from '@/hooks/useLitterPhotos';
import { getPhotoUrlSync, initPhotoBasePath, selectAndCopyMultipleImages } from '@/lib/photoUtils';
import { deleteManagedPhotoIfUnreferenced } from '@/lib/photoStorage';
import type { LitterPhoto } from '@/types';

interface LitterPhotoGalleryProps {
  litterId: string;
}

export function LitterPhotoGallery({ litterId }: LitterPhotoGalleryProps) {
  const { toast } = useToast();
  const { data: photos, isLoading } = useLitterPhotos(litterId);
  const createPhoto = useCreateLitterPhoto();
  const updatePhoto = useUpdateLitterPhoto();
  const deletePhoto = useDeleteLitterPhoto();
  
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<LitterPhoto | null>(null);
  const [editingCaption, setEditingCaption] = useState('');

  // Initialize photo base path on mount
  useEffect(() => {
    initPhotoBasePath();
  }, []);

  const handleUploadPhotos = async () => {
    setIsUploading(true);
    let filenames: string[] = [];
    try {
      filenames = await selectAndCopyMultipleImages();
      
      // Create photo records for each uploaded file
      for (const filename of filenames) {
        await createPhoto.mutateAsync({
          litterId,
          filePath: filename,
          caption: null,
          sortOrder: (photos?.length || 0) + filenames.indexOf(filename),
        });
      }
      if (filenames.length > 0) {
        toast({
          title: 'Photos added',
          description: `${filenames.length} validated photo${filenames.length === 1 ? '' : 's'} added.`,
        });
      }
    } catch (error) {
      // Records created before a database failure remain authoritative. This
      // removes only copied files that are still unreferenced.
      const cleanup = await Promise.allSettled(
        filenames.map((filename) => deleteManagedPhotoIfUnreferenced(filename)),
      );
      const cleanupFailed = cleanup.some((result) => result.status === 'rejected');
      toast({
        title: 'Could not add every photo',
        description: cleanupFailed
          ? 'Some records may have been added, and an unreferenced local file could not be removed. Orphan files are excluded from exports.'
          : error instanceof Error ? error.message : 'No unvalidated photo was added.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const result = await deletePhoto.mutateAsync({ id: photoId, litterId });
      setSelectedPhoto(null);
      toast({
        title: result.success ? 'Photo permanently removed' : 'Photo was already removed',
      });
    } catch (error) {
      toast({
        title: 'Photo cleanup failed',
        description: error instanceof Error ? error.message : 'The photo could not be removed.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveCaption = async () => {
    if (selectedPhoto) {
      await updatePhoto.mutateAsync({
        id: selectedPhoto.id,
        data: { caption: editingCaption || null },
      });
      setSelectedPhoto(null);
    }
  };

  const handlePhotoClick = (photo: LitterPhoto) => {
    setSelectedPhoto(photo);
    setEditingCaption(photo.caption || '');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse text-muted-foreground">Loading photos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Photos ({photos?.length || 0})
          </CardTitle>
          <Button size="sm" onClick={handleUploadPhotos} disabled={isUploading}>
            <Plus className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Add Photos'}
          </Button>
        </CardHeader>
        <CardContent>
          {!photos || photos.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-2">No photos yet</p>
              <Button variant="outline" size="sm" onClick={handleUploadPhotos} disabled={isUploading}>
                <Plus className="h-4 w-4 mr-2" />
                Add your first photos
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => {
                const photoUrl = getPhotoUrlSync(photo.filePath);
                return (
                  <div
                    key={photo.id}
                    className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border border-border hover:border-primary transition-colors"
                    onClick={() => handlePhotoClick(photo)}
                  >
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={photo.caption || 'Litter photo'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-white text-xs truncate">{photo.caption}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Detail Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Photo Details</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
                {getPhotoUrlSync(selectedPhoto.filePath) ? (
                  <img
                    src={getPhotoUrlSync(selectedPhoto.filePath) || undefined}
                    alt={selectedPhoto.caption || 'Litter photo'}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground mb-1 block">Caption</label>
                  <Input
                    value={editingCaption}
                    onChange={(e) => setEditingCaption(e.target.value)}
                    placeholder="Add a caption..."
                  />
                </div>
                <Button onClick={handleSaveCaption} disabled={updatePhoto.isPending}>
                  {updatePhoto.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Uploaded {new Date(selectedPhoto.uploadedAt).toLocaleDateString()}
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Photo
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. The photo will be permanently removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeletePhoto(selectedPhoto.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}


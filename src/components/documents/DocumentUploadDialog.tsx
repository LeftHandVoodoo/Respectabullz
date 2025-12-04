import * as React from 'react';
import { Upload, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TagSelector } from './TagSelector';
import { useCreateDocument, useLinkDocumentToDog, useLinkDocumentToLitter, useLinkDocumentToExpense } from '@/hooks/useDocuments';
import { selectAndCopyDocument, formatFileSize, getFileTypeDisplayName } from '@/lib/documentUtils';
import type { EntityType } from './DocumentList';

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  entityId: string;
}

interface SelectedFile {
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
}: DocumentUploadDialogProps) {
  const [selectedFile, setSelectedFile] = React.useState<SelectedFile | null>(null);
  const [notes, setNotes] = React.useState('');
  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([]);
  const [isSelecting, setIsSelecting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const createDocument = useCreateDocument();
  const linkToDog = useLinkDocumentToDog();
  const linkToLitter = useLinkDocumentToLitter();
  const linkToExpense = useLinkDocumentToExpense();

  const handleSelectFile = async () => {
    setIsSelecting(true);
    try {
      const result = await selectAndCopyDocument();
      if (result) {
        setSelectedFile(result);
      }
    } finally {
      setIsSelecting(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Create the document record
      const doc = await createDocument.mutateAsync({
        filename: selectedFile.filename,
        originalName: selectedFile.originalName,
        filePath: `documents/${selectedFile.filename}`,
        mimeType: selectedFile.mimeType,
        fileSize: selectedFile.fileSize,
        notes: notes || undefined,
        tagIds: selectedTagIds,
      });

      // Link to the entity
      switch (entityType) {
        case 'dog':
          await linkToDog.mutateAsync({ documentId: doc.id, dogId: entityId });
          break;
        case 'litter':
          await linkToLitter.mutateAsync({ documentId: doc.id, litterId: entityId });
          break;
        case 'expense':
          await linkToExpense.mutateAsync({ documentId: doc.id, expenseId: entityId });
          break;
      }

      // Reset and close
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to upload document:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setNotes('');
    setSelectedTagIds([]);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Attach a document to this {entityType}. Supported formats: PDF, Word, Excel, and images.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File selection */}
          {!selectedFile ? (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={handleSelectFile}
            >
              {isSelecting ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Selecting file...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to select a file
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, Word, Excel, JPG, PNG, GIF, WebP
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{selectedFile.originalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {getFileTypeDisplayName(selectedFile.originalName)} • {formatFileSize(selectedFile.fileSize)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectFile}
                  disabled={isSelecting}
                >
                  Change
                </Button>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <TagSelector
              selectedTagIds={selectedTagIds}
              onChange={setSelectedTagIds}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this document..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


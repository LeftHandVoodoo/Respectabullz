import * as React from 'react';
import { Loader2 } from 'lucide-react';
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
import { useUpdateDocument } from '@/hooks/useDocuments';
import { useSetDocumentTags } from '@/hooks/useDocumentTags';
import type { DocumentWithRelations } from '@/types';
import { formatFileSize, getFileTypeDisplayName } from '@/lib/documentUtils';

interface DocumentEditDialogProps {
  document: DocumentWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentEditDialog({
  document,
  open,
  onOpenChange,
}: DocumentEditDialogProps) {
  const [notes, setNotes] = React.useState(document.notes || '');
  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>(
    document.tags?.map((t) => t.id) || []
  );
  const [isSaving, setIsSaving] = React.useState(false);

  const updateDocument = useUpdateDocument();
  const setDocumentTags = useSetDocumentTags();

  // Reset form when document changes
  React.useEffect(() => {
    setNotes(document.notes || '');
    setSelectedTagIds(document.tags?.map((t) => t.id) || []);
  }, [document]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update notes
      await updateDocument.mutateAsync({
        id: document.id,
        data: { notes: notes || undefined },
      });

      // Update tags
      await setDocumentTags.mutateAsync({
        documentId: document.id,
        tagIds: selectedTagIds,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
          <DialogDescription>
            Update tags and notes for this document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File info (read-only) */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <p className="font-medium text-sm">{document.originalName}</p>
            <p className="text-xs text-muted-foreground">
              {getFileTypeDisplayName(document.originalName)} • {formatFileSize(document.fileSize)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}
            </p>
          </div>

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
            <Label htmlFor="notes">Notes</Label>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


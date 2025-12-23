import * as React from 'react';
import {
  FileText,
  FileType,
  Image,
  Table,
  File,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  Printer,
  Edit,
  Eye,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { TagBadgeList } from './TagSelector';
import type { DocumentWithRelations } from '@/types';
import {
  formatFileSize,
  isImageFile,
  isPdfFile,
  isWordFile,
  isExcelFile,
  openDocumentWithSystem,
} from '@/lib/documentUtils';
import { useDeleteDocument } from '@/hooks/useDocuments';

interface DocumentCardProps {
  document: DocumentWithRelations;
  onView?: (doc: DocumentWithRelations) => void;
  onEdit?: (doc: DocumentWithRelations) => void;
  onDelete?: (doc: DocumentWithRelations) => void;
}

function getIconColor(filename: string): string {
  if (isImageFile(filename)) return 'text-teal-500';
  if (isPdfFile(filename)) return 'text-red-500';
  if (isWordFile(filename)) return 'text-blue-500';
  if (isExcelFile(filename)) return 'text-green-500';
  return 'text-gray-500';
}

// Separate component to render the document icon - avoids "component created during render" error
function DocumentIcon({ filename, className }: { filename: string; className?: string }) {
  if (isImageFile(filename)) return <Image className={className} />;
  if (isPdfFile(filename)) return <FileText className={className} />;
  if (isWordFile(filename)) return <FileType className={className} />;
  if (isExcelFile(filename)) return <Table className={className} />;
  return <File className={className} />;
}

export function DocumentCard({ document, onView, onEdit, onDelete }: DocumentCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const deleteDocument = useDeleteDocument();

  const iconColor = React.useMemo(() => getIconColor(document.filename), [document.filename]);

  const handleOpenWithSystem = async () => {
    await openDocumentWithSystem(document.filename);
  };

  const handlePrint = async () => {
    // For images, we'll open in viewer with print option
    // For other files, open with system which can handle print
    if (isImageFile(document.filename)) {
      onView?.(document);
    } else {
      await openDocumentWithSystem(document.filename);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDocument.mutateAsync(document.id);
      onDelete?.(document);
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Card className="p-3 hover:bg-muted/50 transition-colors">
        <div className="flex items-start gap-3">
          {/* File icon */}
          <div className={`p-2 rounded-lg bg-muted ${iconColor}`}>
            <DocumentIcon filename={document.filename} className="h-6 w-6" />
          </div>

          {/* Document info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-medium text-sm truncate" title={document.originalName}>
                  {document.originalName}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(document.fileSize)} • {new Date(document.uploadedAt).toLocaleDateString()}
                </p>
              </div>

              {/* Actions menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={() => onView(document)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleOpenWithSystem}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open with System
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </DropdownMenuItem>
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(document)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Tags
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Tags */}
            {document.tags && document.tags.length > 0 && (
              <div className="mt-2">
                <TagBadgeList tags={document.tags} maxVisible={3} />
              </div>
            )}

            {/* Notes */}
            {document.notes && (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                {document.notes}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{document.originalName}"? This action cannot be undone
              and will remove the document from all linked items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


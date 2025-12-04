import * as React from 'react';
import { FileUp, Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DocumentCard } from './DocumentCard';
import { DocumentUploadDialog } from './DocumentUploadDialog';
import { DocumentViewer } from './DocumentViewer';
import { DocumentEditDialog } from './DocumentEditDialog';
import { useDocumentTags } from '@/hooks/useDocumentTags';
import type { DocumentWithRelations } from '@/types';

export type EntityType = 'dog' | 'litter' | 'expense';

interface DocumentListProps {
  documents: DocumentWithRelations[];
  entityType: EntityType;
  entityId: string;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DocumentList({
  documents,
  entityType,
  entityId,
  isLoading,
  emptyMessage = 'No documents attached',
}: DocumentListProps) {
  const { data: tags = [] } = useDocumentTags();
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [viewingDocument, setViewingDocument] = React.useState<DocumentWithRelations | null>(null);
  const [editingDocument, setEditingDocument] = React.useState<DocumentWithRelations | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTagId, setSelectedTagId] = React.useState<string>('all');

  // Filter documents based on search and tag
  const filteredDocuments = React.useMemo(() => {
    return documents.filter((doc) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        doc.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.notes?.toLowerCase().includes(searchQuery.toLowerCase());

      // Tag filter
      const matchesTag =
        selectedTagId === 'all' ||
        doc.tags?.some((t) => t.id === selectedTagId);

      return matchesSearch && matchesTag;
    });
  }, [documents, searchQuery, selectedTagId]);

  // Get unique tags from current documents for filter dropdown
  const availableTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    documents.forEach((doc) => {
      doc.tags?.forEach((tag) => tagSet.add(tag.id));
    });
    return tags.filter((t) => tagSet.has(t.id));
  }, [documents, tags]);

  const handleView = (doc: DocumentWithRelations) => {
    setViewingDocument(doc);
  };

  const handleEdit = (doc: DocumentWithRelations) => {
    setEditingDocument(doc);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTagId('all');
  };

  const hasActiveFilters = searchQuery || selectedTagId !== 'all';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters and upload button */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tag filter */}
        <Select value={selectedTagId} onValueChange={setSelectedTagId}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {availableTags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color ?? '#6B7280' }}
                  />
                  {tag.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Upload button */}
        <Button onClick={() => setUploadDialogOpen(true)}>
          <FileUp className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: "{searchQuery}"
              <button onClick={() => setSearchQuery('')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedTagId !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Tag: {tags.find((t) => t.id === selectedTagId)?.name}
              <button onClick={() => setSelectedTagId('all')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* Document list */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {hasActiveFilters ? (
            <p>No documents match your filters</p>
          ) : (
            <div className="space-y-2">
              <p>{emptyMessage}</p>
              <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
                <FileUp className="h-4 w-4 mr-2" />
                Upload your first document
              </Button>
            </div>
          )}
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 pr-4">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onView={handleView}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Upload dialog */}
      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        entityType={entityType}
        entityId={entityId}
      />

      {/* View dialog */}
      {viewingDocument && (
        <DocumentViewer
          document={viewingDocument}
          open={!!viewingDocument}
          onOpenChange={(open) => !open && setViewingDocument(null)}
        />
      )}

      {/* Edit dialog */}
      {editingDocument && (
        <DocumentEditDialog
          document={editingDocument}
          open={!!editingDocument}
          onOpenChange={(open) => !open && setEditingDocument(null)}
        />
      )}
    </div>
  );
}


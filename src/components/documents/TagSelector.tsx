import * as React from 'react';
import { Check, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDocumentTags, useCreateDocumentTag } from '@/hooks/useDocumentTags';
import type { DocumentTag } from '@/types';

interface TagSelectorProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  disabled?: boolean;
}

export function TagSelector({ selectedTagIds, onChange, disabled }: TagSelectorProps) {
  const { data: tags = [], isLoading } = useDocumentTags();
  const createTag = useCreateDocumentTag();
  const [open, setOpen] = React.useState(false);
  const [newTagName, setNewTagName] = React.useState('');

  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id));

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const removeTag = (tagId: string) => {
    onChange(selectedTagIds.filter((id) => id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    try {
      const newTag = await createTag.mutateAsync({
        name: newTagName.trim(),
        color: '#6B7280', // Default gray color
      });
      onChange([...selectedTagIds, newTag.id]);
      setNewTagName('');
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  return (
    <div className="space-y-2">
      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              style={{ backgroundColor: tag.color ?? undefined }}
              className="text-white gap-1"
            >
              {tag.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag.id)}
                  className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Tag selector popover */}
      {!disabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={isLoading}
            >
              <Plus className="h-3 w-3" />
              Add Tags
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <div className="p-2 border-b">
              <div className="flex gap-1">
                <Input
                  placeholder="New tag name..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateTag();
                    }
                  }}
                  className="h-8 text-sm"
                />
                <Button
                  size="sm"
                  className="h-8"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || createTag.isPending}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[200px]">
              <div className="p-1">
                {tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2 text-center">
                    No tags available
                  </p>
                ) : (
                  tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors',
                        selectedTagIds.includes(tag.id) && 'bg-muted'
                      )}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color ?? '#6B7280' }}
                      />
                      <span className="flex-1 text-left">{tag.name}</span>
                      {selectedTagIds.includes(tag.id) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                      {tag.isCustom && (
                        <Badge variant="outline" className="text-xs px-1">
                          Custom
                        </Badge>
                      )}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

interface TagBadgeListProps {
  tags: DocumentTag[];
  maxVisible?: number;
}

export function TagBadgeList({ tags, maxVisible = 3 }: TagBadgeListProps) {
  const visibleTags = tags.slice(0, maxVisible);
  const hiddenCount = tags.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-1">
      {visibleTags.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          style={{ backgroundColor: tag.color ?? undefined }}
          className="text-white text-xs"
        >
          {tag.name}
        </Badge>
      ))}
      {hiddenCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{hiddenCount} more
        </Badge>
      )}
    </div>
  );
}


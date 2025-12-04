import * as React from 'react';
import { ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

export interface MultiSelectOption {
  value: string;
  label: string;
  color?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  searchable?: boolean;
  maxDisplay?: number;
  emptyMessage?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  className,
  searchable = true,
  maxDisplay = 2,
  emptyMessage = 'No options found',
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const selectAll = () => {
    onChange(options.map((o) => o.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  const getDisplayLabel = () => {
    if (selected.length === 0) {
      return placeholder;
    }
    if (selected.length === options.length && options.length > 0) {
      return 'All selected';
    }
    if (selected.length <= maxDisplay) {
      return selected
        .map((v) => options.find((o) => o.value === v)?.label || v)
        .join(', ');
    }
    return `${selected.length} selected`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between font-normal', className)}
        >
          <span className="truncate">{getDisplayLabel()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="p-2 border-b">
          {searchable && (
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 mb-2"
            />
          )}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={selectAll}
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={clearAll}
            >
              Clear All
            </Button>
          </div>
        </div>
        <ScrollArea className="max-h-[200px]">
          <div className="p-2">
            {filteredOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {emptyMessage}
              </p>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-sm hover:bg-accent cursor-pointer"
                  onClick={() => toggleOption(option.value)}
                >
                  <Checkbox
                    checked={selected.includes(option.value)}
                    onCheckedChange={() => toggleOption(option.value)}
                  />
                  {option.color && (
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <span className="text-sm truncate">{option.label}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        {selected.length > 0 && (
          <div className="p-2 border-t">
            <div className="flex flex-wrap gap-1">
              {selected.slice(0, 5).map((value) => {
                const option = options.find((o) => o.value === value);
                return (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="text-xs cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(value);
                    }}
                  >
                    {option?.label || value}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                );
              })}
              {selected.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{selected.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}


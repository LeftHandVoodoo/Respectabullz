import { Search, RotateCcw, Dog, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import type { Expense } from '@/types';

interface ExpensesFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  categoryOptions: MultiSelectOption[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  dogOptions: MultiSelectOption[];
  selectedDogs: string[];
  onDogsChange: (dogs: string[]) => void;
  excludedExpenseIds: Set<string>;
  filteredExpenses: Expense[];
  onIncludeAll: () => void;
  onResetFilters: () => void;
}

export function ExpensesFilters({
  search,
  onSearchChange,
  categoryOptions,
  selectedCategories,
  onCategoriesChange,
  dogOptions,
  selectedDogs,
  onDogsChange,
  excludedExpenseIds,
  filteredExpenses,
  onIncludeAll,
  onResetFilters,
}: ExpensesFiltersProps) {
  const hasActiveFilters = selectedCategories.length > 0 || selectedDogs.length > 0 || search.length > 0;
  const hasExclusions = excludedExpenseIds.size > 0 && filteredExpenses.some(e => excludedExpenseIds.has(e.id));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <MultiSelect
          options={categoryOptions}
          selected={selectedCategories}
          onChange={onCategoriesChange}
          placeholder="All Categories"
          className="w-[180px]"
          searchable={false}
        />
        
        {dogOptions.length > 0 && (
          <MultiSelect
            options={dogOptions}
            selected={selectedDogs}
            onChange={onDogsChange}
            placeholder="All Dogs"
            className="w-[180px]"
          />
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-10"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedCategories.map((cat) => {
            const option = categoryOptions.find(o => o.value === cat);
            return (
              <Badge
                key={cat}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => onCategoriesChange(selectedCategories.filter(c => c !== cat))}
              >
                {option?.label || cat}
                <span className="ml-1">×</span>
              </Badge>
            );
          })}
          {selectedDogs.map((dogId) => {
            const option = dogOptions.find(o => o.value === dogId);
            return (
              <Badge
                key={dogId}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => onDogsChange(selectedDogs.filter(d => d !== dogId))}
              >
                <Dog className="mr-1 h-3 w-3" />
                {option?.label || dogId}
                <span className="ml-1">×</span>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Exclusion controls */}
      {filteredExpenses.length > 0 && (
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Use checkboxes to include/exclude expenses from total
          </span>
          {hasExclusions && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onIncludeAll}
              className="h-7 text-xs"
            >
              <Eye className="mr-1 h-3 w-3" />
              Include All
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

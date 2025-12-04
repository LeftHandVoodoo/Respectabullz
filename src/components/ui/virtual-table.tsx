import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface VirtualTableColumn<T> {
  /** Unique key for the column */
  key: string;
  /** Column header content */
  header: React.ReactNode;
  /** Function to render cell content */
  cell: (item: T, index: number) => React.ReactNode;
  /** Column width (CSS value) */
  width?: string;
  /** Additional className for header */
  headerClassName?: string;
  /** Additional className for cells */
  cellClassName?: string;
  /** Whether column is sortable (adds button wrapper to header) */
  sortable?: boolean;
  /** Click handler for sortable header */
  onSort?: () => void;
}

export interface VirtualTableProps<T> {
  /** Array of data items to display */
  data: T[];
  /** Column definitions */
  columns: VirtualTableColumn<T>[];
  /** Estimated row height in pixels (default: 52) */
  rowHeight?: number;
  /** Maximum height of the table container (default: 600px) */
  maxHeight?: number;
  /** Function to get unique key for each row */
  getRowKey: (item: T, index: number) => string;
  /** Called when a row is clicked */
  onRowClick?: (item: T, index: number) => void;
  /** Additional className for rows */
  rowClassName?: string | ((item: T, index: number) => string);
  /** Empty state content */
  emptyState?: React.ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Loading skeleton component */
  loadingSkeleton?: React.ReactNode;
  /** Whether to enable virtual scrolling (default: true, auto-disabled for small lists) */
  enableVirtualization?: boolean;
  /** Threshold for auto-enabling virtualization (default: 50 items) */
  virtualizationThreshold?: number;
  /** Additional className for the table container */
  className?: string;
  /** Overscan - number of items to render outside visible area (default: 5) */
  overscan?: number;
}

/**
 * A virtualized table component that efficiently renders large datasets.
 * Uses @tanstack/react-virtual for windowed rendering.
 *
 * @example
 * ```tsx
 * <VirtualTable
 *   data={dogs}
 *   columns={[
 *     { key: 'name', header: 'Name', cell: (dog) => dog.name },
 *     { key: 'breed', header: 'Breed', cell: (dog) => dog.breed },
 *   ]}
 *   getRowKey={(dog) => dog.id}
 *   onRowClick={(dog) => navigate(`/dogs/${dog.id}`)}
 * />
 * ```
 */
export function VirtualTable<T>({
  data,
  columns,
  rowHeight = 52,
  maxHeight = 600,
  getRowKey,
  onRowClick,
  rowClassName,
  emptyState,
  isLoading,
  loadingSkeleton,
  enableVirtualization = true,
  virtualizationThreshold = 50,
  className,
  overscan = 5,
}: VirtualTableProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Auto-disable virtualization for small lists
  const shouldVirtualize =
    enableVirtualization && data.length >= virtualizationThreshold;

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
    enabled: shouldVirtualize,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  // Calculate padding for virtual scroll
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start ?? 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0)
      : 0;

  const getRowClassName = (item: T, index: number): string => {
    const base = 'cursor-pointer hover:bg-muted/50 transition-colors';
    const custom =
      typeof rowClassName === 'function'
        ? rowClassName(item, index)
        : rowClassName ?? '';
    return cn(base, custom);
  };

  // Render non-virtualized table for small datasets
  const renderStandardTable = () => (
    <div className={cn('rounded-lg border bg-card', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={col.headerClassName}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.sortable && col.onSort ? (
                  <button
                    onClick={col.onSort}
                    className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                  >
                    {col.header}
                  </button>
                ) : (
                  col.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            loadingSkeleton
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8">
                {emptyState ?? (
                  <p className="text-muted-foreground">No data found</p>
                )}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow
                key={getRowKey(item, index)}
                className={onRowClick ? getRowClassName(item, index) : undefined}
                onClick={() => onRowClick?.(item, index)}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.cellClassName}>
                    {col.cell(item, index)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  // Render virtualized table for large datasets
  const renderVirtualizedTable = () => (
    <div className={cn('rounded-lg border bg-card', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={col.headerClassName}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.sortable && col.onSort ? (
                  <button
                    onClick={col.onSort}
                    className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                  >
                    {col.header}
                  </button>
                ) : (
                  col.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      </Table>

      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        {isLoading ? (
          <Table>
            <TableBody>{loadingSkeleton}</TableBody>
          </Table>
        ) : data.length === 0 ? (
          <div className="text-center py-8">
            {emptyState ?? (
              <p className="text-muted-foreground">No data found</p>
            )}
          </div>
        ) : (
          <Table>
            <TableBody>
              {paddingTop > 0 && (
                <tr>
                  <td style={{ height: `${paddingTop}px` }} />
                </tr>
              )}
              {virtualRows.map((virtualRow) => {
                const item = data[virtualRow.index];
                const index = virtualRow.index;
                return (
                  <TableRow
                    key={getRowKey(item, index)}
                    className={onRowClick ? getRowClassName(item, index) : undefined}
                    onClick={() => onRowClick?.(item, index)}
                    style={{ height: `${rowHeight}px` }}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.key} className={col.cellClassName}>
                        {col.cell(item, index)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
              {paddingBottom > 0 && (
                <tr>
                  <td style={{ height: `${paddingBottom}px` }} />
                </tr>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );

  return shouldVirtualize ? renderVirtualizedTable() : renderStandardTable();
}

/**
 * Hook to create a simple column definition
 */
export function useVirtualTableColumns<T>(
  columns: VirtualTableColumn<T>[]
): VirtualTableColumn<T>[] {
  return React.useMemo(() => columns, [columns]);
}


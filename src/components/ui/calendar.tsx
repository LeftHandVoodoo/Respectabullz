import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<'div'> & {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  month?: Date;
  onMonthChange?: (date: Date) => void;
};

function Calendar({
  className,
  selected,
  onSelect,
  month: controlledMonth,
  onMonthChange,
  ...props
}: CalendarProps) {
  const [internalMonth, setInternalMonth] = React.useState(
    controlledMonth || selected || new Date()
  );
  const month = controlledMonth || internalMonth;

  const handleMonthChange = (newMonth: Date) => {
    setInternalMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    month.getFullYear(),
    month.getMonth(),
    1
  ).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isSelected = (day: number) => {
    if (!selected || !day) return false;
    return (
      selected.getDate() === day &&
      selected.getMonth() === month.getMonth() &&
      selected.getFullYear() === month.getFullYear()
    );
  };

  const isToday = (day: number) => {
    if (!day) return false;
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month.getMonth() &&
      today.getFullYear() === month.getFullYear()
    );
  };

  return (
    <div className={cn('p-3', className)} {...props}>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() =>
            handleMonthChange(
              new Date(month.getFullYear(), month.getMonth() - 1, 1)
            )
          }
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="font-medium">
          {month.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <button
          type="button"
          onClick={() =>
            handleMonthChange(
              new Date(month.getFullYear(), month.getMonth() + 1, 1)
            )
          }
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="w-8 h-8 flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <button
            key={index}
            type="button"
            disabled={!day}
            onClick={() => {
              if (day) {
                onSelect?.(
                  new Date(month.getFullYear(), month.getMonth(), day)
                );
              }
            }}
            className={cn(
              'h-8 w-8 rounded-md text-sm transition-colors',
              !day && 'invisible',
              day && 'hover:bg-accent hover:text-accent-foreground',
              isSelected(day!) &&
                'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
              isToday(day!) && !isSelected(day!) && 'bg-accent text-accent-foreground'
            )}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}

Calendar.displayName = 'Calendar';

export { Calendar };


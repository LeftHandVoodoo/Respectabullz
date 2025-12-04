import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { startOfDay, endOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, formatDate } from '@/lib/utils';
import type { HeatCycle, HeatPhase } from '@/types';

interface HeatCycleCalendarProps {
  heatCycles: HeatCycle[];
  isLoading?: boolean;
}

const phaseColors: Record<HeatPhase, { bg: string; border: string; text: string }> = {
  proestrus: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-500',
    text: 'text-red-700 dark:text-red-300',
  },
  estrus: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-500',
    text: 'text-green-700 dark:text-green-300',
  },
  diestrus: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
  },
  anestrus: {
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    border: 'border-gray-500',
    text: 'text-gray-700 dark:text-gray-300',
  },
};

const phaseLabels: Record<HeatPhase, string> = {
  proestrus: 'Proestrus',
  estrus: 'Estrus (Fertile)',
  diestrus: 'Diestrus',
  anestrus: 'Anestrus',
};

export function HeatCycleCalendar({ heatCycles, isLoading }: HeatCycleCalendarProps) {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get cycles that overlap with the current month
  const cyclesInMonth = useMemo(() => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    return heatCycles.filter((cycle) => {
      const start = new Date(cycle.startDate);
      const end = cycle.endDate ? new Date(cycle.endDate) : new Date();
      
      // Check if cycle overlaps with the month
      return start <= monthEnd && end >= monthStart;
    });
  }, [heatCycles, currentMonth]);

  // Get cycles for a specific date
  const getCyclesForDate = (date: Date): HeatCycle[] => {
    return cyclesInMonth.filter((cycle) => {
      const start = startOfDay(new Date(cycle.startDate));
      const end = cycle.endDate ? endOfDay(new Date(cycle.endDate)) : endOfDay(new Date());
      const checkDate = startOfDay(date);
      
      return checkDate >= start && checkDate <= end;
    });
  };

  // Get the primary phase for a date
  const getPhaseForDate = (cycle: HeatCycle, date: Date): HeatPhase | null => {
    const start = new Date(cycle.startDate);
    const daysSinceStart = Math.floor(
      (date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If cycle has explicit phase, use it for active cycles
    if (!cycle.endDate && cycle.currentPhase) {
      return cycle.currentPhase;
    }

    // Estimate phase based on days
    if (daysSinceStart < 0) return null;
    if (daysSinceStart < 9) return 'proestrus';
    if (daysSinceStart < 14) return 'estrus';
    if (daysSinceStart < 60) return 'diestrus';
    return 'anestrus';
  };

  // Check if date is in fertile window
  const isInFertileWindow = (cycle: HeatCycle, date: Date): boolean => {
    if (cycle.endDate) return false;
    
    if (cycle.optimalBreedingStart && cycle.optimalBreedingEnd) {
      return date >= new Date(cycle.optimalBreedingStart) && date <= new Date(cycle.optimalBreedingEnd);
    }
    
    // Estimate based on start date (days 9-14)
    const start = new Date(cycle.startDate);
    const daysSinceStart = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceStart >= 9 && daysSinceStart <= 14;
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  }, [currentMonth]);

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Loading calendar...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar View</CardTitle>
        <CardDescription>
          Visual timeline of heat cycles. Click on highlighted dates to view details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={cn('h-4 w-4 rounded border-2', phaseColors.proestrus.bg, phaseColors.proestrus.border)} />
            <span>Proestrus</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn('h-4 w-4 rounded border-2', phaseColors.estrus.bg, phaseColors.estrus.border)} />
            <span>Estrus (Fertile)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn('h-4 w-4 rounded border-2', phaseColors.diestrus.bg, phaseColors.diestrus.border)} />
            <span>Diestrus</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border-2 border-blue-600 bg-transparent" />
            <span>Bred</span>
          </div>
        </div>

        {/* Calendar */}
        <div className="border rounded-lg p-4">
          {/* Month header */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
              className="h-7 w-7"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-medium">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              className="h-7 w-7"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="w-10 h-8 flex items-center justify-center font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={index} className="h-10" />;
              }

              const cycles = getCyclesForDate(date);
              const today = isToday(date);
              
              if (cycles.length === 0) {
                return (
                  <button
                    key={index}
                    type="button"
                    className={cn(
                      'h-10 w-10 rounded-md text-sm transition-colors',
                      today && 'bg-accent text-accent-foreground font-semibold',
                      !today && 'hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              }

              // Get the first cycle for styling (or prioritize active cycles)
              const activeCycle = cycles.find(c => !c.endDate) || cycles[0];
              const phase = getPhaseForDate(activeCycle, date);
              const isFertile = cycles.some(c => isInFertileWindow(c, date));
              const isBred = cycles.some(c => c.isBred);
              
              const phaseColor = phase ? phaseColors[phase] : phaseColors.anestrus;
              
              // Determine styling
              let dayClasses = 'relative h-10 w-10 rounded-md text-sm transition-colors border-2 ';
              
              if (isFertile) {
                dayClasses += `${phaseColors.estrus.bg} ${phaseColors.estrus.border} ${phaseColors.estrus.text} font-semibold`;
              } else if (phase) {
                dayClasses += `${phaseColor.bg} ${phaseColor.border} ${phaseColor.text}`;
              } else {
                dayClasses += 'bg-muted border-muted-foreground/20';
              }

              if (today) {
                dayClasses += ' ring-2 ring-offset-2 ring-primary';
              }

              const tooltipContent = (
                <div className="space-y-1">
                  <div className="font-semibold">{formatDate(date)}</div>
                  {cycles.map((cycle) => {
                    const cyclePhase = getPhaseForDate(cycle, date);
                    const cycleFertile = isInFertileWindow(cycle, date);
                    return (
                      <div key={cycle.id} className="text-xs">
                        <div className="font-medium">{cycle.bitch?.name || 'Unknown'}</div>
                        {cyclePhase && (
                          <div className={phaseColors[cyclePhase].text}>
                            {phaseLabels[cyclePhase]}
                          </div>
                        )}
                        {cycleFertile && (
                          <div className="text-green-600 font-semibold">Fertile Window</div>
                        )}
                        {cycle.isBred && <div className="text-blue-600">Bred</div>}
                      </div>
                    );
                  })}
                </div>
              );

              return (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          if (activeCycle) {
                            navigate(`/heat-cycles/${activeCycle.id}`);
                          }
                        }}
                        className={cn(dayClasses, 'hover:opacity-80 cursor-pointer')}
                      >
                        {date.getDate()}
                        {cycles.length > 1 && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] flex items-center justify-center text-primary-foreground font-semibold">
                            {cycles.length}
                          </span>
                        )}
                        {isBred && (
                          <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-b-md" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      {tooltipContent}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>

        {/* Active cycles summary */}
        {cyclesInMonth.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Cycles in this month:</h4>
            <div className="flex flex-wrap gap-2">
              {cyclesInMonth.map((cycle) => (
                <Badge
                  key={cycle.id}
                  variant={cycle.endDate ? 'secondary' : 'default'}
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => navigate(`/heat-cycles/${cycle.id}`)}
                >
                  {cycle.bitch?.name || 'Unknown'}
                  {cycle.currentPhase && ` - ${phaseLabels[cycle.currentPhase]}`}
                  {cycle.isBred && ' (Bred)'}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {cyclesInMonth.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No heat cycles in this month
          </p>
        )}
      </CardContent>
    </Card>
  );
}

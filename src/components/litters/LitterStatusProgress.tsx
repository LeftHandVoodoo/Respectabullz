import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LitterStatus } from '@/types';

interface StatusStep {
  value: LitterStatus;
  label: string;
  shortLabel: string;
}

const statusSteps: StatusStep[] = [
  { value: 'planned', label: 'Planned', shortLabel: 'Plan' },
  { value: 'bred', label: 'Bred', shortLabel: 'Bred' },
  { value: 'ultrasound_confirmed', label: 'Ultrasound', shortLabel: 'US' },
  { value: 'xray_confirmed', label: 'X-Ray', shortLabel: 'XR' },
  { value: 'whelped', label: 'Whelped', shortLabel: 'Whelp' },
  { value: 'weaning', label: 'Weaning', shortLabel: 'Wean' },
  { value: 'ready_to_go', label: 'Ready', shortLabel: 'Ready' },
  { value: 'completed', label: 'Completed', shortLabel: 'Done' },
];

interface LitterStatusProgressProps {
  status: LitterStatus | null | undefined;
  className?: string;
}

export function LitterStatusProgress({ status, className }: LitterStatusProgressProps) {
  const currentIndex = status 
    ? statusSteps.findIndex(s => s.value === status) 
    : 0;

  return (
    <div className={cn('w-full', className)}>
      <div className="relative flex justify-between">
        {/* Progress line background */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted" />
        
        {/* Active progress line */}
        <div 
          className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-300"
          style={{ 
            width: currentIndex >= 0 
              ? `${(currentIndex / (statusSteps.length - 1)) * 100}%` 
              : '0%' 
          }}
        />

        {/* Status steps */}
        {statusSteps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div 
              key={step.value} 
              className="relative flex flex-col items-center z-10"
            >
              {/* Circle */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                  isCompleted && 'bg-primary border-primary text-primary-foreground',
                  isCurrent && 'bg-primary border-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2',
                  isFuture && 'bg-background border-muted-foreground/30 text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>

              {/* Label */}
              <span 
                className={cn(
                  'mt-2 text-xs text-center max-w-[60px]',
                  (isCompleted || isCurrent) ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.shortLabel}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button';
}

function Skeleton({
  className,
  variant = 'default',
  ...props
}: SkeletonProps) {
  const baseClasses = 'animate-shimmer shimmer-bg rounded-md';
  
  const variantClasses = {
    default: '',
    card: 'h-32 w-full',
    text: 'h-4 w-full',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-10 w-24',
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      {...props}
    />
  );
}

// Skeleton card for stat cards on dashboard
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-6 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="h-4 w-24" />
        <Skeleton variant="avatar" className="h-4 w-4 rounded" />
      </div>
      <Skeleton variant="text" className="h-8 w-16" />
      <Skeleton variant="text" className="h-3 w-20" />
    </div>
  );
}

// Skeleton table row
function SkeletonTableRow({ columns = 6 }: { columns?: number }) {
  return (
    <tr className="border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton variant="text" className={i === 0 ? 'h-4 w-32' : 'h-4 w-20'} />
        </td>
      ))}
    </tr>
  );
}

// Animated spinner
function Spinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <svg
      className={cn('animate-spin text-primary', sizeClasses[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Loading overlay with spinner
function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 animate-fade-in">
      <Spinner size="lg" />
      <p className="text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonTableRow, Spinner, LoadingOverlay };


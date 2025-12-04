import * as React from 'react';
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
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Description/message explaining what will happen */
  description: string;
  /** Label for the confirm button (default: "Confirm") */
  confirmLabel?: string;
  /** Label for the cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Called when the user confirms */
  onConfirm: () => void | Promise<void>;
  /** Whether the confirm action is loading */
  isLoading?: boolean;
  /** Variant for the confirm button */
  variant?: 'default' | 'destructive';
  /** Additional content to show between description and buttons */
  children?: React.ReactNode;
}

/**
 * A simple confirmation dialog for yes/no decisions.
 * Useful for delete confirmations, dangerous actions, etc.
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={showDeleteConfirm}
 *   onOpenChange={setShowDeleteConfirm}
 *   title="Delete Dog?"
 *   description="This action cannot be undone."
 *   confirmLabel="Delete"
 *   variant="destructive"
 *   onConfirm={handleDelete}
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  isLoading = false,
  variant = 'default',
  children,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const loading = isLoading || internalLoading;

  const handleConfirm = async () => {
    const result = onConfirm();
    if (result instanceof Promise) {
      setInternalLoading(true);
      try {
        await result;
        onOpenChange(false);
      } finally {
        setInternalLoading(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children && <div className="py-2">{children}</div>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={loading}
            className={cn(
              variant === 'destructive' &&
                'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            )}
          >
            {loading ? 'Loading...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export interface ConfirmDialogTriggerProps {
  /** Trigger element (e.g., a Button) */
  trigger: React.ReactNode;
  /** Dialog title */
  title: string;
  /** Description/message explaining what will happen */
  description: string;
  /** Label for the confirm button (default: "Confirm") */
  confirmLabel?: string;
  /** Called when the user confirms */
  onConfirm: () => void | Promise<void>;
  /** Variant for the confirm button */
  variant?: 'default' | 'destructive';
}

/**
 * A convenience wrapper that includes a trigger element.
 * Useful when you want a button that opens the confirm dialog.
 *
 * @example
 * ```tsx
 * <ConfirmDialogTrigger
 *   trigger={<Button variant="destructive">Delete</Button>}
 *   title="Delete Dog?"
 *   description="This action cannot be undone."
 *   confirmLabel="Delete"
 *   variant="destructive"
 *   onConfirm={handleDelete}
 * />
 * ```
 */
export function ConfirmDialogTrigger({
  trigger,
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  variant = 'default',
}: ConfirmDialogTriggerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        variant={variant}
        onConfirm={onConfirm}
      />
    </>
  );
}


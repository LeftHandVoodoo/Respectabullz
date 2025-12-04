import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FormDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Optional description below the title */
  description?: string;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
  /** Label for the submit button (default: "Save") */
  submitLabel?: string;
  /** Label for the cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Called when form is submitted - wrap your form's handleSubmit */
  onSubmit?: (e: React.FormEvent) => void;
  /** Dialog content (form fields) */
  children: React.ReactNode;
  /** Additional className for DialogContent */
  className?: string;
  /** Size preset for the dialog */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Whether to show the footer (default: true) */
  showFooter?: boolean;
  /** Custom footer content (overrides default buttons) */
  footer?: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

/**
 * A reusable form dialog component that standardizes the dialog structure
 * across the application. Handles common patterns like header, footer,
 * submit/cancel buttons, and loading states.
 *
 * @example
 * ```tsx
 * <FormDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Add New Dog"
 *   isSubmitting={isSubmitting}
 *   onSubmit={handleSubmit(onSubmit)}
 * >
 *   <div className="space-y-4">
 *     <Input {...register('name')} />
 *   </div>
 * </FormDialog>
 * ```
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  isSubmitting = false,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  onSubmit,
  children,
  className,
  size = 'lg',
  showFooter = true,
  footer,
}: FormDialogProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          sizeClasses[size],
          'max-h-[90vh] overflow-y-auto',
          className
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {onSubmit ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {children}
            {showFooter && (
              <DialogFooter>
                {footer ?? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isSubmitting}
                    >
                      {cancelLabel}
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : submitLabel}
                    </Button>
                  </>
                )}
              </DialogFooter>
            )}
          </form>
        ) : (
          <>
            <div className="space-y-4">{children}</div>
            {showFooter && (
              <DialogFooter>
                {footer ?? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    {cancelLabel}
                  </Button>
                )}
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export interface FormDialogFieldProps {
  /** Field label */
  label: string;
  /** Whether the field is required */
  required?: boolean;
  /** Error message to display */
  error?: string;
  /** Field content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * A helper component for form fields within FormDialog.
 * Handles label, required indicator, and error display.
 */
export function FormDialogField({
  label,
  required,
  error,
  children,
  className,
}: FormDialogFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}


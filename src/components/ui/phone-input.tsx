import * as React from 'react';
import { Input, InputProps } from '@/components/ui/input';
import { formatPhoneNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface PhoneInputProps extends Omit<InputProps, 'type'> {
  defaultCountry?: string;
}

/**
 * PhoneInput component that automatically formats phone numbers as (xxx) xxx-xxxx
 * Defaults to United States format
 * Compatible with react-hook-form's register() pattern
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, onChange, onBlur, name, defaultCountry: _defaultCountry = 'United States', ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    
    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const cursorPosition = input.selectionStart || 0;
      const oldValue = input.value;
      const formatted = formatPhoneNumber(input.value);
      
      // Calculate new cursor position after formatting
      let newCursorPosition = cursorPosition;
      if (formatted.length > oldValue.length) {
        // If characters were added by formatting, move cursor forward
        newCursorPosition = cursorPosition + (formatted.length - oldValue.length);
      }
      
      // Update the input value directly
      if (inputRef.current) {
        inputRef.current.value = formatted;
        // Restore cursor position
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
      
      // Create synthetic event with formatted value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: formatted,
          name: name || e.target.name,
        },
      } as React.ChangeEvent<HTMLInputElement>;
      
      // Call parent onChange
      onChange?.(syntheticEvent);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Format on blur as well
      if (inputRef.current) {
        const formatted = formatPhoneNumber(inputRef.current.value);
        inputRef.current.value = formatted;
      }
      onBlur?.(e);
    };

    return (
      <Input
        ref={inputRef}
        type="tel"
        name={name}
        className={cn(className)}
        defaultValue={value ? formatPhoneNumber(String(value)) : ''}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="(555) 123-4567"
        maxLength={14}
        {...props}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';


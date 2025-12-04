// Component tests for Button
// Tests the UI component behavior and styling

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from './test-utils';
import { Button } from '../ui/button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not trigger click when disabled', async () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies variant styles', () => {
    const { rerender } = render(<Button variant="default">Default</Button>);
    const defaultButton = screen.getByRole('button');
    expect(defaultButton).toHaveClass('bg-primary');

    rerender(<Button variant="destructive">Destructive</Button>);
    const destructiveButton = screen.getByRole('button');
    expect(destructiveButton).toHaveClass('bg-destructive');

    rerender(<Button variant="outline">Outline</Button>);
    const outlineButton = screen.getByRole('button');
    expect(outlineButton).toHaveClass('border');

    rerender(<Button variant="ghost">Ghost</Button>);
    const ghostButton = screen.getByRole('button');
    expect(ghostButton).toHaveClass('hover:bg-accent');
  });

  it('applies size styles', () => {
    const { rerender } = render(<Button size="default">Default</Button>);
    const defaultButton = screen.getByRole('button');
    expect(defaultButton).toHaveClass('h-10');

    rerender(<Button size="sm">Small</Button>);
    const smallButton = screen.getByRole('button');
    expect(smallButton).toHaveClass('h-9');

    rerender(<Button size="lg">Large</Button>);
    const largeButton = screen.getByRole('button');
    expect(largeButton).toHaveClass('h-11');
  });

  it('renders as a link when asChild is used', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    
    const link = screen.getByRole('link', { name: 'Link Button' });
    expect(link).toHaveAttribute('href', '/test');
  });

  it('supports custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('renders with icon', () => {
    render(
      <Button>
        <span data-testid="icon">🔥</span>
        With Icon
      </Button>
    );
    
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('With Icon');
  });
});


// Component tests for Card
// Tests the card layout component

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from './test-utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../ui/card';

describe('Card Component', () => {
  it('renders a basic card', () => {
    render(
      <Card>
        <CardContent>Card content</CardContent>
      </Card>
    );
    
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders card with all sections', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description text</CardDescription>
        </CardHeader>
        <CardContent>Main content goes here</CardContent>
        <CardFooter>Footer actions</CardFooter>
      </Card>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card description text')).toBeInTheDocument();
    expect(screen.getByText('Main content goes here')).toBeInTheDocument();
    expect(screen.getByText('Footer actions')).toBeInTheDocument();
  });

  it('applies custom className to Card', () => {
    render(
      <Card className="custom-card-class" data-testid="card">
        <CardContent>Content</CardContent>
      </Card>
    );
    
    expect(screen.getByTestId('card')).toHaveClass('custom-card-class');
  });

  it('applies custom className to CardHeader', () => {
    render(
      <Card>
        <CardHeader className="custom-header" data-testid="header">
          <CardTitle>Title</CardTitle>
        </CardHeader>
      </Card>
    );
    
    expect(screen.getByTestId('header')).toHaveClass('custom-header');
  });

  it('applies custom className to CardContent', () => {
    render(
      <Card>
        <CardContent className="custom-content" data-testid="content">
          Content
        </CardContent>
      </Card>
    );
    
    expect(screen.getByTestId('content')).toHaveClass('custom-content');
  });

  it('applies custom className to CardFooter', () => {
    render(
      <Card>
        <CardFooter className="custom-footer" data-testid="footer">
          Footer
        </CardFooter>
      </Card>
    );
    
    expect(screen.getByTestId('footer')).toHaveClass('custom-footer');
  });

  it('renders CardTitle as heading', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>My Title</CardTitle>
        </CardHeader>
      </Card>
    );
    
    // CardTitle renders as h3 by default
    expect(screen.getByText('My Title').tagName).toBe('H3');
  });

  it('renders nested content correctly', () => {
    render(
      <Card>
        <CardContent>
          <div data-testid="nested">
            <p>Nested paragraph</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
    
    expect(screen.getByTestId('nested')).toBeInTheDocument();
    expect(screen.getByText('Nested paragraph')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });
});


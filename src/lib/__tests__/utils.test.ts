// Unit tests for utility functions
import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatCurrency, formatWeight, calculateAge, generateLitterCode } from '../utils';

describe('cn (class name utility)', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const includeClass = true;
    const excludeClass = false;
    expect(cn('base', includeClass && 'included', excludeClass && 'excluded')).toBe('base included');
  });

  it('handles tailwind class conflicts', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('handles arrays', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });
});

describe('formatDate', () => {
  it('formats a Date object correctly', () => {
    // Use a date that won't be affected by timezone (midnight local time)
    const date = new Date(2024, 2, 15); // March 15, 2024 (month is 0-indexed)
    expect(formatDate(date)).toMatch(/Mar 15, 2024/);
  });

  it('formats a date string correctly', () => {
    // Use ISO string with time to avoid timezone issues
    expect(formatDate('2024-03-15T12:00:00.000Z')).toMatch(/Mar 15, 2024/);
  });

  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatDate('invalid-date')).toBe('');
  });
});

describe('formatCurrency', () => {
  it('formats whole numbers correctly', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00');
  });

  it('formats decimals correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats negative numbers correctly', () => {
    expect(formatCurrency(-500)).toBe('-$500.00');
  });

  it('formats small decimals correctly', () => {
    expect(formatCurrency(0.99)).toBe('$0.99');
  });
});

describe('formatWeight', () => {
  it('formats weight in pounds by default', () => {
    expect(formatWeight(10)).toBe('10.0 lbs');
  });

  it('formats weight with decimals in pounds', () => {
    expect(formatWeight(10.5)).toBe('10.5 lbs');
  });

  it('converts and formats weight in kilograms', () => {
    expect(formatWeight(10, 'kg')).toBe('4.5 kg');
  });

  it('handles zero weight', () => {
    expect(formatWeight(0)).toBe('0.0 lbs');
  });
});

describe('calculateAge', () => {
  it('returns days for very young puppies', () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    expect(calculateAge(tenDaysAgo)).toBe('10 days');
  });

  it('returns singular day correctly', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(calculateAge(yesterday)).toBe('1 day');
  });

  it('returns months for puppies under a year', () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    expect(calculateAge(sixMonthsAgo)).toBe('6 months');
  });

  it('returns singular month correctly', () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    expect(calculateAge(oneMonthAgo)).toBe('1 month');
  });

  it('returns years for older dogs', () => {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    expect(calculateAge(threeYearsAgo)).toBe('3 years');
  });

  it('returns years and months for exact ages', () => {
    const twoYearsSixMonths = new Date();
    twoYearsSixMonths.setFullYear(twoYearsSixMonths.getFullYear() - 2);
    twoYearsSixMonths.setMonth(twoYearsSixMonths.getMonth() - 6);
    expect(calculateAge(twoYearsSixMonths)).toBe('2y 6m');
  });

  it('handles date strings', () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    expect(calculateAge(oneYearAgo.toISOString())).toBe('1 year');
  });

  it('returns "Invalid date" for invalid input', () => {
    expect(calculateAge('invalid')).toBe('Invalid date');
  });

  it('handles 0 days for future dates', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(calculateAge(tomorrow)).toBe('0 days');
  });
});

describe('generateLitterCode', () => {
  it('generates code with correct year and month format', () => {
    const date = new Date('2024-03-15');
    const code = generateLitterCode(date);
    expect(code).toMatch(/^2024-03-[A-Z0-9]{3}$/);
  });

  it('pads single-digit months with zero', () => {
    const date = new Date('2024-01-15');
    const code = generateLitterCode(date);
    expect(code).toMatch(/^2024-01-/);
  });

  it('generates unique codes', () => {
    const date = new Date('2024-03-15');
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateLitterCode(date));
    }
    // With random 3-char suffix, should have many unique codes
    expect(codes.size).toBeGreaterThan(50);
  });
});


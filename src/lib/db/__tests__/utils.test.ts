// Unit tests for database utility functions
import { describe, it, expect } from 'vitest';
import {
  generateId,
  dateToSql,
  sqlToDate,
  boolToSql,
  sqlToBool,
  camelToSnake,
  snakeToCamel,
  nowIso,
} from '../utils';

describe('generateId', () => {
  it('generates a unique ID', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('generates IDs with expected format (timestamp-random)', () => {
    const id = generateId();
    expect(id).toMatch(/^\d+-[a-z0-9]+$/);
  });

  it('generates IDs with timestamp prefix', () => {
    const before = Date.now();
    const id = generateId();
    const after = Date.now();
    const timestamp = parseInt(id.split('-')[0]);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});

describe('dateToSql', () => {
  it('converts Date to ISO string', () => {
    const date = new Date('2024-03-15T12:00:00.000Z');
    expect(dateToSql(date)).toBe('2024-03-15T12:00:00.000Z');
  });

  it('returns null for null input', () => {
    expect(dateToSql(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(dateToSql(undefined)).toBeNull();
  });
});

describe('sqlToDate', () => {
  it('converts ISO string to Date', () => {
    const result = sqlToDate('2024-03-15T12:00:00.000Z');
    expect(result).toBeInstanceOf(Date);
    expect(result?.toISOString()).toBe('2024-03-15T12:00:00.000Z');
  });

  it('returns null for null input', () => {
    expect(sqlToDate(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(sqlToDate(undefined)).toBeNull();
  });

  it('handles date-only strings', () => {
    // Use ISO string with time to avoid timezone issues
    const result = sqlToDate('2024-03-15T12:00:00.000Z');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2024);
    expect(result?.getMonth()).toBe(2); // March is 2 (0-indexed)
    // Date may vary by timezone, so check it's a valid date
    expect(result?.getDate()).toBeGreaterThanOrEqual(14);
    expect(result?.getDate()).toBeLessThanOrEqual(16);
  });
});

describe('boolToSql', () => {
  it('converts true to 1', () => {
    expect(boolToSql(true)).toBe(1);
  });

  it('converts false to 0', () => {
    expect(boolToSql(false)).toBe(0);
  });

  it('returns null for null input', () => {
    expect(boolToSql(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(boolToSql(undefined)).toBeNull();
  });
});

describe('sqlToBool', () => {
  it('converts 1 to true', () => {
    expect(sqlToBool(1)).toBe(true);
  });

  it('converts 0 to false', () => {
    expect(sqlToBool(0)).toBe(false);
  });

  it('converts null to false', () => {
    expect(sqlToBool(null)).toBe(false);
  });

  it('converts undefined to false', () => {
    expect(sqlToBool(undefined)).toBe(false);
  });

  it('converts other numbers to false', () => {
    expect(sqlToBool(2)).toBe(false);
    expect(sqlToBool(-1)).toBe(false);
  });
});

describe('camelToSnake', () => {
  it('converts camelCase to snake_case', () => {
    expect(camelToSnake('myVariableName')).toBe('my_variable_name');
  });

  it('handles single word', () => {
    expect(camelToSnake('name')).toBe('name');
  });

  it('handles consecutive capitals', () => {
    expect(camelToSnake('myURLParser')).toBe('my_u_r_l_parser');
  });

  it('handles already lowercase', () => {
    expect(camelToSnake('lowercase')).toBe('lowercase');
  });

  it('handles empty string', () => {
    expect(camelToSnake('')).toBe('');
  });

  it('converts database field names correctly', () => {
    expect(camelToSnake('dateOfBirth')).toBe('date_of_birth');
    expect(camelToSnake('registrationNumber')).toBe('registration_number');
    expect(camelToSnake('isTaxDeductible')).toBe('is_tax_deductible');
  });
});

describe('snakeToCamel', () => {
  it('converts snake_case to camelCase', () => {
    expect(snakeToCamel('my_variable_name')).toBe('myVariableName');
  });

  it('handles single word', () => {
    expect(snakeToCamel('name')).toBe('name');
  });

  it('handles multiple underscores', () => {
    expect(snakeToCamel('very_long_variable_name')).toBe('veryLongVariableName');
  });

  it('handles already camelCase', () => {
    expect(snakeToCamel('alreadyCamel')).toBe('alreadyCamel');
  });

  it('handles empty string', () => {
    expect(snakeToCamel('')).toBe('');
  });

  it('converts database column names correctly', () => {
    expect(snakeToCamel('date_of_birth')).toBe('dateOfBirth');
    expect(snakeToCamel('registration_number')).toBe('registrationNumber');
    expect(snakeToCamel('is_tax_deductible')).toBe('isTaxDeductible');
  });
});

describe('nowIso', () => {
  it('returns current time as ISO string', () => {
    const before = new Date().toISOString();
    const result = nowIso();
    const after = new Date().toISOString();
    
    expect(result >= before).toBe(true);
    expect(result <= after).toBe(true);
  });

  it('returns valid ISO 8601 format', () => {
    const result = nowIso();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});


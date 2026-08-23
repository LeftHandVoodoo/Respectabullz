import { describe, expect, it } from 'vitest';
import {
  neutralizeSpreadsheetFormula,
  serializeCsv,
  serializeCsvField,
  serializeCsvRow,
} from '../csvUtils';

describe('CSV serialization', () => {
  it('quotes fields, doubles embedded quotes, and uses RFC 4180 line endings', () => {
    expect(serializeCsv([
      ['Name', 'Notes'],
      ['Ada, Jr.', 'Line one\n"Line two"'],
    ])).toBe('"Name","Notes"\r\n"Ada, Jr.","Line one\n""Line two"""');
  });

  it.each([
    '=2+2',
    '+SUM(A1:A2)',
    '-1+1',
    '@SUM(A1:A2)',
    '  =HYPERLINK("x")',
    '\tSUM(A1:A2)',
    '\rFORMULA',
  ])(
    'neutralizes dangerous spreadsheet string %s',
    (value) => {
      expect(neutralizeSpreadsheetFormula(value)).toBe(`'${value}`);
      expect(serializeCsvField(value)).toContain("'");
    }
  );

  it('preserves ordinary text and typed numeric values', () => {
    expect(serializeCsvRow(['ordinary', -42, 3.5, false, null])).toBe(
      '"ordinary","-42","3.5","false",""'
    );
  });
});

export type CsvValue = string | number | boolean | Date | null | undefined;

const DANGEROUS_SPREADSHEET_PREFIX = /^(?:[\t\r\n]|[ ]*[=+\-@])/;

/**
 * Neutralize values that spreadsheet applications may interpret as formulas.
 * Numeric values stay numeric; only user-controlled strings receive a leading
 * apostrophe, which Excel-compatible applications treat as an explicit text marker.
 */
export function neutralizeSpreadsheetFormula(value: string): string {
  return DANGEROUS_SPREADSHEET_PREFIX.test(value) ? `'${value}` : value;
}

function csvText(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return neutralizeSpreadsheetFormula(value);
  return String(value);
}

/** Serialize one RFC 4180 field, always quoted for predictable interoperability. */
export function serializeCsvField(value: CsvValue): string {
  return `"${csvText(value).replace(/"/g, '""')}"`;
}

/** Serialize one RFC 4180 record. */
export function serializeCsvRow(values: readonly CsvValue[]): string {
  return values.map(serializeCsvField).join(',');
}

/** Serialize RFC 4180 records using the required CRLF line ending. */
export function serializeCsv(rows: readonly (readonly CsvValue[])[]): string {
  return rows.map(serializeCsvRow).join('\r\n');
}

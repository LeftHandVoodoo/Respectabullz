// @vitest-environment node

import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';

describe('ExcelJS dependency override', () => {
  it('serializes and reloads a workbook path that generates a UUID', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Audit');
    worksheet.addRows([
      ['Metric', 'Value'],
      ['Dogs', 6],
      ['Litters', 2],
    ]);
    worksheet.addConditionalFormatting({
      ref: 'B2:B3',
      rules: [
        {
          type: 'dataBar',
          cfvo: [{ type: 'min' }, { type: 'max' }],
          color: 'FF638EC6',
        },
      ],
    });

    const bytes = await workbook.xlsx.writeBuffer();
    const roundTrip = new ExcelJS.Workbook();
    await roundTrip.xlsx.load(bytes);

    expect(bytes.byteLength).toBeGreaterThan(1_000);
    expect(roundTrip.getWorksheet('Audit')?.getCell('B2').value).toBe(6);
  });
});

import * as XLSX from 'xlsx';
import { normalizeHeader, trimCell } from '@/lib/import/normalizers';

export type WorkbookRows = Record<string, Array<Record<string, unknown>>>;

export function parseWorkbookFromBuffer(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheets: WorkbookRows = {};

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Array<unknown>>(worksheet, {
      header: 1,
      blankrows: false,
      defval: ''
    });

    if (!rows.length) {
      sheets[sheetName] = [];
      return;
    }

    const [headerRow, ...bodyRows] = rows;
    const headers = headerRow.map((cell) => normalizeHeader(cell));

    sheets[sheetName] = bodyRows
      .filter((row) => row.some((cell) => trimCell(cell) !== ''))
      .map((row) => {
        const record: Record<string, unknown> = {};
        headers.forEach((header, index) => {
          record[header] = row[index] ?? '';
        });
        return record;
      });
  });

  return sheets;
}

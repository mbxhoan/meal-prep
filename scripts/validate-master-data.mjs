import fs from 'node:fs';
import * as XLSX from 'xlsx';

function normalizeHeader(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
}

function trimCell(value) {
  return String(value ?? '').trim();
}

function parseWorkbook(filePath) {
  const workbook = XLSX.readFile(filePath);
  const output = {};

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      blankrows: false,
      defval: ''
    });

    if (!rows.length) {
      output[sheetName] = [];
      return;
    }

    const [headerRow, ...bodyRows] = rows;
    const headers = headerRow.map(normalizeHeader);

    output[sheetName] = bodyRows
      .filter((row) => row.some((cell) => trimCell(cell) !== ''))
      .map((row) => {
        const record = {};
        headers.forEach((header, index) => {
          record[header] = row[index] ?? '';
        });
        return record;
      });
  });

  return output;
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: npm run validate:master -- /absolute/path/to/file.xlsx');
  process.exit(1);
}
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const workbookRows = parseWorkbook(filePath);
console.log(JSON.stringify({
  ok: true,
  sheets: Object.keys(workbookRows),
  counts: Object.fromEntries(
    Object.entries(workbookRows).map(([sheet, rows]) => [sheet, rows.length])
  )
}, null, 2));

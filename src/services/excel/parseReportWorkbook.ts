import ExcelJS from 'exceljs';
import type { ResultRow } from '../../types/trpDashboard';
import { extractWorkbookImageMap } from './extractWorkbookImageMap';

function getCellPrimitive(value: unknown): unknown {
  if (
    value
    && typeof value === 'object'
    && 'result' in value
  ) {
    return (value as { result?: unknown }).result ?? '';
  }

  if (
    value
    && typeof value === 'object'
    && 'text' in value
  ) {
    return (value as { text?: unknown }).text ?? '';
  }

  return value;
}

function formatFrequency(value: unknown): string {
  const primitiveValue = getCellPrimitive(value);

  if (typeof primitiveValue === 'number') {
    const formattedValue = Number.isInteger(primitiveValue)
      ? String(primitiveValue)
      : primitiveValue.toFixed(3).replace(/\.?0+$/, '');

    return `${formattedValue} MHz`;
  }

  const normalized = String(primitiveValue ?? '').trim();
  if (normalized.length === 0) {
    return '';
  }

  return normalized.toLowerCase().includes('mhz') ? normalized : `${normalized} MHz`;
}

function formatMetric(value: unknown): string {
  const primitiveValue = getCellPrimitive(value);

  if (typeof primitiveValue === 'number') {
    return primitiveValue.toFixed(2);
  }

  return String(primitiveValue ?? '').trim();
}

// ZIP/Office Open XML magic bytes: PK\x03\x04
const XLSX_MAGIC = [0x50, 0x4b, 0x03, 0x04];

async function hasXlsxMagicBytes(file: File): Promise<boolean> {
  const slice = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(slice);
  return XLSX_MAGIC.every((byte, index) => bytes[index] === byte);
}

export async function parseReportWorkbook(file: File): Promise<ResultRow[]> {
  const lowerName = file.name.toLowerCase();

  if (!lowerName.endsWith('.xlsx') && !lowerName.endsWith('.xlsm')) {
    throw new Error('Only .xlsx and .xlsm files are supported right now.');
  }

  const buffer = await file.arrayBuffer();

  if (!(await hasXlsxMagicBytes(file))) {
    throw new Error('File does not appear to be a valid Excel workbook.');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const imageMap = await extractWorkbookImageMap(buffer, workbook.worksheets);

  const rows: ResultRow[] = [];

  workbook.worksheets.forEach((worksheet) => {
    const unitType = worksheet.name.trim();
    let currentUnitId = '';

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber < 3) {
        return;
      }

      const unitId = String(getCellPrimitive(row.getCell(1).value) ?? '').trim();
      const frequency = getCellPrimitive(row.getCell(2).value);
      const trp = getCellPrimitive(row.getCell(3).value);
      const peak = getCellPrimitive(row.getCell(4).value);

      if (unitId) {
        currentUnitId = unitId;
      }

      const hasData =
        currentUnitId
        && frequency !== null
        && frequency !== undefined
        && trp !== null
        && trp !== undefined
        && peak !== null
        && peak !== undefined;

      if (!hasData) {
        return;
      }

      rows.push({
        rowKey: `${worksheet.id}:${rowNumber}`,
        unitType,
        unit: currentUnitId,
        frequency: formatFrequency(frequency),
        trp: formatMetric(trp),
        peak: formatMetric(peak),
        graphImageSrc: imageMap.get(`${worksheet.id}:${rowNumber}`) ?? null,
      });
    });
  });

  if (rows.length === 0) {
    throw new Error('No report rows were found in the workbook.');
  }

  return rows;
}

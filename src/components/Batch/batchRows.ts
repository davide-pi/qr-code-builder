import type { ErrorCorrectionLevel } from 'qr-code-styling';
import { evaluateTemplate, getTemplate, type ErrorKey } from '../../templates';
import type { QRTemplateData, QRTemplateType } from '../../types/qr';
import { getCapacity } from '../QRPreview/qrChecks';
import { toCsvLine, type CsvDelimiter } from './csv';

// Hard limits that keep a batch responsive and the zip in memory
export const MAX_BATCH_ROWS = 500;
export const MAX_BATCH_FILE_BYTES = 2 * 1024 * 1024;

// Optional column naming the output file (without extension)
export const FILENAME_COLUMN = 'filename';

// Problems found by the batch itself, on top of the template's own validation
export type BatchIssueKey = 'invalidBoolean' | 'invalidChoice' | 'invalidDate' | 'contentTooLong';

export interface BatchIssue {
  // Column the issue belongs to ('' when it concerns the whole row)
  field: string;
  key: ErrorKey | BatchIssueKey;
}

export interface BatchRow {
  // 1-based position among the data rows (header excluded)
  index: number;
  // Output file name without extension; unique among the valid rows
  fileName: string;
  // Short human-readable summary of the row for the preview table
  summary: string;
  // Text to encode; '' when the row has issues
  payload: string;
  issues: BatchIssue[];
}

export type BatchTableError = 'noRows' | 'noKnownColumns' | 'tooManyRows';

export interface BatchTable {
  rows: BatchRow[];
  // Header cells that match no field of the template (they are ignored)
  ignoredColumns: string[];
  error?: BatchTableError;
}

type Cell = string | boolean;

// Text fields whose value must be one of a closed set (matched case-insensitively)
const CHOICE_FIELDS: Partial<Record<QRTemplateType, Record<string, readonly string[]>>> = {
  wifi: { encryption: ['WPA', 'WEP', 'nopass'] },
};

// Fields where an empty cell means "empty", not "the template default" (the calendar defaults
// are the current time, which would silently put wrong dates in a batch)
const BLANK_FIELDS: ReadonlySet<string> = new Set(['startDate', 'endDate']);

const DATE_FIELDS: ReadonlySet<string> = new Set(['startDate', 'endDate']);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/;

const TRUE_WORDS = new Set(['true', '1', 'yes', 'y', 'si', 'sì', 'vero', 'da']);
const FALSE_WORDS = new Set(['false', '0', 'no', 'n', 'falso', 'nu']);

/** `true/false/1/0/yes/no/si/...` (case-insensitive); null when the text is none of them. */
export function parseBoolean(value: string): boolean | null {
  const word = value.trim().toLowerCase();
  if (TRUE_WORDS.has(word)) return true;
  if (FALSE_WORDS.has(word)) return false;
  return null;
}

const readDefaults = (type: QRTemplateType): Record<string, Cell> =>
  getTemplate(type).defaultData() as unknown as Record<string, Cell>;

/** Columns of the CSV template of a template type: its data keys plus the optional file name. */
export const getColumns = (type: QRTemplateType): string[] => [...Object.keys(readDefaults(type)), FILENAME_COLUMN];

/** CSV header line to download as a starting point (no data rows). */
export const buildHeaderTemplate = (type: QRTemplateType, delimiter: CsvDelimiter = ','): string =>
  `${toCsvLine(getColumns(type), delimiter)}\r\n`;

// eslint-disable-next-line no-control-regex -- control characters are exactly what is being removed
const ILLEGAL_FILE_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com\d|lpt\d)$/i;
const IMAGE_EXTENSION = /\.(png|svg|zip)$/i;
const MAX_FILE_NAME_LENGTH = 100;

/** Safe file name (no extension) for every OS and for zip entries; null when nothing is left. */
export function sanitizeFileName(raw: string): string | null {
  let name = raw
    .normalize('NFC')
    .replace(ILLEGAL_FILE_CHARS, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(IMAGE_EXTENSION, '')
    // Leading/trailing dots and spaces are dropped or ignored by Windows
    .replace(/^[. ]+|[. ]+$/g, '');
  if (name.length > MAX_FILE_NAME_LENGTH) name = name.slice(0, MAX_FILE_NAME_LENGTH).replace(/[. ]+$/, '');
  if (!name || /^_+$/.test(name)) return null;
  return WINDOWS_RESERVED.test(name) ? `_${name}` : name;
}

/** Returns the names with duplicates made unique (`a`, `a-2`, `a-3`), case-insensitively. */
export function dedupeFileNames(names: readonly string[]): string[] {
  const used = new Set<string>();
  return names.map((name) => {
    let candidate = name;
    for (let n = 2; used.has(candidate.toLowerCase()); n += 1) candidate = `${name}-${n}`;
    used.add(candidate.toLowerCase());
    return candidate;
  });
}

const SUMMARY_LENGTH = 60;

const summarize = (values: Record<string, Cell>, defaults: Record<string, Cell>): string => {
  const parts = Object.entries(values)
    .filter(([key, value]) => typeof value === 'string' && value !== '' && value !== defaults[key])
    .map(([, value]) => String(value));
  const text = parts.slice(0, 3).join(' · ');
  return text.length > SUMMARY_LENGTH ? `${text.slice(0, SUMMARY_LENGTH - 1)}…` : text;
};

interface BuildOptions {
  errorCorrectionLevel: ErrorCorrectionLevel;
}

/**
 * Turns parsed CSV cells (header row first) into rows of the given template: coerces every
 * cell to the field's type, validates with the template's own `validate`, builds the payload
 * with its own `buildPayload` and assigns unique file names to the valid rows.
 */
export function buildBatchRows(type: QRTemplateType, table: readonly (readonly string[])[], options: BuildOptions): BatchTable {
  const [header, ...dataRows] = table;
  if (!header || dataRows.length === 0) return { rows: [], ignoredColumns: [], error: 'noRows' };
  if (dataRows.length > MAX_BATCH_ROWS) return { rows: [], ignoredColumns: [], error: 'tooManyRows' };

  const defaults = readDefaults(type);
  const columns = new Map<string, number>(); // lower-case field -> column index
  const ignoredColumns: string[] = [];
  header.forEach((cell, col) => {
    const name = cell.trim().toLowerCase();
    const known = name === FILENAME_COLUMN || Object.keys(defaults).some((key) => key.toLowerCase() === name);
    if (known && !columns.has(name)) columns.set(name, col);
    else if (cell.trim()) ignoredColumns.push(cell.trim());
  });
  if (!Object.keys(defaults).some((key) => columns.has(key.toLowerCase()))) {
    return { rows: [], ignoredColumns, error: 'noKnownColumns' };
  }

  const choices = CHOICE_FIELDS[type] ?? {};

  const rows = dataRows.map((cells, i): BatchRow => {
    const issues: BatchIssue[] = [];
    const values: Record<string, Cell> = { ...defaults };

    for (const [key, fallback] of Object.entries(defaults)) {
      const col = columns.get(key.toLowerCase());
      const raw = col === undefined ? '' : (cells[col] ?? '');
      if (raw.trim() === '') {
        if (BLANK_FIELDS.has(key)) values[key] = '';
        continue; // keep the template default
      }
      if (typeof fallback === 'boolean') {
        const parsed = parseBoolean(raw);
        if (parsed === null) issues.push({ field: key, key: 'invalidBoolean' });
        else values[key] = parsed;
      } else if (choices[key]) {
        const match = choices[key].find((choice) => choice.toLowerCase() === raw.trim().toLowerCase());
        if (match === undefined) issues.push({ field: key, key: 'invalidChoice' });
        else values[key] = match;
      } else if (DATE_FIELDS.has(key)) {
        // Accept "2025-03-01 09:30" as well as the ISO form the calendar form uses
        const normalized = raw.trim().replace(' ', 'T');
        if (DATE_PATTERN.test(normalized)) values[key] = normalized;
        else issues.push({ field: key, key: 'invalidDate' });
      } else {
        values[key] = raw;
      }
    }

    const evaluation = evaluateTemplate(type, values as unknown as QRTemplateData);
    for (const [field, key] of Object.entries(evaluation.errors) as [string, ErrorKey][]) issues.push({ field, key });
    // Without this guard the payload of a row with a coercion issue would still be built
    let payload = issues.length === 0 ? evaluation.payload : '';
    if (payload && getCapacity(payload, options.errorCorrectionLevel).exceeded) {
      issues.push({ field: '', key: 'contentTooLong' });
      payload = '';
    }

    const fileCol = columns.get(FILENAME_COLUMN);
    const index = i + 1;
    return {
      index,
      fileName: sanitizeFileName(fileCol === undefined ? '' : (cells[fileCol] ?? '')) ?? `qr-${index}`,
      summary: summarize(values, defaults),
      payload,
      issues,
    };
  });

  // Only rows that will be exported take part in the de-duplication
  const valid = rows.filter((row) => row.issues.length === 0);
  const unique = dedupeFileNames(valid.map((row) => row.fileName));
  valid.forEach((row, i) => {
    row.fileName = unique[i];
  });

  return { rows, ignoredColumns };
}

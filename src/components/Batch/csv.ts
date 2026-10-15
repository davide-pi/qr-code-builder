// Minimal RFC 4180 CSV reader: quoted fields, escaped quotes (""), delimiters and line breaks
// inside quotes, CRLF/LF/CR line endings, UTF-8 BOM, and `,` / `;` / tab delimiter detection
// (Italian Excel exports `;`). Pure: no DOM, no I/O.

export type CsvDelimiter = ',' | ';' | '\t';

const DELIMITERS: readonly CsvDelimiter[] = [',', ';', '\t'];

export interface CsvResult {
  rows: string[][];
  delimiter: CsvDelimiter;
  // A quoted field was never closed: the rest of the file was swallowed by it
  unterminatedQuote: boolean;
}

export const stripBom = (text: string): string => (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);

/** Picks the delimiter that appears most often (outside quotes) on the first non-empty line. */
export function detectDelimiter(text: string): CsvDelimiter {
  const counts: Record<CsvDelimiter, number> = { ',': 0, ';': 0, '\t': 0 };
  let inQuotes = false;
  let seenContent = false;
  for (const char of stripBom(text)) {
    if (char === '"') {
      inQuotes = !inQuotes;
      seenContent = true;
    } else if (!inQuotes && (char === '\n' || char === '\r')) {
      if (seenContent) break;
    } else {
      seenContent = true;
      if (!inQuotes && (DELIMITERS as readonly string[]).includes(char)) counts[char as CsvDelimiter] += 1;
    }
  }
  // Ties (and no delimiter at all) fall back to the comma
  return DELIMITERS.reduce((best, d) => (counts[d] > counts[best] ? d : best), ',' as CsvDelimiter);
}

/** Parses CSV text. Rows made only of empty cells (blank lines) are dropped. */
export function parseCsv(text: string, delimiter: CsvDelimiter = detectDelimiter(text)): CsvResult {
  const source = stripBom(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  // True once the current field started with a quote: `""` alone is an explicit empty string
  let quoted = false;

  const endField = () => {
    row.push(field);
    field = '';
    quoted = false;
  };
  const endRow = () => {
    endField();
    if (row.some((cell) => cell !== '')) rows.push(row);
    row = [];
  };

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"' && field === '' && !quoted) {
      inQuotes = true;
      quoted = true;
    } else if (char === delimiter) {
      endField();
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      endRow();
    } else {
      field += char;
    }
  }
  // Last line without a trailing line break
  if (field !== '' || quoted || row.length > 0) endRow();

  return { rows, delimiter, unterminatedQuote: inQuotes };
}

const needsQuoting = (value: string, delimiter: CsvDelimiter): boolean =>
  value.includes(delimiter) || /["\r\n]/.test(value);

/** Serializes one row, quoting only when needed. */
export function toCsvLine(cells: readonly string[], delimiter: CsvDelimiter = ','): string {
  return cells
    .map((cell) => (needsQuoting(cell, delimiter) ? `"${cell.replace(/"/g, '""')}"` : cell))
    .join(delimiter);
}

import { describe, expect, it } from 'vitest';
import { evaluateTemplate } from '../../templates';
import {
  MAX_BATCH_ROWS, buildBatchRows, buildHeaderTemplate, dedupeFileNames, getColumns, parseBoolean,
  sanitizeFileName,
} from './batchRows';

const options = { errorCorrectionLevel: 'M' as const };

describe('parseBoolean', () => {
  it('accepts the documented spellings, case-insensitively', () => {
    for (const word of ['true', 'TRUE', '1', 'yes', 'Si', 'sì', ' y ']) expect(parseBoolean(word), word).toBe(true);
    for (const word of ['false', '0', 'No', 'n']) expect(parseBoolean(word), word).toBe(false);
    expect(parseBoolean('maybe')).toBeNull();
    expect(parseBoolean('2')).toBeNull();
  });
});

describe('sanitizeFileName', () => {
  it('replaces characters that are illegal in file names', () => {
    expect(sanitizeFileName('a/b\\c:d*e?f"g<h>i|j')).toBe('a_b_c_d_e_f_g_h_i_j');
  });

  it('drops a known extension, edge dots and extra spaces', () => {
    expect(sanitizeFileName('  my   code.PNG ')).toBe('my code');
    expect(sanitizeFileName('..hidden.')).toBe('hidden');
    expect(sanitizeFileName('menu.v2')).toBe('menu.v2');
  });

  it('returns null when nothing usable is left', () => {
    expect(sanitizeFileName('')).toBeNull();
    expect(sanitizeFileName('   ')).toBeNull();
    expect(sanitizeFileName('///')).toBeNull();
    expect(sanitizeFileName('.png')).toBeNull();
  });

  it('avoids Windows reserved names and caps the length', () => {
    expect(sanitizeFileName('CON')).toBe('_CON');
    expect(sanitizeFileName('a'.repeat(300))).toHaveLength(100);
  });

  it('keeps accented and non-latin letters', () => {
    expect(sanitizeFileName('città-ț')).toBe('città-ț');
  });
});

describe('dedupeFileNames', () => {
  it('suffixes repeated names, case-insensitively, without colliding with existing ones', () => {
    expect(dedupeFileNames(['a', 'A', 'a', 'a-2', 'b'])).toEqual(['a', 'A-2', 'a-3', 'a-2-2', 'b']);
  });
});

describe('header template', () => {
  it('lists the data keys of the template plus filename', () => {
    expect(getColumns('url')).toEqual(['url', 'filename']);
    expect(getColumns('wifi')).toEqual(['ssid', 'password', 'encryption', 'hidden', 'filename']);
    expect(buildHeaderTemplate('wifi', ';')).toBe('ssid;password;encryption;hidden;filename\r\n');
  });
});

describe('buildBatchRows', () => {
  it('coerces cells, validates and builds the payload with the template', () => {
    const { rows, error } = buildBatchRows('url', [['URL', 'filename'], ['example.com', 'home'], ['nope', 'bad']], options);
    expect(error).toBeUndefined();
    expect(rows[0]).toMatchObject({ index: 1, fileName: 'home', issues: [], payload: evaluateTemplate('url', { url: 'example.com' }).payload });
    expect(rows[1].payload).toBe('');
    expect(rows[1].issues).toEqual([{ field: 'url', key: 'invalidUrl' }]);
  });

  it('coerces booleans and the wifi encryption choice', () => {
    const header = ['ssid', 'password', 'encryption', 'hidden'];
    const { rows } = buildBatchRows('wifi', [header, ['Home', 'pw', 'wep', 'yes'], ['Guest', '', '', ''], ['X', '', 'rot13', 'maybe']], options);
    expect(rows[0].payload).toBe('WIFI:T:WEP;S:Home;P:pw;H:true;;');
    // Empty cells fall back to the template default (WPA, not hidden)
    expect(rows[1].payload).toBe('WIFI:T:WPA;S:Guest;;');
    expect(rows[2].issues).toEqual([
      { field: 'encryption', key: 'invalidChoice' },
      { field: 'hidden', key: 'invalidBoolean' },
    ]);
    expect(rows[2].payload).toBe('');
  });

  it('keeps calendar dates empty when blank and accepts a space before the time', () => {
    const header = ['title', 'startDate', 'endDate', 'allDay'];
    const { rows } = buildBatchRows('calendar', [
      header,
      ['Party', '2025-03-01 20:00', '2025-03-01 23:00', 'false'],
      ['No start', '', '', ''],
      ['Bad date', '01/03/2025', '', ''],
    ], options);
    expect(rows[0].issues).toEqual([]);
    expect(rows[0].payload).toContain('DTSTART:20250301T200000');
    expect(rows[1].issues).toEqual([{ field: 'startDate', key: 'required' }]);
    expect(rows[2].issues).toContainEqual({ field: 'startDate', key: 'invalidDate' });
  });

  it('names rows after the filename column or qr-<n>, de-duplicating only the valid ones', () => {
    const { rows } = buildBatchRows('url', [
      ['url', 'filename'],
      ['a.com', 'same'],
      ['not a url', 'same'],
      ['b.com', 'same'],
      ['c.com', ''],
    ], options);
    expect(rows.map((row) => row.fileName)).toEqual(['same', 'same', 'same-2', 'qr-4']);
  });

  it('matches headers case-insensitively and reports the ignored ones', () => {
    const { rows, ignoredColumns } = buildBatchRows('url', [[' URL ', 'Notes'], ['a.com', 'x']], options);
    expect(rows[0].issues).toEqual([]);
    expect(ignoredColumns).toEqual(['Notes']);
  });

  it('rejects tables that cannot be used', () => {
    expect(buildBatchRows('url', [], options).error).toBe('noRows');
    expect(buildBatchRows('url', [['url']], options).error).toBe('noRows');
    expect(buildBatchRows('url', [['foo'], ['bar']], options).error).toBe('noKnownColumns');
    const many = [['url'], ...Array.from({ length: MAX_BATCH_ROWS + 1 }, (_, i) => [`a${i}.com`])];
    expect(buildBatchRows('url', many, options).error).toBe('tooManyRows');
    expect(buildBatchRows('url', many.slice(0, MAX_BATCH_ROWS + 1), options).error).toBeUndefined();
  });

  it('flags content that exceeds the capacity of the error correction level', () => {
    const { rows } = buildBatchRows('url', [['url'], [`https://example.com/${'a'.repeat(3000)}`]], options);
    expect(rows[0].issues).toEqual([{ field: '', key: 'contentTooLong' }]);
  });

  it('tolerates short rows', () => {
    const { rows } = buildBatchRows('email', [['email', 'subject', 'body'], ['a@b.it']], options);
    expect(rows[0].issues).toEqual([]);
  });
});

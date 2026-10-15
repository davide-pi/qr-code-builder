import { describe, expect, it } from 'vitest';
import { detectDelimiter, parseCsv, toCsvLine } from './csv';

describe('detectDelimiter', () => {
  it('picks the most frequent delimiter of the first line', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',');
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';');
    expect(detectDelimiter('a\tb\tc')).toBe('\t');
  });

  it('ignores delimiters inside quotes and defaults to the comma', () => {
    expect(detectDelimiter('"a,b,c";d\n1;2')).toBe(';');
    expect(detectDelimiter('single')).toBe(',');
  });

  it('skips a BOM and leading blank lines', () => {
    expect(detectDelimiter('\uFEFF\n\na;b')).toBe(';');
  });
});

describe('parseCsv', () => {
  it('parses plain rows with LF, CRLF and CR endings', () => {
    expect(parseCsv('a,b\n1,2').rows).toEqual([['a', 'b'], ['1', '2']]);
    expect(parseCsv('a,b\r\n1,2\r\n').rows).toEqual([['a', 'b'], ['1', '2']]);
    expect(parseCsv('a,b\r1,2').rows).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('handles quoted fields with delimiters, escaped quotes and newlines', () => {
    const { rows, unterminatedQuote } = parseCsv('name,note\n"Rossi, Mario","say ""hi""\nsecond line"\n');
    expect(rows).toEqual([['name', 'note'], ['Rossi, Mario', 'say "hi"\nsecond line']]);
    expect(unterminatedQuote).toBe(false);
  });

  it('auto-detects the semicolon and strips the UTF-8 BOM', () => {
    const result = parseCsv('\uFEFFurl;filename\nhttps://a.it/x?y=1,2;uno');
    expect(result.delimiter).toBe(';');
    expect(result.rows).toEqual([['url', 'filename'], ['https://a.it/x?y=1,2', 'uno']]);
  });

  it('keeps empty cells and drops blank lines', () => {
    expect(parseCsv('a,b,c\n\n1,,3\n,,\n').rows).toEqual([['a', 'b', 'c'], ['1', '', '3']]);
  });

  it('keeps a quoted empty string as an empty cell and reads a last line without line break', () => {
    expect(parseCsv('a,b\n"",x').rows).toEqual([['a', 'b'], ['', 'x']]);
    expect(parseCsv('a\n1').rows).toEqual([['a'], ['1']]);
  });

  it('flags an unterminated quote', () => {
    expect(parseCsv('a,b\n"open,1').unterminatedQuote).toBe(true);
  });

  it('returns no rows for empty input', () => {
    expect(parseCsv('').rows).toEqual([]);
  });
});

describe('toCsvLine', () => {
  it('quotes only the cells that need it', () => {
    expect(toCsvLine(['a', 'b,c', 'd"e', 'f\ng'])).toBe('a,"b,c","d""e","f\ng"');
    expect(toCsvLine(['a,b', 'c'], ';')).toBe('a,b;c');
  });

  it('round-trips through parseCsv', () => {
    const cells = ['x', 'y;z', 'q"r', 'multi\nline', ''];
    expect(parseCsv(toCsvLine(cells, ';'), ';').rows).toEqual([cells]);
  });
});

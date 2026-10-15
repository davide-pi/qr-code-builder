// RFC 5545 (iCalendar) and RFC 2426 (vCard 3.0) share the same TEXT escaping:
// backslash first, then `;` `,` and line breaks
export const escapeText = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');

// Wi-Fi QR spec: `\` `;` `,` `:` and `"` are escaped with a backslash
export const escapeWifi = (value: string): string => value.replace(/[\\;,:"]/g, '\\$&');

// Values that must stay on a single line (URIs, phone numbers, EPC fields)
export const toSingleLine = (value: string): string => value.replace(/[\r\n]+/g, ' ').trim();

export const CRLF = '\r\n';

const utf8 = new TextEncoder();

// Splits a line into units that must not be separated: a code point (so a UTF-8 multibyte
// sequence stays whole) and a backslash together with the character it escapes
const foldUnits = (line: string): string[] => {
  const units: string[] = [];
  const points = Array.from(line);
  for (let i = 0; i < points.length; i++) {
    if (points[i] === '\\' && i + 1 < points.length) {
      units.push(points[i] + points[i + 1]);
      i++;
    } else {
      units.push(points[i]);
    }
  }
  return units;
};

// RFC 5545 §3.1 / RFC 2425: content lines longer than 75 octets (CRLF excluded) are folded
// with CRLF + one space. The continuation space counts in the 75 octets of the next line.
export const foldLine = (line: string, limit = 75): string => {
  if (line.length * 3 <= limit) return line; // at most 3 octets per UTF-16 unit
  const chunks: string[] = [];
  let chunk = '';
  let octets = 0;
  let max = limit;
  for (const unit of foldUnits(line)) {
    const size = utf8.encode(unit).length;
    if (chunk && octets + size > max) {
      chunks.push(chunk);
      chunk = '';
      octets = 0;
      max = limit - 1;
    }
    chunk += unit;
    octets += size;
  }
  chunks.push(chunk);
  return chunks.join(`${CRLF} `);
};

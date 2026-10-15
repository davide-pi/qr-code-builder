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

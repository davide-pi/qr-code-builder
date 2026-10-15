import type { ErrorKey } from '../types';

const HAS_SCHEME = /^([a-z][a-z\d+.-]*):\/\//i;
// Schemes that are valid without "//" and must not get "https://" prepended
const OPAQUE_SCHEME = /^(mailto|tel|sms|smsto|geo|bitcoin|wifi|skype|facetime|market):/i;
// Schemes accepted with "//": anything else (javascript://, file:///, data://…) is rejected,
// since a QR code is opened by whatever handler the scanner has for that scheme
const ALLOWED_SCHEMES = ['http', 'https', 'ftp'];

// Prepend https:// when the user typed a bare host ("example.com/path")
export function normalizeUrl(input: string): string {
  const value = input.trim();
  if (!value) return '';
  if (HAS_SCHEME.test(value) || OPAQUE_SCHEME.test(value)) return value;
  if (value.startsWith('//')) return `https:${value}`;
  return `https://${value}`;
}

// Error of a URL typed by the user, or null when it is valid
export function validateUrl(input: string): Extract<ErrorKey, 'invalidUrl' | 'invalidUrlScheme'> | null {
  const value = normalizeUrl(input);
  if (!value || /\s/.test(value)) return 'invalidUrl';
  if (OPAQUE_SCHEME.test(value)) return value.replace(OPAQUE_SCHEME, '').length > 0 ? null : 'invalidUrl';
  const scheme = HAS_SCHEME.exec(value)?.[1].toLowerCase();
  if (scheme && !ALLOWED_SCHEMES.includes(scheme)) return 'invalidUrlScheme';
  try {
    const { protocol, hostname } = new URL(value);
    if (protocol === 'ftp:') return hostname ? null : 'invalidUrl';
    // Reject single words such as "hello": a real host has a dot, is localhost or an IPv6 literal
    return hostname.includes('.') || hostname === 'localhost' || hostname.startsWith('[') ? null : 'invalidUrl';
  } catch {
    return 'invalidUrl';
  }
}

export const isValidUrl = (input: string): boolean => validateUrl(input) === null;

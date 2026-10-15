const HAS_SCHEME = /^[a-z][a-z\d+.-]*:\/\//i;
// Schemes that are valid without "//" and must not get "https://" prepended
const OPAQUE_SCHEME = /^(mailto|tel|sms|smsto|geo|bitcoin|wifi|skype|facetime|market):/i;

// Prepend https:// when the user typed a bare host ("example.com/path")
export function normalizeUrl(input: string): string {
  const value = input.trim();
  if (!value) return '';
  if (HAS_SCHEME.test(value) || OPAQUE_SCHEME.test(value)) return value;
  if (value.startsWith('//')) return `https:${value}`;
  return `https://${value}`;
}

export function isValidUrl(input: string): boolean {
  const value = normalizeUrl(input);
  if (!value || /\s/.test(value)) return false;
  if (OPAQUE_SCHEME.test(value)) return value.replace(OPAQUE_SCHEME, '').length > 0;
  try {
    const { protocol, hostname } = new URL(value);
    if (protocol !== 'http:' && protocol !== 'https:') return true;
    // Reject single words such as "hello": a real host has a dot, is localhost or an IPv6 literal
    return hostname.includes('.') || hostname === 'localhost' || hostname.startsWith('[');
  } catch {
    return false;
  }
}

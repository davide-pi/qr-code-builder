import { describe, expect, it } from 'vitest';
import { normalizeAmount } from './amount';
import { toE164 } from './e164';
import { isValidBic, isValidIban, normalizeIban } from './iban';
import { buildSocialUrl } from './social';
import { escapeText, escapeWifi } from './text';
import { isValidUrl, normalizeUrl } from './url';

describe('escapeText (RFC 5545 / RFC 2426)', () => {
  it('escapes backslash first, then ; , and newlines', () => {
    expect(escapeText('a\\b;c,d\ne')).toBe('a\\\\b\\;c\\,d\\ne');
    expect(escapeText('line1\r\nline2')).toBe('line1\\nline2');
  });
});

describe('escapeWifi', () => {
  it('escapes \\ ; , : and "', () => {
    expect(escapeWifi('a\\b;c,d:e"f')).toBe('a\\\\b\\;c\\,d\\:e\\"f');
  });
});

describe('normalizeAmount', () => {
  it('accepts comma and dot decimals', () => {
    expect(normalizeAmount('10,50', 2)).toBe('10.50');
    expect(normalizeAmount('10.5', 2)).toBe('10.5');
    expect(normalizeAmount(' 7 ', 2)).toBe('7');
    expect(normalizeAmount('.5', 2)).toBe('0.5');
  });
  it('rejects zero, negatives, text and too many decimals', () => {
    expect(normalizeAmount('0', 2)).toBeNull();
    expect(normalizeAmount('-1', 2)).toBeNull();
    expect(normalizeAmount('abc', 2)).toBeNull();
    expect(normalizeAmount('', 2)).toBeNull();
    expect(normalizeAmount('1.234', 2)).toBeNull();
    expect(normalizeAmount('1.23456789', 8)).toBe('1.23456789');
  });
});

describe('IBAN', () => {
  it('accepts valid IBANs, with spaces and lowercase', () => {
    expect(isValidIban('DE89370400440532013000')).toBe(true);
    expect(isValidIban('it60 x054 2811 1010 0000 0123 456')).toBe(true);
    expect(isValidIban('GB82 WEST 1234 5698 7654 32')).toBe(true);
  });
  it('rejects a wrong checksum or structure', () => {
    expect(isValidIban('DE89370400440532013001')).toBe(false);
    expect(isValidIban('IT60X0542811101000000123457')).toBe(false);
    expect(isValidIban('1234')).toBe(false);
    expect(isValidIban('')).toBe(false);
  });
  it('normalizes', () => {
    expect(normalizeIban(' de89 3704 ')).toBe('DE893704');
  });
  it('validates BIC', () => {
    expect(isValidBic('BCITITMM')).toBe(true);
    expect(isValidBic('bcitit mm 123')).toBe(true);
    expect(isValidBic('BCIT')).toBe(false);
  });
});

describe('toE164', () => {
  it('prepends the country code', () => {
    expect(toE164('+39', '333 123 4567')).toBe('+393331234567');
  });
  it('keeps the leading 0 of Italian numbers', () => {
    expect(toE164('+39', '06 1234 5678')).toBe('+390612345678');
  });
  it('strips the national trunk prefix where the country uses one', () => {
    expect(toE164('+44', '07911 123456')).toBe('+447911123456');
  });
  it('treats a number typed with + as international and ignores the country code', () => {
    expect(toE164('+39', '+44 7911 123456')).toBe('+447911123456');
  });
  it('treats a number typed with 00 as international', () => {
    expect(toE164('+39', '0044 7911 123456')).toBe('+447911123456');
  });
  it('returns null without a plausible number', () => {
    expect(toE164('+39', '')).toBeNull();
    expect(toE164('+39', 'abc')).toBeNull();
    expect(toE164('+39', '12')).toBeNull();
    expect(toE164('+39', '1'.repeat(20))).toBeNull();
  });
});

describe('url', () => {
  it('prepends https:// to a bare host', () => {
    expect(normalizeUrl('example.com/a?b=1')).toBe('https://example.com/a?b=1');
    expect(normalizeUrl('  example.com ')).toBe('https://example.com');
    expect(normalizeUrl('//example.com')).toBe('https://example.com');
  });
  it('keeps an existing scheme', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    expect(normalizeUrl('mailto:a@b.com')).toBe('mailto:a@b.com');
  });
  it('validates', () => {
    expect(isValidUrl('example.com')).toBe(true);
    expect(isValidUrl('https://localhost:3000')).toBe(true);
    expect(isValidUrl('hello')).toBe(false);
    expect(isValidUrl('exa mple.com')).toBe(false);
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
  });
});

describe('buildSocialUrl', () => {
  const instagram = { baseUrl: 'https://instagram.com/', hosts: ['instagram.com'] };
  const linkedin = {
    baseUrl: 'https://linkedin.com/', hosts: ['linkedin.com'], kinds: ['in', 'company'], defaultKind: 'in',
  };
  const tiktok = { baseUrl: 'https://tiktok.com/', hosts: ['tiktok.com'], handlePrefix: '@' };

  it('trims and strips every leading @', () => {
    expect(buildSocialUrl(instagram, '  @@john.doe ')).toBe('https://instagram.com/john.doe');
    expect(buildSocialUrl(tiktok, '@@john')).toBe('https://tiktok.com/@john');
  });
  it('extracts the handle from a pasted URL of the network', () => {
    expect(buildSocialUrl(instagram, 'https://www.instagram.com/john/?hl=en')).toBe('https://instagram.com/john');
    expect(buildSocialUrl(instagram, 'instagram.com/john')).toBe('https://instagram.com/john');
    expect(buildSocialUrl(tiktok, 'https://www.tiktok.com/@john/video/1')).toBe('https://tiktok.com/@john');
  });
  it('rejects a URL of another network', () => {
    expect(buildSocialUrl(instagram, 'https://twitter.com/john')).toBeNull();
    expect(buildSocialUrl(instagram, 'https://instagram.com/')).toBeNull();
  });
  it('encodes the handle', () => {
    expect(buildSocialUrl(instagram, 'a b')).toBeNull();
    expect(buildSocialUrl(instagram, 'a?b#c')).toBe('https://instagram.com/a%3Fb%23c');
    expect(buildSocialUrl(instagram, 'café')).toBe('https://instagram.com/caf%C3%A9');
  });
  it('supports LinkedIn /in/ and /company/', () => {
    expect(buildSocialUrl(linkedin, 'john-doe-123')).toBe('https://linkedin.com/in/john-doe-123');
    expect(buildSocialUrl(linkedin, 'https://www.linkedin.com/in/john-doe-123/')).toBe('https://linkedin.com/in/john-doe-123');
    expect(buildSocialUrl(linkedin, 'https://www.linkedin.com/company/acme/')).toBe('https://linkedin.com/company/acme');
    expect(buildSocialUrl(linkedin, 'company/acme')).toBe('https://linkedin.com/company/acme');
  });
  it('uses the URL as is when no handle can be extracted', () => {
    const facebook = { baseUrl: 'https://facebook.com/', hosts: ['facebook.com'], passthrough: ['profile.php'] };
    expect(buildSocialUrl(facebook, 'https://www.facebook.com/profile.php?id=123'))
      .toBe('https://www.facebook.com/profile.php?id=123');
  });
});

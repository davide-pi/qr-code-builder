import { describe, expect, it } from 'vitest';
import { getDefaultCalendarData } from '../types/qr';
import {
  createDefaultFormData, evaluateTemplate, getTemplate, isTemplateType, templateTypes,
} from './index';
import { calendarTemplate } from './calendar';
import { emailTemplate } from './email';
import { locationTemplate } from './location';
import { bitcoinTemplate, epcTemplate, paypalTemplate } from './payments';
import { phoneTemplate, smsTemplate, whatsappTemplate } from './phoneTemplates';
import { instagramTemplate, linkedinTemplate, telegramTemplate, tiktokTemplate, twitterTemplate } from './social';
import { urlTemplate } from './url';
import { vcardTemplate } from './vcard';
import { wifiTemplate } from './wifi';

describe('registry', () => {
  it('has a consistent template for every type', () => {
    expect(templateTypes).toHaveLength(20);
    for (const type of templateTypes) {
      expect(getTemplate(type).type).toBe(type);
      expect(isTemplateType(type)).toBe(true);
    }
    expect(isTemplateType('nope')).toBe(false);
  });

  it('starts every template with a required field error and an empty payload', () => {
    const forms = createDefaultFormData();
    for (const type of templateTypes) {
      const result = evaluateTemplate(type, forms[type]);
      // The default calendar has dates but no title; every other default is empty
      expect(result.valid, type).toBe(false);
      expect(result.payload, type).toBe('');
    }
  });

  it('builds the payload only when the data is valid', () => {
    expect(evaluateTemplate('url', { url: 'example.com' })).toMatchObject({ valid: true, payload: 'https://example.com' });
    expect(evaluateTemplate('url', { url: 'hello' })).toMatchObject({ valid: false, payload: '' });
  });
});

describe('url', () => {
  it('requires a valid URL and prepends https://', () => {
    expect(urlTemplate.validate({ url: '' })).toEqual({ url: 'required' });
    expect(urlTemplate.validate({ url: 'hello' })).toEqual({ url: 'invalidUrl' });
    expect(urlTemplate.buildPayload({ url: ' example.com/x ' })).toBe('https://example.com/x');
  });
});

describe('vcard', () => {
  const base = vcardTemplate.defaultData();

  it('emits N and FN, escaped, with CRLF line endings', () => {
    const payload = vcardTemplate.buildPayload({
      ...base,
      firstName: 'Ann;e',
      lastName: 'Smith, Jr',
      organization: 'Acme; Inc',
      title: 'CEO\nFounder',
      phone: '+39 333 1234567',
      email: 'ann@example.com',
      website: 'example.com/a,b',
      address: 'Via Roma 1',
      city: 'Rome',
      country: 'Italy',
    });
    expect(payload.split('\r\n')).toEqual([
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Smith\\, Jr;Ann\\;e;;;',
      'FN:Ann\\;e Smith\\, Jr',
      'ORG:Acme\\; Inc',
      'TITLE:CEO\\nFounder',
      'TEL:+39 333 1234567',
      'EMAIL:ann@example.com',
      'URL:https://example.com/a,b',
      'ADR:;;Via Roma 1;Rome;;;Italy',
      'END:VCARD',
    ]);
    expect(payload).not.toMatch(/[^\r]\n/);
  });

  it('folds long lines at 75 octets without splitting UTF-8 sequences or escapes', () => {
    const title = 'è;'.repeat(60);
    const payload = vcardTemplate.buildPayload({ ...base, firstName: 'A', title });
    const lines = payload.split('\r\n');
    for (const line of lines) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(lines.some((line) => line.startsWith(' '))).toBe(true);
    // Unfolding gives back the escaped value, and no fold falls right after a backslash
    expect(payload.replace(/\r\n /g, '')).toContain(`TITLE:${'è\\;'.repeat(60)}`);
    expect(lines.some((line) => line.endsWith('\\'))).toBe(false);
  });

  it('falls back to the organization for FN and keeps an empty N', () => {
    const lines = vcardTemplate.buildPayload({ ...base, organization: 'Acme' }).split('\r\n');
    expect(lines).toContain('N:;;;;');
    expect(lines).toContain('FN:Acme');
  });

  it('does not let a field inject a new line', () => {
    const payload = vcardTemplate.buildPayload({ ...base, firstName: 'A', phone: '1\r\nEND:VCARD', website: 'x.com\nFOO:bar' });
    expect(payload.split('\r\n').filter((line) => line.startsWith('END:VCARD'))).toHaveLength(1);
    expect(payload).not.toContain('\nFOO:bar');
  });

  it('is empty without name and organization, and validates fields', () => {
    expect(vcardTemplate.buildPayload(base)).toBe('');
    expect(vcardTemplate.validate(base)).toEqual({ firstName: 'nameOrOrganizationRequired' });
    expect(vcardTemplate.validate({ ...base, organization: 'A', email: 'nope', website: 'hello', phone: '12' })).toEqual({
      email: 'invalidEmail', website: 'invalidUrl', phone: 'invalidPhone',
    });
  });
});

describe('wifi', () => {
  const base = wifiTemplate.defaultData();

  it('escapes the special characters, including the colon', () => {
    expect(wifiTemplate.buildPayload({ ...base, ssid: 'My;Net:1', password: 'p\\a"s,s:' })).toBe(
      'WIFI:T:WPA;S:My\\;Net\\:1;P:p\\\\a\\"s\\,s\\:;;',
    );
  });
  it('wraps an all-hex SSID or password in double quotes', () => {
    expect(wifiTemplate.buildPayload({ ...base, ssid: 'CAFE1234', password: '12345678' })).toBe(
      'WIFI:T:WPA;S:"CAFE1234";P:"12345678";;',
    );
    // Not all hex digits: escaped as usual
    expect(wifiTemplate.buildPayload({ ...base, ssid: 'cafeg', password: 'ab:cd' })).toBe('WIFI:T:WPA;S:cafeg;P:ab\\:cd;;');
  });
  it('omits the password for open networks and flags hidden ones', () => {
    expect(wifiTemplate.buildPayload({ ...base, ssid: 'Open', password: 'ignored', encryption: 'nopass' })).toBe('WIFI:T:nopass;S:Open;;');
    expect(wifiTemplate.buildPayload({ ...base, ssid: 'Net', password: 'pw', encryption: 'WEP', hidden: true })).toBe(
      'WIFI:T:WEP;S:Net;P:pw;H:true;;',
    );
  });
  it('requires the SSID', () => {
    expect(wifiTemplate.validate(base)).toEqual({ ssid: 'required' });
    expect(wifiTemplate.buildPayload(base)).toBe('');
  });
});

describe('email', () => {
  const base = emailTemplate.defaultData();

  it('keeps @ readable and omits empty params', () => {
    expect(emailTemplate.buildPayload({ ...base, email: 'a.b+c@example.com' })).toBe('mailto:a.b%2Bc@example.com');
  });
  it('encodes subject and body, with CRLF line breaks', () => {
    expect(emailTemplate.buildPayload({ email: 'a@example.com', subject: 'Hi & bye', body: 'l1\nl2' })).toBe(
      'mailto:a@example.com?subject=Hi%20%26%20bye&body=l1%0D%0Al2',
    );
    expect(emailTemplate.buildPayload({ email: 'a@example.com', subject: '', body: 'x' })).toBe('mailto:a@example.com?body=x');
  });
  it('supports several recipients and validates them', () => {
    expect(emailTemplate.buildPayload({ ...base, email: 'a@x.com, b@y.com' })).toBe('mailto:a@x.com,b@y.com');
    expect(emailTemplate.validate({ ...base, email: '' })).toEqual({ email: 'required' });
    expect(emailTemplate.validate({ ...base, email: 'a@x.com, nope' })).toEqual({ email: 'invalidEmail' });
  });
});

describe('phone, sms, whatsapp', () => {
  it('builds tel: with an E.164 number', () => {
    expect(phoneTemplate.buildPayload({ country: 'IT', countryCode: '+39', phone: '333 123 4567' })).toBe('tel:+393331234567');
  });
  it('uses a typed international number and ignores the country code', () => {
    expect(phoneTemplate.buildPayload({ country: 'IT', countryCode: '+39', phone: '+44 7911 123456' })).toBe('tel:+447911123456');
    expect(smsTemplate.buildPayload({ country: 'IT', countryCode: '+39', phone: '0044 7911 123456', message: '' })).toBe('sms:+447911123456');
  });
  it('strips the trunk prefix only where the country has one', () => {
    expect(smsTemplate.buildPayload({ country: 'GB', countryCode: '+44', phone: '07911 123456', message: 'Hi there' })).toBe(
      'sms:+447911123456?body=Hi%20there',
    );
    expect(phoneTemplate.buildPayload({ country: 'IT', countryCode: '+39', phone: '06 1234 5678' })).toBe('tel:+390612345678');
  });
  it('builds wa.me without the plus', () => {
    expect(whatsappTemplate.buildPayload({ country: 'IT', countryCode: '+39', phone: '333 123 4567', message: 'Ciao & grazie' })).toBe(
      'https://wa.me/393331234567?text=Ciao%20%26%20grazie',
    );
    expect(whatsappTemplate.buildPayload({ country: 'IT', countryCode: '+39', phone: '333 123 4567', message: '' })).toBe('https://wa.me/393331234567');
  });
  it('validates the number', () => {
    expect(phoneTemplate.validate({ country: 'IT', countryCode: '+39', phone: '' })).toEqual({ phone: 'required' });
    expect(phoneTemplate.validate({ country: 'IT', countryCode: '+39', phone: 'abc' })).toEqual({ phone: 'invalidPhone' });
    expect(smsTemplate.validate({ country: 'IT', countryCode: '+39', phone: '333 123 4567', message: '' })).toEqual({});
  });
});

describe('calendar', () => {
  const base = { title: 'Meet', location: '', description: '', startDate: '2025-03-01T09:30', endDate: '2025-03-01T10:30', allDay: false };

  it('escapes SUMMARY, LOCATION and DESCRIPTION and uses CRLF', () => {
    const payload = calendarTemplate.buildPayload({
      ...base,
      title: 'A;B,C\\D',
      location: 'Room 1, Floor 2',
      description: 'line1\nline2; ok',
    });
    const lines = payload.split('\r\n');
    expect(lines.filter((line) => !/^(UID|DTSTAMP):/.test(line))).toEqual([
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//QR Code Builder//EN',
      'BEGIN:VEVENT',
      'SUMMARY:A\\;B\\,C\\\\D',
      'LOCATION:Room 1\\, Floor 2',
      'DESCRIPTION:line1\\nline2\\; ok',
      'DTSTART:20250301T093000',
      'DTEND:20250301T103000',
      'END:VEVENT',
      'END:VCALENDAR',
    ]);
  });
  it('emits a deterministic UID and a UTC DTSTAMP derived from the start', () => {
    const lines = calendarTemplate.buildPayload(base).split('\r\n');
    expect(lines).toContain('DTSTAMP:20250301T093000Z');
    expect(lines.find((line) => line.startsWith('UID:'))).toMatch(/^UID:[0-9a-f]{14}@qr-code-builder$/);
    // Pure: same event, same payload; another event, another UID
    expect(calendarTemplate.buildPayload(base)).toBe(calendarTemplate.buildPayload({ ...base }));
    const uid = (title: string) => calendarTemplate.buildPayload({ ...base, title }).match(/UID:(\S+)/)?.[1];
    expect(uid('Meet')).toBe(uid('Meet'));
    expect(uid('Meet')).not.toBe(uid('Meet 2'));
    expect(calendarTemplate.buildPayload({ ...base, allDay: true, startDate: '2025-02-28', endDate: '2025-02-28' }))
      .toContain('DTSTAMP:20250228T000000Z');
  });
  it('folds long lines at 75 octets', () => {
    const payload = calendarTemplate.buildPayload({ ...base, description: 'word '.repeat(40) });
    for (const line of payload.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    // Unfolding (CRLF + space) restores the original line
    expect(payload.replace(/\r\n /g, '')).toContain(`DESCRIPTION:${'word '.repeat(40)}`);
  });
  it('makes the DTEND of an all-day event exclusive', () => {
    const payload = calendarTemplate.buildPayload({ ...base, allDay: true, startDate: '2025-02-28', endDate: '2025-02-28' });
    expect(payload).toContain('DTSTART;VALUE=DATE:20250228');
    expect(payload).toContain('DTEND;VALUE=DATE:20250301');
    expect(calendarTemplate.buildPayload({ ...base, allDay: true, startDate: '2025-12-31', endDate: '2025-12-31' }))
      .toContain('DTEND;VALUE=DATE:20260101');
  });
  it('validates title, start and end >= start', () => {
    expect(calendarTemplate.validate({ ...base, title: '' })).toEqual({ title: 'required' });
    expect(calendarTemplate.validate({ ...base, startDate: '' })).toEqual({ startDate: 'required' });
    expect(calendarTemplate.validate({ ...base, endDate: '2025-03-01T09:29' })).toEqual({ endDate: 'endBeforeStart' });
    expect(calendarTemplate.validate({ ...base, endDate: base.startDate })).toEqual({});
    expect(calendarTemplate.validate({ ...base, allDay: true, startDate: '2025-03-02', endDate: '2025-03-01' }))
      .toEqual({ endDate: 'endBeforeStart' });
  });
  it('defaults to local time', () => {
    const { startDate } = getDefaultCalendarData();
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    expect(startDate.slice(0, 10)).toBe(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
    expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});

describe('location', () => {
  const base = locationTemplate.defaultData();

  it('builds a geo URI and accepts comma decimals', () => {
    expect(locationTemplate.buildPayload({ ...base, latitude: '41,9028', longitude: '12.4964' })).toBe('geo:41.9028,12.4964');
    expect(locationTemplate.buildPayload({ ...base, latitude: '0', longitude: '-0.5' })).toBe('geo:0,-0.5');
  });
  it('normalizes a trailing or a leading dot to the RFC 5870 form', () => {
    expect(locationTemplate.buildPayload({ ...base, latitude: '45.', longitude: '.5' })).toBe('geo:45,0.5');
    expect(locationTemplate.buildPayload({ ...base, latitude: '-.5', longitude: '+12,' })).toBe('geo:-0.5,12');
    expect(locationTemplate.validate({ ...base, latitude: '45.', longitude: '.5' })).toEqual({});
  });
  it('puts the label in q with the point', () => {
    expect(locationTemplate.buildPayload({ latitude: '41.9', longitude: '12.5', label: 'Rome (IT)' })).toBe(
      'geo:41.9,12.5?q=41.9,12.5(Rome%20%28IT%29)',
    );
  });
  it('validates the ranges', () => {
    expect(locationTemplate.validate({ ...base, latitude: '90', longitude: '-180' })).toEqual({});
    expect(locationTemplate.validate({ ...base, latitude: '90.1', longitude: '180.1' })).toEqual({
      latitude: 'invalidLatitude', longitude: 'invalidLongitude',
    });
    expect(locationTemplate.validate({ ...base, latitude: 'x', longitude: '' })).toEqual({
      latitude: 'invalidLatitude', longitude: 'required',
    });
  });
});

describe('social', () => {
  it('builds the profile URLs', () => {
    expect(instagramTemplate.buildPayload({ username: ' @@john ' })).toBe('https://instagram.com/john');
    expect(twitterTemplate.buildPayload({ username: 'https://x.com/john' })).toBe('https://twitter.com/john');
    expect(tiktokTemplate.buildPayload({ username: '@john' })).toBe('https://tiktok.com/@john');
    expect(linkedinTemplate.buildPayload({ username: 'https://www.linkedin.com/company/acme' })).toBe('https://linkedin.com/company/acme');
  });
  it('flags an empty or foreign handle', () => {
    expect(instagramTemplate.validate({ username: '' })).toEqual({ username: 'required' });
    expect(instagramTemplate.validate({ username: 'https://twitter.com/john' })).toEqual({ username: 'invalidHandle' });
  });
  it('builds Telegram links, keeping a phone number link intact', () => {
    expect(telegramTemplate.buildPayload({ username: '@john', message: 'Hi & hello' })).toBe('https://t.me/john?text=Hi%20%26%20hello');
    expect(telegramTemplate.buildPayload({ username: '+393331234567', message: '' })).toBe('https://t.me/+393331234567');
  });
});

describe('paypal', () => {
  const base = paypalTemplate.defaultData();

  it('defaults the currency to EUR', () => {
    expect(base.currency).toBe('EUR');
  });
  it('normalizes the amount and encodes the username', () => {
    expect(paypalTemplate.buildPayload({ ...base, username: 'john', amount: '10,5', currency: 'USD' })).toBe('https://paypal.me/john/10.5USD');
    expect(paypalTemplate.buildPayload({ ...base, username: 'jo hn' })).toBe('');
    expect(paypalTemplate.buildPayload({ ...base, username: 'john' })).toBe('https://paypal.me/john');
    expect(paypalTemplate.buildPayload({ ...base, username: 'https://paypal.me/john', amount: '3' })).toBe('https://paypal.me/john/3EUR');
  });
  it('validates the amount', () => {
    expect(paypalTemplate.validate({ ...base, username: 'john', amount: '-3' })).toEqual({ amount: 'invalidAmount' });
    expect(paypalTemplate.validate({ ...base, username: 'john', amount: 'abc' })).toEqual({ amount: 'invalidAmount' });
    expect(paypalTemplate.validate({ ...base, username: '' })).toEqual({ username: 'required' });
  });
});

describe('bitcoin', () => {
  const base = bitcoinTemplate.defaultData();
  const address = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';

  it('builds a BIP21 URI with a normalized amount and an encoded label', () => {
    expect(bitcoinTemplate.buildPayload({ address, amount: '0,001', label: 'Don & Co' })).toBe(
      `bitcoin:${address}?amount=0.001&label=Don%20%26%20Co`,
    );
    expect(bitcoinTemplate.buildPayload({ ...base, address })).toBe(`bitcoin:${address}`);
  });
  it('validates address and amount', () => {
    expect(bitcoinTemplate.validate({ ...base, address: '' })).toEqual({ address: 'required' });
    expect(bitcoinTemplate.validate({ ...base, address: 'not an address' })).toEqual({ address: 'invalidBitcoinAddress' });
    expect(bitcoinTemplate.validate({ ...base, address, amount: '0' })).toEqual({ amount: 'invalidAmount' });
    expect(bitcoinTemplate.validate({ ...base, address, amount: '1.123456789' })).toEqual({ amount: 'invalidAmount' });
  });
});

describe('epc', () => {
  const base = { name: 'Acme Srl', iban: 'it60 x054 2811 1010 0000 0123 456', bic: 'bcitit mm', amount: '12,5', remittance: 'Invoice 42' };

  it('builds the Girocode payload', () => {
    expect(epcTemplate.buildPayload(base)).toBe(
      ['BCD', '002', '1', 'SCT', 'BCITITMM', 'Acme Srl', 'IT60X0542811101000000123456', 'EUR12.50', '', '', 'Invoice 42'].join('\n'),
    );
  });
  it('omits optional trailing lines', () => {
    expect(epcTemplate.buildPayload({ ...base, bic: '', amount: '', remittance: '' })).toBe(
      ['BCD', '002', '1', 'SCT', '', 'Acme Srl', 'IT60X0542811101000000123456'].join('\n'),
    );
  });
  it('validates name, IBAN checksum, BIC, amount range and lengths', () => {
    expect(epcTemplate.validate(base)).toEqual({});
    expect(epcTemplate.validate({ ...base, name: '', iban: '' })).toEqual({ name: 'required', iban: 'required' });
    expect(epcTemplate.validate({ ...base, iban: 'IT60X0542811101000000123457' })).toEqual({ iban: 'invalidIban' });
    expect(epcTemplate.validate({ ...base, bic: 'XX' })).toEqual({ bic: 'invalidBic' });
    expect(epcTemplate.validate({ ...base, amount: '1000000000' })).toEqual({ amount: 'amountOutOfRange' });
    expect(epcTemplate.validate({ ...base, amount: '999999999,99' })).toEqual({});
    expect(epcTemplate.validate({ ...base, amount: '0,01' })).toEqual({});
    expect(epcTemplate.validate({ ...base, amount: '0' })).toEqual({ amount: 'invalidAmount' });
    expect(epcTemplate.validate({ ...base, name: 'x'.repeat(71), remittance: 'y'.repeat(141) })).toEqual({
      name: 'tooLong', remittance: 'tooLong',
    });
  });
});

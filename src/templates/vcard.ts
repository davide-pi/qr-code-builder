import { Contact } from 'lucide-react';
import { defaultVCardData, type VCardData } from '../types/qr';
import { VCardForm } from './forms/ContactForms';
import { CRLF, escapeText, toSingleLine } from './lib/text';
import { isValidUrl, normalizeUrl } from './lib/url';
import type { FieldErrors, QRTemplate } from './types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const displayName = (data: VCardData): string =>
  `${data.firstName} ${data.lastName}`.trim() || data.organization.trim();

// vCard 3.0 (RFC 2426)
const buildPayload = (data: VCardData): string => {
  const fullName = displayName(data);
  if (!fullName) return '';
  const hasAddress = [data.address, data.city, data.state, data.zip, data.country].some(Boolean);
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    // N and FN are mandatory in 3.0; FN falls back to the organization
    `N:${escapeText(data.lastName.trim())};${escapeText(data.firstName.trim())};;;`,
    `FN:${escapeText(fullName)}`,
    data.organization && `ORG:${escapeText(data.organization.trim())}`,
    data.title && `TITLE:${escapeText(data.title.trim())}`,
    data.phone && `TEL:${escapeText(toSingleLine(data.phone))}`,
    data.email && `EMAIL:${escapeText(toSingleLine(data.email))}`,
    // URL is a URI value: it is not TEXT-escaped, only kept on one line
    data.website && `URL:${toSingleLine(normalizeUrl(data.website))}`,
    hasAddress &&
      `ADR:;;${escapeText(data.address)};${escapeText(data.city)};${escapeText(data.state)};${escapeText(data.zip)};${escapeText(data.country)}`,
    'END:VCARD',
  ];
  return lines.filter(Boolean).join(CRLF);
};

const validate = (data: VCardData): FieldErrors<VCardData> => {
  const errors: FieldErrors<VCardData> = {};
  if (!displayName(data)) errors.firstName = 'nameOrOrganizationRequired';
  if (data.phone.trim() && (data.phone.match(/\d/g) ?? []).length < 3) {
    errors.phone = 'invalidPhone';
  }
  if (data.email.trim() && !EMAIL_PATTERN.test(data.email.trim())) errors.email = 'invalidEmail';
  if (data.website.trim() && !isValidUrl(data.website)) errors.website = 'invalidUrl';
  return errors;
};

export const vcardTemplate: QRTemplate<VCardData> = {
  type: 'vcard',
  category: 'contact',
  icon: Contact,
  defaultData: () => ({ ...defaultVCardData }),
  validate,
  buildPayload,
  Form: VCardForm,
};

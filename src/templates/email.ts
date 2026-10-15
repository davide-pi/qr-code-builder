import { Mail } from 'lucide-react';
import { defaultEmailData, type EmailData } from '../types/qr';
import { EmailForm } from './forms/ContactForms';
import type { FieldErrors, QRTemplate } from './types';

const EMAIL_PATTERN = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

// The address field accepts several recipients separated by "," or ";"
const parseAddresses = (value: string): string[] =>
  value.split(/[,;]/).map((address) => address.trim()).filter(Boolean);

// RFC 6068: "@" stays readable in the address, line breaks are CRLF
const buildPayload = (data: EmailData): string => {
  const addresses = parseAddresses(data.email);
  if (addresses.length === 0) return '';
  const to = addresses.map((address) => encodeURIComponent(address).replace(/%40/g, '@')).join(',');
  const params: string[] = [];
  if (data.subject.trim()) params.push(`subject=${encodeURIComponent(data.subject)}`);
  if (data.body.trim()) params.push(`body=${encodeURIComponent(data.body.replace(/\r?\n/g, '\r\n'))}`);
  return `mailto:${to}${params.length > 0 ? `?${params.join('&')}` : ''}`;
};

const validate = (data: EmailData): FieldErrors<EmailData> => {
  const addresses = parseAddresses(data.email);
  if (addresses.length === 0) return { email: 'required' };
  return addresses.every((address) => EMAIL_PATTERN.test(address)) ? {} : { email: 'invalidEmail' };
};

export const emailTemplate: QRTemplate<EmailData> = {
  type: 'email',
  category: 'contact',
  icon: Mail,
  defaultData: () => ({ ...defaultEmailData }),
  validate,
  buildPayload,
  Form: EmailForm,
};

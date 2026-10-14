import { MessageCircle, MessageSquare, Phone } from 'lucide-react';
import {
  defaultPhoneData, defaultSMSData, defaultWhatsAppData,
  type PhoneData, type SMSData, type WhatsAppData,
} from '../types/qr';
import { PhoneCallForm, SmsForm, WhatsAppForm } from './forms/ContactForms';
import { toE164 } from './lib/e164';
import type { FieldErrors, QRTemplate } from './types';

// Shared phone check: the number is required and must resolve to a plausible E.164 number
const validatePhone = (data: { countryCode: string; phone: string }): FieldErrors<{ phone: string }> => {
  if (!data.phone.trim()) return { phone: 'required' };
  return toE164(data.countryCode, data.phone) ? {} : { phone: 'invalidPhone' };
};

export const phoneTemplate: QRTemplate<PhoneData> = {
  type: 'phone',
  category: 'contact',
  icon: Phone,
  defaultData: () => ({ ...defaultPhoneData }),
  validate: validatePhone,
  buildPayload: (data) => {
    const number = toE164(data.countryCode, data.phone);
    return number ? `tel:${number}` : '';
  },
  Form: PhoneCallForm,
};

export const smsTemplate: QRTemplate<SMSData> = {
  type: 'sms',
  category: 'contact',
  icon: MessageSquare,
  defaultData: () => ({ ...defaultSMSData }),
  validate: validatePhone,
  buildPayload: (data) => {
    const number = toE164(data.countryCode, data.phone);
    if (!number) return '';
    return `sms:${number}${data.message ? `?body=${encodeURIComponent(data.message)}` : ''}`;
  },
  Form: SmsForm,
};

export const whatsappTemplate: QRTemplate<WhatsAppData> = {
  type: 'whatsapp',
  category: 'contact',
  icon: MessageCircle,
  defaultData: () => ({ ...defaultWhatsAppData }),
  validate: validatePhone,
  buildPayload: (data) => {
    const number = toE164(data.countryCode, data.phone);
    if (!number) return '';
    // wa.me wants the international number without the "+"
    return `https://wa.me/${number.slice(1)}${data.message ? `?text=${encodeURIComponent(data.message)}` : ''}`;
  },
  Form: WhatsAppForm,
};

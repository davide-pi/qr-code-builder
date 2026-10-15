import type { QRTemplateData, QRTemplateType, TemplateDataMap, TemplateFormData } from '../types/qr';
import { calendarTemplate } from './calendar';
import { emailTemplate } from './email';
import { locationTemplate } from './location';
import { bitcoinTemplate, epcTemplate, paypalTemplate } from './payments';
import { phoneTemplate, smsTemplate, whatsappTemplate } from './phoneTemplates';
import {
  facebookTemplate, instagramTemplate, linkedinTemplate, snapchatTemplate,
  telegramTemplate, tiktokTemplate, twitterTemplate, youtubeTemplate,
} from './social';
import type { FieldErrors, QRTemplate } from './types';
import { urlTemplate } from './url';
import { vcardTemplate } from './vcard';
import { wifiTemplate } from './wifi';

export type { ErrorKey, FieldErrors, QRTemplate, TemplateFormProps } from './types';

// Every template, checked against the data type of its own type key
const registry: { [K in QRTemplateType]: QRTemplate<TemplateDataMap[K]> } = {
  url: urlTemplate,
  vcard: vcardTemplate,
  email: emailTemplate,
  sms: smsTemplate,
  phone: phoneTemplate,
  whatsapp: whatsappTemplate,
  telegram: telegramTemplate,
  instagram: instagramTemplate,
  twitter: twitterTemplate,
  linkedin: linkedinTemplate,
  tiktok: tiktokTemplate,
  youtube: youtubeTemplate,
  facebook: facebookTemplate,
  snapchat: snapchatTemplate,
  paypal: paypalTemplate,
  bitcoin: bitcoinTemplate,
  epc: epcTemplate,
  wifi: wifiTemplate,
  calendar: calendarTemplate,
  location: locationTemplate,
};

// Display order of the dropdown (grouped by category there)
export const templateTypes = Object.keys(registry) as QRTemplateType[];

// The registry cannot correlate a runtime `type` with its data type: this is the one cast
export const getTemplate = (type: QRTemplateType): QRTemplate<QRTemplateData> =>
  registry[type] as unknown as QRTemplate<QRTemplateData>;

export const isTemplateType = (value: unknown): value is QRTemplateType =>
  typeof value === 'string' && Object.hasOwn(registry, value);

// Fresh default data of every template
export const createDefaultFormData = (): TemplateFormData =>
  Object.fromEntries(templateTypes.map((type) => [type, getTemplate(type).defaultData()])) as TemplateFormData;

export interface TemplateEvaluation {
  errors: FieldErrors<QRTemplateData>;
  valid: boolean;
  // Text to encode; '' while the data is invalid
  payload: string;
}

export function evaluateTemplate(type: QRTemplateType, data: QRTemplateData): TemplateEvaluation {
  const template = getTemplate(type);
  const errors = template.validate(data);
  const valid = Object.keys(errors).length === 0;
  return { errors, valid, payload: valid ? template.buildPayload(data) : '' };
}

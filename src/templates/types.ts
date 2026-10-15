import type { LucideIcon } from 'lucide-react';
import type { ComponentType } from 'react';
import type { Translations } from '../i18n/types';
import type { QRTemplateType, TemplateCategory } from '../types/qr';

// Key of a translated validation message (`t.qrDataInput.errors[key]`)
export type ErrorKey = keyof Translations['qrDataInput']['errors'];

// Validation result: only the invalid fields are present
export type FieldErrors<D> = Partial<Record<keyof D, ErrorKey>>;

export interface TemplateFormProps<D> {
  data: D;
  onChange: (data: D) => void;
  errors: FieldErrors<D>;
}

// A QR content template. `validate` and `buildPayload` are pure; `buildPayload`
// assumes the data passed `validate` and returns '' when there is nothing to encode.
export interface QRTemplate<D> {
  type: QRTemplateType;
  category: Exclude<TemplateCategory, 'all'>;
  icon: LucideIcon;
  defaultData: () => D;
  validate: (data: D) => FieldErrors<D>;
  buildPayload: (data: D) => string;
  Form: ComponentType<TemplateFormProps<D>>;
}

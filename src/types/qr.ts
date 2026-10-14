import type { DotType, CornerSquareType, CornerDotType, GradientType, ErrorCorrectionLevel } from 'qr-code-styling';
import { getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js';

// Template Categories
export type TemplateCategory = 'all' | 'links' | 'contact' | 'social' | 'payment';

// QR Content Template Types
export type QRTemplateType =
  // Links
  | 'url'
  // Contact
  | 'vcard' | 'email' | 'sms' | 'phone'
  // Messaging
  | 'whatsapp' | 'telegram'
  // Social
  | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube' | 'facebook' | 'snapchat'
  // Payment
  | 'paypal' | 'bitcoin' | 'epc'
  // Utilities
  | 'wifi' | 'calendar' | 'location';

export interface URLData {
  url: string;
}

export interface VCardData {
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface WiFiData {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface EmailData {
  email: string;
  subject: string;
  body: string;
}

export interface SMSData {
  countryCode: string;
  phone: string;
  message: string;
}

export interface CalendarData {
  title: string;
  location: string;
  description: string;
  startDate: string; // ISO format
  endDate: string; // ISO format
  allDay: boolean;
}

export interface LocationData {
  latitude: string;
  longitude: string;
  label: string;
}

// Phone Call Data
export interface PhoneData {
  countryCode: string;
  phone: string;
}

// WhatsApp Data
export interface WhatsAppData {
  countryCode: string;
  phone: string;
  message: string;
}

// Telegram Data
export interface TelegramData {
  username: string;
  message: string;
}

// Social Media Data (generic for all platforms)
export interface SocialMediaData {
  username: string;
}

// PayPal Data
export interface PayPalData {
  username: string;
  amount: string;
  currency: string;
}

// Bitcoin Data
export interface BitcoinData {
  address: string;
  amount: string;
  label: string;
}

// SEPA credit transfer (EPC069-12 "Girocode")
export interface EPCData {
  name: string;
  iban: string;
  bic: string;
  amount: string;
  remittance: string;
}

// Form data type of every template, keyed by template type
export interface TemplateDataMap {
  url: URLData;
  vcard: VCardData;
  wifi: WiFiData;
  email: EmailData;
  sms: SMSData;
  calendar: CalendarData;
  location: LocationData;
  phone: PhoneData;
  whatsapp: WhatsAppData;
  telegram: TelegramData;
  instagram: SocialMediaData;
  twitter: SocialMediaData;
  linkedin: SocialMediaData;
  tiktok: SocialMediaData;
  youtube: SocialMediaData;
  facebook: SocialMediaData;
  snapchat: SocialMediaData;
  paypal: PayPalData;
  bitcoin: BitcoinData;
  epc: EPCData;
}

export type QRTemplateData = TemplateDataMap[QRTemplateType];

// In-memory form state of every template (never persisted: it holds personal data)
export type TemplateFormData = { [K in QRTemplateType]: TemplateDataMap[K] };

export interface GradientConfig {
  enabled: boolean;
  type: GradientType;
  colorStops: { offset: number; color: string }[];
  rotation: number;
}

export interface QROptions {
  data: string;
  templateType: QRTemplateType;
  size: number;
  margin: number;
  // Error correction
  errorCorrectionLevel: ErrorCorrectionLevel;
  // Dot options
  dotColor: string;
  dotGradient: GradientConfig;
  dotType: DotType;
  // Corner square options
  cornerSquareColor: string;
  cornerSquareType: CornerSquareType;
  // Corner dot options
  cornerDotColor: string;
  cornerDotType: CornerDotType;
  // Background options
  backgroundColor: string;
  transparentBackground: boolean;
  // Image options
  image: string;
  imageSize: number;
  imageMargin: number;
}
export const defaultQROptions: QROptions = {
  data: '',
  templateType: 'url',
  size: 300,
  margin: 10,
  errorCorrectionLevel: 'M',
  dotColor: '#000000',
  dotGradient: {
    enabled: false,
    type: 'linear',
    colorStops: [
      { offset: 0, color: '#000000' },
      { offset: 1, color: '#4a90d9' },
    ],
    rotation: 0,
  },
  dotType: 'square',
  cornerSquareColor: '#000000',
  cornerSquareType: 'square',
  cornerDotColor: '#000000',
  cornerDotType: 'square',
  backgroundColor: '#ffffff',
  transparentBackground: false,
  image: '',
  imageSize: 0.2,
  imageMargin: 5,
};

// Default template data
export const defaultURLData: URLData = {
  url: '',
};

export const defaultVCardData: VCardData = {
  firstName: '',
  lastName: '',
  organization: '',
  title: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: '',
};

export const defaultWiFiData: WiFiData = {
  ssid: '',
  password: '',
  encryption: 'WPA',
  hidden: false,
};

export const defaultEmailData: EmailData = {
  email: '',
  subject: '',
  body: '',
};

export const defaultSMSData: SMSData = {
  countryCode: '+39',
  phone: '',
  message: '',
};

// Format a date as YYYY-MM-DDTHH:MM in LOCAL time, as expected by datetime-local inputs
// (toISOString would shift it to UTC)
const toLocalDateTime = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Helper to get current datetime in format for datetime-local input
const getCurrentDateTime = (): string => toLocalDateTime(new Date());

// Helper to get datetime 1 hour from now
const getOneHourLater = (): string => toLocalDateTime(new Date(Date.now() + 60 * 60 * 1000));

export const getDefaultCalendarData = (): CalendarData => ({
  title: '',
  location: '',
  description: '',
  startDate: getCurrentDateTime(),
  endDate: getOneHourLater(),
  allDay: false,
});

export const defaultLocationData: LocationData = {
  latitude: '',
  longitude: '',
  label: '',
};

export const defaultPhoneData: PhoneData = {
  countryCode: '+39',
  phone: '',
};

export const defaultWhatsAppData: WhatsAppData = {
  countryCode: '+39',
  phone: '',
  message: '',
};

export const defaultTelegramData: TelegramData = {
  username: '',
  message: '',
};

export const defaultSocialMediaData: SocialMediaData = {
  username: '',
};

export const defaultPayPalData: PayPalData = {
  username: '',
  amount: '',
  currency: 'EUR',
};

export const defaultBitcoinData: BitcoinData = {
  address: '',
  amount: '',
  label: '',
};

export const defaultEPCData: EPCData = {
  name: '',
  iban: '',
  bic: '',
  amount: '',
  remittance: '',
};

export const dotTypes: DotType[] = ['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'];
export const cornerSquareTypes: CornerSquareType[] = ['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded', 'dot'];
export const cornerDotTypes: CornerDotType[] = ['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded', 'dot'];
export const gradientTypes: GradientType[] = ['linear', 'radial'];
export const errorCorrectionLevels: { value: ErrorCorrectionLevel; label: string; description: string }[] = [
  { value: 'L', label: 'Low (L)', description: '~7% damage recovery. Best for clean environments.' },
  { value: 'M', label: 'Medium (M)', description: '~15% damage recovery. Good balance of size and reliability.' },
  { value: 'Q', label: 'Quartile (Q)', description: '~25% damage recovery. Good for moderate damage resistance.' },
  { value: 'H', label: 'High (H)', description: '~30% damage recovery. Best when using center logo.' },
];

// Common country codes for phone numbers (generated from libphonenumber-js)
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

// Priority countries to show at the top of the list
const priorityCountries: CountryCode[] = ['IT', 'US', 'GB', 'DE', 'FR', 'ES'];

const allCountryCodes = getCountries()
  .map((countryCode) => ({
    countryCode,
    code: `+${getCountryCallingCode(countryCode)}`,
    country: countryNames.of(countryCode) || countryCode,
  }))
  .sort((a, b) => a.country.localeCompare(b.country));

// Put priority countries at the top, then the rest alphabetically
export const countryCodes: { code: string; country: string }[] = [
  ...priorityCountries
    .map((cc) => allCountryCodes.find((c) => c.countryCode === cc)!)
    .filter(Boolean)
    .map(({ code, country }) => ({ code, country })),
  ...allCountryCodes
    .filter((c) => !priorityCountries.includes(c.countryCode))
    .map(({ code, country }) => ({ code, country })),
];

// Local storage key
export const STORAGE_KEY = 'qr-generator-settings';
export const PRESETS_KEY = 'qr-generator-presets';

// Color presets
export interface ColorPreset {
  name: string;
  dotColor: string;
  cornerSquareColor: string;
  cornerDotColor: string;
  backgroundColor: string;
}

export const defaultColorPresets: ColorPreset[] = [
  { name: 'Classic', dotColor: '#000000', cornerSquareColor: '#000000', cornerDotColor: '#000000', backgroundColor: '#ffffff' },
  { name: 'Ocean', dotColor: '#0077b6', cornerSquareColor: '#023e8a', cornerDotColor: '#03045e', backgroundColor: '#caf0f8' },
  { name: 'Forest', dotColor: '#2d6a4f', cornerSquareColor: '#1b4332', cornerDotColor: '#081c15', backgroundColor: '#d8f3dc' },
  { name: 'Sunset', dotColor: '#e63946', cornerSquareColor: '#d62828', cornerDotColor: '#6a040f', backgroundColor: '#fff1e6' },
  { name: 'Purple', dotColor: '#7b2cbf', cornerSquareColor: '#5a189a', cornerDotColor: '#3c096c', backgroundColor: '#e0aaff' },
  { name: 'Monochrome', dotColor: '#333333', cornerSquareColor: '#1a1a1a', cornerDotColor: '#000000', backgroundColor: '#f5f5f5' },
];

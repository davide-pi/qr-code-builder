import type { DotType, CornerSquareType, CornerDotType, GradientType, ErrorCorrectionLevel } from 'qr-code-styling';

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
  | 'paypal' | 'bitcoin'
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
  phone: string;
}

// WhatsApp Data
export interface WhatsAppData {
  phone: string;
  message: string;
}

// Telegram Data
export interface TelegramData {
  username: string;
}

// Social Media Data (generic for all platforms)
export interface SocialMediaData {
  username: string;
}

// PayPal Data
export interface PayPalData {
  username: string;
  amount?: string;
  currency?: string;
}

// Bitcoin Data
export interface BitcoinData {
  address: string;
  amount?: string;
  label?: string;
}

export type QRTemplateData =
  | URLData | VCardData | WiFiData | EmailData | SMSData | CalendarData | LocationData
  | PhoneData | WhatsAppData | TelegramData | SocialMediaData | PayPalData | BitcoinData;

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
  imageSize: number; // 0.2 to 0.3 (20-30%)
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
  imageSize: 0.25,
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
  phone: '',
  message: '',
};

export const defaultCalendarData: CalendarData = {
  title: '',
  location: '',
  description: '',
  startDate: '',
  endDate: '',
  allDay: false,
};

export const defaultLocationData: LocationData = {
  latitude: '',
  longitude: '',
  label: '',
};

export const defaultPhoneData: PhoneData = {
  phone: '',
};

export const defaultWhatsAppData: WhatsAppData = {
  phone: '',
  message: '',
};

export const defaultTelegramData: TelegramData = {
  username: '',
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

// Template definition with categories
export interface TemplateDefinition {
  type: QRTemplateType;
  label: string;
  category: TemplateCategory;
  description: string;
}

export const templateDefinitions: TemplateDefinition[] = [
  // Links
  { type: 'url', label: 'URL', category: 'links', description: 'Website or link' },
  // Contact & Messaging
  { type: 'vcard', label: 'vCard', category: 'contact', description: 'Contact card' },
  { type: 'email', label: 'Email', category: 'contact', description: 'Email message' },
  { type: 'sms', label: 'SMS', category: 'contact', description: 'Text message' },
  { type: 'phone', label: 'Phone', category: 'contact', description: 'Phone call' },
  { type: 'whatsapp', label: 'WhatsApp', category: 'contact', description: 'WhatsApp message' },
  { type: 'telegram', label: 'Telegram', category: 'contact', description: 'Telegram profile' },
  // Social
  { type: 'instagram', label: 'Instagram', category: 'social', description: 'Instagram profile' },
  { type: 'twitter', label: 'Twitter/X', category: 'social', description: 'Twitter profile' },
  { type: 'linkedin', label: 'LinkedIn', category: 'social', description: 'LinkedIn profile' },
  { type: 'tiktok', label: 'TikTok', category: 'social', description: 'TikTok profile' },
  { type: 'youtube', label: 'YouTube', category: 'social', description: 'YouTube channel' },
  { type: 'facebook', label: 'Facebook', category: 'social', description: 'Facebook page' },
  { type: 'snapchat', label: 'Snapchat', category: 'social', description: 'Snapchat profile' },
  // Payment
  { type: 'paypal', label: 'PayPal', category: 'payment', description: 'PayPal payment' },
  { type: 'bitcoin', label: 'Bitcoin', category: 'payment', description: 'Bitcoin address' },
  // Utilities (shown in 'all' or could add 'utilities' category)
  { type: 'wifi', label: 'WiFi', category: 'links', description: 'WiFi credentials' },
  { type: 'calendar', label: 'Event', category: 'links', description: 'Calendar event' },
  { type: 'location', label: 'Location', category: 'links', description: 'Geo location' },
];

export const categoryLabels: Record<TemplateCategory, string> = {
  all: 'All',
  links: 'Links',
  contact: 'Contact & Messaging',
  social: 'Social',
  payment: 'Payment',
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

import { Link } from 'lucide-react';
import { defaultURLData, type URLData } from '../types/qr';
import { UrlForm } from './forms/LinkForms';
import { isValidUrl, normalizeUrl } from './lib/url';
import type { QRTemplate } from './types';

export const urlTemplate: QRTemplate<URLData> = {
  type: 'url',
  category: 'links',
  icon: Link,
  defaultData: () => ({ ...defaultURLData }),
  validate: (data) => {
    if (!data.url.trim()) return { url: 'required' };
    return isValidUrl(data.url) ? {} : { url: 'invalidUrl' };
  },
  buildPayload: (data) => normalizeUrl(data.url),
  Form: UrlForm,
};

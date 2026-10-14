import { Wifi } from 'lucide-react';
import { defaultWiFiData, type WiFiData } from '../types/qr';
import { WifiForm } from './forms/LinkForms';
import { escapeWifi } from './lib/text';
import type { QRTemplate } from './types';

// WPA, WPA2 and WPA3 networks (transition mode) all use `T:WPA`. A WPA3-only network would
// need `T:SAE`, which is not understood by every scanner, so it is not offered.
const buildPayload = (data: WiFiData): string => {
  if (!data.ssid) return '';
  const parts = [`T:${data.encryption}`, `S:${escapeWifi(data.ssid)}`];
  if (data.encryption !== 'nopass' && data.password) parts.push(`P:${escapeWifi(data.password)}`);
  if (data.hidden) parts.push('H:true');
  return `WIFI:${parts.join(';')};;`;
};

export const wifiTemplate: QRTemplate<WiFiData> = {
  type: 'wifi',
  category: 'links',
  icon: Wifi,
  defaultData: () => ({ ...defaultWiFiData }),
  validate: (data) => (data.ssid ? {} : { ssid: 'required' }),
  buildPayload,
  Form: WifiForm,
};

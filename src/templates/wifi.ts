import { Wifi } from 'lucide-react';
import { defaultWiFiData, type WiFiData } from '../types/qr';
import { WifiForm } from './forms/LinkForms';
import { escapeWifi } from './lib/text';
import type { QRTemplate } from './types';

// ZXing convention: a value made only of hex digits would be read as a hex-encoded string,
// so it is wrapped in double quotes
const escapeWifiValue = (value: string): string =>
  /^[0-9a-f]+$/i.test(value) ? `"${value}"` : escapeWifi(value);

// WPA, WPA2 and WPA3 networks (transition mode) all use `T:WPA`. A WPA3-only network would
// need `T:SAE`, which is not understood by every scanner, so it is not offered.
const buildPayload = (data: WiFiData): string => {
  if (!data.ssid) return '';
  const parts = [`T:${data.encryption}`, `S:${escapeWifiValue(data.ssid)}`];
  if (data.encryption !== 'nopass' && data.password) parts.push(`P:${escapeWifiValue(data.password)}`);
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

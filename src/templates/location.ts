import { MapPin } from 'lucide-react';
import { defaultLocationData, type LocationData } from '../types/qr';
import { LocationForm } from './forms/LinkForms';
import type { FieldErrors, QRTemplate } from './types';

// Accepts a comma or a dot as decimal separator; returns the dotted string or null
const parseCoordinate = (value: string, limit: number): string | null => {
  const normalized = value.trim().replace(',', '.').replace(/^\+/, '');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(normalized)) return null;
  return Math.abs(Number(normalized)) <= limit ? normalized : null;
};

// RFC 5870 geo URI; the `q` parameter (understood by map apps) carries the label
const buildPayload = (data: LocationData): string => {
  const latitude = parseCoordinate(data.latitude, 90);
  const longitude = parseCoordinate(data.longitude, 180);
  if (latitude === null || longitude === null) return '';
  const point = `${latitude},${longitude}`;
  const label = data.label.trim();
  // Parentheses delimit the label in `q`, so they are percent-encoded inside it
  const encodedLabel = encodeURIComponent(label).replace(/\(/g, '%28').replace(/\)/g, '%29');
  return label ? `geo:${point}?q=${point}(${encodedLabel})` : `geo:${point}`;
};

const validate = (data: LocationData): FieldErrors<LocationData> => {
  const errors: FieldErrors<LocationData> = {};
  if (!data.latitude.trim()) errors.latitude = 'required';
  else if (parseCoordinate(data.latitude, 90) === null) errors.latitude = 'invalidLatitude';
  if (!data.longitude.trim()) errors.longitude = 'required';
  else if (parseCoordinate(data.longitude, 180) === null) errors.longitude = 'invalidLongitude';
  return errors;
};

export const locationTemplate: QRTemplate<LocationData> = {
  type: 'location',
  category: 'links',
  icon: MapPin,
  defaultData: () => ({ ...defaultLocationData }),
  validate,
  buildPayload,
  Form: LocationForm,
};

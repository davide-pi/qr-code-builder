import { isTemplateType } from '../../templates';
import type { QROptions } from '../../types/qr';
import { defaultQROptions, errorCorrectionLevels } from '../../types/qr';
import { parseImportedPresets, type PresetStyle } from '../QROptions/presetStorage';

// Accepted ranges of the numeric settings. The size is fixed at 300 today (no UI), the logo
// ranges mirror the sliders of the options panel.
export const MIN_SIZE = 100;
export const MAX_SIZE = 1000;
export const MARGIN_RATIO = 0.15; // the margin never exceeds 15% of the size
const MIN_IMAGE_SIZE = 0.1;
const MAX_IMAGE_SIZE = 0.3;
const MAX_IMAGE_MARGIN = 5;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

// presetStorage keeps `parseStyle` private; its public import goes through the same strict
// validation, so a one-entry list is used to reuse it (colors, types and gradient are checked,
// unknown keys dropped)
const parseStyle = (value: unknown): PresetStyle | null =>
  parseImportedPresets(JSON.stringify([{ name: 'saved', style: value }]))?.[0].style ?? null;

// Validates the untrusted JSON read from localStorage and merges it with the defaults, so a
// corrupted or hand-edited value can never reach the preview. `data` and `image` are never restored.
export const parseSavedOptions = (raw: string | null): QROptions => {
  let saved: unknown;
  try {
    saved = raw ? JSON.parse(raw) : null;
  } catch {
    return defaultQROptions;
  }
  if (!isRecord(saved)) return defaultQROptions;

  // Fields added after the settings were saved fall back to the defaults before validating
  const style = parseStyle({
    ...defaultQROptions,
    ...saved,
    dotGradient: { ...defaultQROptions.dotGradient, ...(isRecord(saved.dotGradient) ? saved.dotGradient : {}) },
  });

  const size = isFiniteNumber(saved.size) ? Math.round(clamp(saved.size, MIN_SIZE, MAX_SIZE)) : defaultQROptions.size;
  const margin = isFiniteNumber(saved.margin)
    ? Math.round(clamp(saved.margin, 0, Math.floor(size * MARGIN_RATIO)))
    : Math.min(defaultQROptions.margin, Math.floor(size * MARGIN_RATIO));
  // Older versions stored the logo size in pixels: convert it back to a ratio
  const imageSize = isFiniteNumber(saved.imageSize)
    ? clamp(saved.imageSize > 1 ? saved.imageSize / defaultQROptions.size : saved.imageSize, MIN_IMAGE_SIZE, MAX_IMAGE_SIZE)
    : defaultQROptions.imageSize;
  const imageMargin = isFiniteNumber(saved.imageMargin)
    ? Math.round(clamp(saved.imageMargin, 0, MAX_IMAGE_MARGIN))
    : defaultQROptions.imageMargin;
  const errorCorrectionLevel = errorCorrectionLevels.find((level) => level === saved.errorCorrectionLevel)
    ?? defaultQROptions.errorCorrectionLevel;

  return {
    ...defaultQROptions,
    ...style,
    size,
    margin,
    errorCorrectionLevel,
    imageSize,
    imageMargin,
    templateType: isTemplateType(saved.templateType) ? saved.templateType : defaultQROptions.templateType,
  };
};

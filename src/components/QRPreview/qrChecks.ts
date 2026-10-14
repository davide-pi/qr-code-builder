import type { ErrorCorrectionLevel } from 'qr-code-styling';
import type { QROptions } from '../../types/qr';

// QR version 40 byte-mode capacity per error correction level.
const MAX_BYTES: Record<ErrorCorrectionLevel, number> = {
  L: 2953,
  M: 2331,
  Q: 1663,
  H: 1273,
};

const encoder = new TextEncoder();

export interface CapacityInfo {
  used: number;
  max: number;
  exceeded: boolean;
}

/** Compares the UTF-8 size of the payload against the byte-mode capacity of the EC level. */
export function getCapacity(data: string, level: ErrorCorrectionLevel): CapacityInfo {
  const used = encoder.encode(data).length;
  const max = MAX_BYTES[level];
  return { used, max, exceeded: used > max };
}

type RGB = [number, number, number];

/** Parses #rgb / #rrggbb (alpha ignored). Returns null for any other color syntax. */
function parseHex(color: string): RGB | null {
  const match = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(color.trim());
  if (!match) return null;
  let hex = match[1];
  if (hex.length <= 4) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
}

/** WCAG relative luminance. */
function luminance([r, g, b]: RGB): number {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrastRatio(a: number, b: number): number {
  const [hi, lo] = a >= b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

export type ScanWarning =
  | { kind: 'lowContrast'; ratio: number }
  | { kind: 'inverted' }
  | { kind: 'logoNeedsHighEc' };

const MIN_CONTRAST = 4.5;

/** Non-blocking heuristics about how reliably the current style will scan. */
export function getScanWarnings(options: QROptions): ScanWarning[] {
  const warnings: ScanWarning[] = [];

  const foreground = [
    ...(options.dotGradient.enabled
      ? options.dotGradient.colorStops.map((stop) => stop.color)
      : [options.dotColor]),
    options.cornerSquareColor,
    options.cornerDotColor,
  ]
    .map(parseHex)
    .filter((rgb): rgb is RGB => rgb !== null)
    .map(luminance);

  // A transparent background is assumed to sit on white.
  const background = options.transparentBackground ? 1 : parseHex(options.backgroundColor);
  const backgroundLum = typeof background === 'number'
    ? background
    : background
      ? luminance(background)
      : null;

  if (foreground.length > 0 && backgroundLum !== null) {
    const worst = Math.min(...foreground.map((lum) => contrastRatio(lum, backgroundLum)));
    if (worst < MIN_CONTRAST) {
      warnings.push({ kind: 'lowContrast', ratio: Math.floor(worst * 10) / 10 });
    }
    if (foreground.some((lum) => lum > backgroundLum)) {
      warnings.push({ kind: 'inverted' });
    }
  }

  if (options.image && options.errorCorrectionLevel !== 'H' && options.errorCorrectionLevel !== 'Q') {
    warnings.push({ kind: 'logoNeedsHighEc' });
  }

  return warnings;
}

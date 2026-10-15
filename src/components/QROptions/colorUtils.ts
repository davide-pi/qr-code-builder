import type { ColorPreset, QROptions } from '../../types/qr';

/** Accepts #rrggbb, #rgb and the same without the leading "#". Returns lowercase #rrggbb, or null. */
export function normalizeHex(input: string): string | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!match) return null;
  const hex = match[1].length === 3 ? match[1].replace(/./g, (c) => c + c) : match[1];
  return `#${hex.toLowerCase()}`;
}

/** True when the current colors are exactly those of the preset (no gradient, opaque background). */
export function matchesPreset(options: QROptions, preset: ColorPreset): boolean {
  const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  return (
    !options.dotGradient.enabled &&
    !options.transparentBackground &&
    same(options.dotColor, preset.dotColor) &&
    same(options.cornerSquareColor, preset.cornerSquareColor) &&
    same(options.cornerDotColor, preset.cornerDotColor) &&
    same(options.backgroundColor, preset.backgroundColor)
  );
}

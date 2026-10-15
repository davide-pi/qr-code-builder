import { describe, expect, it } from 'vitest';
import { defaultColorPresets, defaultQROptions } from '../../types/qr';
import { matchesPreset, normalizeHex } from './colorUtils';

describe('normalizeHex', () => {
  it('accepts #rrggbb, #rgb and the same without the hash', () => {
    expect(normalizeHex('#1A2B3C')).toBe('#1a2b3c');
    expect(normalizeHex('1a2b3c')).toBe('#1a2b3c');
    expect(normalizeHex('#abc')).toBe('#aabbcc');
    expect(normalizeHex('F0a')).toBe('#ff00aa');
  });

  it('ignores surrounding whitespace', () => {
    expect(normalizeHex('  #123456 ')).toBe('#123456');
  });

  it('rejects anything else', () => {
    for (const bad of ['', '#', '#12', '#1234', '#12345', '#1234567', '#ggg', 'red', '##123456', '#12 345']) {
      expect(normalizeHex(bad)).toBeNull();
    }
  });
});

describe('matchesPreset', () => {
  const classic = defaultColorPresets[0];
  const ocean = defaultColorPresets[1];

  it('matches the preset that was applied, ignoring case', () => {
    const options = { ...defaultQROptions, dotColor: ocean.dotColor.toUpperCase(), cornerSquareColor: ocean.cornerSquareColor, cornerDotColor: ocean.cornerDotColor, backgroundColor: ocean.backgroundColor };
    expect(matchesPreset(options, ocean)).toBe(true);
    expect(matchesPreset(options, classic)).toBe(false);
  });

  it('does not match once a single color, the gradient or the transparency differs', () => {
    expect(matchesPreset(defaultQROptions, classic)).toBe(true);
    expect(matchesPreset({ ...defaultQROptions, cornerDotColor: '#111111' }, classic)).toBe(false);
    expect(matchesPreset({ ...defaultQROptions, dotGradient: { ...defaultQROptions.dotGradient, enabled: true } }, classic)).toBe(false);
    expect(matchesPreset({ ...defaultQROptions, transparentBackground: true }, classic)).toBe(false);
  });
});

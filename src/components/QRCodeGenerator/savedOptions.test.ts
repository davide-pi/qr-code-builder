import { describe, expect, it } from 'vitest';
import { defaultQROptions } from '../../types/qr';
import { parseSavedOptions } from './savedOptions';

const parse = (value: unknown) => parseSavedOptions(JSON.stringify(value));

describe('parseSavedOptions', () => {
  it('falls back to the defaults without a usable value', () => {
    expect(parseSavedOptions(null)).toEqual(defaultQROptions);
    expect(parseSavedOptions('{not json')).toEqual(defaultQROptions);
    expect(parse([1, 2])).toEqual(defaultQROptions);
    expect(parse('text')).toEqual(defaultQROptions);
  });

  it('restores a valid styling', () => {
    const saved = {
      ...defaultQROptions, dotColor: '#112233', dotType: 'dots', errorCorrectionLevel: 'H',
      templateType: 'wifi', margin: 20, size: 400,
    };
    expect(parse(saved)).toMatchObject({
      dotColor: '#112233', dotType: 'dots', errorCorrectionLevel: 'H', templateType: 'wifi', margin: 20, size: 400,
    });
  });

  it('never restores data or image', () => {
    const options = parse({ ...defaultQROptions, data: 'secret', image: 'data:image/png;base64,AAAA' });
    expect(options.data).toBe('');
    expect(options.image).toBe('');
  });

  it('merges fields missing from an older save with the defaults', () => {
    const withoutGradient = Object.fromEntries(Object.entries(defaultQROptions).filter(([key]) => key !== 'dotGradient'));
    expect(parse({ ...withoutGradient, dotColor: '#ff0000' })).toEqual({ ...defaultQROptions, dotColor: '#ff0000' });
    expect(parse({ dotColor: '#ff0000' })).toEqual({ ...defaultQROptions, dotColor: '#ff0000' });
  });

  it('drops the whole styling when a color, type or gradient is invalid', () => {
    expect(parse({ ...defaultQROptions, dotColor: 'red' })).toEqual(defaultQROptions);
    expect(parse({ ...defaultQROptions, dotColor: '#123456', dotType: 'blob' })).toEqual(defaultQROptions);
    expect(parse({ ...defaultQROptions, dotColor: '#123456', backgroundColor: 'url(x)' })).toEqual(defaultQROptions);
    const badGradient = { ...defaultQROptions.dotGradient, rotation: 9999 };
    expect(parse({ ...defaultQROptions, dotColor: '#123456', dotGradient: badGradient })).toEqual(defaultQROptions);
  });

  it('checks the error correction level and the template type', () => {
    expect(parse({ ...defaultQROptions, errorCorrectionLevel: 'Z' }).errorCorrectionLevel).toBe('M');
    expect(parse({ ...defaultQROptions, templateType: 'nope' }).templateType).toBe('url');
  });

  it('clamps size and margin, and ignores non-numbers', () => {
    expect(parse({ size: 99999 }).size).toBe(1000);
    expect(parse({ size: 1 }).size).toBe(100);
    expect(parse({ size: 'big' }).size).toBe(300);
    expect(parse({ size: null }).size).toBe(300);
    expect(parse({ size: 300, margin: 999 }).margin).toBe(45);
    expect(parse({ size: 300, margin: -5 }).margin).toBe(0);
    expect(parse({ margin: '10' }).margin).toBe(10);
  });

  it('migrates and clamps the logo settings', () => {
    expect(parse({ imageSize: 60 }).imageSize).toBe(0.2); // pixels from an old version
    expect(parse({ imageSize: 0.01 }).imageSize).toBe(0.1);
    expect(parse({ imageSize: 0.9 }).imageSize).toBe(0.3);
    expect(parse({ imageMargin: 50 }).imageMargin).toBe(5);
    expect(parse({ imageMargin: Infinity }).imageMargin).toBe(defaultQROptions.imageMargin);
  });
});

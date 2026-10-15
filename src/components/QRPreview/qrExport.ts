import QRCodeStyling from 'qr-code-styling';
import type { Options } from 'qr-code-styling';
import type { QROptions } from '../../types/qr';

export const EXPORT_SIZES = [512, 1024, 2048] as const;
export const DEFAULT_EXPORT_SIZE = 1024;

// Printable PDF sizes: QR side in millimetres, on an A4 portrait page.
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_MARGIN_MM = 15;
export const PDF_SIZES = ['5cm', '10cm', 'a4'] as const;
export type PdfSize = (typeof PDF_SIZES)[number];
export const DEFAULT_PDF_SIZE: PdfSize = '10cm';

const PDF_DPI = 300;
const MM_PER_INCH = 25.4;

export function getPdfSideMm(size: PdfSize): number {
  switch (size) {
    case '5cm':
      return 50;
    case '10cm':
      return 100;
    case 'a4':
      return Math.min(A4_WIDTH_MM, A4_HEIGHT_MM) - 2 * A4_MARGIN_MM;
  }
}

/** Pixel side that gives at least 300 DPI at the printed size. */
export function getPdfPixels(size: PdfSize): number {
  return Math.ceil((getPdfSideMm(size) / MM_PER_INCH) * PDF_DPI);
}

export const PDF_PAGE = { width: A4_WIDTH_MM, height: A4_HEIGHT_MM } as const;

/** Maps our state to qr-code-styling options. `px` overrides the side; margins scale with it. */
export function buildQROptions(options: QROptions, px: number = options.size, data: string = options.data): Options {
  const scale = px / options.size;
  return {
    width: px,
    height: px,
    margin: Math.round(options.margin * scale),
    data: data || ' ', // Use space as fallback to prevent crash
    qrOptions: {
      errorCorrectionLevel: options.errorCorrectionLevel,
    },
    dotsOptions: {
      type: options.dotType,
      ...(options.dotGradient.enabled
        ? {
            gradient: {
              type: options.dotGradient.type,
              rotation: options.dotGradient.rotation,
              colorStops: options.dotGradient.colorStops,
            },
          }
        : { color: options.dotColor, gradient: undefined }),
    },
    cornersSquareOptions: {
      type: options.cornerSquareType,
      color: options.cornerSquareColor,
    },
    cornersDotOptions: {
      type: options.cornerDotType,
      color: options.cornerDotColor,
    },
    backgroundOptions: options.transparentBackground
      ? undefined
      : { color: options.backgroundColor },
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: Math.round(options.imageMargin * scale),
      // Convert percentage (0.1-0.3) to ratio (0.33-1.0)
      // 10% -> 0.33, 30% -> 1.0
      imageSize: options.imageSize / 0.3,
    },
    // Only include image if it exists
    image: options.image || undefined,
  };
}

/** Renders the QR on an offscreen instance at the requested pixel side. */
export async function renderBlob(options: QROptions, extension: 'png' | 'svg', px: number): Promise<Blob> {
  const qr = new QRCodeStyling(buildQROptions(options, px));
  const data = await qr.getRawData(extension);
  if (!(data instanceof Blob)) {
    throw new Error(`Failed to render ${extension}`);
  }
  return data;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

/** Triggers a browser download. The object URL is revoked later: some browsers start reading it asynchronously. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** `qr-<template>-<yyyymmdd-hhmm>.<ext>` */
export function buildFileName(templateType: string | undefined, extension: string, now = new Date()): string {
  const slug = (templateType ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'code';
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `qr-${slug}-${date}-${time}.${extension}`;
}

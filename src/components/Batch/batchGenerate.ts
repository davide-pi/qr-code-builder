import type { QROptions } from '../../types/qr';
import { renderBlob } from '../QRPreview/qrExport';
import type { BatchRow } from './batchRows';

export interface BatchGenerateParams {
  // Rows to export (the valid ones)
  rows: readonly BatchRow[];
  // Current styling: `data` is replaced by the payload of every row
  options: QROptions;
  extension: 'png' | 'svg';
  // Side of every image in pixels
  size: number;
  signal: AbortSignal;
  onProgress: (done: number, total: number) => void;
}

export interface BatchGenerateResult {
  zip: Blob;
  // Index (1-based, as in the CSV) of the rows that could not be rendered
  failed: number[];
}

const nextTask = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const abortError = () => new DOMException('Batch generation cancelled', 'AbortError');

/**
 * Renders one image per row with the offscreen QRCodeStyling export of the single editor and
 * zips them. `fflate` is loaded on demand. Rejects with an `AbortError` when cancelled.
 */
export async function generateBatchZip(params: BatchGenerateParams): Promise<BatchGenerateResult> {
  const { rows, options, extension, size, signal, onProgress } = params;
  const { zipSync } = await import('fflate');
  const files: Record<string, [Uint8Array, { level: 0 | 6 }]> = {};
  const failed: number[] = [];

  onProgress(0, rows.length);
  for (const [i, row] of rows.entries()) {
    if (signal.aborted) throw abortError();
    try {
      const blob = await renderBlob({ ...options, data: row.payload }, extension, size);
      // PNG is already compressed: store it as is
      files[`${row.fileName}.${extension}`] = [new Uint8Array(await blob.arrayBuffer()), { level: extension === 'png' ? 0 : 6 }];
    } catch (err) {
      console.error(`Batch row ${row.index} failed:`, err);
      failed.push(row.index);
    }
    onProgress(i + 1, rows.length);
    // Let the browser paint the progress and handle the cancel click
    await nextTask();
  }
  if (signal.aborted) throw abortError();
  if (Object.keys(files).length === 0) throw new Error('No image could be rendered');

  const zipped = zipSync(files);
  // Copy into a plain ArrayBuffer-backed view: Blob does not accept SharedArrayBuffer-typed arrays
  return { zip: new Blob([new Uint8Array(zipped)], { type: 'application/zip' }), failed };
}

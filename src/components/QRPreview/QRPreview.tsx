import { useEffect, useRef, useMemo, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import type { Options } from 'qr-code-styling';
import type { QROptions } from '../../types/qr';
import { Copy, Check, Download, AlertTriangle, Loader2 } from 'lucide-react';
import { useLanguage } from '../../i18n';
import { getCapacity, getScanWarnings } from './qrChecks';
import type { ScanWarning } from './qrChecks';
import {
  DEFAULT_EXPORT_SIZE,
  DEFAULT_PDF_SIZE,
  EXPORT_SIZES,
  PDF_PAGE,
  PDF_SIZES,
  blobToDataUrl,
  buildFileName,
  buildQROptions,
  getPdfPixels,
  getPdfSideMm,
  renderBlob,
  downloadBlob,
} from './qrExport';
import type { PdfSize } from './qrExport';
import Segmented from '../Segmented/Segmented';
import './QRPreview.css';

interface QRPreviewProps {
  options: QROptions;
}

type BusyAction = 'png' | 'svg' | 'pdf' | 'copy';

const canCopyImage = typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write;

export default function QRPreview({ options }: QRPreviewProps) {
  const { t } = useLanguage();
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<QRCodeStyling | null>(null);
  const lastValidOptionsRef = useRef<Options | null>(null);
  const copyTimerRef = useRef<number | undefined>(undefined);
  const [copySuccess, setCopySuccess] = useState(false);
  const [exportSize, setExportSize] = useState<number>(DEFAULT_EXPORT_SIZE);
  const [pdfSize, setPdfSize] = useState<PdfSize>(DEFAULT_PDF_SIZE);
  const [busy, setBusy] = useState<BusyAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // Failure of the live preview, tied to the options that caused it so it clears on its own.
  const [renderFailure, setRenderFailure] = useState<{ source: Options; message: string } | null>(null);

  const isDataEmpty = !options.data || options.data.trim().length === 0;

  // Capacity is derived while rendering: no state, no effect.
  const capacity = useMemo(
    () => getCapacity(options.data || '', options.errorCorrectionLevel),
    [options.data, options.errorCorrectionLevel],
  );
  const capacityError = capacity.exceeded
    ? t.qrPreview.errors.contentTooLong
        .replace('{max}', capacity.max.toLocaleString())
        .replace('{used}', capacity.used.toLocaleString())
        .replace('{level}', options.errorCorrectionLevel)
    : null;

  // Style options for the live preview; the instance is updated only when this changes.
  const qrOptions = useMemo(() => buildQROptions(options), [options]);
  const renderError = renderFailure?.source === qrOptions ? renderFailure.message : null;

  const error = capacityError ?? renderError;
  const displayError = error ?? actionError ?? (isDataEmpty ? t.qrPreview.contentRequired : null);
  const isDataValid = !isDataEmpty && !error;

  const warnings = useMemo(() => getScanWarnings(options), [options]);

  const failedToGenerate = t.qrPreview.errors.failedToGenerate;

  // Create the instance once, then update it in place. It is recreated only when an update
  // throws, because the library clears the container before regenerating.
  useEffect(() => {
    const container = qrRef.current;
    if (!container) return;

    const create = (opts: Options) => {
      container.innerHTML = '';
      qrCodeRef.current = new QRCodeStyling(opts);
      qrCodeRef.current.append(container);
      lastValidOptionsRef.current = opts;
    };

    if (capacityError) {
      // Keep the last good render (dimmed by the error state); seed one if there is none yet.
      if (!qrCodeRef.current) create({ ...qrOptions, data: ' ' });
      return;
    }

    try {
      if (qrCodeRef.current) {
        qrCodeRef.current.update(qrOptions);
        lastValidOptionsRef.current = qrOptions;
      } else {
        create(qrOptions);
      }
    } catch (err) {
      console.error('Failed to render QR code:', err);
      // Reported from a microtask: the failure comes from the external library, not from React state.
      queueMicrotask(() => setRenderFailure({ source: qrOptions, message: failedToGenerate }));
      try {
        create(lastValidOptionsRef.current ?? { ...qrOptions, data: ' ' });
      } catch {
        // Nothing left to show; the error banner is already displayed.
      }
    }
  }, [qrOptions, capacityError, failedToGenerate]);

  useEffect(() => () => window.clearTimeout(copyTimerRef.current), []);

  const fileBase = options.templateType;

  const runAction = async (action: BusyAction, task: () => Promise<void>, failureLabel: string) => {
    if (!isDataValid || busy) return;
    setBusy(action);
    setActionError(null);
    try {
      await task();
    } catch (err) {
      console.error(`${failureLabel} failed:`, err);
      setActionError(failureLabel);
    } finally {
      setBusy(null);
    }
  };

  const copyToClipboard = () =>
    runAction(
      'copy',
      async () => {
        // The blob is passed as a promise so Safari keeps the user gesture while it renders.
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': renderBlob(options, 'png', exportSize) }),
        ]);
        setCopySuccess(true);
        window.clearTimeout(copyTimerRef.current);
        copyTimerRef.current = window.setTimeout(() => setCopySuccess(false), 2000);
      },
      t.qrPreview.errors.failedToCopy,
    );

  const downloadPNG = () =>
    runAction(
      'png',
      async () => downloadBlob(await renderBlob(options, 'png', exportSize), buildFileName(fileBase, 'png')),
      `${t.qrPreview.errors.failedToDownload} PNG`,
    );

  const downloadSVG = () =>
    runAction(
      'svg',
      // The serialized SVG already carries xmlns and the requested width/height.
      async () => downloadBlob(await renderBlob(options, 'svg', exportSize), buildFileName(fileBase, 'svg')),
      `${t.qrPreview.errors.failedToDownload} SVG`,
    );

  const downloadPDF = () =>
    runAction(
      'pdf',
      async () => {
        const [{ jsPDF }, png] = await Promise.all([
          import('jspdf'),
          renderBlob(options, 'png', getPdfPixels(pdfSize)),
        ]);
        const imgData = await blobToDataUrl(png);
        const side = getPdfSideMm(pdfSize);
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
        pdf.addImage(imgData, 'PNG', (PDF_PAGE.width - side) / 2, (PDF_PAGE.height - side) / 2, side, side);
        pdf.save(buildFileName(fileBase, 'pdf'));
      },
      `${t.qrPreview.errors.failedToDownload} PDF`,
    );

  const warningText = (warning: ScanWarning): string => {
    switch (warning.kind) {
      case 'lowContrast':
        return t.qrPreview.scannability.lowContrast.replace('{ratio}', String(warning.ratio));
      case 'inverted':
        return t.qrPreview.scannability.inverted;
      case 'logoNeedsHighEc':
        return t.qrPreview.scannability.logoNeedsHighEc;
    }
  };

  const pdfSizeLabel = (size: PdfSize) =>
    size === 'a4' ? t.qrPreview.pdfFitA4 : `${getPdfSideMm(size) / 10} cm`;

  const actionsDisabled = !isDataValid || busy !== null;

  return (
    <div className="qr-preview-section" role="region" aria-label={t.qrPreview.title}>
      <h2>{t.qrPreview.title}</h2>

      {displayError && (
        <div className="qr-error" role="alert">
          <AlertTriangle size={16} />
          <span>{displayError}</span>
        </div>
      )}

      <div className="qr-preview-stage">
        <div
          className={`qr-preview ${displayError ? 'has-error' : ''} ${options.transparentBackground ? 'is-transparent' : ''}`}
          ref={qrRef}
          role="img"
          aria-label={t.qrPreview.previewLabel}
        />
      </div>

      {isDataValid && warnings.length > 0 && (
        <div className="qr-warnings" role="status">
          <strong>{t.qrPreview.scannability.title}</strong>
          <ul>
            {warnings.map((warning) => (
              <li key={warning.kind}>{warningText(warning)}</li>
            ))}
          </ul>
        </div>
      )}

      {isDataValid && warnings.length === 0 && (
        <p className="qr-scan-ok" role="status">
          <Check size={16} aria-hidden="true" />
          {t.qrPreview.scannability.ok}
        </p>
      )}

      <div className="export-options">
        <Segmented
          label={t.qrPreview.exportSize}
          value={exportSize}
          options={EXPORT_SIZES.map((size) => ({ value: size as number, label: `${size} px` }))}
          onChange={setExportSize}
        />
        <Segmented
          label={t.qrPreview.pdfSize}
          value={pdfSize}
          options={PDF_SIZES.map((size) => ({ value: size, label: pdfSizeLabel(size) }))}
          onChange={setPdfSize}
        />
      </div>

      <div className="export-buttons" role="group" aria-label={t.qrPreview.downloadAs}>
        <button
          onClick={downloadPNG}
          className="btn btn-cta export-png"
          aria-label={`${t.qrPreview.downloadAs} PNG`}
          disabled={actionsDisabled}
        >
          {busy === 'png' ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
          PNG
        </button>
        <button
          onClick={downloadSVG}
          className="btn btn-secondary"
          aria-label={`${t.qrPreview.downloadAs} SVG`}
          disabled={actionsDisabled}
        >
          {busy === 'svg' ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
          SVG
        </button>
        <button
          onClick={downloadPDF}
          className="btn btn-secondary"
          aria-label={`${t.qrPreview.downloadAs} PDF`}
          aria-busy={busy === 'pdf'}
          disabled={actionsDisabled}
        >
          {busy === 'pdf' ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
          {busy === 'pdf' ? t.qrPreview.preparing : 'PDF'}
        </button>
      </div>

      {canCopyImage && (
        <button
          onClick={copyToClipboard}
          className="btn btn-secondary copy-button"
          aria-label={t.qrPreview.copyToClipboard}
          disabled={actionsDisabled}
        >
          {busy === 'copy' ? <Loader2 size={16} className="spin" /> : copySuccess ? <Check size={16} /> : <Copy size={16} />}
          {copySuccess ? t.qrPreview.copied : t.qrPreview.copyToClipboard}
        </button>
      )}
    </div>
  );
}

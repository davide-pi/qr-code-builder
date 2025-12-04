import { useEffect, useRef, useCallback, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import type { Options } from 'qr-code-styling';
import { jsPDF } from 'jspdf';
import type { QROptions } from '../../types/qr';
import { Copy, Check, Download, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../i18n';
import './QRPreview.css';

interface QRPreviewProps {
  options: QROptions;
}

export default function QRPreview({ options }: QRPreviewProps) {
  const { t } = useLanguage();
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<QRCodeStyling | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastValidOptionsRef = useRef<Options | null>(null);

  // Check if data is empty
  const isDataEmpty = !options.data || options.data.trim().length === 0;

  // Check if data is valid for QR generation
  const isDataValid = !isDataEmpty && !error;

  // Display message (error or empty state)
  const displayError = error || (isDataEmpty ? t.qrPreview.contentRequired : null);

  // Build QR code styling options from our state
  const buildQROptions = useCallback((): Options => {
    const qrOptions: Options = {
      width: options.size,
      height: options.size,
      margin: options.margin,
      data: options.data || ' ', // Use space as fallback to prevent crash
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
        margin: options.imageMargin,
        // Convert percentage (0.1-0.3) to ratio (0.33-1.0)
        // 10% -> 0.33, 30% -> 1.0
        imageSize: (options.imageSize / 0.3),
      },
      // Only include image if it exists
      image: options.image || undefined,
    };

    return qrOptions;
  }, [options]);

  // Create or recreate QR code instance
  const createQRCode = useCallback((qrOptions: Options) => {
    if (qrRef.current) {
      qrRef.current.innerHTML = '';
    }
    qrCodeRef.current = new QRCodeStyling(qrOptions);
    if (qrRef.current) {
      qrCodeRef.current.append(qrRef.current);
    }
    lastValidOptionsRef.current = qrOptions;
  }, []);

  // Initialize QR code once and append to DOM
  useEffect(() => {
    try {
      const qrOptions = buildQROptions();
      createQRCode(qrOptions);
      setError(null);
    } catch (err) {
      console.error('Failed to initialize QR code:', err);
      setError(t.qrPreview.errors.failedToInitialize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update QR code when options change
  useEffect(() => {
    if (!qrCodeRef.current) return;

    const qrOptions = buildQROptions();

    // Check data length to prevent overflow error
    // QR code version 40 max byte capacity (most content uses byte mode)
    const dataLength = (options.data || '').length;
    const maxLength = options.errorCorrectionLevel === 'L' ? 2953
                    : options.errorCorrectionLevel === 'M' ? 2331
                    : options.errorCorrectionLevel === 'Q' ? 1663
                    : 1273; // H
    if (dataLength > maxLength) {
      setError(t.qrPreview.errors.contentTooLong.replace('{max}', maxLength.toLocaleString()).replace('{level}', options.errorCorrectionLevel));
      return;
    }

    setError(null);

    try {
      qrCodeRef.current.update(qrOptions);
      lastValidOptionsRef.current = qrOptions;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Failed to update QR code:', errorMessage);

      if (errorMessage.includes('overflow') || errorMessage.includes('length')) {
        setError(t.qrPreview.errors.contentTooLong.replace('{max}', '').replace('{level}', options.errorCorrectionLevel));
      } else {
        setError(t.qrPreview.errors.failedToGenerate);
      }

      // Recreate QR code with last valid options to fix DOM state
      if (lastValidOptionsRef.current) {
        try {
          createQRCode(lastValidOptionsRef.current);
        } catch {
          // If even this fails, create with minimal data
          createQRCode({ ...qrOptions, data: ' ' });
        }
      }
    }
  }, [buildQROptions, createQRCode, options.data, options.errorCorrectionLevel]);

  // Recreate QR code when image or image size changes (update doesn't handle these well)
  useEffect(() => {
    if (!qrCodeRef.current) return;

    try {
      const qrOptions = buildQROptions();
      createQRCode(qrOptions);
      setError(null);
    } catch (err) {
      console.error('Failed to update QR code image:', err);
    }
  }, [buildQROptions, createQRCode, options.image, options.imageSize]);

  // Copy to clipboard
  const copyToClipboard = async () => {
    if (!qrCodeRef.current || !isDataValid) return;

    try {
      const blob = await qrCodeRef.current.getRawData('png');
      if (blob instanceof Blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback: try to copy as data URL
      try {
        const blob = await qrCodeRef.current.getRawData('png');
        if (blob instanceof Blob) {
          const reader = new FileReader();
          reader.onload = async () => {
            const dataUrl = reader.result as string;
            await navigator.clipboard.writeText(dataUrl);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
          };
          reader.readAsDataURL(blob);
        }
      } catch {
        console.error('Fallback copy also failed');
      }
    }
  };

  // Export functions
  const downloadPNG = () => {
    if (!qrCodeRef.current || !isDataValid) return;
    try {
      qrCodeRef.current.download({ name: 'qr-code', extension: 'png' });
    } catch (err) {
      console.error('Failed to download PNG:', err);
      setError(`${t.qrPreview.errors.failedToDownload} PNG`);
    }
  };

  const downloadSVG = async () => {
    if (!qrCodeRef.current || !isDataValid) return;

    try {
      // Get raw SVG data and clean it
      const svgData = await qrCodeRef.current.getRawData('svg');
      if (svgData instanceof Blob) {
        const text = await svgData.text();
        // Create a clean SVG by parsing and re-serializing
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'image/svg+xml');
        const svg = doc.querySelector('svg');

        if (svg) {
          // Remove any unnecessary attributes or metadata
          svg.removeAttribute('xmlns:xlink');

          // Serialize back to string
          const serializer = new XMLSerializer();
          const cleanSvg = serializer.serializeToString(svg);

          // Download
          const blob = new Blob([cleanSvg], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'qr-code.svg';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }
    } catch (err) {
      console.error('Failed to download SVG:', err);
      setError(`${t.qrPreview.errors.failedToDownload} SVG`);
    }
  };

  const downloadPDF = async () => {
    if (!qrCodeRef.current || !isDataValid) return;

    try {
      const canvas = await qrCodeRef.current.getRawData('png');
      if (canvas instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          const imgData = reader.result as string;
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [options.size + 40, options.size + 40],
          });
          pdf.addImage(imgData, 'PNG', 20, 20, options.size, options.size);
          pdf.save('qr-code.pdf');
        };
        reader.readAsDataURL(canvas);
      }
    } catch (err) {
      console.error('Failed to download PDF:', err);
      setError(`${t.qrPreview.errors.failedToDownload} PDF`);
    }
  };

  return (
    <div className="qr-preview-section" role="region" aria-label={t.qrPreview.title}>
      <h2>{t.qrPreview.title}</h2>

      {displayError && (
        <div className="qr-error" role="alert">
          <AlertTriangle size={16} />
          <span>{displayError}</span>
        </div>
      )}

      <div
        className={`qr-preview ${displayError ? 'has-error' : ''}`}
        ref={qrRef}
        aria-live="polite"
      />

      <div className="action-buttons">
        <button
          onClick={copyToClipboard}
          className="btn btn-copy"
          aria-label={t.qrPreview.copyToClipboard}
          disabled={!isDataValid || !!error}
        >
          {copySuccess ? <Check size={16} /> : <Copy size={16} />}
          {copySuccess ? t.qrPreview.copied : t.qrPreview.copyToClipboard}
        </button>
      </div>

      <div className="export-buttons" role="group" aria-label={t.qrPreview.downloadAs}>
        <button
          onClick={downloadPNG}
          className="btn btn-export"
          aria-label={`${t.qrPreview.downloadAs} PNG`}
          disabled={!isDataValid || !!error}
        >
          <Download size={16} />
          PNG
        </button>
        <button
          onClick={downloadSVG}
          className="btn btn-export"
          aria-label={`${t.qrPreview.downloadAs} SVG`}
          disabled={!isDataValid || !!error}
        >
          <Download size={16} />
          SVG
        </button>
        <button
          onClick={downloadPDF}
          className="btn btn-export"
          aria-label={`${t.qrPreview.downloadAs} PDF`}
          disabled={!isDataValid || !!error}
        >
          <Download size={16} />
          PDF
        </button>
      </div>
    </div>
  );
}

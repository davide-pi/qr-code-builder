import { Download, FileSpreadsheet, Loader2, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useLanguage } from '../../i18n';
import type { Translations } from '../../i18n/types';
import type { QROptions, QRTemplateType } from '../../types/qr';
import TemplateDropdown from '../QRDataInput/TemplateDropdown';
import { DEFAULT_EXPORT_SIZE, EXPORT_SIZES, buildFileName, downloadBlob } from '../QRPreview/qrExport';
import { generateBatchZip } from './batchGenerate';
import {
  MAX_BATCH_FILE_BYTES, MAX_BATCH_ROWS, buildBatchRows, buildHeaderTemplate, getColumns,
  type BatchIssue, type BatchRow,
} from './batchRows';
import { parseCsv, type CsvDelimiter } from './csv';
import './Batch.css';

interface BatchDialogProps {
  // Styling of the single editor (its `data` is ignored)
  options: QROptions;
  initialType: QRTemplateType;
  onClose: () => void;
}

type ErrorKey = keyof Translations['batch']['errors'];
type Phase = 'idle' | 'running';

interface LoadedFile {
  name: string;
  cells: string[][];
  delimiter: CsvDelimiter;
}

const MAX_FILE_MB = MAX_BATCH_FILE_BYTES / (1024 * 1024);

const fill = (template: string, values: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));

// UTF-8 first (with or without BOM); legacy Excel exports are Windows-1252
const decodeText = (buffer: ArrayBuffer): string => {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('windows-1252').decode(buffer);
  }
};

const delimiterLabel = (delimiter: CsvDelimiter): string => (delimiter === '\t' ? 'Tab' : delimiter);

export default function BatchDialog({ options, initialType, onClose }: BatchDialogProps) {
  const { t, language } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const baseId = useId();
  const [type, setType] = useState<QRTemplateType>(initialType);
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [extension, setExtension] = useState<'png' | 'svg'>('png');
  const [size, setSize] = useState<number>(DEFAULT_EXPORT_SIZE);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  // Announced to screen readers: progress changes only every 10%, not on every row
  const [status, setStatus] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    // Closing the dialog (also with Escape) cancels a running generation
    return () => abortRef.current?.abort();
  }, []);

  const table = useMemo(
    () => (file ? buildBatchRows(type, file.cells, { errorCorrectionLevel: options.errorCorrectionLevel }) : null),
    [file, type, options.errorCorrectionLevel],
  );
  const validRows = useMemo(() => table?.rows.filter((row) => row.issues.length === 0) ?? [], [table]);
  const tableError = table?.error ? fill(t.batch.errors[table.error], { maxRows: MAX_BATCH_ROWS }) : null;
  const running = phase === 'running';

  const errorText = (key: ErrorKey) => fill(t.batch.errors[key], { maxSize: MAX_FILE_MB, maxRows: MAX_BATCH_ROWS });

  const issueText = ({ field, key }: BatchIssue): string => {
    const message = key in t.batch.issues
      ? t.batch.issues[key as keyof typeof t.batch.issues]
      : t.qrDataInput.errors[key as keyof typeof t.qrDataInput.errors];
    return field ? `${field}: ${message}` : message;
  };

  const handleTypeChange = (next: QRTemplateType) => {
    setType(next);
    setStatus('');
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const selected = input.files?.[0];
    input.value = ''; // allows picking the same file again after fixing it
    if (!selected) return;
    setStatus('');
    setFile(null);
    if (selected.size > MAX_BATCH_FILE_BYTES) {
      setLoadError(errorText('fileTooLarge'));
      return;
    }
    try {
      const { rows, delimiter, unterminatedQuote } = parseCsv(decodeText(await selected.arrayBuffer()));
      if (unterminatedQuote) {
        setLoadError(errorText('unterminatedQuote'));
        return;
      }
      setLoadError(null);
      setFile({ name: selected.name, cells: rows, delimiter });
    } catch (err) {
      console.error('Failed to read the CSV file:', err);
      setLoadError(errorText('readFailed'));
    }
  };

  const downloadTemplate = () => {
    // The BOM makes Excel read the file as UTF-8; it expects `;` where the decimal separator is `,`
    const delimiter: CsvDelimiter = language === 'en' ? ',' : ';';
    const blob = new Blob([`\uFEFF${buildHeaderTemplate(type, delimiter)}`], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `qr-batch-template-${type}.csv`);
  };

  const generate = async () => {
    if (running || validRows.length === 0) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase('running');
    setProgress({ done: 0, total: validRows.length });
    let lastDecile = -1;
    try {
      const { zip, failed } = await generateBatchZip({
        rows: validRows,
        options,
        extension,
        size,
        signal: controller.signal,
        onProgress: (done, total) => {
          setProgress({ done, total });
          const decile = Math.floor((done * 10) / total);
          if (decile !== lastDecile) {
            lastDecile = decile;
            setStatus(fill(t.batch.progress, { done, total }));
          }
        },
      });
      downloadBlob(zip, buildFileName('batch', 'zip'));
      const count = validRows.length - failed.length;
      setStatus(failed.length === 0
        ? fill(t.batch.done, { count })
        : fill(t.batch.doneWithFailures, { count, failed: failed.length, rows: failed.join(', ') }));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setStatus(t.batch.cancelled);
      } else {
        console.error('Batch generation failed:', err);
        setStatus(errorText('generateFailed'));
      }
    } finally {
      abortRef.current = null;
      setPhase('idle');
    }
  };

  const rowStatus = (row: BatchRow) =>
    row.issues.length === 0 ? (
      <span className="batch-status-ok">{t.batch.statusOk}</span>
    ) : (
      <span className="batch-status-skipped">
        {t.batch.statusSkipped}
        <ul>
          {row.issues.map((issue) => (
            <li key={`${issue.field}-${issue.key}`}>{issueText(issue)}</li>
          ))}
        </ul>
      </span>
    );

  const titleId = `${baseId}-title`;
  const fileId = `${baseId}-file`;
  const invalidCount = (table?.rows.length ?? 0) - validRows.length;

  return (
    <dialog ref={dialogRef} className="batch-dialog" aria-labelledby={titleId} onClose={onClose}>
      <header className="batch-header">
        <h2 id={titleId}>{t.batch.title}</h2>
        <button type="button" className="batch-close" onClick={() => dialogRef.current?.close()} aria-label={t.batch.close}>
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <p className="batch-note">{t.batch.intro}</p>
      <p className="batch-note">{t.batch.privacy}</p>

      <fieldset className="batch-fieldset" disabled={running}>
        <TemplateDropdown value={type} onChange={handleTypeChange} />

        <div className="batch-step">
          <h3>{t.batch.step1}</h3>
          <p className="batch-note">
            {fill(t.batch.columnsHint, {
              columns: getColumns(type).join(', '),
              maxRows: MAX_BATCH_ROWS,
              maxSize: MAX_FILE_MB,
            })}
          </p>
          <p className="batch-note">{t.batch.booleanHint}</p>
          <button type="button" className="btn btn-secondary" onClick={downloadTemplate}>
            <Download size={16} aria-hidden="true" />
            {t.batch.downloadTemplate}
          </button>
        </div>

        <div className="batch-step">
          <h3>{t.batch.step2}</h3>
          <label className="batch-file" htmlFor={fileId}>
            <FileSpreadsheet size={16} aria-hidden="true" />
            <span>{t.batch.uploadLabel}</span>
          </label>
          <input id={fileId} type="file" accept=".csv,text/csv,text/plain" onChange={handleFile} />
          {loadError && <p className="batch-error" role="alert">{loadError}</p>}
          {tableError && <p className="batch-error" role="alert">{tableError}</p>}
          {file && table && !table.error && (
            <>
              <p className="batch-note">
                {fill(t.batch.fileLoaded, {
                  name: file.name,
                  rows: table.rows.length,
                  delimiter: delimiterLabel(file.delimiter),
                })}
                {table.ignoredColumns.length > 0 && ` ${fill(t.batch.ignoredColumns, { columns: table.ignoredColumns.join(', ') })}`}
              </p>
              <h4>{t.batch.previewTitle}</h4>
              <p className="batch-note">{fill(t.batch.summary, { valid: validRows.length, invalid: invalidCount })}</p>
              <div className="batch-table-wrap" tabIndex={0} role="region" aria-label={t.batch.previewTitle}>
                <table className="batch-table">
                  <thead>
                    <tr>
                      <th scope="col">{t.batch.columnRow}</th>
                      <th scope="col">{t.batch.columnFile}</th>
                      <th scope="col">{t.batch.columnContent}</th>
                      <th scope="col">{t.batch.columnStatus}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row) => (
                      <tr key={row.index} className={row.issues.length === 0 ? undefined : 'batch-row-skipped'}>
                        <td>{row.index}</td>
                        <td>{row.issues.length === 0 ? row.fileName : ''}</td>
                        <td>{row.summary}</td>
                        <td>{rowStatus(row)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="batch-step">
          <h3>{t.batch.step3}</h3>
          <div className="export-options">
            <label className="export-option">
              <span>{t.batch.format}</span>
              <select value={extension} onChange={(e) => setExtension(e.target.value as 'png' | 'svg')}>
                <option value="png">PNG</option>
                <option value="svg">SVG</option>
              </select>
            </label>
            <label className="export-option">
              <span>{t.batch.size}</span>
              <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
                {EXPORT_SIZES.map((px) => (
                  <option key={px} value={px}>{px} px</option>
                ))}
              </select>
            </label>
          </div>
          <p className="batch-note">{t.batch.stylingNote}</p>
        </div>
      </fieldset>

      {file && table && !table.error && validRows.length === 0 && (
        <p className="batch-error" role="alert">{t.batch.errors.noValidRows}</p>
      )}

      <div className="batch-actions">
        <button
          type="button"
          className={running ? 'btn btn-secondary' : 'btn btn-primary'}
          onClick={running ? () => abortRef.current?.abort() : generate}
          disabled={!running && validRows.length === 0}
        >
          {running ? t.batch.cancel : (
            <>
              <Download size={16} aria-hidden="true" />
              {t.batch.generate}
            </>
          )}
        </button>
        {running && (
          <>
            <Loader2 size={18} className="batch-spin" aria-hidden="true" />
            <progress
              className="batch-progress"
              value={progress.done}
              max={progress.total}
              aria-label={fill(t.batch.progress, progress)}
            />
          </>
        )}
      </div>
      <p className="batch-status" role="status" aria-live="polite">{status}</p>
    </dialog>
  );
}

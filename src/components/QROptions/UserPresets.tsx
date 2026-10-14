import { useRef, useState } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import type { QROptions } from '../../types/qr';
import { useLanguage } from '../../i18n';
import {
  MAX_IMPORT_BYTES,
  MAX_PRESET_NAME_LENGTH,
  MAX_USER_PRESETS,
  createPresetId,
  loadUserPresets,
  mergePresets,
  parseImportedPresets,
  pickStyle,
  saveUserPresets,
  serializePresets,
  type UserPreset,
} from './presetStorage';

interface UserPresetsProps {
  options: QROptions;
  onUpdateOption: <K extends keyof QROptions>(key: K, value: QROptions[K]) => void;
}

interface Status {
  text: string;
  isError: boolean;
}

export default function UserPresets({ options, onUpdateOption }: UserPresetsProps) {
  const { t } = useLanguage();
  const labels = t.qrOptions.presets;
  const [presets, setPresets] = useState<UserPreset[]>(loadUserPresets);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<Status | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Updates state and storage; reports when the browser refuses to store the presets
  const persist = (next: UserPreset[], successText: string) => {
    setPresets(next);
    if (saveUserPresets(next)) {
      setStatus({ text: successText, isError: false });
    } else {
      setStatus({ text: labels.storageError, isError: true });
    }
  };

  const trimmedName = name.trim();
  const replacesExisting = presets.some((p) => p.name.toLowerCase() === trimmedName.toLowerCase());
  const limitReached = presets.length >= MAX_USER_PRESETS && !replacesExisting;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedName) return;
    if (limitReached) return;
    const preset: UserPreset = { id: createPresetId(), name: trimmedName, style: pickStyle(options) };
    persist(mergePresets(presets, [preset]), labels.saved.replace('{name}', trimmedName));
    setName('');
  };

  // Styling only: `data` and `image` are never touched. Calls are batched into a single update.
  const handleApply = ({ style }: UserPreset) => {
    onUpdateOption('dotColor', style.dotColor);
    onUpdateOption('dotGradient', {
      ...style.dotGradient,
      colorStops: style.dotGradient.colorStops.map((stop) => ({ ...stop })),
    });
    onUpdateOption('dotType', style.dotType);
    onUpdateOption('cornerSquareColor', style.cornerSquareColor);
    onUpdateOption('cornerSquareType', style.cornerSquareType);
    onUpdateOption('cornerDotColor', style.cornerDotColor);
    onUpdateOption('cornerDotType', style.cornerDotType);
    onUpdateOption('backgroundColor', style.backgroundColor);
    onUpdateOption('transparentBackground', style.transparentBackground);
  };

  const handleDelete = (preset: UserPreset) => {
    persist(
      presets.filter((p) => p.id !== preset.id),
      labels.deleted.replace('{name}', preset.name),
    );
  };

  const handleExport = () => {
    const blob = new Blob([serializePresets(presets)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'qr-code-presets.json';
    link.click();
    URL.revokeObjectURL(url);
    setStatus({ text: labels.exported, isError: false });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const imported = file.size <= MAX_IMPORT_BYTES ? parseImportedPresets(await file.text()) : null;
    if (!imported) {
      setStatus({ text: labels.importError, isError: true });
      return;
    }
    persist(mergePresets(presets, imported), labels.imported.replace('{count}', String(imported.length)));
  };

  return (
    <>
      <form className="user-presets-form" onSubmit={handleSave}>
        <div className="option-group">
          <label htmlFor="userPresetName">{labels.nameLabel}</label>
          <div className="user-presets-save-row">
            <input
              type="text"
              id="userPresetName"
              value={name}
              maxLength={MAX_PRESET_NAME_LENGTH}
              placeholder={labels.namePlaceholder}
              aria-describedby="userPresetHint"
              onChange={(e) => setName(e.target.value)}
            />
            <button type="submit" className="btn btn-small btn-primary" disabled={!trimmedName || limitReached}>
              {labels.save}
            </button>
          </div>
          <p id="userPresetHint" className="option-hint">{labels.hint}</p>
        </div>
      </form>

      {presets.length === 0 ? (
        <p className="option-hint">{labels.empty}</p>
      ) : (
        <ul className="user-presets-list" aria-label={labels.list}>
          {presets.map((preset) => (
            <li key={preset.id} className="user-preset-item">
              <button
                type="button"
                className="user-preset-apply"
                onClick={() => handleApply(preset)}
                aria-label={labels.apply.replace('{name}', preset.name)}
                title={labels.apply.replace('{name}', preset.name)}
              >
                <span
                  className="user-preset-swatch"
                  aria-hidden="true"
                  style={{
                    background: `linear-gradient(135deg, ${preset.style.dotColor} 0%, ${preset.style.cornerSquareColor} 100%)`,
                  }}
                />
                <span className="user-preset-name">{preset.name}</span>
              </button>
              <button
                type="button"
                className="btn-icon"
                onClick={() => handleDelete(preset)}
                aria-label={labels.delete.replace('{name}', preset.name)}
                title={labels.delete.replace('{name}', preset.name)}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="user-presets-actions">
        <button type="button" className="btn btn-small btn-secondary" onClick={handleExport} disabled={presets.length === 0}>
          <Download size={14} aria-hidden="true" /> {labels.export}
        </button>
        <button type="button" className="btn btn-small btn-secondary" onClick={() => importInputRef.current?.click()}>
          <Upload size={14} aria-hidden="true" /> {labels.import}
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={handleImport}
        />
      </div>

      <p className={`option-status ${limitReached || status?.isError ? 'error' : ''}`} role="status">
        {limitReached ? labels.limitReached.replace('{max}', String(MAX_USER_PRESETS)) : status?.text}
      </p>
    </>
  );
}

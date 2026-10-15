import { useId, useState } from 'react';
import { useLanguage } from '../../i18n';
import { normalizeHex } from './colorUtils';

interface ColorFieldProps {
  label: string;
  // #rrggbb
  value: string;
  onChange: (color: string) => void;
}

// What the user typed in the hex box. `base` is the color it was typed against: when the color
// changes from outside (picker, preset, undo) the draft no longer applies and is dropped.
interface Draft {
  text: string;
  base: string;
  // The error is shown once the box is left, not while a color is still being typed
  blurred: boolean;
}

// Native color picker + hex text box that stay in sync, behind one visible label
export default function ColorField({ label, value, onChange }: ColorFieldProps) {
  const { t } = useLanguage();
  const id = useId();
  const [draft, setDraft] = useState<Draft | null>(null);

  const activeDraft = draft && draft.base === value ? draft : null;
  const text = activeDraft ? activeDraft.text : value;
  const hasError = activeDraft !== null && activeDraft.blurred && normalizeHex(activeDraft.text) === null;

  const handleText = (next: string) => {
    const hex = normalizeHex(next);
    if (hex) onChange(hex);
    setDraft({ text: next, base: hex ?? value, blurred: false });
  };

  // A valid draft is replaced by the normalized color; an invalid one stays, with its error
  const handleBlur = () =>
    setDraft((current) => (current && (normalizeHex(current.text) ? null : { ...current, blurred: true })));

  return (
    <div className="option-group color-field">
      <label htmlFor={`${id}-picker`}>{label}</label>
      <div className="color-field-controls">
        <input
          type="color"
          id={`${id}-picker`}
          value={value}
          onChange={(e) => {
            setDraft(null);
            onChange(e.target.value);
          }}
        />
        <input
          type="text"
          id={`${id}-hex`}
          value={text}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          aria-label={t.qrOptions.colors.hexValue.replace('{name}', label)}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? `${id}-error` : undefined}
          onChange={(e) => handleText(e.target.value)}
          onBlur={handleBlur}
        />
      </div>
      {hasError && (
        <p id={`${id}-error`} className="option-status error" role="alert">
          {t.qrOptions.colors.invalidHex}
        </p>
      )}
    </div>
  );
}

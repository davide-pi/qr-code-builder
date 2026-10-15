import { useId } from 'react';
import './Segmented.css';

interface SegmentedProps<T extends string | number> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

// Pill-shaped single choice. Native radio inputs give the group semantics, arrow-key
// navigation and a checked state for assistive technology.
export default function Segmented<T extends string | number>({ label, value, options, onChange }: SegmentedProps<T>) {
  const name = useId();
  return (
    <fieldset className="segmented-field">
      <legend className="segmented-legend">{label}</legend>
      <div className="segmented">
        {options.map((option) => (
          <label key={option.value} className="segmented-item">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

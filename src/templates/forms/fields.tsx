import { useState, type ReactNode } from 'react';
import { useLanguage } from '../../i18n';
import CountryCodeSelect from '../../components/CountryCodeSelect/CountryCodeSelect';
import type { ErrorKey } from '../types';

interface FieldFrameProps {
  id: string;
  label: string;
  required?: boolean;
  // Error to show; a "required" error is hidden until the user has left the field
  error?: ErrorKey;
  touched: boolean;
  children: ReactNode;
}

function FieldError({ id, error }: { id: string; error: ErrorKey }) {
  const { t } = useLanguage();
  return (
    <p id={id} className="field-error">
      {t.qrDataInput.errors[error]}
    </p>
  );
}

const isErrorVisible = (error: ErrorKey | undefined, touched: boolean): error is ErrorKey =>
  error !== undefined && (error !== 'required' || touched);

// Label + control + inline error: the shared markup of every form field
function FieldFrame({ id, label, required, error, touched, children }: FieldFrameProps) {
  return (
    <div className="form-group">
      <label htmlFor={id}>
        {label}
        {required ? ' *' : ''}
      </label>
      {children}
      {isErrorVisible(error, touched) && <FieldError id={`${id}-error`} error={error} />}
    </div>
  );
}

const describedBy = (id: string, error: ErrorKey | undefined, touched: boolean) =>
  isErrorVisible(error, touched)
    ? { 'aria-invalid': true as const, 'aria-describedby': `${id}-error` }
    : {};

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: ErrorKey;
  required?: boolean;
  type?: 'text' | 'url' | 'email' | 'tel' | 'date' | 'datetime-local';
  placeholder?: string;
  max?: string;
  maxLength?: number;
  // Renders a textarea with this many rows
  rows?: number;
}

export function TextField({
  id, label, value, onChange, error, required, type = 'text', placeholder, max, maxLength, rows,
}: TextFieldProps) {
  const [touched, setTouched] = useState(false);
  const common = {
    id,
    value,
    placeholder,
    maxLength,
    'aria-required': required || undefined,
    onBlur: () => setTouched(true),
    ...describedBy(id, error, touched),
  };
  return (
    <FieldFrame id={id} label={label} required={required} error={error} touched={touched}>
      {rows ? (
        <textarea {...common} rows={rows} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...common} type={type} max={max} onChange={(e) => onChange(e.target.value)} />
      )}
    </FieldFrame>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function SelectField({ id, label, value, onChange, options }: SelectFieldProps) {
  return (
    <FieldFrame id={id} label={label} touched={false}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
}

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function CheckboxField({ label, checked, onChange }: CheckboxFieldProps) {
  return (
    <div className="form-group">
      <label className="checkbox-label">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        {label}
      </label>
    </div>
  );
}

interface PhoneFieldProps {
  id: string;
  label: string;
  country: string;
  countryCode: string;
  phone: string;
  onCountryChange: (country: string, countryCode: string) => void;
  onPhoneChange: (value: string) => void;
  error?: ErrorKey;
  required?: boolean;
  placeholder?: string;
}

// Country code selector + national number input
export function PhoneField({
  id, label, country, countryCode, phone, onCountryChange, onPhoneChange, error, required, placeholder,
}: PhoneFieldProps) {
  const [touched, setTouched] = useState(false);
  return (
    <FieldFrame id={id} label={label} required={required} error={error} touched={touched}>
      <div className="phone-input-group">
        <div className="country-code-select-wrapper">
          <CountryCodeSelect value={country} callingCode={countryCode} onChange={onCountryChange} />
        </div>
        <input
          type="tel"
          id={id}
          className="phone-number-input"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          aria-required={required || undefined}
          {...describedBy(id, error, touched)}
        />
      </div>
    </FieldFrame>
  );
}

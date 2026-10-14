import { useMemo } from 'react';
import Select, { type SingleValue } from 'react-select';
import { useLanguage } from '../../i18n';
import { buildCountryCodes } from './countryCodes';
import './CountryCodeSelect.css';

interface CountryOption {
  // Unique per country: several countries share the same dialing code
  key: string;
  value: string;
  label: string;
}

interface CountryCodeSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CountryCodeSelectInner({ value, onChange }: CountryCodeSelectProps) {
  const { language, t } = useLanguage();

  const countryOptions = useMemo<CountryOption[]>(
    () =>
      buildCountryCodes(language).map(({ countryCode, code, country }) => ({
        key: countryCode,
        value: code,
        label: `${code} ${country}`,
      })),
    [language],
  );

  const selectedOption = countryOptions.find((opt) => opt.value === value) || null;

  const handleChange = (option: SingleValue<CountryOption>) => {
    if (option) {
      onChange(option.value);
    }
  };

  return (
    <Select<CountryOption>
      value={selectedOption}
      onChange={handleChange}
      options={countryOptions}
      getOptionValue={(option) => option.key}
      placeholder={t.common.selectCountry}
      aria-label={t.common.selectCountry}
      isSearchable
      classNamePrefix="country-select"
      menuPlacement="auto"
      filterOption={(option, inputValue) => {
        const searchLower = inputValue.toLowerCase();
        return (
          option.label.toLowerCase().includes(searchLower) ||
          option.data.value.includes(inputValue)
        );
      }}
    />
  );
}

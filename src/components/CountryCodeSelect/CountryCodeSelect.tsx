import Select, { type SingleValue } from 'react-select';
import { countryCodes } from '../../types/qr';
import './CountryCodeSelect.css';

interface CountryOption {
  value: string;
  label: string;
}

interface CountryCodeSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const countryOptions: CountryOption[] = countryCodes.map(({ code, country }) => ({
  value: code,
  label: `${code} ${country}`,
}));

export default function CountryCodeSelect({ value, onChange }: CountryCodeSelectProps) {
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
      placeholder="Select country..."
      isSearchable
      classNamePrefix="country-select"
      menuPlacement="auto"
      filterOption={(option, inputValue) => {
        const searchLower = inputValue.toLowerCase();
        return (
          option.label.toLowerCase().includes(searchLower) ||
          option.value.includes(inputValue)
        );
      }}
    />
  );
}

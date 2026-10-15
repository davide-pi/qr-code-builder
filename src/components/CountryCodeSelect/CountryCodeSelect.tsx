import { lazy, Suspense } from 'react';
import { useLanguage } from '../../i18n';

interface CountryCodeSelectProps {
  // ISO 3166-1 alpha-2 of the selected country (several countries share a calling code)
  value: string;
  // Calling code of the selected country ("+39"), shown while the select is loading
  callingCode: string;
  onChange: (country: string, callingCode: string) => void;
}

// react-select is heavy: load it only when a template with a phone number is shown
const CountryCodeSelectInner = lazy(() => import('./CountryCodeSelectInner'));

export default function CountryCodeSelect({ callingCode, ...props }: CountryCodeSelectProps) {
  const { t } = useLanguage();

  return (
    <Suspense
      fallback={
        <select
          disabled
          value={callingCode}
          aria-label={t.common.selectCountry}
        >
          <option value={callingCode}>{callingCode}</option>
        </select>
      }
    >
      <CountryCodeSelectInner {...props} />
    </Suspense>
  );
}

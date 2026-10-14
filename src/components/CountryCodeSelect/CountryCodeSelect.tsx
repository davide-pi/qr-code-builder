import { lazy, Suspense } from 'react';
import { useLanguage } from '../../i18n';

interface CountryCodeSelectProps {
  value: string;
  onChange: (value: string) => void;
}

// react-select is heavy: load it only when a template with a phone number is shown
const CountryCodeSelectInner = lazy(() => import('./CountryCodeSelectInner'));

export default function CountryCodeSelect(props: CountryCodeSelectProps) {
  const { t } = useLanguage();

  return (
    <Suspense
      fallback={
        <select
          disabled
          value={props.value}
          aria-label={t.common.selectCountry}
        >
          <option value={props.value}>{props.value}</option>
        </select>
      }
    >
      <CountryCodeSelectInner {...props} />
    </Suspense>
  );
}

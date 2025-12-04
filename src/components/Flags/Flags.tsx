import type { Language } from '../../i18n';

// Map language codes to country codes for flag-icons
const languageToCountry: Record<Language, string> = {
  en: 'gb',
  it: 'it',
  ro: 'ro',
};

interface LanguageFlagProps {
  code: Language;
  className?: string;
}

export function LanguageFlag({ code, className = '' }: LanguageFlagProps) {
  const countryCode = languageToCountry[code];

  return (
    <span
      className={`fi fi-${countryCode} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

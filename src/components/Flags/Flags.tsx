import type { Language } from '../../i18n';
// Only the flags of the UI languages are bundled (small SVGs, inlined as data URIs by Vite)
import gbFlag from 'flag-icons/flags/4x3/gb.svg';
import itFlag from 'flag-icons/flags/4x3/it.svg';
import roFlag from 'flag-icons/flags/4x3/ro.svg';
import './Flags.css';

const flagSources: Record<Language, string> = {
  en: gbFlag,
  it: itFlag,
  ro: roFlag,
};

interface LanguageFlagProps {
  code: Language;
  className?: string;
}

export function LanguageFlag({ code, className = '' }: LanguageFlagProps) {
  return (
    <img
      src={flagSources[code]}
      className={`flag ${className}`.trim()}
      alt=""
      aria-hidden="true"
    />
  );
}

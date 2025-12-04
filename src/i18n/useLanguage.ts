import { useContext } from 'react';
import type { Language, Translations } from './types';
import { LanguageContext } from './LanguageContextDef';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Export available languages for the language switcher
export const availableLanguages: { code: Language; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'it', name: 'Italiano' },
  { code: 'ro', name: 'Română' },
];

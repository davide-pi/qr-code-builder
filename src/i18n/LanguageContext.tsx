import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Language, Translations } from './types';
import { LANGUAGE_STORAGE_KEY } from './types';
import { en } from './en';
import { it } from './it';
import { ro } from './ro';

const translations: Record<Language, Translations> = { en, it, ro };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Detect browser language
const detectBrowserLanguage = (): Language => {
  const browserLang = navigator.language.split('-')[0];
  if (browserLang === 'it') return 'it';
  if (browserLang === 'ro') return 'ro';
  return 'en';
};

// Get initial language from localStorage or browser
const getInitialLanguage = (): Language => {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'en' || stored === 'it' || stored === 'ro') {
    return stored;
  }
  return detectBrowserLanguage();
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  };

  // Set initial html lang attribute
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
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

import { useState, useEffect, type ReactNode } from 'react';
import type { Language, Translations } from './types';
import { LANGUAGE_STORAGE_KEY } from './types';
import { en } from './en';
import { it } from './it';
import { ro } from './ro';
import type { LanguageContextType } from './useLanguage';
import { LanguageContext } from './LanguageContextDef';

const translations: Record<Language, Translations> = { en, it, ro };

// Detect browser language
const detectBrowserLanguage = (): Language => {
  const browserLang = navigator.language.split('-')[0];
  if (browserLang === 'it') return 'it';
  if (browserLang === 'ro') return 'ro';
  return 'en';
};

// Get initial language from localStorage or browser
const getInitialLanguage = (): Language => {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'en' || stored === 'it' || stored === 'ro') {
      return stored;
    }
  } catch {
    // Storage unavailable (e.g. private mode): fall back to the browser language
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
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Storage unavailable: the choice only lasts for this session
    }
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

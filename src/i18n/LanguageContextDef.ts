import { createContext } from 'react';
import type { LanguageContextType } from './useLanguage';

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

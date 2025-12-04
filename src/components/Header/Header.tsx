import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, ChevronDown } from 'lucide-react';
import { useLanguage, availableLanguages } from '../../i18n';
import { LanguageFlag } from '../Flags/Flags';
import './Header.css';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Header({ theme, onToggleTheme }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = availableLanguages.find(l => l.code === language);

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-title">
          <img src="logo-white.svg" alt="QR Code" className="header-logo" />
          <h1>{t.header.title}</h1>
        </div>
        <div className="header-actions">
          {/* Language Selector Dropdown */}
          <div className="language-selector" ref={dropdownRef}>
            <button
              className="language-toggle"
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-haspopup="listbox"
            >
              <span className="current-lang">
                <LanguageFlag code={language} />
                {currentLang?.name}
              </span>
              <ChevronDown size={14} className={`lang-chevron ${isOpen ? 'rotated' : ''}`} />
            </button>
            {isOpen && (
              <div className="language-dropdown" role="listbox">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`language-option ${language === lang.code ? 'active' : ''}`}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsOpen(false);
                    }}
                    role="option"
                    aria-selected={language === lang.code}
                  >
                    <LanguageFlag code={lang.code} className="lang-flag" />
                    <span className="lang-name">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Theme Toggle */}
          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? t.header.switchToLight : t.header.switchToDark}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}

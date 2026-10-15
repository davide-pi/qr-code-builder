import { useState, useRef, useEffect, useId } from 'react';
import { Sun, Moon, ChevronDown, QrCode } from 'lucide-react';
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
  const [activeIndex, setActiveIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const listboxId = useId();

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

  // Roving focus: keep DOM focus on the active option while the listbox is open
  useEffect(() => {
    if (isOpen) {
      optionRefs.current[activeIndex]?.focus();
    }
  }, [isOpen, activeIndex]);

  const selectedIndex = availableLanguages.findIndex((l) => l.code === language);
  const currentLang = availableLanguages[selectedIndex];

  const openMenu = (index: number = selectedIndex) => {
    setActiveIndex(index);
    setIsOpen(true);
  };

  const closeMenu = () => {
    setIsOpen(false);
    toggleRef.current?.focus();
  };

  const selectLanguage = (index: number) => {
    setLanguage(availableLanguages[index].code);
    closeMenu();
  };

  const handleToggleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      openMenu(e.key === 'ArrowUp' ? availableLanguages.length - 1 : selectedIndex);
    }
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
    const last = availableLanguages.length - 1;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(index === last ? 0 : index + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(index === 0 ? last : index - 1);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(last);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        selectLanguage(index);
        break;
      case 'Escape':
        e.preventDefault();
        closeMenu();
        break;
      case 'Tab':
        // Let the browser move focus on from the toggle button
        closeMenu();
        break;
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-title">
          <span className="header-logo" aria-hidden="true">
            <QrCode size={20} />
          </span>
          <h1>{t.header.title}</h1>
          <span className="header-pill">{t.header.tagline}</span>
        </div>
        <div className="header-actions">
          {/* Language Selector Dropdown */}
          <div className="language-selector" ref={dropdownRef}>
            <button
              ref={toggleRef}
              className="language-toggle"
              onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
              onKeyDown={handleToggleKeyDown}
              aria-label={`${t.header.language}: ${currentLang?.name}`}
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              aria-controls={isOpen ? listboxId : undefined}
            >
              <span className="current-lang">
                <LanguageFlag code={language} />
                {currentLang?.name}
              </span>
              <ChevronDown size={14} className={`lang-chevron ${isOpen ? 'rotated' : ''}`} />
            </button>
            {isOpen && (
              <div
                id={listboxId}
                className="language-dropdown"
                role="listbox"
                aria-label={t.header.language}
              >
                {availableLanguages.map((lang, index) => (
                  <div
                    key={lang.code}
                    ref={(el) => {
                      optionRefs.current[index] = el;
                    }}
                    className={`language-option ${language === lang.code ? 'active' : ''}`}
                    role="option"
                    lang={lang.code}
                    aria-selected={language === lang.code}
                    tabIndex={index === activeIndex ? 0 : -1}
                    onClick={() => selectLanguage(index)}
                    onKeyDown={(e) => handleOptionKeyDown(e, index)}
                  >
                    <LanguageFlag code={lang.code} className="lang-flag" />
                    <span className="lang-name">{lang.name}</span>
                  </div>
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
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}

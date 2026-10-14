import { useState, useEffect } from 'react';
import { LanguageProvider } from './i18n';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import QRCodeGenerator from './components/QRCodeGenerator/QRCodeGenerator';
import './App.css';

const THEME_STORAGE_KEY = 'qr-generator-theme';

type Theme = 'light' | 'dark';

// Saved choice if valid, otherwise the OS preference (dark when it expresses none)
const getInitialTheme = (): Theme => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Storage unavailable (e.g. private mode): fall back to the OS preference
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Only an explicit choice is persisted, so an unset theme keeps following the OS
  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage unavailable: the choice only lasts for this session
    }
  };

  return (
    <LanguageProvider>
      <div className="app">
        <Header theme={theme} onToggleTheme={toggleTheme} />
        <main className="app-main">
          <QRCodeGenerator />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}

export default App;

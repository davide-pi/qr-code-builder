import { useState, useEffect } from 'react';
import { LanguageProvider } from './i18n';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import QRCodeGenerator from './components/QRCodeGenerator/QRCodeGenerator';
import './App.css';

const THEME_STORAGE_KEY = 'qr-generator-theme';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return (saved as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
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

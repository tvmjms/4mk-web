import React, { createContext, useContext, useState, useEffect } from 'react';
import { getLanguage, setLanguage as setI18nLanguage, type Language } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getLanguage());

  useEffect(() => {
    // Load language preference from user profile or localStorage
    const loadLanguage = async () => {
      try {
        // TODO: Load from user profile when available
        const stored = getLanguage();
        setLanguageState(stored);
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = (lang: Language) => {
    setI18nLanguage(lang);
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}





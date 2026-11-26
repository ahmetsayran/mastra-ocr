import React, { createContext, useContext, useEffect, useState } from 'react';
import { type Language, languages, type TranslationKey, translations } from '#/config/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number | undefined>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getSavedLanguage = (): Language => {
  const savedLanguage = localStorage.getItem('language');
  return languages.includes(savedLanguage as Language) ? (savedLanguage as Language) : languages[0];
};

// Translates outside React components (e.g. the global query and mutation error handlers)
export const translate = (key: TranslationKey) => translations[getSavedLanguage()][key];

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, _setLanguage] = useState<Language>(getSavedLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (language: Language) => {
    localStorage.setItem('language', language);
    _setLanguage(language);
  };

  const t = (key: TranslationKey, params?: Record<string, string | number | undefined>) =>
    translations[language][key].replace(/\{(\w+)\}/g, (match, name: string) =>
      params?.[name] === undefined ? match : String(params[name]),
    );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

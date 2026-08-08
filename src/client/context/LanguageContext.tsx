import type React from 'react';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { type TranslationDictionary, translate, translations } from '../translations.js';
import type { Language } from '../types.js';

const LANGUAGE_STORAGE_KEY = 'wish_app_language';
const LEGACY_LANGUAGE_STORAGE_KEY = 'wish_language';

function getInitialLanguage(): Language {
  const saved =
    localStorage.getItem(LANGUAGE_STORAGE_KEY) || localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
  if (saved === 'zh' || saved === 'en') {
    if (!localStorage.getItem(LANGUAGE_STORAGE_KEY)) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, saved);
    }
    return saved;
  }
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof TranslationDictionary | string) => string;
  dict: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === 'zh' ? 'en' : 'zh';
    setLanguage(nextLang);
  };

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.title = translations[language].brand;
    const descriptionMeta = document.getElementById('pageDescription');
    if (descriptionMeta) {
      descriptionMeta.setAttribute('content', translations[language].pageDescription);
    }
  }, [language]);

  const t = (key: keyof TranslationDictionary | string): string => {
    return translate(language, key);
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, toggleLanguage, t, dict: translations[language] }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

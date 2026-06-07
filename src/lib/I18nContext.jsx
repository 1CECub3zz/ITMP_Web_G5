import { createContext, useContext, useMemo, useState } from 'react';
import { DEFAULT_LANGUAGE, getNestedTranslation, translations } from '@/lib/i18n';

const STORAGE_KEY = 'brewtrack.language';
const I18nContext = createContext(null);

function readInitialLanguage() {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && translations[stored] ? stored : DEFAULT_LANGUAGE;
}

function applyVariables(template, variables = {}) {
  if (typeof template !== 'string') return template;
  return Object.entries(variables).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template
  );
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(readInitialLanguage);

  const setLanguage = (nextLanguage) => {
    if (!translations[nextLanguage]) return;
    setLanguageState(nextLanguage);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    }
  };

  const t = (key, variables, fallback = key) => {
    const translated =
      getNestedTranslation(language, key) ??
      getNestedTranslation(DEFAULT_LANGUAGE, key) ??
      fallback;
    return applyVariables(translated, variables);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}


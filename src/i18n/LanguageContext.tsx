import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getSetting, setSetting } from '@/db/database';
import { translations, type Locale } from './translations';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void getSetting('locale').then((val) => {
      if (val && val in translations) {
        setLocaleState(val as Locale);
      }
      setLoaded(true);
    });
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    void setSetting('locale', newLocale);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let value = translations[locale]?.[key] ?? translations.en[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(`{${k}}`, String(v));
      }
    }
    return value;
  }, [locale]);

  if (!loaded) return null;

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTranslation() {
  return useContext(LanguageContext);
}

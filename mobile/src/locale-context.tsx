import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";
import {
  LOCALE_META,
  STORAGE_LOCALE,
  isLocale,
  translate,
  type Locale,
  type TranslateVars,
} from "@/lib/i18n";

type LocaleContextValue = {
  ready: boolean;
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: string, vars?: TranslateVars) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_LOCALE).then((stored) => {
      if (!cancelled) {
        if (isLocale(stored)) setLocaleState(stored);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = async (next: Locale) => {
    setLocaleState(next);
    I18nManager.allowRTL(LOCALE_META[next].dir === "rtl");
    await AsyncStorage.setItem(STORAGE_LOCALE, next);
  };

  const value = useMemo(
    () => ({
      ready,
      locale,
      setLocale,
      t: (key: string, vars?: TranslateVars) => translate(locale, key, vars),
    }),
    [ready, locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside LocaleProvider");
  return value;
}

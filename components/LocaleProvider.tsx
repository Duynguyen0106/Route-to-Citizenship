"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  LOCALE_META,
  STORAGE_LOCALE,
  isLocale,
  translate,
  type Locale,
  type TranslateVars,
} from "@/lib/i18n";

const LocaleContext = createContext<{
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: TranslateVars) => string;
}>({
  locale: "en",
  dir: "ltr",
  setLocale: () => undefined,
  t: (key) => key,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_LOCALE);
    if (isLocale(stored)) setLocaleState(stored);
  }, []);

  useEffect(() => {
    const meta = LOCALE_META[locale];
    document.documentElement.lang = meta.htmlLang;
    document.documentElement.dir = meta.dir;
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      dir: LOCALE_META[locale].dir,
      setLocale: (next: Locale) => {
        setLocaleState(next);
        window.localStorage.setItem(STORAGE_LOCALE, next);
      },
      t: (key: string, vars?: TranslateVars) => translate(locale, key, vars),
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

"use client";

import { LOCALES, LOCALE_META } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLocale();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className={compact ? "sr-only" : "text-ink-muted"}>{t("lang.label")}</span>
      <select
        className="min-h-11 rounded-lg border border-navy/15 bg-white px-2 py-1 text-navy"
        value={locale}
        aria-label={t("a11y.lang")}
        onChange={(event) => setLocale(event.target.value as (typeof LOCALES)[number])}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code} lang={LOCALE_META[code].htmlLang}>
            {LOCALE_META[code].native}
          </option>
        ))}
      </select>
    </label>
  );
}

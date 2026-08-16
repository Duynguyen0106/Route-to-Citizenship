"use client";

import Link from "next/link";
import { GOVUK, LEGAL_NOTICE } from "@/lib/legal";
import { RULES_REVIEWED_ON } from "@/lib/types";
import { formatLongDate } from "@/lib/format";
import { ReportInaccuracyButton } from "@/components/ReportInaccuracyButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLocale } from "@/components/LocaleProvider";

export function SiteFooter() {
  const { t } = useLocale();

  return (
    <footer className="border-t border-navy/10 bg-navy text-paper-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="max-w-4xl text-sm leading-relaxed text-paper-50">
          This app provides general information only and does not constitute legal advice. Always
          check the{" "}
          <a
            className="underline decoration-gold/70 underline-offset-2"
            href={GOVUK.browse}
            target="_blank"
            rel="noreferrer"
          >
            official GOV.UK website
          </a>{" "}
          or consult a{" "}
          <a
            className="underline decoration-gold/70 underline-offset-2"
            href={GOVUK.adviser}
            target="_blank"
            rel="noreferrer"
          >
            regulated immigration adviser
          </a>
          .
        </p>
        <p className="sr-only">{LEGAL_NOTICE}</p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-paper-200/70">
          <p>Last reviewed: {formatLongDate(RULES_REVIEWED_ON)}.</p>
          <div className="flex flex-wrap items-center gap-4">
            <LanguageSwitcher compact />
            <ReportInaccuracyButton variant="footer" />
            <Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-white">
              {t("footer.privacy")}
            </Link>
            <Link href="/disclaimer" className="inline-flex min-h-11 items-center hover:text-white">
              {t("footer.disclaimer")}
            </Link>
            <Link href="/about" className="inline-flex min-h-11 items-center hover:text-white">
              {t("footer.sources")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

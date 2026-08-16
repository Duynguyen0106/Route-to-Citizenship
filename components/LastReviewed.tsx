"use client";

import { formatLongDate } from "@/lib/format";
import { RULES_REVIEWED_ON } from "@/lib/types";
import { useLocale } from "@/components/LocaleProvider";

export function LastReviewed({ date }: { date?: string }) {
  const { t } = useLocale();
  return (
    <p className="text-xs uppercase tracking-[0.16em] text-ink-faint">
      {t("reviewed.prefix")} {formatLongDate(date ?? RULES_REVIEWED_ON)}
    </p>
  );
}

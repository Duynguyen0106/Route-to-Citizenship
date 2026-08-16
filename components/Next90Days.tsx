"use client";

import { parseISO } from "date-fns";
import Link from "next/link";
import { useMemo } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { formatLongDate } from "@/lib/format";
import { localiseActionCopy, type TranslateFn } from "@/lib/i18n";
import { GOVUK } from "@/lib/legal";
import { buildNextActions, type ActionHorizon, type NextAction } from "@/lib/next-actions";
import type { PlanResult, Profile } from "@/lib/types";

const HORIZON_STYLE: Record<ActionHorizon, string> = {
  overdue: "border-clay/40 bg-clay/10 text-clay-600",
  now: "border-gold/40 bg-gold/10 text-navy",
  soon: "border-navy/15 bg-navy/5 text-navy",
  later: "border-navy/10 bg-paper-50 text-ink-muted",
};

function horizonLabel(horizon: ActionHorizon, t: TranslateFn): string {
  return t(`next90.horizon.${horizon}`);
}

function displayAction(action: NextAction, t: TranslateFn): NextAction {
  const date = action.dueOn
    ? formatLongDate(action.dueOn)
    : String(action.copyVars?.date ?? "");
  const copy = localiseActionCopy(t, action.copyKey, { ...action.copyVars, date });
  return { ...action, ...copy };
}

export function Next90Days({ profile, plan }: { profile: Profile; plan: PlanResult }) {
  const { t } = useLocale();
  const asOf = useMemo(() => {
    const parsed = parseISO(plan.asOf);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [plan.asOf]);
  const set = useMemo(() => buildNextActions(profile, plan, asOf), [profile, plan, asOf]);

  return (
    <section id="next" className="mt-8 scroll-mt-24">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">{t("nav.next")}</p>
      <h2 className="mt-2 font-serif text-2xl text-navy sm:text-3xl">{t("section.next")}</h2>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">{t("next90.intro")}</p>

      {set.milestones.length > 0 ? (
        <ol className="mt-6 grid gap-3 sm:grid-cols-3">
          {set.milestones.slice(0, 3).map((milestone) => (
            <li key={`${milestone.id}-${milestone.date}`} className="rounded-2xl border border-navy/10 bg-white p-4 shadow-card">
              <p className="text-xs uppercase tracking-[0.16em] text-ink-faint">
                {t(`milestone.${milestone.id}`)}
              </p>
              <p className="mt-2 font-serif text-xl text-navy">{formatLongDate(milestone.date)}</p>
            </li>
          ))}
        </ol>
      ) : null}

      <ul className="mt-6 space-y-3">
        {set.focus.map((action) => (
          <li key={action.id}>
            <ActionCard action={displayAction(action, t)} t={t} />
          </li>
        ))}
      </ul>

      {set.later.length > 0 ? (
        <details className="mt-4 rounded-2xl border border-navy/10 bg-paper-50 px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-navy">
            {t("next90.laterPath", { count: set.later.length })}
          </summary>
          <ul className="mt-3 space-y-3">
            {set.later.map((action) => (
              <li key={action.id}>
                <ActionCard action={displayAction(action, t)} t={t} compact />
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <p className="mt-4 text-xs text-ink-faint">
        {t("next90.adviserFooter")}{" "}
        <a href={GOVUK.adviser} className="underline" target="_blank" rel="noreferrer">
          {t("next90.adviserRegister")}
        </a>{" "}
        {t("next90.orSra")}{" "}
        <Link href="/advisers" className="underline">
          {t("next90.howIntro")}
        </Link>
        .
      </p>
    </section>
  );
}

function ActionCard({
  action,
  compact = false,
  t,
}: {
  action: NextAction;
  compact?: boolean;
  t: TranslateFn;
}) {
  const internal = action.href.startsWith("/");

  return (
    <article className={`rounded-2xl border px-4 py-4 ${HORIZON_STYLE[action.horizon]} ${compact ? "py-3" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-medium text-navy">{action.title}</p>
        <span className="text-xs uppercase tracking-wide">{horizonLabel(action.horizon, t)}</span>
      </div>
      {action.dueOn ? (
        <p className="mt-1 text-xs">{t("next90.sketchDate", { date: formatLongDate(action.dueOn) })}</p>
      ) : null}
      <p className="mt-2 text-sm">{action.detail}</p>
      {action.fact ? (
        <p className="mt-2 text-xs">
          {t("next90.encodedFrom", {
            date: formatLongDate(action.fact.effectiveFrom),
            summary: action.fact.summary,
          })}{" "}
          <a href={action.fact.sourceUrl} className="underline" target="_blank" rel="noreferrer">
            {t("next90.source")}
          </a>
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {internal ? (
          <Link href={action.href} className="inline-flex min-h-11 items-center rounded-full bg-navy px-3 py-1.5 text-paper-50">
            {action.cta}
          </Link>
        ) : (
          <a href={action.href} className="inline-flex min-h-11 items-center rounded-full bg-navy px-3 py-1.5 text-paper-50">
            {action.cta}
          </a>
        )}
        <a
          href={action.officialUrl}
          className="inline-flex min-h-11 items-center rounded-full border border-navy/20 bg-white px-3 py-1.5 text-navy"
          target="_blank"
          rel="noreferrer"
        >
          {action.officialLabel}
        </a>
      </div>
    </article>
  );
}

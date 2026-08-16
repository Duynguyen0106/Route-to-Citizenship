"use client";

import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Bell,
  CalendarRange,
  ClipboardCheck,
  GitCompare,
  Plane,
  ShieldAlert,
} from "lucide-react";
import { LastReviewed } from "@/components/LastReviewed";
import { useLocale } from "@/components/LocaleProvider";
import { listFeaturedRoutes, listRoutes } from "@/lib/routes";

const FEATURES = [
  { icon: CalendarRange, titleKey: "home.feat.routes.title", bodyKey: "home.feat.routes.body" },
  { icon: Plane, titleKey: "home.feat.absences.title", bodyKey: "home.feat.absences.body" },
  { icon: GitCompare, titleKey: "home.feat.switch.title", bodyKey: "home.feat.switch.body" },
  { icon: Banknote, titleKey: "home.feat.fees.title", bodyKey: "home.feat.fees.body" },
  { icon: ClipboardCheck, titleKey: "home.feat.checklist.title", bodyKey: "home.feat.checklist.body" },
  { icon: Bell, titleKey: "home.feat.reminders.title", bodyKey: "home.feat.reminders.body" },
] as const;

export function HomePageContent() {
  const { t } = useLocale();
  const featured = listFeaturedRoutes();

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
        <p className="text-xs uppercase tracking-[0.22em] text-clay">{t("home.kicker")}</p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-navy sm:text-6xl">
          {t("home.hero")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">{t("home.lead")}</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/plan"
            className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-paper-50 hover:bg-navy-700"
          >
            {t("home.ctaPlan")} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/pricing" className="text-sm text-ink-muted underline-offset-4 hover:underline">
            {t("home.ctaPricing")}
          </Link>
          <Link href="/disclaimer" className="text-sm text-ink-muted underline-offset-4 hover:underline">
            {t("home.ctaDisclaimer")}
          </Link>
        </div>
        <div className="mt-10 rounded-2xl border border-clay/30 bg-clay/10 px-5 py-4 text-sm leading-relaxed text-clay-600">
          <strong className="font-semibold">Not immigration advice.</strong> This tool does not
          assess your full case, cannot bind the Home Office, and must not be used as a substitute
          for GOV.UK guidance or advice from an OISC-regulated adviser or solicitor.
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/pricing" className="rounded-2xl border border-navy/10 bg-paper-50 p-5 hover:border-navy/30">
            <p className="text-xs uppercase tracking-[0.16em] text-moss">{t("home.plansKicker")}</p>
            <p className="mt-2 font-serif text-xl text-navy">{t("home.plansTitle")}</p>
            <p className="mt-1 text-sm text-ink-muted">{t("home.plansBody")}</p>
          </Link>
          <Link href="/advisers" className="rounded-2xl border border-navy/10 bg-paper-50 p-5 hover:border-navy/30">
            <p className="text-xs uppercase tracking-[0.16em] text-moss">{t("home.advisersKicker")}</p>
            <p className="mt-2 font-serif text-xl text-navy">{t("home.advisersTitle")}</p>
            <p className="mt-1 text-sm text-ink-muted">{t("home.advisersBody")}</p>
          </Link>
          <Link href="/employers" className="rounded-2xl border border-navy/10 bg-paper-50 p-5 hover:border-navy/30">
            <p className="text-xs uppercase tracking-[0.16em] text-moss">{t("home.employersKicker")}</p>
            <p className="mt-2 font-serif text-xl text-navy">{t("home.employersTitle")}</p>
            <p className="mt-1 text-sm text-ink-muted">{t("home.employersBody")}</p>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-serif text-3xl text-navy">{t("home.featuredTitle")}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {featured.map((route) => (
            <article key={route.key} className="rounded-2xl border border-navy/10 bg-paper-50 p-5">
              <LastReviewed date={route.lastReviewedOn} />
              <h3 className="mt-2 font-serif text-xl text-navy">
                <Link href={`/routes/${route.key}`} className="hover:underline">
                  {route.name}
                </Link>
              </h3>
              <p className="mt-2 text-sm text-ink-muted">{route.notes}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-ink-faint">
                {route.minYearsToILR
                  ? t("home.ilrYears", { years: route.minYearsToILR })
                  : t("home.ilrNA")}{" "}
                ·{" "}
                {route.absenceLimit
                  ? t("home.absencesDays", { days: route.absenceLimit })
                  : t("home.absencesNA")}{" "}
                · {t("home.englishLabel", { level: route.englishRequirement ?? t("home.englishNone") })}{" "}
                · {route.lifeInUKRequired ? t("home.lifeRequired") : t("home.lifeNotRequired")}
              </p>
              <p className="mt-3 text-sm">
                <Link href={`/routes/${route.key}`} className="text-navy underline underline-offset-2">
                  {t("home.govukLinks")}
                </Link>
              </p>
            </article>
          ))}
        </div>
        <h3 className="mt-12 font-serif text-2xl text-navy">{t("home.alsoTitle")}</h3>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">{t("home.alsoLead")}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {listRoutes()
            .filter((route) => !featured.some((item) => item.key === route.key))
            .map((route) => (
              <article key={route.key} className="rounded-xl border border-navy/10 bg-paper-50 p-4">
                <h4 className="font-medium text-navy">
                  <Link href={`/routes/${route.key}`} className="hover:underline">
                    {route.name}
                  </Link>
                </h4>
                <p className="mt-1 text-xs text-ink-muted">
                  {route.minYearsToILR
                    ? t("home.ilrYears", { years: route.minYearsToILR })
                    : t("home.ilrNone")}{" "}
                  · {route.notes.split(".")[0]}.
                </p>
              </article>
            ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="font-serif text-3xl text-navy">{t("home.featuresTitle")}</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article
              key={feature.titleKey}
              className="rounded-2xl border border-navy/10 bg-paper-50 p-5 shadow-card"
            >
              <feature.icon className="h-5 w-5 text-moss" />
              <h3 className="mt-3 font-serif text-xl text-navy">{t(feature.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t(feature.bodyKey)}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 flex items-center gap-2 text-sm text-ink-muted">
          <ShieldAlert className="h-4 w-4" />
          {t("home.recheck")}
        </p>
      </section>
    </div>
  );
}

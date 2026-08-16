"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AbsenceTracker } from "@/components/AbsenceTracker";
import { ApplicationWindows } from "@/components/ApplicationWindows";
import { ChecklistPanel } from "@/components/ChecklistPanel";
import { Next90Days } from "@/components/Next90Days";
import { DocumentVault } from "@/components/DocumentVault";
import { EligibilityPanel } from "@/components/EligibilityPanel";
import { FeeCalculator } from "@/components/FeeCalculator";
import { PathwayStrip } from "@/components/PathwayStrip";
import { RemindersPanel } from "@/components/RemindersPanel";
import { ResidenceCalendar } from "@/components/ResidenceCalendar";
import { RouteComparison } from "@/components/RouteComparison";
import { SwitchSimulator } from "@/components/SwitchSimulator";
import { Timeline } from "@/components/Timeline";
import { WhatIfAbsence } from "@/components/WhatIfAbsence";
import { LastReviewed } from "@/components/LastReviewed";
import { ReportInaccuracyButton } from "@/components/ReportInaccuracyButton";
import { RuleUpdates } from "@/components/RuleUpdates";
import { RiskPanel } from "@/components/RiskPanel";
import { RecommendationsPanel } from "@/components/RecommendationsPanel";
import { BenchmarkPanel } from "@/components/BenchmarkPanel";
import { GoalInterpreter } from "@/components/GoalInterpreter";
import { GuidanceChat } from "@/components/GuidanceChat";
import { ApplicationPackPanel } from "@/components/ApplicationPackPanel";
import { PartnerServicesPanel } from "@/components/PartnerServicesPanel";
import { ShareExportPanel } from "@/components/ShareExportPanel";
import { AbsenceImportTools } from "@/components/AbsenceImportTools";
import { AbsenceForecastPanel } from "@/components/AbsenceForecastPanel";
import { FeatureGate } from "@/components/FeatureGate";
import { ExpertQaPanel } from "@/components/ExpertQaPanel";
import { usePlan } from "@/components/PlanProvider";
import { PLAN_CATALOGUE } from "@/lib/billing";
import { SharePackView } from "@/components/SharePackView";
import { listVaultMeta } from "@/lib/document-vault";
import { buildSharePack } from "@/lib/share-pack";
import { useLocale } from "@/components/LocaleProvider";
import { formatGbp, formatLongDate } from "@/lib/format";
import { formatDaysUntilLabel } from "@/lib/i18n";
import { getPathway } from "@/lib/pathways";
import { getRouteForPathway } from "@/lib/routes";
import type { PlanResult, Profile } from "@/lib/types";

export function Dashboard({
  profile,
  plan,
  onEdit,
  onReset,
  onProfileChange,
}: {
  profile: Profile;
  plan: PlanResult;
  onEdit: () => void;
  onReset: () => void;
  onProfileChange: (profile: Profile) => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const { t } = useLocale();
  const { plan: previewPlan } = usePlan();
  const pathway = getPathway(plan.pathwayId);
  const rule = getRouteForPathway(plan.pathwayId);
  const printPack = useMemo(() => buildSharePack(profile, plan, listVaultMeta()), [profile, plan]);

  return (
    <>
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 print:hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-moss">{pathway.title}</p>
          <h1 className="mt-2 font-serif text-3xl text-navy sm:text-4xl">{plan.route.name}</h1>
          <p className="mt-2">
            <LastReviewed date={rule.lastReviewedOn} />
          </p>
          <p className="mt-3 max-w-2xl text-ink-muted">{plan.summary}</p>
          <p className="mt-2 text-xs text-ink-faint">
            {t("dash.previewPlan", { name: PLAN_CATALOGUE[previewPlan].name })} ·{" "}
            <Link href="/pricing" className="underline">
              {t("dash.changeTier")}
            </Link>{" "}
            {t("dash.noPayment")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm sm:gap-3">
          <button type="button" onClick={onEdit} className="min-h-11 rounded-full border border-navy/20 px-4 py-2">
            {t("dash.edit")}
          </button>
          <ReportInaccuracyButton routeKey={rule.key} />
          <button
            type="button"
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true);
                return;
              }
              onReset();
              setConfirmReset(false);
            }}
            className={`min-h-11 rounded-full px-4 py-2 ${
              confirmReset ? "bg-clay text-white" : "text-ink-muted"
            }`}
          >
            {confirmReset ? t("dash.resetConfirm") : t("dash.reset")}
          </button>
        </div>
      </div>

      <PathwayStrip pathwayId={plan.pathwayId} currentVisaId={profile.currentVisaId} />

      <div className="mt-4 rounded-xl border border-clay/25 bg-clay/10 px-4 py-3 text-sm text-clay-600">
        {t("dash.notAdvice")}{" "}
        <Link href="/disclaimer" className="underline">
          {t("dash.disclaimer")}
        </Link>
        . {t("dash.confirmOn")}{" "}
        <a href={plan.route.officialUrl} className="underline" target="_blank" rel="noreferrer">
          {t("dash.govukPage")}
        </a>{" "}
        {t("dash.orThe")}{" "}
        <Link href={`/routes/${rule.key}`} className="underline">
          {t("dash.routeNotes")}
        </Link>
        .
      </div>

      <Next90Days profile={profile} plan={plan} />

      <nav
        className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 text-sm sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        aria-label={t("a11y.jump")}
      >
        {[
          ["next", t("nav.next")],
          ["timeline", t("nav.timeline")],
          ["windows", t("nav.windows")],
          ["household", t("nav.household")],
          ["routes", t("nav.routes")],
          ["checklist", t("nav.checklist")],
          ["vault", t("nav.vault")],
          ["absences", t("nav.absences")],
          ["whatif", t("nav.whatif")],
          ["switch", t("nav.switch")],
          ["fees", t("nav.fees")],
          ["eligibility", t("nav.eligibility")],
          ["rules", t("nav.rules")],
          ["recommend", t("nav.recommend")],
          ["risk", t("nav.risk")],
          ["benchmarks", t("nav.benchmarks")],
          ["goals", t("nav.goals")],
          ["chat", t("nav.chat")],
          ["apply", t("nav.apply")],
          ["services", t("nav.services")],
          ["share", t("nav.share")],
          ["expert", t("nav.expert")],
          ["reminders", t("nav.reminders")],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-navy/10 px-3 py-2 text-navy hover:bg-navy/15"
          >
            {label}
          </a>
        ))}
      </nav>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label={t("dash.visaExpires")}
          value={formatLongDate(profile.visaExpiresOn)}
          hint={formatDaysUntilLabel(profile.visaExpiresOn, t)}
        />
        <Stat
          label={t("dash.ilrEligibility")}
          value={
            plan.ilrEligibleOn && plan.route.id !== "ilr"
              ? formatLongDate(plan.ilrEligibleOn)
              : plan.route.id === "ilr"
                ? t("dash.alreadyHeld")
                : t("dash.noIlrPath")
          }
          hint={
            plan.ilrApplyFrom
              ? t("dash.applyFrom", { date: formatLongDate(plan.ilrApplyFrom) })
              : plan.hasIlrPath
                ? t("dash.checkComparison")
                : t("dash.switchQualifying")
          }
        />
        <Stat
          label={t("dash.citizenshipEst")}
          value={
            plan.citizenshipEligibleOn
              ? formatLongDate(plan.citizenshipEligibleOn)
              : plan.citizenshipPath === "already_british"
                ? t("dash.alreadyBritish")
                : "—"
          }
          hint={
            plan.citizenshipPath === "naturalisation_spouse"
              ? t("dash.spouseHint")
              : plan.citizenshipPath === "registration_birth" || plan.citizenshipPath === "registration_parent"
                ? t("dash.registrationHint")
                : t("dash.standardWait")
          }
        />
        <Stat
          label={t("dash.pathCost")}
          value={formatGbp(plan.fees.totalGbp)}
          hint={t("dash.pathCostHint")}
        />
      </dl>

      {plan.needsVisaExtension && plan.extensionNote && (
        <div className="mt-6 rounded-2xl border border-clay/40 bg-white px-5 py-4 text-sm text-clay-600">
          <strong className="font-semibold">{t("dash.extensionNeeded")} </strong>
          {plan.extensionNote}
        </div>
      )}

      {plan.longResidenceIlrOn && plan.longResidenceIlrOn !== plan.ilrEligibleOn ? (
        <div className="mt-6 rounded-2xl border border-navy/10 bg-paper-50 px-5 py-4 text-sm text-ink-muted">
          <strong className="font-semibold text-navy">{t("dash.parallelClock")} </strong>
          {t("dash.parallelBody", { date: formatLongDate(plan.longResidenceIlrOn) })}
        </div>
      ) : null}

      <section id="timeline" className="mt-12 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.timeline")}</h2>
        <p className="mt-2 text-sm text-ink-muted">{t("dash.timelineIntro")}</p>
        <Timeline
          events={plan.timeline}
          residenceStart={profile.ukEntryDate || profile.qualifyingResidenceStart}
          asOf={plan.asOf}
        />
      </section>

      <section id="windows" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.windows")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">{t("dash.windowsIntro")}</p>
        <ApplicationWindows windows={plan.applicationWindows} processing={plan.processingEstimates} />
      </section>

      <section id="household" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.household")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">{t("dash.householdIntro")}</p>
        {plan.switchChain.length > 0 ? (
          <ol className="mt-6 space-y-3">
            {plan.switchChain.map((hop, index) => (
              <li key={`${hop.toVisaId}-${hop.on}`} className="rounded-xl border border-navy/10 bg-paper-50 px-4 py-3 text-sm">
                <p className="font-medium text-navy">
                  {index + 1}. {t("dash.switchTo", { visa: hop.toVisaId, date: formatLongDate(hop.on) })}
                </p>
                <p className="mt-1 text-ink-muted">{hop.note}</p>
                {hop.ilrEligibleOn ? (
                  <p className="mt-1 text-xs text-ink-faint">{t("dash.ilrFromHop", { date: formatLongDate(hop.ilrEligibleOn) })}</p>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-sm text-ink-muted">{t("dash.noSwitches")}</p>
        )}
        {plan.dependantPlans.length > 0 ? (
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {plan.dependantPlans.map((dependant) => (
              <li key={dependant.id} className="rounded-xl border border-navy/10 bg-paper-50 p-4">
                <p className="font-medium text-navy">{dependant.label}</p>
                <p className="mt-1 text-sm text-ink-muted">{dependant.summary}</p>
                <p className="mt-2 text-xs text-ink-faint">
                  {t("timeline.ilr")}: {dependant.ilrEligibleOn ? formatLongDate(dependant.ilrEligibleOn) : "—"}
                  {" · "}
                  {t("timeline.citizenship")}:{" "}
                  {dependant.citizenshipEligibleOn
                    ? formatLongDate(dependant.citizenshipEligibleOn)
                    : dependant.citizenshipPath === "already_british"
                      ? t("dash.alreadyBritish")
                      : "—"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-ink-muted">{t("dash.noDependants")}</p>
        )}
      </section>

      <section id="routes" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.routes")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">{t("dash.routesIntro")}</p>
        <RouteComparison profile={profile} plan={plan} onSwitch={onProfileChange} />
      </section>

      <section id="checklist" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.checklist")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">{t("dash.checklistIntro")}</p>
        <ChecklistPanel
          items={plan.checklist}
          checkedIds={profile.checkedDocumentIds}
          onToggle={(id) => {
            const next = profile.checkedDocumentIds.includes(id)
              ? profile.checkedDocumentIds.filter((item) => item !== id)
              : [...profile.checkedDocumentIds, id];
            onProfileChange({ ...profile, checkedDocumentIds: next });
          }}
        />
      </section>

      <section id="vault" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.vault")}</h2>
        <FeatureGate feature="vault">
          <DocumentVault checklist={plan.checklist} asOf={plan.asOf} />
        </FeatureGate>
      </section>

      <section id="absences" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.absences")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">{t("dash.absencesIntro")}</p>
        <FeatureGate feature="absences">
          <div className="mt-6">
            <AbsenceForecastPanel
              trips={profile.absences}
              asOf={plan.asOf}
              qualifyingStart={profile.qualifyingResidenceStart || profile.ukEntryDate}
            />
            <AbsenceImportTools
              trips={profile.absences}
              onChange={(absences) => onProfileChange({ ...profile, absences })}
            />
            <AbsenceTracker
              trips={profile.absences}
              qualifyingStart={profile.qualifyingResidenceStart || profile.ukEntryDate}
              onChange={(absences) => onProfileChange({ ...profile, absences })}
            />
          </div>
          <h3 className="mt-10 font-serif text-xl text-navy">{t("section.calendar")}</h3>
          <ResidenceCalendar trips={profile.absences} asOf={plan.asOf} />
        </FeatureGate>
      </section>

      <section id="whatif" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.whatif")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">{t("dash.whatifIntro")}</p>
        <FeatureGate feature="whatif">
          <WhatIfAbsence profile={profile} asOf={plan.asOf} />
        </FeatureGate>
      </section>

      <section id="switch" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.switch")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">{t("dash.switchIntro")}</p>
        <FeatureGate feature="switch">
          <SwitchSimulator profile={profile} plan={plan} />
        </FeatureGate>
      </section>

      <section id="fees" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.fees")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">{t("dash.feesIntro")}</p>
        <FeeCalculator profile={profile} />
      </section>

      <section id="eligibility" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.eligibility")}</h2>
        <FeatureGate feature="eligibility">
          <EligibilityPanel items={plan.eligibility} check={plan.eligibilityCheck} />
        </FeatureGate>
      </section>

      <section id="rules" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.rules")}</h2>
        <FeatureGate feature="rules">
          <RuleUpdates profile={profile} />
        </FeatureGate>
      </section>

      <section id="recommend" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.recommend")}</h2>
        <FeatureGate feature="recommend">
          <RecommendationsPanel profile={profile} plan={plan} />
        </FeatureGate>
      </section>

      <section id="risk" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.risk")}</h2>
        <FeatureGate feature="risk">
          <RiskPanel profile={profile} plan={plan} />
        </FeatureGate>
      </section>

      <section id="benchmarks" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.benchmarks")}</h2>
        <FeatureGate feature="benchmarks">
          <BenchmarkPanel profile={profile} plan={plan} />
        </FeatureGate>
      </section>

      <section id="goals" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.goals")}</h2>
        <FeatureGate feature="goals">
          <GoalInterpreter />
        </FeatureGate>
      </section>

      <section id="chat" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.chat")}</h2>
        <FeatureGate feature="chat">
          <GuidanceChat />
        </FeatureGate>
      </section>

      <section id="apply" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.apply")}</h2>
        <ApplicationPackPanel profile={profile} plan={plan} />
      </section>

      <section id="services" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.services")}</h2>
        <FeatureGate feature="services">
          <PartnerServicesPanel profile={profile} plan={plan} onProfileChange={onProfileChange} />
        </FeatureGate>
      </section>

      <section id="share" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.share")}</h2>
        <FeatureGate feature="shareExport">
          <ShareExportPanel profile={profile} plan={plan} />
        </FeatureGate>
      </section>

      <section id="expert" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.expert")}</h2>
        <FeatureGate feature="expertQa">
          <ExpertQaPanel />
        </FeatureGate>
      </section>

      <section id="reminders" className="mt-14 scroll-mt-24 pb-8">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">{t("section.reminders")}</h2>
        <RemindersPanel
          reminders={plan.reminders}
          prefs={profile.reminderPrefs}
          onPrefsChange={(reminderPrefs) => onProfileChange({ ...profile, reminderPrefs })}
        />
      </section>
    </div>

    <div className="hidden print:block print-sheet px-8 py-6">
      <SharePackView pack={printPack} />
    </div>
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-paper-50 p-5 shadow-card">
      <dt className="text-xs uppercase tracking-[0.16em] text-ink-faint">{label}</dt>
      <dd className="mt-2 font-serif text-2xl text-navy">{value}</dd>
      <p className="mt-1 text-sm text-ink-muted">{hint}</p>
    </div>
  );
}

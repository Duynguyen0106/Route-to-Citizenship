"use client";

import { useState } from "react";
import Link from "next/link";
import { AbsenceTracker } from "@/components/AbsenceTracker";
import { ChecklistPanel } from "@/components/ChecklistPanel";
import { DashboardAlerts } from "@/components/DashboardAlerts";
import { EligibilityPanel } from "@/components/EligibilityPanel";
import { FeeCalculator } from "@/components/FeeCalculator";
import { PathwayStrip } from "@/components/PathwayStrip";
import { RemindersPanel } from "@/components/RemindersPanel";
import { RouteComparison } from "@/components/RouteComparison";
import { SwitchSimulator } from "@/components/SwitchSimulator";
import { Timeline } from "@/components/Timeline";
import { LastReviewed } from "@/components/LastReviewed";
import { ReportInaccuracyButton } from "@/components/ReportInaccuracyButton";
import { formatDaysUntil, formatGbp, formatLongDate } from "@/lib/format";
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
  const pathway = getPathway(plan.pathwayId);
  const rule = getRouteForPathway(plan.pathwayId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-moss">{pathway.title}</p>
          <h1 className="mt-2 font-serif text-3xl text-navy sm:text-4xl">{plan.route.name}</h1>
          <p className="mt-2">
            <LastReviewed date={rule.lastReviewedOn} />
          </p>
          <p className="mt-3 max-w-2xl text-ink-muted">{plan.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm sm:gap-3">
          <button type="button" onClick={onEdit} className="min-h-11 rounded-full border border-navy/20 px-4 py-2">
            Edit profile
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
            {confirmReset ? "Confirm start over" : "Start over"}
          </button>
        </div>
      </div>

      <PathwayStrip pathwayId={plan.pathwayId} currentVisaId={profile.currentVisaId} />

      <div className="mt-4 rounded-xl border border-clay/25 bg-clay/10 px-4 py-3 text-sm text-clay-600">
        Not immigration advice.{" "}
        <Link href="/disclaimer" className="underline">
          Read the full disclaimer
        </Link>
        . Confirm everything on{" "}
        <a href={plan.route.officialUrl} className="underline" target="_blank" rel="noreferrer">
          the GOV.UK page for this visa
        </a>{" "}
        or the{" "}
        <Link href={`/routes/${rule.key}`} className="underline">
          route notes
        </Link>
        .
      </div>

      <DashboardAlerts reminders={plan.reminders} />

      <nav className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 text-sm sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {[
          ["timeline", "Timeline"],
          ["routes", "Routes"],
          ["checklist", "Checklist"],
          ["absences", "Absences"],
          ["switch", "Switch dates"],
          ["fees", "Fees"],
          ["eligibility", "Eligibility"],
          ["reminders", "Reminders"],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="shrink-0 rounded-full bg-navy/10 px-3 py-2 text-navy hover:bg-navy/15"
          >
            {label}
          </a>
        ))}
      </nav>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Current visa expires"
          value={formatLongDate(profile.visaExpiresOn)}
          hint={formatDaysUntil(profile.visaExpiresOn)}
        />
        <Stat
          label="Estimated ILR eligibility"
          value={
            plan.ilrEligibleOn && plan.route.id !== "ilr"
              ? formatLongDate(plan.ilrEligibleOn)
              : plan.route.id === "ilr"
                ? "Already held"
                : "No ILR path yet"
          }
          hint={
            plan.ilrApplyFrom
              ? `Apply from ${formatLongDate(plan.ilrApplyFrom)}`
              : plan.hasIlrPath
                ? "Check the route comparison"
                : "Switch to a qualifying visa"
          }
        />
        <Stat
          label="Estimated citizenship"
          value={plan.citizenshipEligibleOn ? formatLongDate(plan.citizenshipEligibleOn) : "—"}
          hint={profile.marriedToBritishCitizen ? "Spouse of a British citizen pattern" : "Standard 12-month ILR wait"}
        />
        <Stat
          label="Path cost (estimate)"
          value={formatGbp(plan.fees.totalGbp)}
          hint="Visa, IHS, ILR, tests and citizenship — see Fees"
        />
      </dl>

      {plan.needsVisaExtension && plan.extensionNote && (
        <div className="mt-6 rounded-2xl border border-clay/40 bg-white px-5 py-4 text-sm text-clay-600">
          <strong className="font-semibold">Extension likely needed. </strong>
          {plan.extensionNote}
        </div>
      )}

      <section id="timeline" className="mt-12 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">Timeline</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Current date, visa expiry, ILR and citizenship markers. The bar is time already spent from
          your UK residence start.
        </p>
        <Timeline
          events={plan.timeline}
          residenceStart={profile.ukEntryDate || profile.qualifyingResidenceStart}
          asOf={plan.asOf}
        />
      </section>

      <section id="routes" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">Route comparison</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          The five MVP routes. Switch only if the planner models an in-country move from your current
          visa — it does not check whether you actually qualify.
        </p>
        <RouteComparison profile={profile} plan={plan} onSwitch={onProfileChange} />
      </section>

      <section id="checklist" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">Document checklist</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Typical evidence for the next application. Confirm the live list on GOV.UK.
        </p>
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

      <section id="absences" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">Absence tracker</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Log trips outside the UK. Totals are calculated per 12-month period against the usual
          180-day ILR limit. This is not a Home Office calculation.
        </p>
        <div className="mt-6">
          <AbsenceTracker
            trips={profile.absences}
            qualifyingStart={profile.qualifyingResidenceStart || profile.ukEntryDate}
            onChange={(absences) => onProfileChange({ ...profile, absences })}
          />
        </div>
      </section>

      <section id="switch" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">Custom switch date</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Compare staying put with switching on a date you choose. Use the cards above to apply a
          modelled in-country switch.
        </p>
        <SwitchSimulator profile={profile} plan={plan} />
      </section>

      <section id="fees" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">Fee calculator</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          A basic total using Home Office fees from 8 April 2026. IHS years and extras can be
          toggled; live amounts on GOV.UK always win.
        </p>
        <FeeCalculator profile={profile} />
      </section>

      <section id="eligibility" className="mt-14 scroll-mt-24">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">Basic eligibility checks</h2>
        <EligibilityPanel items={plan.eligibility} check={plan.eligibilityCheck} />
      </section>

      <section id="reminders" className="mt-14 scroll-mt-24 pb-8">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">All reminders</h2>
        <RemindersPanel
          reminders={plan.reminders}
          prefs={profile.reminderPrefs}
          onPrefsChange={(reminderPrefs) => onProfileChange({ ...profile, reminderPrefs })}
        />
      </section>
    </div>
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

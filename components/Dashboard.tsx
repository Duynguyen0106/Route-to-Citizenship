"use client";

import Link from "next/link";
import { AlternativeRoutes } from "@/components/AlternativeRoutes";
import { ChecklistPanel } from "@/components/ChecklistPanel";
import { EligibilityPanel } from "@/components/EligibilityPanel";
import { RemindersPanel } from "@/components/RemindersPanel";
import { Timeline } from "@/components/Timeline";
import { formatDaysUntil, formatLongDate } from "@/lib/format";
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
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-moss">Your route</p>
          <h1 className="mt-2 font-serif text-4xl text-navy">{plan.route.name}</h1>
          <p className="mt-3 max-w-2xl text-ink-muted">{plan.summary}</p>
        </div>
        <div className="flex gap-3 text-sm">
          <button type="button" onClick={onEdit} className="rounded-full border border-navy/20 px-4 py-2">
            Edit profile
          </button>
          <button type="button" onClick={onReset} className="rounded-full px-4 py-2 text-ink-muted">
            Start over
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-clay/25 bg-clay/10 px-4 py-3 text-sm text-clay-600">
        Not immigration advice.{" "}
        <Link href="/disclaimer" className="underline">
          Read the full disclaimer
        </Link>
        . Confirm everything on{" "}
        <a href={plan.route.officialUrl} className="underline" target="_blank" rel="noreferrer">
          the GOV.UK page for this visa
        </a>
        .
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Current visa expires"
          value={formatLongDate(profile.visaExpiresOn)}
          hint={formatDaysUntil(profile.visaExpiresOn)}
        />
        <Stat
          label="Estimated ILR eligibility"
          value={plan.ilrEligibleOn && plan.route.id !== "ilr" ? formatLongDate(plan.ilrEligibleOn) : plan.route.id === "ilr" ? "Already held" : "No ILR path"}
          hint={
            plan.ilrApplyFrom
              ? `Apply from ${formatLongDate(plan.ilrApplyFrom)}`
              : plan.hasIlrPath
                ? "Check switching options"
                : "Switch to a qualifying visa"
          }
        />
        <Stat
          label="Estimated citizenship eligibility"
          value={plan.citizenshipEligibleOn ? formatLongDate(plan.citizenshipEligibleOn) : "—"}
          hint={profile.marriedToBritishCitizen ? "Spouse of a British citizen pattern" : "Standard 12-month ILR wait"}
        />
      </dl>

      {plan.needsVisaExtension && plan.extensionNote && (
        <div className="mt-6 rounded-2xl border border-clay/40 bg-white px-5 py-4 text-sm text-clay-600">
          <strong className="font-semibold">Extension likely needed. </strong>
          {plan.extensionNote}
        </div>
      )}

      <section id="timeline" className="mt-12">
        <h2 className="font-serif text-3xl text-navy">Timeline</h2>
        <p className="mt-2 text-sm text-ink-muted">
          A sketch of your current path. Dates are estimates from the profile you entered.
        </p>
        <Timeline events={plan.timeline} />
      </section>

      <section id="eligibility" className="mt-14">
        <h2 className="font-serif text-3xl text-navy">Basic eligibility checks</h2>
        <EligibilityPanel items={plan.eligibility} />
      </section>

      <section id="alternatives" className="mt-14">
        <h2 className="font-serif text-3xl text-navy">Alternative routes</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          These are illustrative switches, not a finding that you qualify. Salary, endorsement,
          relationship, and in-country switching rules can block a move.
        </p>
        <AlternativeRoutes alternatives={plan.alternatives} hasIlrPath={plan.hasIlrPath} />
      </section>

      <section id="checklist" className="mt-14">
        <h2 className="font-serif text-3xl text-navy">Document checklist</h2>
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

      <section id="reminders" className="mt-14 pb-8">
        <h2 className="font-serif text-3xl text-navy">Reminders</h2>
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

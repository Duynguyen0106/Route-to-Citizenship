"use client";

import { useMemo, useState } from "react";
import { englishMet, lifeInUkMet } from "@/lib/eligibility";
import { defaultIhsYears, estimateFees, FEES_FROM, FEES_SOURCE } from "@/lib/fees";
import { formatGbp } from "@/lib/format";
import type { Profile } from "@/lib/types";

export function FeeCalculator({ profile }: { profile: Profile }) {
  const [includeNextVisa, setIncludeNextVisa] = useState(profile.currentVisaId !== "ilr");
  const [includeIhs, setIncludeIhs] = useState(profile.currentVisaId !== "ilr");
  const [includeIlr, setIncludeIlr] = useState(true);
  const [includeCitizenship, setIncludeCitizenship] = useState(true);
  const [includeTests, setIncludeTests] = useState(true);
  const [ihsYears, setIhsYears] = useState(
    defaultIhsYears(profile.currentVisaId, profile.sponsorshipOverThreeYears),
  );

  const breakdown = useMemo(
    () =>
      estimateFees({
        currentVisaId: profile.currentVisaId,
        pathwayId: profile.pathwayId,
        applyFromInsideUk: profile.applyFromInsideUk,
        sponsorshipOverThreeYears: profile.sponsorshipOverThreeYears,
        dependantCount: profile.dependantCount,
        includeNextVisa,
        includeIhs,
        ihsYears,
        includeIlr,
        includeCitizenship,
        includeTests,
        needsEnglishTest: !englishMet(profile),
        needsLifeInUk: !lifeInUkMet(profile),
        globalTalentNeedsEndorsement: profile.currentVisaId.startsWith("global-talent"),
      }),
    [
      profile,
      includeNextVisa,
      includeIhs,
      includeIlr,
      includeCitizenship,
      includeTests,
      ihsYears,
    ],
  );

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="rounded-2xl border border-navy/10 bg-paper-50 p-5">
        <p className="font-serif text-3xl text-navy">{formatGbp(breakdown.totalGbp)}</p>
        <p className="mt-1 text-sm text-ink-muted">
          {breakdown.people} applicant{breakdown.people === 1 ? "" : "s"} · Home Office table from{" "}
          {FEES_FROM}
        </p>
        <ul className="mt-4 divide-y divide-navy/10">
          {breakdown.lines.map((line) => (
            <li key={line.id} className="flex items-start justify-between gap-4 py-2 text-sm">
              <span>
                <span className="text-navy">{line.label}</span>
                {line.note && <span className="mt-0.5 block text-xs text-ink-muted">{line.note}</span>}
              </span>
              <span className="whitespace-nowrap font-medium">{formatGbp(line.amountGbp)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-ink-muted">
          {breakdown.disclaimer}{" "}
          <a href={FEES_SOURCE} className="underline" target="_blank" rel="noreferrer">
            Official fee table
          </a>
          .
        </p>
      </div>
      <aside className="space-y-3 rounded-2xl border border-navy/10 bg-paper-50 p-5 text-sm">
        <p className="font-medium text-navy">Include in this estimate</p>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={includeNextVisa} onChange={(e) => setIncludeNextVisa(e.target.checked)} />
          Next visa / extension
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={includeIhs} onChange={(e) => setIncludeIhs(e.target.checked)} />
          Immigration Health Surcharge
        </label>
        {includeIhs && (
          <label className="block text-xs text-ink-muted">
            IHS years
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={ihsYears}
              onChange={(event) => setIhsYears(Number(event.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-navy/15 px-2 py-1 text-sm text-ink"
            />
          </label>
        )}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={includeTests} onChange={(e) => setIncludeTests(e.target.checked)} />
          Tests (if not already met)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={includeIlr} onChange={(e) => setIncludeIlr(e.target.checked)} />
          ILR application
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={includeCitizenship} onChange={(e) => setIncludeCitizenship(e.target.checked)} />
          Citizenship (main applicant)
        </label>
        <p className="text-xs text-ink-muted">
          Dependants and in-UK vs overseas are taken from your profile. Edit the profile to change
          them.
        </p>
      </aside>
    </div>
  );
}

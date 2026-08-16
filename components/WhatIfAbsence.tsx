"use client";

import { parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { formatLongDate } from "@/lib/format";
import { useLocale } from "@/components/LocaleProvider";
import { simulateWhatIfAbsence } from "@/lib/what-if";
import type { Profile } from "@/lib/types";

export function WhatIfAbsence({ profile, asOf }: { profile: Profile; asOf: string }) {
  const { t } = useLocale();
  const [days, setDays] = useState(90);
  const [departedOn, setDepartedOn] = useState(asOf);
  const [ran, setRan] = useState(false);

  const result = useMemo(() => {
    if (!ran) return null;
    return simulateWhatIfAbsence(profile, { departedOn, days }, parseISO(asOf));
  }, [ran, profile, departedOn, days, asOf]);

  return (
    <div className="mt-6 rounded-2xl border border-navy/10 bg-paper-50 p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-medium text-navy">
          {t("whatif.days")}
          <input
            className="field-input"
            type="number"
            min={1}
            max={366}
            value={days}
            onChange={(event) => {
              setRan(false);
              setDays(Number(event.target.value) || 1);
            }}
          />
        </label>
        <label className="text-sm font-medium text-navy">
          {t("whatif.from")}
          <input
            className="field-input"
            type="date"
            value={departedOn}
            onChange={(event) => {
              setRan(false);
              setDepartedOn(event.target.value);
            }}
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            className="min-h-11 w-full rounded-full bg-navy px-4 py-2 text-sm text-paper-50"
            onClick={() => setRan(true)}
          >
            {t("whatif.run")}
          </button>
        </div>
      </div>

      {result ? (
        <div className="mt-5 space-y-3 text-sm" aria-live="polite">
          <p className="text-ink-muted">
            Extra trip: {formatLongDate(result.extraTrip.departedOn)} →{" "}
            {formatLongDate(result.extraTrip.returnedOn)} ({days} days). Last-12-month absences rise by{" "}
            {result.last12Delta} days.
          </p>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-navy/10 px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-ink-faint">ILR date</dt>
              <dd className="mt-1 text-navy">
                {formatLongDate(result.baseline.ilrEligibleOn ?? "")} →{" "}
                {formatLongDate(result.projected.ilrEligibleOn ?? "")}
              </dd>
            </div>
            <div className="rounded-xl border border-navy/10 px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-ink-faint">Citizenship date</dt>
              <dd className="mt-1 text-navy">
                {formatLongDate(result.baseline.citizenshipEligibleOn ?? "")} →{" "}
                {formatLongDate(result.projected.citizenshipEligibleOn ?? "")}
              </dd>
            </div>
          </dl>
          <ul className="list-disc space-y-1 pl-5 text-ink-muted">
            {result.flags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-muted">
          Example: 90 days away. This does not change your saved absences until you add a real trip.
        </p>
      )}
    </div>
  );
}

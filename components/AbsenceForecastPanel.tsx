"use client";

import { forecastAbsenceRisk } from "@/lib/absence-forecast";
import { formatLongDate } from "@/lib/format";
import type { AbsenceTrip } from "@/lib/types";
import { parseISO } from "date-fns";

export function AbsenceForecastPanel({
  trips,
  asOf,
  qualifyingStart,
}: {
  trips: AbsenceTrip[];
  asOf: string;
  qualifyingStart: string;
}) {
  const start = parseISO(qualifyingStart || asOf);
  const asOfDate = parseISO(asOf);
  if (Number.isNaN(start.getTime()) || Number.isNaN(asOfDate.getTime())) return null;
  const forecast = forecastAbsenceRisk(trips, asOfDate, start);

  return (
    <div className="mb-6 rounded-2xl border border-navy/10 bg-paper-50 p-4">
      <h3 className="text-xs uppercase tracking-[0.16em] text-ink-faint">Predictive absence sketch</h3>
      <p className="mt-2 font-serif text-2xl text-navy">
        {forecast.last12Months} days away
        <span className="ml-2 text-sm font-sans text-ink-muted">last 12 months · {forecast.remainingTo180} under 180</span>
      </p>
      {forecast.projectedHitOn ? (
        <p className="mt-1 text-sm text-ink-muted">
          Linear projection reaches 180 days around {formatLongDate(forecast.projectedHitOn)}.
        </p>
      ) : null}
      <ul className="mt-3 list-disc pl-5 text-sm text-ink-muted">
        {forecast.flags.map((flag) => (
          <li key={flag}>{flag}</li>
        ))}
      </ul>
    </div>
  );
}

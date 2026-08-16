"use client";

import { analyseAbsences, emptyAbsenceAnalysis, tripDays } from "@/lib/absences";
import { formatLongDate } from "@/lib/format";
import type { AbsenceTrip } from "@/lib/types";
import { parseISO } from "date-fns";

export function AbsenceTracker({
  trips,
  qualifyingStart,
  asOf = new Date(),
  onChange,
}: {
  trips: AbsenceTrip[];
  qualifyingStart: string;
  asOf?: Date;
  onChange: (trips: AbsenceTrip[]) => void;
}) {
  const analysis =
    trips.length > 0 && qualifyingStart
      ? analyseAbsences(trips, asOf, parseISO(qualifyingStart))
      : emptyAbsenceAnalysis(asOf);

  function addTrip() {
    onChange([
      ...trips,
      {
        id: crypto.randomUUID(),
        departedOn: "",
        returnedOn: "",
        place: "",
      },
    ]);
  }

  function update(id: string, patch: Partial<AbsenceTrip>) {
    onChange(trips.map((trip) => (trip.id === id ? { ...trip, ...patch } : trip)));
  }

  function remove(id: string) {
    onChange(trips.filter((trip) => trip.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Meter
          label="Last 12 months"
          value={`${analysis.last12Months} days`}
          hint={`${analysis.remainingLast12} of 180 ILR days left`}
          warn={analysis.last12Months > 150}
          bad={analysis.last12Months > 180}
        />
        <Meter
          label="Worst rolling 12 months"
          value={`${analysis.maxRolling12Months.days} days`}
          hint={
            analysis.breached180
              ? "Over 180 days — continuous residence may be broken"
              : "ILR usually allows up to 180 days in any 12 months"
          }
          warn={analysis.maxRolling12Months.days > 150}
          bad={analysis.breached180}
        />
        <Meter
          label="Citizenship windows"
          value={`${analysis.last5Years} / 450`}
          hint={`Last 12 months ${analysis.last12Months} / 90 · last 3 years ${analysis.last3Years} / 270`}
          warn={analysis.last12Months > 70 || analysis.last5Years > 400}
          bad={analysis.last12Months > 90 || analysis.last5Years > 450}
        />
      </div>

      <ul className="divide-y divide-navy/10 rounded-2xl border border-navy/10 bg-paper-50">
        {trips.length === 0 && (
          <li className="px-4 py-4 text-sm text-ink-muted">
            No trips yet. Add time spent outside the UK. Day of return is not counted.
          </li>
        )}
        {trips.map((trip) => (
          <li key={trip.id} className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <label className="text-xs text-ink-muted">
              Left the UK
              <input
                type="date"
                value={trip.departedOn}
                onChange={(event) => update(trip.id, { departedOn: event.target.value })}
                className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-2 py-1.5 text-sm text-ink"
              />
            </label>
            <label className="text-xs text-ink-muted">
              Returned
              <input
                type="date"
                value={trip.returnedOn}
                onChange={(event) => update(trip.id, { returnedOn: event.target.value })}
                className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-2 py-1.5 text-sm text-ink"
              />
            </label>
            <label className="text-xs text-ink-muted">
              Where
              <input
                type="text"
                value={trip.place}
                placeholder="Optional"
                onChange={(event) => update(trip.id, { place: event.target.value })}
                className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-2 py-1.5 text-sm text-ink"
              />
            </label>
            <div className="flex items-end justify-between gap-2 pb-1 text-xs text-ink-muted">
              <span>
                {trip.departedOn && trip.returnedOn
                  ? `${tripDays(trip)} day${tripDays(trip) === 1 ? "" : "s"}`
                  : ""}
              </span>
              <button type="button" onClick={() => remove(trip.id)} className="text-clay">
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={addTrip}
        className="rounded-full border border-navy/20 px-4 py-2 text-sm"
      >
        Add a trip
      </button>

      {analysis.breached180 && analysis.maxRolling12Months.days > 0 && (
        <p className="text-sm text-clay-600">
          The heaviest 12-month window in this log is {analysis.maxRolling12Months.days} days,
          ending {formatLongDate(analysis.maxRolling12Months.windowEnd)}. That can break ILR
          continuous residence.
        </p>
      )}
    </div>
  );
}

function Meter({
  label,
  value,
  hint,
  warn,
  bad,
}: {
  label: string;
  value: string;
  hint: string;
  warn: boolean;
  bad: boolean;
}) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-paper-50 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-faint">{label}</p>
      <p className={`mt-1 font-serif text-2xl ${bad ? "text-clay" : warn ? "text-gold-600" : "text-navy"}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-muted">{hint}</p>
    </div>
  );
}

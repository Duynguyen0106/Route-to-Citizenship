"use client";

import { parseISO } from "date-fns";
import { analyseAbsences, emptyAbsenceAnalysis, tripDays, twelveMonthPeriods } from "@/lib/absences";
import { formatLongDate } from "@/lib/format";
import type { AbsenceTrip } from "@/lib/types";

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
  const complete = trips.filter((trip) => trip.departedOn && trip.returnedOn);
  const analysis =
    complete.length > 0 && qualifyingStart
      ? analyseAbsences(complete, asOf, parseISO(qualifyingStart))
      : emptyAbsenceAnalysis(asOf);
  const periods = qualifyingStart
    ? twelveMonthPeriods(complete, asOf, parseISO(qualifyingStart))
    : [];
  const overLimit = periods.filter((period) => period.overLimit);

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

      <ul className="space-y-3 md:hidden">
        {trips.length === 0 ? (
          <li className="rounded-2xl border border-navy/10 bg-paper-50 px-4 py-4 text-sm text-ink-muted">
            No trips yet. Add time spent outside the UK. The day of return is not counted.
          </li>
        ) : (
          trips.map((trip, index) => (
            <li key={trip.id} className="rounded-2xl border border-navy/10 bg-paper-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-faint">Trip {index + 1}</p>
              <div className="mt-3 grid gap-3">
                <label className="text-sm font-medium text-navy">
                  Start date
                  <input
                    type="date"
                    value={trip.departedOn}
                    onChange={(event) => update(trip.id, { departedOn: event.target.value })}
                    className="field-input"
                  />
                </label>
                <label className="text-sm font-medium text-navy">
                  End date
                  <input
                    type="date"
                    value={trip.returnedOn}
                    onChange={(event) => update(trip.id, { returnedOn: event.target.value })}
                    className="field-input"
                  />
                </label>
                <p className="text-sm text-navy">
                  Days away:{" "}
                  <strong>
                    {trip.departedOn && trip.returnedOn ? tripDays(trip) : "—"}
                  </strong>
                </p>
                <label className="text-sm font-medium text-navy">
                  Reason
                  <input
                    type="text"
                    value={trip.place}
                    placeholder="Holiday, work, family…"
                    onChange={(event) => update(trip.id, { place: event.target.value })}
                    className="field-input"
                  />
                </label>
                <button type="button" onClick={() => remove(trip.id)} className="self-start text-sm text-clay">
                  Remove trip
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      <div className="hidden overflow-x-auto rounded-2xl border border-navy/10 bg-paper-50 md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-navy/5 text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Start date</th>
              <th className="px-4 py-3 font-medium">End date</th>
              <th className="px-4 py-3 font-medium">Days away</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {trips.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-ink-muted">
                  No trips yet. Add time spent outside the UK. The day of return is not counted.
                </td>
              </tr>
            ) : (
              trips.map((trip) => (
                <tr key={trip.id} className="border-t border-navy/10">
                  <td className="px-4 py-2">
                    <input
                      type="date"
                      aria-label="Start date"
                      value={trip.departedOn}
                      onChange={(event) => update(trip.id, { departedOn: event.target.value })}
                      className="min-h-11 w-full rounded-lg border border-navy/15 bg-white px-2 py-1.5"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="date"
                      aria-label="End date"
                      value={trip.returnedOn}
                      onChange={(event) => update(trip.id, { returnedOn: event.target.value })}
                      className="min-h-11 w-full rounded-lg border border-navy/15 bg-white px-2 py-1.5"
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-navy">
                    {trip.departedOn && trip.returnedOn ? tripDays(trip) : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      aria-label="Reason"
                      value={trip.place}
                      placeholder="Holiday, work, family…"
                      onChange={(event) => update(trip.id, { place: event.target.value })}
                      className="min-h-11 w-full rounded-lg border border-navy/15 bg-white px-2 py-1.5"
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button type="button" onClick={() => remove(trip.id)} className="text-sm text-clay">
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addTrip}
        className="min-h-11 rounded-full border border-navy/20 px-4 py-2 text-sm"
      >
        Add a trip
      </button>

      {periods.length > 0 ? (
        <div className="rounded-2xl border border-navy/10 bg-paper-50 p-4">
          <p className="text-sm font-medium text-navy">Days away per 12-month period</p>
          <ul className="mt-2 space-y-1 text-sm text-ink-muted">
            {periods.map((period) => (
              <li key={period.windowEnd} className={period.overLimit ? "text-clay-600" : ""}>
                {formatLongDate(period.windowStart)} to {formatLongDate(period.windowEnd)}:{" "}
                <strong>{period.days} days</strong>
                {period.overLimit ? " — over the usual 180-day ILR limit" : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {overLimit.length > 0 || analysis.breached180 ? (
        <p className="text-sm text-clay-600">
          At least one 12-month period exceeds 180 days away. That can break ILR continuous
          residence. Recheck the dates on GOV.UK or with a regulated adviser.
        </p>
      ) : null}
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

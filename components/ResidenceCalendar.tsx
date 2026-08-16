import { parseISO } from "date-fns";
import {
  RESIDENCE_TONE_LABEL,
  buildResidenceCalendar,
  type ResidenceTone,
} from "@/lib/residence-calendar";
import type { AbsenceTrip } from "@/lib/types";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TONE_CLASS: Record<ResidenceTone, string> = {
  uk: "bg-moss/25 text-moss-700",
  away: "bg-gold/40 text-navy",
  risk: "bg-clay/30 text-clay-600",
  breach: "bg-clay text-white",
  today: "bg-navy text-paper-50 ring-2 ring-gold",
  future: "bg-navy/5 text-ink-faint",
};

export function ResidenceCalendar({ trips, asOf }: { trips: AbsenceTrip[]; asOf: string }) {
  const months = buildResidenceCalendar(trips, parseISO(asOf), 12);
  return (
    <div className="mt-6">
      <ul className="mb-4 flex flex-wrap gap-3 text-xs text-ink-muted" aria-hidden>
        {(Object.keys(TONE_CLASS) as ResidenceTone[])
          .filter((tone) => tone !== "future")
          .map((tone) => (
            <li key={tone} className="flex items-center gap-2">
              <span className={`inline-block h-3 w-3 rounded-sm ${TONE_CLASS[tone]}`} />
              {RESIDENCE_TONE_LABEL[tone]}
            </li>
          ))}
      </ul>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {months.map((month) => (
          <section key={month.key} aria-label={month.label}>
            <h3 className="text-sm font-medium text-navy">{month.label}</h3>
            <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] text-ink-faint">
              {WEEKDAYS.map((day) => (
                <span key={day}>
                  <span aria-hidden>{day.slice(0, 1)}</span>
                  <span className="sr-only">{day}</span>
                </span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {month.days.map((day, index) => (
                <span
                  key={`${day.date}-${index}`}
                  title={`${day.date}: ${RESIDENCE_TONE_LABEL[day.tone]}${day.away ? ` · ${day.rolling12} days away in 12 months` : ""}`}
                  className={`flex min-h-8 items-center justify-center rounded-sm ${
                    day.inMonth ? TONE_CLASS[day.tone] : "bg-transparent text-ink-faint"
                  }`}
                >
                  <span className="sr-only">
                    {day.date}: {RESIDENCE_TONE_LABEL[day.tone]}
                    {day.rolling12 ? `, ${day.rolling12} days outside the UK in the previous 12 months` : ""}
                  </span>
                  <span aria-hidden>{day.inMonth ? day.dayOfMonth : ""}</span>
                </span>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-4 text-xs text-ink-muted">
        Colour is paired with a text label in the legend and in each day’s accessible name. This is a
        sketch of logged trips, not a Home Office calculation.
      </p>
    </div>
  );
}

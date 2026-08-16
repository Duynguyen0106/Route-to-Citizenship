import { addDays, differenceInCalendarDays, startOfMonth, endOfMonth } from "date-fns";
import { daysAbsentInRange } from "./absences";
import { toIsoDate } from "./dates";
import type { AbsenceTrip } from "./types";

export type ResidenceTone = "uk" | "away" | "risk" | "breach" | "today" | "future";

export interface ResidenceDay {
  date: string;
  dayOfMonth: number;
  inMonth: boolean;
  away: boolean;
  rolling12: number;
  tone: ResidenceTone;
}

export interface ResidenceMonth {
  key: string;
  label: string;
  year: number;
  month: number;
  days: ResidenceDay[];
}

function isAwayOn(trips: AbsenceTrip[], day: Date): boolean {
  const iso = toIsoDate(day);
  return trips.some((trip) => trip.departedOn && trip.returnedOn && iso >= trip.departedOn && iso < trip.returnedOn);
}

export function rollingAbsenceAt(trips: AbsenceTrip[], day: Date): number {
  return daysAbsentInRange(trips, addDays(day, -365), addDays(day, 1));
}

export function toneForDay(options: {
  date: Date;
  asOf: Date;
  away: boolean;
  rolling12: number;
}): ResidenceTone {
  const { date, asOf, away, rolling12 } = options;
  if (toIsoDate(date) === toIsoDate(asOf)) return "today";
  if (date.getTime() > asOf.getTime()) return "future";
  if (away && rolling12 > 180) return "breach";
  if (away && rolling12 > 150) return "risk";
  if (away) return "away";
  if (rolling12 > 180) return "breach";
  if (rolling12 > 150) return "risk";
  return "uk";
}

export function buildResidenceMonth(
  trips: AbsenceTrip[],
  year: number,
  monthIndex: number,
  asOf: Date,
): ResidenceMonth {
  const monthStart = startOfMonth(new Date(year, monthIndex, 1));
  const monthEnd = endOfMonth(monthStart);
  const startWeekday = monthStart.getDay();
  const days: ResidenceDay[] = [];

  for (let offset = 0; offset < startWeekday; offset += 1) {
    const date = addDays(monthStart, offset - startWeekday);
    days.push({
      date: toIsoDate(date),
      dayOfMonth: date.getDate(),
      inMonth: false,
      away: false,
      rolling12: 0,
      tone: "future",
    });
  }

  const monthLength = differenceInCalendarDays(addDays(monthEnd, 1), monthStart);
  for (let index = 0; index < monthLength; index += 1) {
    const date = addDays(monthStart, index);
    const away = isAwayOn(trips, date);
    const rolling12 = away || toIsoDate(date) <= toIsoDate(asOf) ? rollingAbsenceAt(trips, date) : 0;
    days.push({
      date: toIsoDate(date),
      dayOfMonth: date.getDate(),
      inMonth: true,
      away,
      rolling12,
      tone: toneForDay({ date, asOf, away, rolling12 }),
    });
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return {
    key: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
    label: `${monthNames[monthIndex]} ${year}`,
    year,
    month: monthIndex,
    days,
  };
}

/** Last 12 complete-or-current months up to `asOf`. */
export function buildResidenceCalendar(
  trips: AbsenceTrip[],
  asOf: Date,
  monthCount = 12,
): ResidenceMonth[] {
  const months: ResidenceMonth[] = [];
  const cursor = startOfMonth(asOf);
  for (let index = monthCount - 1; index >= 0; index -= 1) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth() - index, 1);
    months.push(buildResidenceMonth(trips, date.getFullYear(), date.getMonth(), asOf));
  }
  return months;
}

export const RESIDENCE_TONE_LABEL: Record<ResidenceTone, string> = {
  uk: "In the UK",
  away: "Outside the UK",
  risk: "Approaching 180-day limit",
  breach: "Over 180 days in 12 months",
  today: "Today",
  future: "Future / padding",
};

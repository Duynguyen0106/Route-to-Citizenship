import { differenceInCalendarDays, parseISO, subMonths, subYears } from "date-fns";
import { toIsoDate } from "./dates";
import type { AbsenceAnalysis, AbsenceTrip, AbsenceWindow } from "./types";

export interface TwelveMonthPeriod {
  windowStart: string;
  windowEnd: string;
  days: number;
  overLimit: boolean;
}

/** Whole days outside the UK: departure date up to (not including) the return date. */
export function tripDays(trip: AbsenceTrip): number {
  return Math.max(0, differenceInCalendarDays(parseISO(trip.returnedOn), parseISO(trip.departedOn)));
}

export function daysAbsentInRange(
  trips: AbsenceTrip[],
  rangeStart: Date,
  rangeEnd: Date,
): number {
  let total = 0;
  for (const trip of trips) {
    const start = parseISO(trip.departedOn);
    const end = parseISO(trip.returnedOn);
    const overlapStart = start > rangeStart ? start : rangeStart;
    const overlapEnd = end < rangeEnd ? end : rangeEnd;
    if (overlapEnd > overlapStart) {
      total += differenceInCalendarDays(overlapEnd, overlapStart);
    }
  }
  return total;
}

export function maxRolling12MonthAbsence(
  trips: AbsenceTrip[],
  from: Date,
  to: Date,
): AbsenceWindow {
  const anchors: Date[] = [to];
  for (const trip of trips) {
    anchors.push(parseISO(trip.departedOn), parseISO(trip.returnedOn));
  }

  let max = 0;
  let windowEnd = to;
  let windowStart = subMonths(to, 12);

  for (const end of anchors) {
    if (end < from || end > to) continue;
    const start = subMonths(end, 12);
    const days = daysAbsentInRange(trips, start, end);
    if (days >= max) {
      max = days;
      windowEnd = end;
      windowStart = start;
    }
  }

  return {
    days: max,
    windowStart: toIsoDate(windowStart),
    windowEnd: toIsoDate(windowEnd),
  };
}

export function analyseAbsences(
  trips: AbsenceTrip[],
  asOf: Date,
  qualifyingStart: Date,
): AbsenceAnalysis {
  const last12Start = subMonths(asOf, 12);
  const last3Start = subYears(asOf, 3);
  const last5Start = subYears(asOf, 5);
  const last12 = daysAbsentInRange(trips, last12Start, asOf);
  const last3Years = daysAbsentInRange(trips, last3Start, asOf);
  const last5Years = daysAbsentInRange(trips, last5Start, asOf);
  const maxRolling12Months = maxRolling12MonthAbsence(trips, qualifyingStart, asOf);

  return {
    tripCount: trips.length,
    last12Months: last12,
    last3Years,
    last5Years,
    maxRolling12Months,
    breached180: maxRolling12Months.days > 180 || last12 > 180,
    remainingLast12: Math.max(0, 180 - last12),
    remainingCitizenship12: Math.max(0, 90 - last12),
    remainingCitizenship5y: Math.max(0, 450 - last5Years),
    remainingCitizenship3y: Math.max(0, 270 - last3Years),
  };
}

/** Split a trip's counted days (excluding the return date) across calendar years. */
export function daysAwayByYear(start: Date, end: Date): Record<string, number> {
  const totals: Record<string, number> = {};
  let cursor = start;
  while (cursor < end) {
    const year = Number(toIsoDate(cursor).slice(0, 4));
    const yearEnd = parseISO(`${year + 1}-01-01`);
    const chunkEnd = yearEnd < end ? yearEnd : end;
    const days = differenceInCalendarDays(chunkEnd, cursor);
    if (days > 0) totals[String(year)] = (totals[String(year)] ?? 0) + days;
    cursor = chunkEnd;
  }
  return totals;
}

export function totalsByYear(trips: AbsenceTrip[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const trip of trips) {
    if (!trip.departedOn || !trip.returnedOn) continue;
    const chunk = daysAwayByYear(parseISO(trip.departedOn), parseISO(trip.returnedOn));
    for (const [year, days] of Object.entries(chunk)) {
      totals[year] = (totals[year] ?? 0) + days;
    }
  }
  return totals;
}

/** Days away in each 12-month window ending on a trip return date or as-of date. */
export function twelveMonthPeriods(
  trips: AbsenceTrip[],
  asOf: Date,
  qualifyingStart: Date,
  limit = 180,
): TwelveMonthPeriod[] {
  const complete = trips.filter((trip) => trip.departedOn && trip.returnedOn);
  const ends = [asOf, ...complete.map((trip) => parseISO(trip.returnedOn))];
  const seen = new Set<string>();
  const periods: TwelveMonthPeriod[] = [];

  for (const end of ends) {
    if (Number.isNaN(end.getTime()) || end < qualifyingStart) continue;
    const windowEnd = toIsoDate(end);
    if (seen.has(windowEnd)) continue;
    seen.add(windowEnd);
    const start = subMonths(end, 12);
    const days = daysAbsentInRange(complete, start, end);
    periods.push({
      windowStart: toIsoDate(start),
      windowEnd,
      days,
      overLimit: days > limit,
    });
  }

  return periods.sort((a, b) => b.windowEnd.localeCompare(a.windowEnd));
}

export function emptyAbsenceAnalysis(asOf: Date): AbsenceAnalysis {
  const iso = toIsoDate(asOf);
  return {
    tripCount: 0,
    last12Months: 0,
    last3Years: 0,
    last5Years: 0,
    maxRolling12Months: { days: 0, windowStart: iso, windowEnd: iso },
    breached180: false,
    remainingLast12: 180,
    remainingCitizenship12: 90,
    remainingCitizenship5y: 450,
    remainingCitizenship3y: 270,
  };
}

export function withDerivedAbsenceTotals<T extends {
  absences?: AbsenceTrip[];
  daysAbsentLast12Months: number;
  daysAbsentLast5Years: number;
  daysAbsentLast12MonthsCitizenship: number;
  exceeded180DaysInAny12Months: boolean;
  qualifyingResidenceStart: string;
}>(profile: T, asOf: Date): T {
  if (!profile.absences?.length) return profile;
  const analysis = analyseAbsences(
    profile.absences,
    asOf,
    parseISO(profile.qualifyingResidenceStart || toIsoDate(asOf)),
  );
  return {
    ...profile,
    daysAbsentLast12Months: analysis.last12Months,
    daysAbsentLast5Years: analysis.last5Years,
    daysAbsentLast12MonthsCitizenship: analysis.last12Months,
    exceeded180DaysInAny12Months: analysis.breached180,
  };
}

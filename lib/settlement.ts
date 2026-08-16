import { addDays, addMonths, addYears, parseISO } from "date-fns";
import { toIsoDate } from "./dates";
import type { VisaRoute } from "./types";

/** ILR can usually be applied for up to 28 days before the qualifying date. */
export const ILR_EARLY_APPLY_DAYS = 28;

export function addCalendarYears(start: Date, years: number): Date {
  if (years === 0) return new Date(start);
  if (Number.isInteger(years)) return addYears(start, years);
  return addMonths(start, Math.round(years * 12));
}

export function laterDate(a: Date, b: Date): Date {
  return a.getTime() >= b.getTime() ? a : b;
}

export function ilrEligibleDate(route: VisaRoute, qualifyingStart: Date): Date | null {
  if (!route.leadsToIlr || route.ilrYears === null) return null;
  return addCalendarYears(qualifyingStart, route.ilrYears);
}

export function ilrApplyFromDate(eligibleOn: Date): Date {
  return addDays(eligibleOn, -ILR_EARLY_APPLY_DAYS);
}

/**
 * Naturalisation (British citizenship) after ILR:
 * - Standard: ILR held for 12 months, and 5 years' residence.
 * - Married to a British citizen: no 12-month ILR wait; 3 years' residence and ILR first.
 */
export function citizenshipEligibleDate(options: {
  ilrEligibleOn: Date | null;
  ilrGrantedOn: Date | null;
  residenceStart: Date;
  marriedToBritishCitizen: boolean;
  alreadyHasIlr: boolean;
}): Date | null {
  const { ilrEligibleOn, ilrGrantedOn, residenceStart, marriedToBritishCitizen, alreadyHasIlr } =
    options;

  const ilrDate = alreadyHasIlr ? ilrGrantedOn : ilrEligibleOn;
  if (!ilrDate) return null;

  if (marriedToBritishCitizen) {
    const threeYearResidence = addCalendarYears(residenceStart, 3);
    return laterDate(ilrDate, threeYearResidence);
  }

  const twelveMonthsAfterIlr = addCalendarYears(ilrDate, 1);
  const fiveYearResidence = addCalendarYears(residenceStart, 5);
  return laterDate(twelveMonthsAfterIlr, fiveYearResidence);
}

export function isoOrNull(value: Date | null): string | null {
  return value ? toIsoDate(value) : null;
}

export { toIsoDate, parseISO };

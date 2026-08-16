import { addDays, addMonths } from "date-fns";
import { analyseAbsences } from "./absences";
import { toIsoDate } from "./dates";
import type { AbsenceTrip } from "./types";

export interface AbsenceForecast {
  last12Months: number;
  remainingTo180: number;
  projectedHitOn: string | null;
  flags: string[];
}

/**
 * Sketch whether logged trips are heading toward the usual 180-day ILR limit.
 * This is not a Home Office calculation and does not predict a refusal.
 */
export function forecastAbsenceRisk(
  trips: AbsenceTrip[],
  asOf: Date,
  qualifyingStart: Date,
): AbsenceForecast {
  const analysis = analyseAbsences(trips, asOf, qualifyingStart);
  const last12Months = analysis.last12Months;
  const remainingTo180 = Math.max(0, 180 - last12Months);
  const flags: string[] = [];

  if (analysis.breached180) {
    flags.push(
      "Logged trips already sketch more than 180 days outside the UK in a 12-month window. Confirm the live rule on GOV.UK.",
    );
  } else if (last12Months >= 150) {
    flags.push(
      `You are about ${remainingTo180} day${remainingTo180 === 1 ? "" : "s"} under the usual 180-day ILR limit in the last 12 months.`,
    );
  }

  const lookbackStart = addMonths(asOf, -12);
  const spanDays = Math.max(1, Math.round((asOf.getTime() - lookbackStart.getTime()) / 86_400_000));
  const dailyRate = last12Months / spanDays;
  let projectedHitOn: string | null = null;
  if (!analysis.breached180 && dailyRate > 0 && remainingTo180 > 0) {
    const daysUntilHit = Math.ceil(remainingTo180 / dailyRate);
    if (daysUntilHit <= 365) {
      projectedHitOn = toIsoDate(addDays(asOf, daysUntilHit));
      flags.push(
        `If absences continue at the last-12-months rate, the 180-day sketch would be reached around ${projectedHitOn}. This is a linear projection, not a prediction of your travel.`,
      );
    }
  }

  if (last12Months > 90) {
    flags.push(
      "Citizenship usually allows 90 days outside the UK in the last 12 months. This sketch is already above that window.",
    );
  }

  if (flags.length === 0) {
    flags.push("Logged trips are not close to the usual 180-day ILR sketch on this profile.");
  }

  return { last12Months, remainingTo180, projectedHitOn, flags };
}

import { addYears, differenceInCalendarDays, parseISO } from "date-fns";
import { toIsoDate } from "./dates";
import { alreadyHoldsIlr } from "./eligibility";
import { countsTowardLongResidence, tryGetRoute } from "./visas";
import type { Profile, VisaStageRecord } from "./types";

/** A gap longer than this between grants is treated as breaking continuous lawful residence. */
export const LONG_RESIDENCE_GAP_DAYS = 14;

export function lawfulLeaveStages(profile: Profile): VisaStageRecord[] {
  const currentEnd = alreadyHoldsIlr(profile) ? profile.visaGrantedOn : profile.visaExpiresOn;
  const stages: VisaStageRecord[] = [
    ...(profile.priorStages ?? []),
    {
      visaId: profile.currentVisaId,
      start: profile.visaGrantedOn || profile.qualifyingResidenceStart || profile.ukEntryDate,
      end: currentEnd,
    },
  ].filter((stage) => {
    if (!stage.start) return false;
    const route = tryGetRoute(stage.visaId);
    if (!route) return stage.visaId !== "visitor";
    return countsTowardLongResidence(route);
  });

  return stages.sort((a, b) => a.start.localeCompare(b.start));
}

/**
 * Start of the latest unbroken stretch of lawful leave that can count toward
 * 10-year long residence. Visitor time is dropped; a gap over 14 days restarts the clock.
 */
export function longResidenceStartIso(profile: Profile): string | null {
  if (profile.pathwayId === "long-residence") {
    return (
      profile.ukEntryDate ||
      profile.qualifyingResidenceStart ||
      profile.visaGrantedOn ||
      null
    );
  }

  const stages = lawfulLeaveStages(profile);
  if (stages.length === 0) {
    return null;
  }

  let stretchStart = stages[0].start;
  for (let index = 1; index < stages.length; index += 1) {
    const previousEnd = parseISO(stages[index - 1].end || stages[index - 1].start);
    const nextStart = parseISO(stages[index].start);
    if (
      Number.isNaN(previousEnd.getTime()) ||
      Number.isNaN(nextStart.getTime()) ||
      differenceInCalendarDays(nextStart, previousEnd) > LONG_RESIDENCE_GAP_DAYS
    ) {
      stretchStart = stages[index].start;
    }
  }
  return stretchStart;
}

export function longResidenceIlrDate(profile: Profile): Date | null {
  const start = longResidenceStartIso(profile);
  if (!start) return null;
  const parsed = parseISO(start);
  if (Number.isNaN(parsed.getTime())) return null;
  return addYears(parsed, 10);
}

export function longResidenceIlrOnIso(profile: Profile): string | null {
  const date = longResidenceIlrDate(profile);
  return date ? toIsoDate(date) : null;
}

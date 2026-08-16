import { addDays, addMonths, addYears, formatISO, parseISO } from "date-fns";
import {
  canSwitchInCountry,
  getRoute,
  isFamilyCombination,
  isQualifyingWorkCombination,
} from "./routes";
import type {
  AlternativeRoute,
  PlanResult,
  Profile,
  TimelineEvent,
  VisaRoute,
} from "./types";
import { analyseAbsences, emptyAbsenceAnalysis, withDerivedAbsenceTotals } from "./absences";
import { buildChecklist } from "./checklist";
import { englishMet, lifeInUkMet, assessEligibility } from "./eligibility";
import { defaultIhsYears, estimateFees } from "./fees";
import { studentPathNeedsSwitch, SWITCH_TARGETS } from "./pathways";
import { buildReminders } from "./reminders";
import { normalizeProfile } from "./storage";

export function toIsoDate(date: Date): string {
  return formatISO(date, { representation: "date" });
}

export function fromIsoDate(value: string): Date {
  return parseISO(value);
}

export function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/** ILR can usually be applied for up to 28 days before the qualifying date. */
export const ILR_EARLY_APPLY_DAYS = 28;

export function addCalendarYears(start: Date, years: number): Date {
  if (years === 0) return new Date(start);
  if (Number.isInteger(years)) return addYears(start, years);
  return addMonths(start, Math.round(years * 12));
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
 * - Married to a British citizen: no 12-month ILR wait; 3 years' residence and ILR.
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

function laterDate(a: Date, b: Date): Date {
  return a.getTime() >= b.getTime() ? a : b;
}

export function needsExtension(
  visaExpiresOn: Date,
  ilrEligibleOn: Date | null,
): boolean {
  if (!ilrEligibleOn) {
    return true;
  }
  const applyFrom = ilrApplyFromDate(ilrEligibleOn);
  return visaExpiresOn.getTime() < applyFrom.getTime();
}

function buildTimeline(
  profile: Profile,
  route: VisaRoute,
  asOf: Date,
  ilrOn: Date | null,
  citizenshipOn: Date | null,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const [index, stage] of (profile.priorStages ?? []).entries()) {
    if (!stage.start) continue;
    events.push({
      id: `stage-${index}`,
      label: `${getRoute(stage.visaId).shortName} started`,
      date: stage.start,
      kind: "stage",
    });
  }

  events.push(
    {
      id: "qualifying-start",
      label:
        profile.pathwayId === "long-residence"
          ? "Lawful residence started"
          : "Qualifying residence started",
      date: profile.qualifyingResidenceStart,
      kind: "past",
    },
    {
      id: "now",
      label: "Today",
      date: toIsoDate(asOf),
      kind: "now",
    },
    {
      id: "visa-expiry",
      label: "Current visa expires",
      date: profile.visaExpiresOn,
      kind: "visa",
      note:
        fromIsoDate(profile.visaExpiresOn).getTime() < asOf.getTime()
          ? "This date is in the past. Check you still have valid leave."
          : undefined,
    },
  );

  if (studentPathNeedsSwitch(profile) && profile.plannedSwitchOn) {
    events.push({
      id: "planned-switch",
      label: `Planned switch to ${getRoute(profile.plannedSwitchTo || "skilled-worker").shortName}`,
      date: profile.plannedSwitchOn,
      kind: "stage",
    });
  }

  if (ilrOn && route.id !== "ilr") {
    events.push({
      id: "ilr",
      label: "Estimated ILR eligibility",
      date: toIsoDate(ilrOn),
      kind: "ilr",
      note: `You can usually apply up to ${ILR_EARLY_APPLY_DAYS} days earlier.`,
    });
  } else if (route.id === "ilr") {
    events.push({
      id: "ilr-held",
      label: "ILR / settled status held",
      date: profile.visaGrantedOn,
      kind: "ilr",
    });
  } else if (studentPathNeedsSwitch(profile) && !profile.plannedSwitchOn) {
    events.push({
      id: "switch-needed",
      label: "Switch needed to start ILR clock",
      date: profile.visaExpiresOn,
      kind: "warning",
      note: "Student and Graduate leave do not lead to ILR on their own.",
    });
  }

  if (citizenshipOn) {
    events.push({
      id: "citizenship",
      label: "Estimated citizenship eligibility",
      date: toIsoDate(citizenshipOn),
      kind: "citizenship",
    });
  }

  const seen = new Set<string>();
  return events
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .filter((event) => {
      const key = `${event.date}:${event.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function switchQualifyingStart(
  profile: Profile,
  current: VisaRoute,
  candidate: VisaRoute,
  asOf: Date,
): Date {
  const existingStart = fromIsoDate(profile.qualifyingResidenceStart);

  if (candidate.id === "global-talent-talent") {
    return asOf;
  }
  if (candidate.id === "innovator-founder" && current.id !== "innovator-founder") {
    return asOf;
  }
  if (isQualifyingWorkCombination(current, candidate) || isFamilyCombination(current, candidate)) {
    return existingStart;
  }
  if (candidate.id === "long-residence") {
    return fromIsoDate(profile.ukEntryDate || profile.qualifyingResidenceStart);
  }
  return asOf;
}

export function suggestAlternatives(
  profile: Profile,
  current: VisaRoute,
  currentIlrOn: Date | null,
  asOf: Date,
): AlternativeRoute[] {
  const results: AlternativeRoute[] = [];
  const candidates = SWITCH_TARGETS.map((target) => getRoute(target.visaId));

  for (const candidate of candidates) {
    if (candidate.id === current.id) continue;
    if (profile.pathwayId === "long-residence" && candidate.id === "long-residence") continue;

    const inCountry = canSwitchInCountry(current.id, candidate.id);
    const start = switchQualifyingStart(profile, current, candidate, asOf);
    const ilrOn = ilrEligibleDate(candidate, start);
    const citizenshipOn = citizenshipEligibleDate({
      ilrEligibleOn: ilrOn,
      ilrGrantedOn: null,
      residenceStart: fromIsoDate(profile.ukEntryDate || profile.qualifyingResidenceStart),
      marriedToBritishCitizen: profile.marriedToBritishCitizen,
      alreadyHasIlr: false,
    });

    let daysSaved: number | null = null;
    if (ilrOn && currentIlrOn) {
      daysSaved = daysBetween(ilrOn, currentIlrOn);
    } else if (ilrOn && !currentIlrOn) {
      daysSaved = null;
    } else if (candidate.id !== "graduate") {
      continue;
    }

    const reason = alternativeReason(current, candidate, daysSaved, inCountry);
    if (!reason) continue;

    results.push({
      routeId: candidate.id,
      name: candidate.name,
      reason,
      inCountrySwitch: inCountry,
      ilrEligibleOn: ilrOn ? toIsoDate(ilrOn) : null,
      citizenshipEligibleOn: citizenshipOn ? toIsoDate(citizenshipOn) : null,
      daysSavedVsCurrent: daysSaved,
      caveats: [
        ...candidate.caveats,
        ...(inCountry ? [] : ["You would usually need to apply from outside the UK."]),
      ],
      officialUrl: candidate.officialUrl,
    });
  }

  return results.sort((a, b) => {
    const aDate = a.ilrEligibleOn ?? "9999";
    const bDate = b.ilrEligibleOn ?? "9999";
    return aDate.localeCompare(bDate);
  });
}

function alternativeReason(
  current: VisaRoute,
  candidate: VisaRoute,
  daysSaved: number | null,
  inCountry: boolean,
): string | null {
  if (!current.leadsToIlr && candidate.leadsToIlr) {
    return `${candidate.shortName} can start a path to ILR after ${candidate.ilrYears} year${candidate.ilrYears === 1 ? "" : "s"}. Your current ${current.shortName} visa does not.`;
  }
  if (current.id === "spouse-10" && candidate.id === "spouse-5") {
    return "If you now meet the 5-year family route requirements (including the financial requirement), switching can halve the time to ILR.";
  }
  if (candidate.id === "global-talent-talent") {
    return "If you can secure a Global Talent endorsement as exceptional talent (or hold an eligible prize), ILR may be available after 3 years on that visa.";
  }
  if (candidate.id === "innovator-founder") {
    return "Innovator Founder can lead to ILR after 3 years if the business receives a settlement endorsement.";
  }
  if (candidate.id === "long-residence") {
    return "Lawful time in the UK can sometimes count toward 10-year long residence, even when the current visa has no 5-year ILR path.";
  }
  if (candidate.id === "graduate" && current.id === "student") {
    return "A Graduate visa can give you time to find a Skilled Worker sponsor. It does not itself lead to ILR.";
  }
  if (candidate.id === "skilled-worker" && (current.id === "student" || current.id === "graduate")) {
    return "Switching to Skilled Worker is the usual way this study path starts a 5-year ILR clock.";
  }
  if (daysSaved !== null && daysSaved > 30) {
    const years = candidate.ilrYears;
    return `Switching could bring ILR forward by about ${Math.round(daysSaved / 30)} months if you qualify (${years}-year route).`;
  }
  if (!inCountry && candidate.leadsToIlr && !current.leadsToIlr) {
    return `Apply for ${candidate.shortName} from overseas to begin an ILR-qualifying route.`;
  }
  return null;
}

function summarise(
  route: VisaRoute,
  ilrOn: Date | null,
  citizenshipOn: Date | null,
  needsExt: boolean,
): string {
  if (route.id === "ilr") {
    return citizenshipOn
      ? `You already have settlement. A typical next milestone is British citizenship from ${toIsoDate(citizenshipOn)}, if you meet the residence, test, and good character rules.`
      : "You already have settlement. Citizenship depends on residence, tests, and good character.";
  }
  if (!route.leadsToIlr) {
    return `${route.name} does not lead to ILR on its own. Look at switching options to start a qualifying clock.`;
  }
  if (!ilrOn) {
    return "This planner could not estimate an ILR date from the details provided.";
  }
  const ext = needsExt
    ? " You will likely need to extend or switch before that date so you still have valid leave."
    : "";
  const cit = citizenshipOn
    ? ` British citizenship is then typically estimated from ${toIsoDate(citizenshipOn)}.`
    : "";
  return `On your current ${route.shortName} route, ILR is estimated from ${toIsoDate(ilrOn)}.${ext}${cit}`;
}

export function calculatePlan(profile: Profile, asOf: Date = new Date()): PlanResult {
  const derived = withDerivedAbsenceTotals(normalizeProfile(profile), asOf);
  const pathwayId = derived.pathwayId ?? "skilled-worker";
  const route = getRoute(derived.currentVisaId);
  const alreadyHasIlr = route.id === "ilr";
  const residenceStart = fromIsoDate(derived.ukEntryDate || derived.qualifyingResidenceStart);
  const visaExpiry = fromIsoDate(derived.visaExpiresOn);

  let qualifyingStart = fromIsoDate(derived.qualifyingResidenceStart);
  let ilrRoute = route;
  let projectedIlr = route.leadsToIlr;

  if (pathwayId === "long-residence" && !alreadyHasIlr) {
    ilrRoute = getRoute("long-residence");
    projectedIlr = true;
  }

  if (studentPathNeedsSwitch(derived) && derived.plannedSwitchOn) {
    qualifyingStart = fromIsoDate(derived.plannedSwitchOn);
    ilrRoute = getRoute(derived.plannedSwitchTo || "skilled-worker");
    projectedIlr = true;
  }

  const ilrOn = alreadyHasIlr ? asOf : projectedIlr ? ilrEligibleDate(ilrRoute, qualifyingStart) : null;
  const applyFrom = ilrOn && !alreadyHasIlr ? ilrApplyFromDate(ilrOn) : null;
  const citizenshipOn = citizenshipEligibleDate({
    ilrEligibleOn: alreadyHasIlr ? fromIsoDate(derived.visaGrantedOn) : ilrOn,
    ilrGrantedOn: alreadyHasIlr ? fromIsoDate(derived.visaGrantedOn) : null,
    residenceStart,
    marriedToBritishCitizen: derived.marriedToBritishCitizen,
    alreadyHasIlr,
  });

  const needsExt =
    !alreadyHasIlr &&
    projectedIlr &&
    needsExtension(visaExpiry, ilrOn);

  const extensionNote = needsExt
    ? `Your visa expires on ${derived.visaExpiresOn}, which is before you can usually apply for ILR. Plan an extension or a switch so you do not have a gap in leave.`
    : null;

  const eligibility = assessEligibility({
    profile: derived,
    route,
    asOf,
    ilrOn,
    citizenshipOn,
    alreadyHasIlr,
  });

  const alternatives = suggestAlternatives(derived, route, ilrOn, asOf);
  const checklist = buildChecklist(derived, route);
  const reminders = buildReminders({
    profile: derived,
    route,
    asOf,
    ilrApplyFrom: applyFrom,
    ilrOn,
    citizenshipOn,
    visaExpiry,
  });

  const absences =
    derived.absences?.length > 0
      ? analyseAbsences(
          derived.absences,
          asOf,
          fromIsoDate(derived.qualifyingResidenceStart || derived.ukEntryDate),
        )
      : emptyAbsenceAnalysis(asOf);

  if (!derived.absences?.length) {
    absences.last12Months = derived.daysAbsentLast12Months;
    absences.last5Years = derived.daysAbsentLast5Years;
    absences.breached180 =
      derived.exceeded180DaysInAny12Months || derived.daysAbsentLast12Months > 180;
    absences.remainingLast12 = Math.max(0, 180 - derived.daysAbsentLast12Months);
    absences.remainingCitizenship12 = Math.max(0, 90 - derived.daysAbsentLast12MonthsCitizenship);
    absences.remainingCitizenship5y = Math.max(0, 450 - derived.daysAbsentLast5Years);
  }

  const fees = estimateFees({
    currentVisaId: derived.currentVisaId,
    pathwayId,
    applyFromInsideUk: derived.applyFromInsideUk,
    sponsorshipOverThreeYears: derived.sponsorshipOverThreeYears,
    dependantCount: derived.dependantCount,
    includeNextVisa: derived.currentVisaId !== "ilr",
    includeIhs: derived.currentVisaId !== "ilr",
    ihsYears: defaultIhsYears(derived.currentVisaId, derived.sponsorshipOverThreeYears),
    includeIlr: true,
    includeCitizenship: true,
    includeTests: true,
    needsEnglishTest: !englishMet(derived),
    needsLifeInUk: !lifeInUkMet(derived),
    globalTalentNeedsEndorsement: derived.currentVisaId.startsWith("global-talent"),
  });

  return {
    asOf: toIsoDate(asOf),
    pathwayId,
    route,
    hasIlrPath: projectedIlr,
    ilrEligibleOn: alreadyHasIlr ? derived.visaGrantedOn : ilrOn ? toIsoDate(ilrOn) : null,
    ilrApplyFrom: applyFrom ? toIsoDate(applyFrom) : null,
    citizenshipEligibleOn: citizenshipOn ? toIsoDate(citizenshipOn) : null,
    needsVisaExtension: Boolean(needsExt),
    extensionNote,
    timeline: buildTimeline(derived, route, asOf, alreadyHasIlr ? null : ilrOn, citizenshipOn),
    eligibility,
    alternatives,
    checklist,
    reminders,
    absences,
    fees,
    summary: summarise(route, alreadyHasIlr ? null : ilrOn, citizenshipOn, Boolean(needsExt)),
  };
}


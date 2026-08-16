import { formatISO, parseISO } from "date-fns";
import {
  canSwitchInCountry,
  getRoute,
  isFamilyCombination,
  isQualifyingWorkCombination,
  tryGetRoute,
} from "./visas";
import type {
  AlternativeRoute,
  PlanResult,
  Profile,
  TimelineEvent,
  VisaRoute,
} from "./types";
import { analyseAbsences, emptyAbsenceAnalysis, withDerivedAbsenceTotals } from "./absences";
import { buildChecklist } from "./checklist";
import { englishMet, lifeInUkMet, assessEligibility, checkEligibility, alreadyHoldsIlr } from "./eligibility";
import { planDependants, mainCitizenshipPath } from "./dependants";
import { longResidenceIlrDate } from "./long-residence";
import { plannedSwitchList, projectSwitchChain } from "./switch-chain";
import { defaultIhsYears, estimateFees } from "./fees";
import { studentPathNeedsSwitch, SWITCH_TARGETS } from "./pathways";
import { effectiveMinYearsToILR, getRouteForPathway, visaIdToCurrentVisaType } from "./routes";
import { buildReminders } from "./reminders";
import { normalizeProfile } from "./storage";
import {
  ILR_EARLY_APPLY_DAYS,
  addCalendarYears,
  citizenshipEligibleDate,
  ilrApplyFromDate,
  ilrEligibleDate,
} from "./settlement";
import {
  buildApplicationWindows,
  buildProcessingEstimates,
  processingTimelineEvents,
} from "./processing";

export { ILR_EARLY_APPLY_DAYS, addCalendarYears, citizenshipEligibleDate, ilrApplyFromDate, ilrEligibleDate };

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

export function needsExtension(
  visaExpiresOn: Date,
  ilrEligibleOn: Date | null,
): boolean {
  if (Number.isNaN(visaExpiresOn.getTime())) return true;
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
  extras: {
    switchChain: PlanResult["switchChain"];
    longResidenceIlrOn: string | null;
    citizenshipPath: PlanResult["citizenshipPath"];
    citizenshipDetail: string;
  },
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const [index, stage] of (profile.priorStages ?? []).entries()) {
    if (!stage.start) continue;
    const prior = tryGetRoute(stage.visaId);
    events.push({
      id: `stage-${index}`,
      label: `${prior?.shortName ?? stage.visaId} started`,
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

  if (extras.switchChain.length) {
    extras.switchChain.forEach((hop, index) => {
      const next = tryGetRoute(hop.toVisaId);
      events.push({
        id: index === 0 ? "planned-switch" : `chain-${index}`,
        label: `Planned switch to ${next?.shortName ?? hop.toVisaId}`,
        date: hop.on,
        kind: "stage",
        note: hop.note,
      });
    });
  } else if (profile.plannedSwitchOn && profile.plannedSwitchTo) {
    const next = tryGetRoute(profile.plannedSwitchTo);
    events.push({
      id: "planned-switch",
      label: `Planned switch to ${next?.shortName ?? profile.plannedSwitchTo}`,
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
      note:
        extras.longResidenceIlrOn && extras.longResidenceIlrOn === toIsoDate(ilrOn)
          ? `Estimated from 10 years of unbroken lawful residence. You can usually apply up to ${ILR_EARLY_APPLY_DAYS} days earlier.`
          : `You can usually apply up to ${ILR_EARLY_APPLY_DAYS} days earlier.`,
    });
  } else if (route.id === "ilr") {
    events.push({
      id: "ilr-held",
      label: "ILR / settled status held",
      date: profile.visaGrantedOn,
      kind: "ilr",
    });
  } else if (!route.leadsToIlr && !ilrOn) {
    events.push({
      id: "switch-needed",
      label: "Switch needed to start ILR clock",
      date: profile.visaExpiresOn,
      kind: "warning",
      note: `${route.shortName} does not lead to ILR on its own. Time may still count toward 10-year long residence.`,
    });
  }

  if (
    extras.longResidenceIlrOn &&
    extras.longResidenceIlrOn !== (ilrOn ? toIsoDate(ilrOn) : null)
  ) {
    events.push({
      id: "long-residence",
      label: "10-year long residence ILR (parallel clock)",
      date: extras.longResidenceIlrOn,
      kind: "ilr",
      note: "Lawful time on most visas can combine toward long residence, even if you switch categories.",
    });
  }

  if (citizenshipOn) {
    events.push({
      id: "citizenship",
      label:
        extras.citizenshipPath === "registration_birth" || extras.citizenshipPath === "registration_parent"
          ? "Estimated citizenship by registration"
          : extras.citizenshipPath === "naturalisation_spouse"
            ? "Estimated citizenship (3-year spouse route)"
            : "Estimated citizenship eligibility",
      date: toIsoDate(citizenshipOn),
      kind: "citizenship",
      note: extras.citizenshipDetail,
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
  extras: { longResidenceIlrOn: string | null; citizenshipDetail: string },
): string {
  if (route.id === "ilr") {
    return citizenshipOn
      ? `You already have settlement. A typical next milestone is British citizenship from ${toIsoDate(citizenshipOn)}, if you meet the residence, test, and good character rules.`
      : "You already have settlement. Citizenship depends on residence, tests, and good character.";
  }
  if (route.id === "child-registration") {
    return citizenshipOn
      ? `This is a citizenship-by-registration path, not an ILR clock. Registration is estimated from ${toIsoDate(citizenshipOn)}.`
      : "This is a citizenship-by-registration path. Add whether the child was born in the UK and whether a parent is British or later becomes settled.";
  }
  if (!route.leadsToIlr && ilrOn && extras.longResidenceIlrOn === toIsoDate(ilrOn)) {
    return `Your current ${route.shortName} visa does not have a 5-year ILR clock. Ten years of combined lawful residence is estimated from ${toIsoDate(ilrOn)}. Look at switching if you want a shorter settlement route.`;
  }
  if (!route.leadsToIlr) {
    return `${route.name} does not lead to ILR on its own. Look at switching options to start a qualifying clock. Lawful time may still count toward 10-year long residence.`;
  }
  if (!ilrOn) {
    return "This planner could not estimate an ILR date from the details provided.";
  }
  const ext = needsExt
    ? " You will likely need to extend or switch before that date so you still have valid leave."
    : "";
  const cit = citizenshipOn
    ? ` British citizenship is then typically estimated from ${toIsoDate(citizenshipOn)}. ${extras.citizenshipDetail}`
    : "";
  return `On your current ${route.shortName} route, ILR is estimated from ${toIsoDate(ilrOn)}.${ext}${cit}`;
}

function earliestDate(a: Date | null, b: Date | null): Date | null {
  if (a && b) return a.getTime() <= b.getTime() ? a : b;
  return a ?? b;
}

function dependantOwnIlr(profile: Profile): Date | null {
  const grant = fromIsoDate(profile.visaGrantedOn || profile.qualifyingResidenceStart);
  if (Number.isNaN(grant.getTime())) return null;
  const partner = addCalendarYears(grant, 5);
  if (!profile.mainApplicantIlrOn) return partner;
  const main = fromIsoDate(profile.mainApplicantIlrOn);
  if (Number.isNaN(main.getTime())) return partner;
  return partner.getTime() >= main.getTime() ? partner : main;
}

export function calculatePlan(profile: Profile, asOf: Date = new Date()): PlanResult {
  const derived = withDerivedAbsenceTotals(normalizeProfile(profile), asOf);
  const pathwayId = derived.pathwayId ?? "skilled-worker";
  const rule = getRouteForPathway(pathwayId);
  const route = getRoute(derived.currentVisaId);
  const alreadyHasIlr = alreadyHoldsIlr(derived);
  const visaExpiry = fromIsoDate(derived.visaExpiresOn);
  const currentVisaType = visaIdToCurrentVisaType(derived.currentVisaId);
  const hops = plannedSwitchList(derived);
  const chain = hops.length ? projectSwitchChain(derived) : null;
  const switchChain = chain?.hops ?? [];

  let qualifyingStart = fromIsoDate(derived.qualifyingResidenceStart);
  let projectedYears = effectiveMinYearsToILR(rule, currentVisaType, {
    plannedSwitch: hops.length > 0 || Boolean(derived.plannedSwitchOn),
    currentVisaId: derived.currentVisaId,
  });

  if (!chain && studentPathNeedsSwitch(derived) && derived.plannedSwitchOn) {
    qualifyingStart = fromIsoDate(derived.plannedSwitchOn);
    projectedYears = effectiveMinYearsToILR(rule, "SKILLED_WORKER", {
      plannedSwitch: true,
      currentVisaId: derived.plannedSwitchTo || "skilled-worker",
    });
  }

  let routeIlrOn: Date | null = null;
  if (alreadyHasIlr) {
    routeIlrOn = asOf;
  } else if (pathwayId === "child-registration") {
    routeIlrOn = null;
  } else if (pathwayId === "dependant") {
    routeIlrOn = dependantOwnIlr(derived);
  } else if (chain?.ilrOn) {
    routeIlrOn = chain.ilrOn;
  } else if (projectedYears !== null) {
    routeIlrOn = addCalendarYears(qualifyingStart, projectedYears);
  }

  const longResidenceOn =
    pathwayId === "child-registration" ? null : longResidenceIlrDate(derived);
  const ilrOn =
    pathwayId === "long-residence"
      ? longResidenceOn ?? routeIlrOn
      : earliestDate(routeIlrOn, longResidenceOn);

  const projectedIlr = Boolean(ilrOn);
  const applyFrom = ilrOn && !alreadyHasIlr ? ilrApplyFromDate(ilrOn) : null;
  const citizenship = mainCitizenshipPath({
    profile: derived,
    asOf,
    ilrOn,
    alreadyHasIlr,
  });
  const citizenshipOn = citizenship.eligibleOn ? fromIsoDate(citizenship.eligibleOn) : null;
  const dependantPlans = planDependants(
    derived,
    alreadyHasIlr ? derived.visaGrantedOn : ilrOn ? toIsoDate(ilrOn) : null,
    asOf,
    alreadyHasIlr,
  );

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
    rule,
    asOf,
    ilrOn,
    citizenshipOn,
    alreadyHasIlr,
  });
  const eligibilityCheck = checkEligibility(derived, rule, asOf);

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
    includeNextVisa: derived.currentVisaId !== "ilr" && derived.currentVisaId !== "child-registration",
    includeIhs: derived.currentVisaId !== "ilr" && derived.currentVisaId !== "child-registration",
    ihsYears: defaultIhsYears(derived.currentVisaId, derived.sponsorshipOverThreeYears),
    includeIlr: derived.currentVisaId !== "child-registration",
    includeCitizenship: derived.currentVisaId !== "child-registration" && derived.ageBand !== "under_18",
    includeTests: derived.currentVisaId !== "child-registration",
    needsEnglishTest: !englishMet(derived) && derived.currentVisaId !== "child-registration",
    needsLifeInUk: !lifeInUkMet(derived) && derived.currentVisaId !== "child-registration",
    globalTalentNeedsEndorsement: derived.currentVisaId.startsWith("global-talent"),
  });

  const longResidenceIlrOn = longResidenceOn ? toIsoDate(longResidenceOn) : null;
  const applicationWindows = buildApplicationWindows({
    profile: derived,
    route,
    asOf,
    ilrApplyFrom: applyFrom,
    ilrOn: alreadyHasIlr ? null : ilrOn,
    citizenshipOn,
  });
  const processingEstimates = buildProcessingEstimates({
    profile: derived,
    route,
    asOf,
    ilrApplyFrom: applyFrom,
    ilrOn: alreadyHasIlr ? null : ilrOn,
    citizenshipOn,
  });
  const timeline = [
    ...buildTimeline(derived, route, asOf, alreadyHasIlr ? null : ilrOn, citizenshipOn, {
      switchChain,
      longResidenceIlrOn,
      citizenshipPath: citizenship.kind,
      citizenshipDetail: citizenship.detail,
    }),
    ...processingTimelineEvents(applicationWindows, processingEstimates),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  return {
    asOf: toIsoDate(asOf),
    pathwayId,
    route,
    hasIlrPath: alreadyHasIlr || projectedIlr,
    ilrEligibleOn: alreadyHasIlr ? derived.visaGrantedOn : ilrOn ? toIsoDate(ilrOn) : null,
    ilrApplyFrom: applyFrom ? toIsoDate(applyFrom) : null,
    citizenshipEligibleOn: citizenshipOn ? toIsoDate(citizenshipOn) : null,
    citizenshipPath: citizenship.kind,
    longResidenceIlrOn,
    switchChain,
    dependantPlans,
    applicationWindows,
    processingEstimates,
    needsVisaExtension: Boolean(needsExt),
    extensionNote,
    timeline,
    eligibility,
    eligibilityCheck,
    alternatives,
    checklist,
    reminders,
    absences,
    fees,
    summary: summarise(route, alreadyHasIlr ? null : ilrOn, citizenshipOn, Boolean(needsExt), {
      longResidenceIlrOn,
      citizenshipDetail: citizenship.detail,
    }),
  };
}


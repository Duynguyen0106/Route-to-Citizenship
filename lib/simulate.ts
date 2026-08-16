import { parseISO } from "date-fns";
import {
  citizenshipEligibleDate,
  daysBetween,
  ilrEligibleDate,
  toIsoDate,
} from "./calculate";
import { alreadyHoldsIlr } from "./eligibility";
import { estimateFees } from "./fees";
import { SWITCH_TARGETS } from "./pathways";
import {
  canSwitchToRouteInCountry,
  listRoutes,
  switchTargetVisaId,
  visaIdToCurrentVisaType,
  type RouteDefinition,
} from "./routes";
import { canSwitchInCountry, getRoute, isFamilyCombination, isQualifyingWorkCombination } from "./visas";
import type { FeeBreakdown, PossibleSwitch, Profile } from "./types";

export interface SwitchSimulation {
  fromVisaId: string;
  toVisaId: string;
  toLabel: string;
  switchOn: string;
  inCountrySwitch: boolean;
  stayIlrOn: string | null;
  stayCitizenshipOn: string | null;
  newIlrOn: string | null;
  newCitizenshipOn: string | null;
  newQualifyingStart: string;
  daysSavedVsStay: number | null;
  clockNote: string;
  caveats: string[];
  nextApplicationFee: FeeBreakdown;
}

export function qualifyingStartAfterSwitch(
  profile: Profile,
  toVisaId: string,
  switchOn: Date,
): { start: Date; note: string } {
  const current = getRoute(profile.currentVisaId);
  const candidate = getRoute(toVisaId);
  const existingStart = parseISO(profile.qualifyingResidenceStart);
  const ukEntry = parseISO(profile.ukEntryDate || profile.qualifyingResidenceStart);

  if (toVisaId === "long-residence") {
    return {
      start: ukEntry,
      note: "Long residence usually counts continuous lawful time from when that residence began — not from the switch date.",
    };
  }
  if (toVisaId === "global-talent-talent") {
    return {
      start: switchOn,
      note: "The 3-year Global Talent ILR clock usually starts when you are on Global Talent, not from earlier work leave.",
    };
  }
  if (toVisaId === "graduate") {
    return {
      start: switchOn,
      note: "A Graduate visa does not lead to ILR. You would still need a later qualifying switch.",
    };
  }
  if (
    profile.pathwayId === "student-to-skilled" &&
    (current.id === "student" || current.id === "graduate") &&
    toVisaId === "skilled-worker"
  ) {
    return {
      start: switchOn,
      note: "Student and Graduate time does not usually count toward Skilled Worker ILR. The 5-year clock starts on the Skilled Worker grant.",
    };
  }
  if (isQualifyingWorkCombination(current, candidate) || isFamilyCombination(current, candidate)) {
    return {
      start: existingStart,
      note: "Time on your current qualifying route may combine with the new visa toward ILR.",
    };
  }
  return {
    start: switchOn,
    note: "This switch is treated as starting a new qualifying clock on the switch date.",
  };
}

export function simulateSwitch(
  profile: Profile,
  toVisaId: string,
  switchOn: Date,
  stayIlrOn: Date | null,
  stayCitizenshipOn: Date | null,
): SwitchSimulation {
  const target = SWITCH_TARGETS.find((item) => item.visaId === toVisaId);
  const candidate = getRoute(toVisaId);
  const { start, note } = qualifyingStartAfterSwitch(profile, toVisaId, switchOn);
  const ilrOn = ilrEligibleDate(candidate, start);
  const citizenshipOn = citizenshipEligibleDate({
    ilrEligibleOn: ilrOn,
    ilrGrantedOn: null,
    residenceStart: parseISO(profile.ukEntryDate || profile.qualifyingResidenceStart),
    marriedToBritishCitizen: profile.marriedToBritishCitizen,
    alreadyHasIlr: false,
  });

  let daysSaved: number | null = null;
  if (ilrOn && stayIlrOn) daysSaved = daysBetween(ilrOn, stayIlrOn);
  else if (ilrOn && !stayIlrOn) daysSaved = null;

  const inCountry = canSwitchInCountry(profile.currentVisaId, toVisaId);
  const nextApplicationFee = estimateFees({
    currentVisaId: toVisaId === "long-residence" ? "ilr" : toVisaId,
    pathwayId: target?.pathwayId ?? profile.pathwayId,
    applyFromInsideUk: inCountry,
    sponsorshipOverThreeYears: profile.sponsorshipOverThreeYears,
    dependantCount: profile.dependantCount,
    includeNextVisa: toVisaId !== "long-residence",
    includeIhs: toVisaId !== "long-residence" && toVisaId !== "ilr",
    ihsYears: toVisaId === "graduate" ? 2 : toVisaId === "spouse-5" || toVisaId === "spouse-10" ? 2.5 : 3,
    includeIlr: toVisaId === "long-residence",
    includeCitizenship: false,
    includeTests: false,
    needsEnglishTest: false,
    needsLifeInUk: false,
    globalTalentNeedsEndorsement: toVisaId.startsWith("global-talent"),
  });

  return {
    fromVisaId: profile.currentVisaId,
    toVisaId,
    toLabel: target?.label ?? candidate.name,
    switchOn: toIsoDate(switchOn),
    inCountrySwitch: inCountry,
    stayIlrOn: stayIlrOn ? toIsoDate(stayIlrOn) : null,
    stayCitizenshipOn: stayCitizenshipOn ? toIsoDate(stayCitizenshipOn) : null,
    newIlrOn: ilrOn ? toIsoDate(ilrOn) : null,
    newCitizenshipOn: citizenshipOn ? toIsoDate(citizenshipOn) : null,
    newQualifyingStart: toIsoDate(start),
    daysSavedVsStay: daysSaved,
    clockNote: note,
    caveats: [
      ...candidate.caveats,
      ...(inCountry ? [] : ["You would usually need to apply from outside the UK."]),
      "Salary, endorsement, relationship, and switching rules are not checked here.",
    ],
    nextApplicationFee,
  };
}

const SWITCH_CAVEATS: Record<string, string> = {
  "skilled-worker":
    "You still need a licensed sponsor, a valid Certificate of Sponsorship, and to meet the going rate / salary threshold.",
  "spouse-5":
    "You still need to meet the relationship and financial requirements for the partner route.",
  "global-talent-talent":
    "You still need an eligible endorsement as exceptional talent or an eligible prize.",
  "long-residence":
    "This is an ILR application after 10 years of continuous lawful residence, not a new visa. Not all leave counts.",
};

function switchReason(fromVisaId: string, toRoute: RouteDefinition): string {
  const fromType = visaIdToCurrentVisaType(fromVisaId);
  if (toRoute.key === "skilled-worker" && (fromType === "STUDENT" || fromType === "GRADUATE")) {
    return "Student and Graduate leave can usually be switched in-country to Skilled Worker, which starts a 5-year ILR clock.";
  }
  if (toRoute.key === "global-talent" && fromType === "SKILLED_WORKER") {
    return "A Skilled Worker can usually switch in-country to Global Talent if endorsed, which can shorten ILR to 3 years.";
  }
  if (toRoute.key === "skilled-worker" && fromType === "FAMILY") {
    return "A family visa holder can usually switch in-country to Skilled Worker if they have a sponsor and meet the salary rules.";
  }
  if (toRoute.key === "family") {
    return "You can usually switch in-country onto the partner route if you meet the relationship and financial requirements.";
  }
  if (toRoute.key === "long-residence") {
    return "Lawful time on your current visa can count toward 10-year long residence ILR.";
  }
  if (toRoute.key === "global-talent") {
    return "You can usually switch in-country to Global Talent if you obtain an eligible endorsement or prize.";
  }
  if (toRoute.key === "skilled-worker") {
    return "You can usually switch in-country to Skilled Worker if you have a licensed sponsor and meet the salary rules.";
  }
  return `In-country switching onto ${toRoute.name} is typically allowed from your current visa type.`;
}

function meetsFamilySwitchCriteria(profile: Profile): boolean {
  return profile.marriedToBritishCitizen || profile.hasSettledPartner;
}

/**
 * In-country switches from the current visa onto the other MVP routes,
 * with estimated ILR and citizenship dates if the switch is made on `asOf`.
 */
export function getPossibleSwitches(
  profile: Profile,
  asOf: Date = new Date(),
): PossibleSwitch[] {
  if (alreadyHoldsIlr(profile)) return [];

  const fromType = visaIdToCurrentVisaType(profile.currentVisaId);
  const stayIlrOn = null;
  const stayCitizenshipOn = null;

  return listRoutes().flatMap((route) => {
    if (!canSwitchToRouteInCountry(fromType, route)) return [];
    if (route.key === "family" && !meetsFamilySwitchCriteria(profile)) return [];

    const toVisaId = switchTargetVisaId(route);
    if (toVisaId === profile.currentVisaId) return [];
    if (!canSwitchInCountry(profile.currentVisaId, toVisaId)) return [];

    const simulation = simulateSwitch(profile, toVisaId, asOf, stayIlrOn, stayCitizenshipOn);
    const caveats = [
      switchReason(profile.currentVisaId, route),
      SWITCH_CAVEATS[toVisaId],
      ...simulation.caveats,
    ].filter((item, index, all): item is string => Boolean(item) && all.indexOf(item) === index);

    return [
      {
        routeKey: route.key,
        name: route.name,
        toVisaId,
        inCountrySwitch: true,
        estimatedILRDate: simulation.newIlrOn ? parseISO(simulation.newIlrOn) : null,
        estimatedCitizenshipDate: simulation.newCitizenshipOn
          ? parseISO(simulation.newCitizenshipOn)
          : null,
        yearsToILR: route.minYearsToILR,
        clockNote: simulation.clockNote,
        caveats,
      } satisfies PossibleSwitch,
    ];
  });
}

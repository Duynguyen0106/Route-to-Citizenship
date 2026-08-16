import { parseISO } from "date-fns";
import {
  citizenshipEligibleDate,
  daysBetween,
  ilrEligibleDate,
  toIsoDate,
} from "./calculate";
import { estimateFees } from "./fees";
import { SWITCH_TARGETS } from "./pathways";
import { canSwitchInCountry, getRoute, isFamilyCombination, isQualifyingWorkCombination } from "./visas";
import type { FeeBreakdown, Profile } from "./types";

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

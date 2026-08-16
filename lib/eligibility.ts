import { differenceInCalendarDays, parseISO } from "date-fns";
import { analyseAbsences } from "./absences";
import { toIsoDate } from "./dates";
import {
  ROUTES,
  effectiveMinYearsToILR,
  visaIdToCurrentVisaType,
  type RouteDefinition,
} from "./routes";
import { addCalendarYears, citizenshipEligibleDate } from "./settlement";
import type { EligibilityCheck, EligibilityItem, Profile, VisaRoute } from "./types";
import { MAJORITY_ENGLISH_SPEAKING_COUNTRIES } from "./types";

const ENGLISH_SPEAKING_CODES = new Set<string>(
  MAJORITY_ENGLISH_SPEAKING_COUNTRIES.map((c) => c.code),
);

const SETTLED_VISA_IDS = new Set(["ilr", "citizenship"]);

export function englishMet(profile: Profile): boolean {
  if (profile.ageBand === "65_plus") return true;
  return (
    profile.englishStatus === "b1_or_higher" ||
    profile.englishStatus === "degree_taught_in_english" ||
    profile.englishStatus === "majority_english_national" ||
    profile.englishStatus === "exempt_age" ||
    profile.englishStatus === "exempt_medical" ||
    ENGLISH_SPEAKING_CODES.has(profile.nationality)
  );
}

export function lifeInUkMet(profile: Profile): boolean {
  if (profile.ageBand === "65_plus" || profile.ageBand === "under_18") return true;
  return (
    profile.lifeInUkStatus === "passed" ||
    profile.lifeInUkStatus === "exempt_age" ||
    profile.lifeInUkStatus === "exempt_under_18" ||
    profile.lifeInUkStatus === "exempt_medical"
  );
}

export function alreadyHoldsIlr(profile: Profile): boolean {
  return SETTLED_VISA_IDS.has(profile.currentVisaId);
}

/** Current visa, or the most recent visa event if the person is already settled. */
export function currentOrLastVisaType(profile: Profile) {
  if (!alreadyHoldsIlr(profile)) {
    return visaIdToCurrentVisaType(profile.currentVisaId);
  }
  const last = [...(profile.priorStages ?? [])]
    .reverse()
    .find((stage) => !SETTLED_VISA_IDS.has(stage.visaId));
  return last ? visaIdToCurrentVisaType(last.visaId) : visaIdToCurrentVisaType(profile.currentVisaId);
}

export function visaMatchesRoute(profile: Profile, route: RouteDefinition): boolean {
  const current = visaIdToCurrentVisaType(profile.currentVisaId);
  if (!alreadyHoldsIlr(profile) && route.visaTypesInvolved.includes(current)) {
    return true;
  }
  if (alreadyHoldsIlr(profile) && !(profile.priorStages ?? []).length) {
    return true;
  }
  const lastStage = (profile.priorStages ?? []).at(-1);
  if (lastStage && route.visaTypesInvolved.includes(visaIdToCurrentVisaType(lastStage.visaId))) {
    return true;
  }
  return alreadyHoldsIlr(profile) && route.visaTypesInvolved.includes(currentOrLastVisaType(profile));
}

function leaveGapExceedsDays(profile: Profile, limitDays: number): boolean {
  const stages = [
    ...(profile.priorStages ?? []),
    {
      visaId: profile.currentVisaId,
      start: profile.visaGrantedOn,
      end: alreadyHoldsIlr(profile) ? profile.visaGrantedOn : profile.visaExpiresOn,
    },
  ]
    .filter((stage) => stage.start)
    .sort((a, b) => a.start.localeCompare(b.start));

  for (let index = 1; index < stages.length; index += 1) {
    const previousEnd = parseISO(stages[index - 1].end || stages[index - 1].start);
    const nextStart = parseISO(stages[index].start);
    if (differenceInCalendarDays(nextStart, previousEnd) > limitDays) {
      return true;
    }
  }
  return false;
}

function absenceWithinLimit(profile: Profile, route: RouteDefinition, asOf: Date): boolean {
  const limit = route.absenceLimitPerYear;
  if (limit === null) return true;
  if (profile.exceeded180DaysInAny12Months) return false;
  if (profile.daysAbsentLast12Months > limit) return false;
  if (profile.absences?.length) {
    const start = parseISO(profile.qualifyingResidenceStart || profile.ukEntryDate || toIsoDate(asOf));
    const analysis = analyseAbsences(profile.absences, asOf, start);
    if (analysis.maxRolling12Months.days > limit || analysis.last12Months > limit) {
      return false;
    }
  }
  return true;
}

function visaIdForClock(profile: Profile, route: RouteDefinition): string {
  const current = profile.currentVisaId;
  if (!alreadyHoldsIlr(profile) && route.visaTypesInvolved.includes(visaIdToCurrentVisaType(current))) {
    return current;
  }
  const last = (profile.priorStages ?? []).at(-1);
  if (last && route.visaTypesInvolved.includes(visaIdToCurrentVisaType(last.visaId))) {
    return last.visaId;
  }
  return current;
}

function qualifyingStartIso(profile: Profile, route: RouteDefinition): string | null {
  if (route.key === ROUTES.studentToGraduateToSkilled.key) {
    const clockType = visaIdToCurrentVisaType(visaIdForClock(profile, route));
    if (clockType === "SKILLED_WORKER") {
      return profile.qualifyingResidenceStart || profile.visaGrantedOn;
    }
    if (profile.plannedSwitchOn) return profile.plannedSwitchOn;
    return null;
  }
  if (route.key === ROUTES.longResidence.key) {
    return profile.ukEntryDate || profile.qualifyingResidenceStart || profile.visaGrantedOn;
  }
  return profile.qualifyingResidenceStart || profile.visaGrantedOn;
}

function estimatedDates(
  profile: Profile,
  route: RouteDefinition,
): { ilr: Date | null; citizenship: Date | null } {
  const residenceStart = parseISO(
    profile.ukEntryDate || profile.qualifyingResidenceStart || profile.visaGrantedOn,
  );

  if (alreadyHoldsIlr(profile)) {
    const ilr = parseISO(profile.visaGrantedOn);
    return {
      ilr,
      citizenship: citizenshipEligibleDate({
        ilrEligibleOn: ilr,
        ilrGrantedOn: ilr,
        residenceStart,
        marriedToBritishCitizen: profile.marriedToBritishCitizen,
        alreadyHasIlr: true,
      }),
    };
  }

  const clockVisaId = visaIdForClock(profile, route);
  const years = effectiveMinYearsToILR(route, visaIdToCurrentVisaType(clockVisaId), {
    plannedSwitch: Boolean(profile.plannedSwitchOn),
    currentVisaId: clockVisaId,
  });
  const startIso = qualifyingStartIso(profile, route);
  if (years === null || !startIso) {
    return { ilr: null, citizenship: null };
  }

  const ilrOn = addCalendarYears(parseISO(startIso), years);
  return {
    ilr: ilrOn,
    citizenship: citizenshipEligibleDate({
      ilrEligibleOn: ilrOn,
      ilrGrantedOn: null,
      residenceStart,
      marriedToBritishCitizen: profile.marriedToBritishCitizen,
      alreadyHasIlr: false,
    }),
  };
}

/**
 * Route-aware ILR / citizenship eligibility check.
 * Dates are estimates. This is not a Home Office assessment.
 */
export function checkEligibility(
  profile: Profile,
  route: RouteDefinition,
  asOf: Date = new Date(),
): EligibilityCheck {
  const reasons: string[] = [];
  const settled = alreadyHoldsIlr(profile);
  const visaOk = visaMatchesRoute(profile, route);
  const dates = estimatedDates(profile, route);

  if (!visaOk) {
    reasons.push(
      `Current visa (${profile.currentVisaId}) is not one of the visa types on ${route.name}.`,
    );
  }

  if (
    visaOk &&
    !settled &&
    route.key === ROUTES.studentToGraduateToSkilled.key &&
    dates.ilr === null
  ) {
    reasons.push(
      "Student and Graduate leave do not lead to ILR. Switch to Skilled Worker (or record a planned switch) to start the 5-year clock.",
    );
  }

  const continuousResidence =
    settled || !route.ilrRequiresContinuousResidence || !leaveGapExceedsDays(profile, 180);
  if (!continuousResidence) {
    reasons.push("There appears to be a gap of more than 180 days between periods of leave.");
  }

  const absenceLimit = settled || absenceWithinLimit(profile, route, asOf);
  if (!absenceLimit) {
    const limit = route.absenceLimitPerYear ?? 180;
    reasons.push(
      `Absences exceed ${limit} days in a 12-month period, which can break continuous residence.`,
    );
  }

  const englishNeeded = Boolean(route.englishRequirement);
  const english = !englishNeeded || englishMet(profile);
  if (!english) {
    reasons.push(
      `English at ${route.englishRequirement} (or an exemption) is required for ILR on this route.`,
    );
  }

  const lifeInUK = !route.lifeInUKRequired || lifeInUkMet(profile);
  if (!lifeInUK) {
    reasons.push("The Life in the UK test is required for ILR for most applicants aged 18–64.");
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    estimatedILRDate: visaOk || settled ? dates.ilr : null,
    estimatedCitizenshipDate: visaOk || settled ? dates.citizenship : null,
    requirementsMet: {
      continuousResidence,
      absenceLimit,
      english,
      lifeInUK,
      feesKnown: true,
    },
  };
}

export function checkSkilledWorkerEligibility(profile: Profile, asOf?: Date): EligibilityCheck {
  return checkEligibility(profile, ROUTES.skilledWorker, asOf);
}

export function checkFamilyEligibility(profile: Profile, asOf?: Date): EligibilityCheck {
  return checkEligibility(profile, ROUTES.family, asOf);
}

export function checkStudentToGraduateToSkilledEligibility(
  profile: Profile,
  asOf?: Date,
): EligibilityCheck {
  return checkEligibility(profile, ROUTES.studentToGraduateToSkilled, asOf);
}

export function checkGlobalTalentEligibility(profile: Profile, asOf?: Date): EligibilityCheck {
  return checkEligibility(profile, ROUTES.globalTalent, asOf);
}

export function checkLongResidenceEligibility(profile: Profile, asOf?: Date): EligibilityCheck {
  return checkEligibility(profile, ROUTES.longResidence, asOf);
}

export const ROUTE_ELIGIBILITY_CHECKS = {
  skilledWorker: checkSkilledWorkerEligibility,
  family: checkFamilyEligibility,
  studentToGraduateToSkilled: checkStudentToGraduateToSkilledEligibility,
  globalTalent: checkGlobalTalentEligibility,
  longResidence: checkLongResidenceEligibility,
} as const;

export function assessEligibility(options: {
  profile: Profile;
  route: VisaRoute;
  rule: RouteDefinition;
  asOf: Date;
  ilrOn: Date | null;
  citizenshipOn: Date | null;
  alreadyHasIlr: boolean;
}): EligibilityItem[] {
  const { profile, rule, asOf, ilrOn, alreadyHasIlr } = options;
  const check = checkEligibility(profile, rule, asOf);
  const items: EligibilityItem[] = [];
  const absenceLimit = rule.absenceLimitPerYear;

  if (!visaMatchesRoute(profile, rule) && !alreadyHasIlr) {
    items.push({
      id: "route",
      label: "Qualifying visa route",
      status: "not_met",
      detail: `${rule.name} does not start an ILR clock on your current visa. ${rule.notes}`,
    });
  } else if (check.estimatedILRDate === null && !alreadyHasIlr) {
    items.push({
      id: "route",
      label: "Qualifying visa route",
      status: "not_met",
      detail: `${rule.name} does not start an ILR clock on your current visa. ${rule.notes}`,
    });
  } else {
    items.push({
      id: "route",
      label: "Qualifying visa route",
      status: "met",
      detail: alreadyHasIlr
        ? "You already hold ILR or settled status."
        : `${rule.name} is treated as a qualifying route in this planner (${rule.minYearsToILR}-year clock).`,
    });
  }

  if (ilrOn && !alreadyHasIlr) {
    const remaining = ilrOn.getTime() - asOf.getTime();
    items.push({
      id: "residence",
      label: "Continuous residence period",
      status: !check.requirementsMet.continuousResidence
        ? "not_met"
        : remaining <= 0
          ? "met"
          : "attention",
      detail: !check.requirementsMet.continuousResidence
        ? "There appears to be a gap of more than 180 days between periods of leave."
        : remaining <= 0
          ? "On the dates you entered, the qualifying residence period appears complete. Confirm the Home Office calculation before applying."
          : `Estimated ILR date is ${ilrOn.toISOString().slice(0, 10)}. Residence is counted from ${profile.qualifyingResidenceStart}. ${rule.ilrRequiresContinuousResidence ? "This route requires continuous residence." : ""}`,
    });
  } else if (alreadyHasIlr) {
    items.push({
      id: "residence",
      label: "Continuous residence period",
      status: "met",
      detail: "Settlement is already held. Citizenship has a separate residence and absence test.",
    });
  } else {
    items.push({
      id: "residence",
      label: "Continuous residence period",
      status: check.requirementsMet.continuousResidence ? "not_applicable" : "not_met",
      detail: check.requirementsMet.continuousResidence
        ? "There is no ILR residence clock on your current visa."
        : "There appears to be a gap of more than 180 days between periods of leave.",
    });
  }

  if (rule.ilrRequiresContinuousResidence && absenceLimit !== null) {
    const overLimit = !check.requirementsMet.absenceLimit;
    items.push({
      id: "absences",
      label: "Absences from the UK (ILR)",
      status: overLimit
        ? "not_met"
        : profile.daysAbsentLast12Months > absenceLimit * 0.85
          ? "attention"
          : "met",
      detail: overLimit
        ? `More than ${absenceLimit} days outside the UK in a 12-month period can break continuous residence on this route.`
        : `You recorded ${profile.daysAbsentLast12Months} days outside the UK in the last 12 months (limit is ${absenceLimit}).`,
    });
  } else {
    items.push({
      id: "absences",
      label: "Absences from the UK (ILR)",
      status: "not_applicable",
      detail: "This route does not apply the standard ILR absence limit in the planner.",
    });
  }

  const englishNeeded = Boolean(rule.englishRequirement) && !alreadyHasIlr;
  if (englishNeeded) {
    items.push({
      id: "english",
      label: "English language",
      status: check.requirementsMet.english ? "met" : "not_met",
      detail: check.requirementsMet.english
        ? "Your profile indicates an English requirement is already met or exempt."
        : `This route requires English at ${rule.englishRequirement} (or an exemption: age, medical, majority English-speaking nationality, or a degree taught in English).`,
    });
  } else {
    items.push({
      id: "english",
      label: "English language",
      status: alreadyHasIlr ? (check.requirementsMet.english ? "met" : "attention") : "not_applicable",
      detail: alreadyHasIlr
        ? check.requirementsMet.english
          ? "English appears in place for a future citizenship application."
          : "Naturalisation usually still needs English at B1 unless you are exempt."
        : "English is not required for ILR on this route in the planner.",
    });
  }

  const lifeNeeded = rule.lifeInUKRequired && !alreadyHasIlr;
  if (lifeNeeded) {
    items.push({
      id: "life-in-uk",
      label: "Life in the UK test",
      status: check.requirementsMet.lifeInUK ? "met" : "not_met",
      detail: check.requirementsMet.lifeInUK
        ? "Your profile indicates the Life in the UK test is passed or exempt."
        : "This route requires the Life in the UK test for most applicants aged 18–64.",
    });
  } else {
    items.push({
      id: "life-in-uk",
      label: "Life in the UK test",
      status: alreadyHasIlr ? (check.requirementsMet.lifeInUK ? "met" : "attention") : "not_applicable",
      detail: alreadyHasIlr
        ? check.requirementsMet.lifeInUK
          ? "Life in the UK appears in place for citizenship."
          : "Naturalisation usually still needs the Life in the UK test unless you are exempt."
        : "Not required for ILR on this route in the planner.",
    });
  }

  const citAbsencesOk = profile.daysAbsentLast5Years <= 450 && profile.daysAbsentLast12MonthsCitizenship <= 90;
  const spouseAbsencesOk =
    profile.daysAbsentLast5Years <= 270 && profile.daysAbsentLast12MonthsCitizenship <= 90;

  items.push({
    id: "citizenship-absences",
    label: "Absences (citizenship)",
    status: profile.marriedToBritishCitizen
      ? spouseAbsencesOk
        ? "attention"
        : "not_met"
      : citAbsencesOk
        ? "attention"
        : "not_met",
    detail: profile.marriedToBritishCitizen
      ? `Spouse route naturalisation usually allows no more than 270 days outside the UK in 3 years and 90 days in the last 12 months. You recorded ${profile.daysAbsentLast5Years} days (5-year / overall figure) and ${profile.daysAbsentLast12MonthsCitizenship} in the last 12 months.`
      : `Standard naturalisation usually allows no more than 450 days outside the UK in 5 years and 90 days in the last 12 months. You recorded ${profile.daysAbsentLast5Years} and ${profile.daysAbsentLast12MonthsCitizenship} days respectively.`,
  });

  items.push({
    id: "good-character",
    label: "Good character & other rules",
    status: "attention",
    detail:
      "Criminality, unpaid NHS / tax debts, deception, and similar issues can refuse ILR or citizenship. This app does not assess good character.",
  });

  return items;
}

import type { EligibilityItem, Profile, VisaRoute } from "./types";
import { MAJORITY_ENGLISH_SPEAKING_COUNTRIES } from "./types";

const ENGLISH_SPEAKING_CODES = new Set<string>(
  MAJORITY_ENGLISH_SPEAKING_COUNTRIES.map((c) => c.code),
);

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

export function assessEligibility(options: {
  profile: Profile;
  route: VisaRoute;
  asOf: Date;
  ilrOn: Date | null;
  citizenshipOn: Date | null;
  alreadyHasIlr: boolean;
}): EligibilityItem[] {
  const { profile, route, asOf, ilrOn, alreadyHasIlr } = options;
  const items: EligibilityItem[] = [];

  if (!route.leadsToIlr && !alreadyHasIlr) {
    items.push({
      id: "route",
      label: "Qualifying visa route",
      status: "not_met",
      detail: `${route.name} does not lead to ILR. You would need to switch to a qualifying route.`,
    });
  } else {
    items.push({
      id: "route",
      label: "Qualifying visa route",
      status: "met",
      detail: alreadyHasIlr
        ? "You already hold ILR or settled status."
        : `${route.name} is treated as a qualifying route in this planner (${route.ilrYears}-year clock).`,
    });
  }

  if (route.leadsToIlr && ilrOn && !alreadyHasIlr) {
    const remaining = ilrOn.getTime() - asOf.getTime();
    items.push({
      id: "residence",
      label: "Continuous residence period",
      status: remaining <= 0 ? "met" : "attention",
      detail:
        remaining <= 0
          ? "On the dates you entered, the qualifying residence period appears complete. Confirm the Home Office calculation before applying."
          : `Estimated ILR date is ${ilrOn.toISOString().slice(0, 10)}. Residence is counted from ${profile.qualifyingResidenceStart}.`,
    });
  } else if (!route.leadsToIlr) {
    items.push({
      id: "residence",
      label: "Continuous residence period",
      status: "not_applicable",
      detail: "There is no ILR residence clock on your current visa.",
    });
  } else if (alreadyHasIlr) {
    items.push({
      id: "residence",
      label: "Continuous residence period",
      status: "met",
      detail: "Settlement is already held. Citizenship has a separate residence and absence test.",
    });
  }

  if (route.absenceRule === "180_in_12") {
    const over180 = profile.exceeded180DaysInAny12Months || profile.daysAbsentLast12Months > 180;
    items.push({
      id: "absences",
      label: "Absences from the UK (ILR)",
      status: over180 ? "not_met" : profile.daysAbsentLast12Months > 150 ? "attention" : "met",
      detail: over180
        ? "More than 180 days outside the UK in a 12-month period can break continuous residence for most ILR routes."
        : `You recorded ${profile.daysAbsentLast12Months} days outside the UK in the last 12 months (limit is usually 180).`,
    });
  } else if (route.absenceRule === "eu_settled") {
    items.push({
      id: "absences",
      label: "Absences from the UK (EUSS)",
      status: profile.daysAbsentLast12Months > 180 ? "attention" : "met",
      detail:
        "EU Settlement Scheme continuous residence is different from the ILR 180-day rule. Long single absences (often over 6 months) can break the clock.",
    });
  } else {
    items.push({
      id: "absences",
      label: "Absences from the UK (ILR)",
      status: "not_applicable",
      detail: "The standard 180-day ILR absence rule is not applied to this visa in the planner.",
    });
  }

  const englishNeeded = route.englishRequiredForIlr && !alreadyHasIlr;
  if (englishNeeded) {
    items.push({
      id: "english",
      label: "English language",
      status: englishMet(profile) ? "met" : "not_met",
      detail: englishMet(profile)
        ? "Your profile indicates an English requirement is already met or exempt."
        : "ILR usually needs English at CEFR B1 (or an exemption: age, medical, majority English-speaking nationality, or a degree taught in English).",
    });
  } else {
    items.push({
      id: "english",
      label: "English language",
      status: alreadyHasIlr ? (englishMet(profile) ? "met" : "attention") : "not_applicable",
      detail: alreadyHasIlr
        ? englishMet(profile)
          ? "English appears in place for a future citizenship application."
          : "Naturalisation usually still needs English at B1 unless you are exempt."
        : "English is not required for this status in the planner (for example EUSS).",
    });
  }

  const lifeNeeded = route.lifeInUkRequiredForIlr && !alreadyHasIlr;
  if (lifeNeeded) {
    items.push({
      id: "life-in-uk",
      label: "Life in the UK test",
      status: lifeInUkMet(profile) ? "met" : "not_met",
      detail: lifeInUkMet(profile)
        ? "Your profile indicates the Life in the UK test is passed or exempt."
        : "Most ILR applicants aged 18–64 must pass the Life in the UK test.",
    });
  } else {
    items.push({
      id: "life-in-uk",
      label: "Life in the UK test",
      status: alreadyHasIlr ? (lifeInUkMet(profile) ? "met" : "attention") : "not_applicable",
      detail: alreadyHasIlr
        ? lifeInUkMet(profile)
          ? "Life in the UK appears in place for citizenship."
          : "Naturalisation usually still needs the Life in the UK test unless you are exempt."
        : "Not required for this status in the planner.",
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

import { englishMet, lifeInUkMet } from "./eligibility";
import { GOVUK, LEGAL_NOTICE } from "./legal";
import type { EligibilityCheck, PlanResult, Profile } from "./types";

export type RiskBand = "stronger" | "mixed" | "weaker";

export interface RiskFactor {
  id: string;
  label: string;
  impact: "helps" | "hurts" | "unscored";
  detail: string;
}

export interface RiskAssessment {
  readiness: number;
  band: RiskBand;
  factors: RiskFactor[];
  /** Always null — we do not publish fake Home Office approval odds. */
  approvalProbability: null;
  probabilityNote: string;
  disclaimer: string;
}

const PROBABILITY_NOTE =
  "This is a readiness sketch from your answers and encoded rules — not a prediction of Home Office approval. National grant or refusal rates are averages and are not applied to your file. Good character, criminality, deception, NHS debt and sponsor checks are not scored.";

export function riskBand(readiness: number): RiskBand {
  if (readiness >= 75) return "stronger";
  if (readiness >= 45) return "mixed";
  return "weaker";
}

export function assessRouteRisk(profile: Profile, plan: PlanResult): RiskAssessment {
  const factors: RiskFactor[] = [];
  let concern = 0;
  const check: EligibilityCheck | undefined = plan.eligibilityCheck;

  if (englishMet(profile) || check?.requirementsMet.english) {
    factors.push({
      id: "english",
      label: "English",
      impact: "helps",
      detail: "English is marked as met or exempt in this plan.",
    });
  } else {
    concern += 22;
    factors.push({
      id: "english",
      label: "English not marked as met",
      impact: "hurts",
      detail: "Most ILR and citizenship applications need B1 (or an accepted equivalent) unless an exemption applies.",
    });
  }

  if (lifeInUkMet(profile) || check?.requirementsMet.lifeInUK) {
    factors.push({
      id: "life-in-uk",
      label: "Life in the UK",
      impact: "helps",
      detail: "Life in the UK is marked as passed or exempt.",
    });
  } else if (plan.route.lifeInUkRequiredForIlr) {
    concern += 14;
    factors.push({
      id: "life-in-uk",
      label: "Life in the UK not passed",
      impact: "hurts",
      detail: "Book the test well before the ILR window. Centres fill up.",
    });
  }

  const away = plan.absences.last12Months;
  if (plan.absences.breached180 || profile.exceeded180DaysInAny12Months) {
    concern += 36;
    factors.push({
      id: "absence-breach",
      label: "Absences over the usual 180-day sketch",
      impact: "hurts",
      detail: "More than 180 days outside the UK in a 12-month period can break continuous residence for ILR.",
    });
  } else if (away > 150) {
    concern += 18;
    factors.push({
      id: "absence-risk",
      label: "Absences approaching 180 days",
      impact: "hurts",
      detail: `About ${away} days away in the last 12 months in this sketch.`,
    });
  } else {
    factors.push({
      id: "absence-ok",
      label: "Absences inside the usual 180-day sketch",
      impact: "helps",
      detail: `About ${away} days away in the last 12 months in this sketch.`,
    });
  }

  if (plan.needsVisaExtension) {
    concern += 12;
    factors.push({
      id: "extension",
      label: "Visa may expire before ILR",
      impact: "hurts",
      detail: plan.extensionNote ?? "Plan an extension or switch so leave does not lapse.",
    });
  }

  const required = plan.checklist.filter((item) => item.required);
  const missing = required.filter((item) => !profile.checkedDocumentIds.includes(item.id)).length;
  if (missing > 0) {
    concern += Math.min(12, missing * 2);
    factors.push({
      id: "checklist",
      label: "Checklist still incomplete",
      impact: "hurts",
      detail: `${missing} required evidence item${missing === 1 ? "" : "s"} not ticked yet.`,
    });
  }

  if (!plan.hasIlrPath) {
    concern += 20;
    factors.push({
      id: "no-ilr",
      label: "No ILR clock on the current visa",
      impact: "hurts",
      detail: "Student, Graduate, visitor and some other categories usually need a switch before ILR is modelled.",
    });
  }

  factors.push({
    id: "character",
    label: "Good character / criminality",
    impact: "unscored",
    detail:
      "This planner does not collect criminal records and does not score good character. Criminality, NHS debt, litigation and deception can refuse ILR or citizenship even when dates look fine.",
  });

  const readiness = Math.max(0, Math.min(100, 100 - concern));
  return {
    readiness,
    band: riskBand(readiness),
    factors,
    approvalProbability: null,
    probabilityNote: PROBABILITY_NOTE,
    disclaimer: `${LEGAL_NOTICE} Official guidance: ${GOVUK.browse}`,
  };
}

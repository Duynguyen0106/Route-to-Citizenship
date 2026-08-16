import { addMonths, differenceInCalendarDays, parseISO } from "date-fns";
import { toIsoDate } from "./dates";
import { alreadyHoldsIlr, englishMet, lifeInUkMet } from "./eligibility";
import { applyUrlForVisa } from "./govuk-apply";
import { GOVUK } from "./legal";
import { currentRuleVersion, ENCODED_RULE_NOTICES } from "./rule-versions";
import { RULES_REVIEWED_ON, type PlanResult, type Profile } from "./types";

export const NEXT_HORIZON_DAYS = 90;
export const FOCUS_LIMIT = 5;

export type ActionHorizon = "overdue" | "now" | "soon" | "later";

export interface EncodedFactRef {
  ruleKey: string;
  summary: string;
  effectiveFrom: string;
  sourceUrl: string;
  reviewedOn: string;
}

export interface NextAction {
  id: string;
  copyKey: string;
  copyVars?: Record<string, string | number>;
  title: string;
  detail: string;
  dueOn: string | null;
  horizon: ActionHorizon;
  href: string;
  cta: string;
  officialUrl: string;
  officialLabel: string;
  adviser: boolean;
  fact: EncodedFactRef | null;
}

export interface NextActionSet {
  asOf: string;
  horizonDays: number;
  focus: NextAction[];
  later: NextAction[];
  milestones: { id: string; label: string; date: string }[];
  needsAdviser: boolean;
}

function parseDay(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = parseISO(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(iso: string | null, asOf: Date): number | null {
  const date = parseDay(iso);
  if (!date) return null;
  return differenceInCalendarDays(date, asOf);
}

function horizonOf(days: number | null): ActionHorizon {
  if (days === null) return "now";
  if (days < 0) return "overdue";
  if (days <= 14) return "now";
  if (days <= NEXT_HORIZON_DAYS) return "soon";
  return "later";
}

function fact(ruleKey: string): EncodedFactRef | null {
  const row = currentRuleVersion(ruleKey);
  if (!row) return null;
  return {
    ruleKey,
    summary: row.summary,
    effectiveFrom: row.effectiveFrom,
    sourceUrl: row.sourceUrl,
    reviewedOn: RULES_REVIEWED_ON,
  };
}

function noticeFact(id: string): EncodedFactRef | null {
  const row = ENCODED_RULE_NOTICES.find((item) => item.id === id);
  if (!row) return null;
  return {
    ruleKey: id,
    summary: row.detail,
    effectiveFrom: row.effectiveOn,
    sourceUrl: row.sourceUrl,
    reviewedOn: RULES_REVIEWED_ON,
  };
}

function rank(action: NextAction): number {
  const order: Record<ActionHorizon, number> = { overdue: 0, now: 1, soon: 2, later: 3 };
  const due = action.dueOn ?? "9999-12-31";
  return order[action.horizon] * 1_000_000 + Number(due.replaceAll("-", ""));
}

function caseLooksNonStraightforward(profile: Profile, plan: PlanResult): boolean {
  if (plan.absences.breached180) return true;
  if (profile.currentVisaId === "visitor") return true;
  if (profile.pathwayId === "protection" || profile.pathwayId === "child-registration") return true;
  if (!plan.hasIlrPath && !alreadyHoldsIlr(profile) && profile.currentVisaId !== "citizenship") return true;
  if (plan.eligibility.some((item) => item.id === "residence" && item.status === "not_met")) return true;
  return false;
}

export function buildNextActions(profile: Profile, plan: PlanResult, asOf: Date): NextActionSet {
  const asOfIso = toIsoDate(asOf);
  const actions: NextAction[] = [];
  const visaDays = daysUntil(profile.visaExpiresOn, asOf);
  const ilrDays = daysUntil(plan.ilrApplyFrom, asOf);
  const citizenshipDays = daysUntil(plan.citizenshipEligibleOn, asOf);

  if (profile.visaExpiresOn && profile.currentVisaId !== "ilr" && profile.currentVisaId !== "citizenship") {
    actions.push({
      id: "visa-expiry",
      copyKey: visaDays !== null && visaDays < 0 ? "visaExpiryPast" : "visaExpiry",
      copyVars: { date: profile.visaExpiresOn },
      title:
        visaDays !== null && visaDays < 0
          ? "Current leave has a sketched expiry in the past"
          : "Plan an extension or switch before leave expires",
      detail: `Current leave is sketched to end on ${profile.visaExpiresOn}. Confirm the live expiry in your UKVI account. This app cannot extend a visa.`,
      dueOn: profile.visaExpiresOn,
      horizon: horizonOf(visaDays),
      href: "#apply",
      cta: "Open GOV.UK apply pack",
      officialUrl: applyUrlForVisa(profile.currentVisaId),
      officialLabel: "Apply or extend on GOV.UK",
      adviser: false,
      fact: null,
    });
  }

  if (plan.absences.breached180 || plan.absences.remainingLast12 <= 30) {
    actions.push({
      id: "absences",
      copyKey: plan.absences.breached180 ? "absencesBreach" : "absencesLow",
      copyVars: { days: plan.absences.remainingLast12 },
      title: plan.absences.breached180
        ? "Logged trips sketch a 180-day continuous-residence risk"
        : `Only ${plan.absences.remainingLast12} days remain under the usual 180-day ILR limit`,
      detail:
        "Check the absence log and the what-if tool before you book more travel. Confirm the live rule on GOV.UK — this is not a Home Office calculation.",
      dueOn: asOfIso,
      horizon: plan.absences.breached180 ? "overdue" : "now",
      href: "#absences",
      cta: "Review absences",
      officialUrl: GOVUK.ilr,
      officialLabel: "ILR residence rules on GOV.UK",
      adviser: plan.absences.breached180,
      fact: fact("ilr.absence.180"),
    });
  }

  if (plan.route.englishRequiredForIlr && !englishMet(profile) && !alreadyHoldsIlr(profile)) {
    const target = plan.ilrApplyFrom ? addMonths(parseISO(plan.ilrApplyFrom), -4) : addMonths(asOf, 90);
    const dueOn = toIsoDate(target);
    actions.push({
      id: "english",
      copyKey: "english",
      title: "Book an approved English test (usually B1)",
      detail: "SELT results can take time. Only tests on the live GOV.UK list count. Save the last four characters of the candidate number here if you want a reminder.",
      dueOn,
      horizon: horizonOf(daysUntil(dueOn, asOf)),
      href: "#services",
      cta: "English test links",
      officialUrl: GOVUK.proveEnglish,
      officialLabel: "Approved English tests on GOV.UK",
      adviser: false,
      fact: fact("english.ilr"),
    });
  }

  if (plan.route.lifeInUkRequiredForIlr && !lifeInUkMet(profile) && !alreadyHoldsIlr(profile)) {
    const target = plan.ilrApplyFrom ? addMonths(parseISO(plan.ilrApplyFrom), -3) : addMonths(asOf, 120);
    const dueOn = toIsoDate(Number.isNaN(target.getTime()) ? addMonths(asOf, 120) : target);
    actions.push({
      id: "life-in-uk",
      copyKey: "lifeInUk",
      title: "Book the Life in the UK test",
      detail: "Centres fill up. You usually need the pass notification for ILR if you are aged 18–64 and not exempt.",
      dueOn,
      horizon: horizonOf(daysUntil(dueOn, asOf)),
      href: "#services",
      cta: "Life in the UK booking",
      officialUrl: GOVUK.lifeInUk,
      officialLabel: "Book on GOV.UK",
      adviser: false,
      fact: fact("lifeInUk.ilr"),
    });
  }

  if (plan.ilrApplyFrom && plan.hasIlrPath && plan.route.id !== "ilr") {
    actions.push({
      id: "ilr-window",
      copyKey: "ilrWindow",
      title: "ILR can usually be submitted from this date",
      detail: "You can usually apply up to 28 days before the qualifying date. Applying earlier is often treated as premature.",
      dueOn: plan.ilrApplyFrom,
      horizon: horizonOf(ilrDays),
      href: "#windows",
      cta: "See application window",
      officialUrl: GOVUK.ilr,
      officialLabel: "ILR on GOV.UK",
      adviser: false,
      fact: fact("ilr.earlyApplyDays"),
    });
  }

  if (plan.citizenshipEligibleOn && plan.citizenshipPath !== "already_british" && plan.citizenshipPath !== "none") {
    actions.push({
      id: "citizenship",
      copyKey: plan.citizenshipPath === "naturalisation_spouse" ? "citizenshipSpouse" : "citizenship",
      title: "Citizenship eligibility comes into view",
      detail:
        plan.citizenshipPath === "naturalisation_spouse"
          ? "Spouse naturalisation still needs ILR first. Recheck absences and good character on GOV.UK."
          : "Standard naturalisation is usually 12 months after ILR. Recheck absences and good character on GOV.UK.",
      dueOn: plan.citizenshipEligibleOn,
      horizon: horizonOf(citizenshipDays),
      href: "#apply",
      cta: "Citizenship apply link",
      officialUrl: GOVUK.citizenship,
      officialLabel: "British citizenship on GOV.UK",
      adviser: false,
      fact: fact("citizenship.afterIlrMonths"),
    });
  }

  const missing = plan.checklist.filter((item) => item.required && !profile.checkedDocumentIds.includes(item.id));
  if (missing.length) {
    const labels = missing.slice(0, 3).map((item) => item.label).join(", ");
    actions.push({
      id: "evidence",
      copyKey: "evidence",
      copyVars: { labels },
      title: "Gather evidence for the next application",
      detail: `Still open on this plan: ${labels}. Tick items as you collect them. Confirm the live list on GOV.UK.`,
      dueOn: plan.ilrApplyFrom,
      horizon: horizonOf(ilrDays ?? 60),
      href: "#checklist",
      cta: "Open checklist",
      officialUrl: plan.route.officialUrl,
      officialLabel: "Official visa page",
      adviser: false,
      fact: fact("fees.table"),
    });
  }

  if (profile.currentVisaId === "skilled-worker" || profile.currentVisaId === "health-care-worker") {
    actions.push({
      id: "salary-cos",
      copyKey: "salaryCos",
      title: "Confirm salary, going rate and Certificate of Sponsorship",
      detail:
        "This planner does not check salary thresholds, going rates, or sponsor licences. Confirm them on GOV.UK before you extend or switch.",
      dueOn: asOfIso,
      horizon: "now",
      href: "#eligibility",
      cta: "Eligibility caveats",
      officialUrl: GOVUK.skilledWorker,
      officialLabel: "Skilled Worker rules on GOV.UK",
      adviser: false,
      fact: noticeFact("sw-salary-2024-04-04"),
    });
  }

  if (
    (profile.currentVisaId === "student" || profile.currentVisaId === "graduate") &&
    !profile.plannedSwitchOn
  ) {
    actions.push({
      id: "plan-switch",
      copyKey: "planSwitch",
      title: "Student and Graduate leave do not lead to ILR on their own",
      detail: "Record a planned switch (usually to Skilled Worker) so the 5-year clock can be sketched.",
      dueOn: asOfIso,
      horizon: "now",
      href: "#switch",
      cta: "Open switch dates",
      officialUrl: GOVUK.skilledWorker,
      officialLabel: "Skilled Worker on GOV.UK",
      adviser: false,
      fact: fact("skilled-worker.ilrYears"),
    });
  }

  const needsAdviser = caseLooksNonStraightforward(profile, plan);
  if (needsAdviser) {
    actions.push({
      id: "adviser",
      copyKey: "adviser",
      title: "This sketch looks non-straightforward — speak to a regulated adviser",
      detail:
        "Verify the person on the official OISC or SRA register before you pay anyone. This app is not immigration advice and does not instruct an adviser for you.",
      dueOn: asOfIso,
      horizon: "now",
      href: "/advisers",
      cta: "How introductions work",
      officialUrl: GOVUK.adviser,
      officialLabel: "Find an immigration adviser on GOV.UK",
      adviser: true,
      fact: null,
    });
  }

  const sorted = actions.sort((a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id));
  const focusPool = sorted.filter((item) => item.horizon !== "later");
  const later = sorted.filter((item) => item.horizon === "later");
  const focus = (focusPool.length >= 3 ? focusPool : [...focusPool, ...later]).slice(0, FOCUS_LIMIT);
  const laterRest = sorted.filter((item) => !focus.some((row) => row.id === item.id));

  const milestones = [
    profile.visaExpiresOn && profile.currentVisaId !== "ilr"
      ? { id: "leaveExpires", label: "Leave expires", date: profile.visaExpiresOn }
      : null,
    plan.ilrApplyFrom ? { id: "ilrApplyFrom", label: "ILR apply from", date: plan.ilrApplyFrom } : null,
    plan.citizenshipEligibleOn
      ? { id: "citizenshipSketch", label: "Citizenship (sketch)", date: plan.citizenshipEligibleOn }
      : null,
  ].filter((item): item is { id: string; label: string; date: string } => Boolean(item));

  return {
    asOf: asOfIso,
    horizonDays: NEXT_HORIZON_DAYS,
    focus,
    later: laterRest,
    milestones,
    needsAdviser,
  };
}

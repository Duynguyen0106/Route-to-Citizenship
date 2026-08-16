import { FEES_FROM, FEES_SOURCE, ILR_FEE, NATURALISATION_FEE } from "./fees";
import { GOVUK } from "./legal";
import { RULES_REVIEWED_ON } from "./types";
import type { Profile } from "./types";

export type RuleNoticeKind = "fee" | "english" | "salary" | "page" | "processing" | "residence";

export interface EncodedRuleVersion {
  ruleKey: string;
  routeKeys: string[];
  effectiveFrom: string;
  effectiveTo: string | null;
  summary: string;
  value: Record<string, unknown> | null;
  sourceUrl: string;
}

export interface EncodedRuleNotice {
  id: string;
  title: string;
  detail: string;
  kind: RuleNoticeKind;
  effectiveOn: string;
  routeKeys: string[];
  sourceUrl: string;
}

/** Versioned facts this planner actually encodes. Earlier amounts are not invented. */
export const ENCODED_RULE_VERSIONS: EncodedRuleVersion[] = [
  {
    ruleKey: "fees.table",
    routeKeys: ["*"],
    effectiveFrom: FEES_FROM,
    effectiveTo: null,
    summary: `Home Office immigration and nationality fees from ${FEES_FROM}. ILR £${ILR_FEE}; naturalisation £${NATURALISATION_FEE}.`,
    value: { ilrGbp: ILR_FEE, naturalisationGbp: NATURALISATION_FEE, tableFrom: FEES_FROM },
    sourceUrl: FEES_SOURCE,
  },
  {
    ruleKey: "fees.table",
    routeKeys: ["*"],
    effectiveFrom: "2008-01-01",
    effectiveTo: "2026-04-07",
    summary:
      "Earlier Home Office fee tables applied before 8 April 2026. This planner does not encode those historic amounts — use archived GOV.UK if you need a past figure.",
    value: null,
    sourceUrl: "https://www.gov.uk/government/collections/home-office-immigration-and-nationality-fees",
  },
  {
    ruleKey: "ilr.earlyApplyDays",
    routeKeys: ["*"],
    effectiveFrom: "2016-01-01",
    effectiveTo: null,
    summary: "ILR can usually be submitted up to 28 days before the qualifying period ends.",
    value: { days: 28 },
    sourceUrl: GOVUK.ilr,
  },
  {
    ruleKey: "ilr.absence.180",
    routeKeys: ["skilled-worker", "family", "global-talent", "long-residence", "innovator-founder", "scale-up", "sportsperson", "minister-of-religion", "ancestry", "bno"],
    effectiveFrom: "2012-01-01",
    effectiveTo: null,
    summary: "Continuous residence for most work and family ILR routes is usually broken by more than 180 days outside the UK in any 12-month period.",
    value: { days: 180 },
    sourceUrl: GOVUK.ilr,
  },
  {
    ruleKey: "citizenship.afterIlrMonths",
    routeKeys: ["*"],
    effectiveFrom: "2009-01-01",
    effectiveTo: null,
    summary: "Standard naturalisation is usually 12 months after ILR, unless you are married to a British citizen (ILR still required first).",
    value: { monthsAfterIlr: 12, spouseResidenceYears: 3 },
    sourceUrl: GOVUK.citizenship,
  },
  {
    ruleKey: "skilled-worker.ilrYears",
    routeKeys: ["skilled-worker", "student-graduate-skilled-worker"],
    effectiveFrom: "2021-01-01",
    effectiveTo: null,
    summary: "Time on Skilled Worker usually counts toward 5-year work settlement if salary and sponsorship rules keep being met.",
    value: { years: 5 },
    sourceUrl: GOVUK.skilledWorker,
  },
  {
    ruleKey: "english.ilr",
    routeKeys: ["skilled-worker", "family", "global-talent", "long-residence"],
    effectiveFrom: "2013-10-28",
    effectiveTo: null,
    summary: "Most ILR applications need English at B1 (or an accepted equivalent) unless an exemption applies.",
    value: { level: "B1" },
    sourceUrl: GOVUK.ilr,
  },
  {
    ruleKey: "lifeInUk.ilr",
    routeKeys: ["skilled-worker", "family", "global-talent", "long-residence"],
    effectiveFrom: "2013-10-28",
    effectiveTo: null,
    summary: "Most ILR applications for people aged 18–64 need a Life in the UK test pass unless an exemption applies.",
    value: { required: true },
    sourceUrl: GOVUK.lifeInUk,
  },
];

export const ENCODED_RULE_NOTICES: EncodedRuleNotice[] = [
  {
    id: "sw-salary-2024-04-04",
    title: "Skilled Worker salary rules changed (4 April 2024)",
    detail:
      "The general salary threshold and going rates rose for many new Skilled Worker applications. This planner does not check salary or going rates. Confirm the live figures on GOV.UK before you switch or extend.",
    kind: "salary",
    effectiveOn: "2024-04-04",
    routeKeys: ["skilled-worker", "student-graduate-skilled-worker"],
    sourceUrl: GOVUK.skilledWorker,
  },
  {
    id: "fees-2026-04-08",
    title: "Home Office fee table from 8 April 2026",
    detail: `Application, IHS, ILR and nationality fees in this planner follow the 8 April 2026 table. Live amounts on GOV.UK always win.`,
    kind: "fee",
    effectiveOn: FEES_FROM,
    routeKeys: ["*"],
    sourceUrl: FEES_SOURCE,
  },
  {
    id: "english-ilr-b1",
    title: "English at B1 is still required for most ILR routes",
    detail:
      "If a new English test format is announced, this planner will not pick it up until the encoded rules are reviewed. Check GOV.UK for accepted tests.",
    kind: "english",
    effectiveOn: "2013-10-28",
    routeKeys: ["skilled-worker", "family", "global-talent", "long-residence"],
    sourceUrl: GOVUK.ilr,
  },
];

export function ruleVersionsAt(ruleKey: string, asOf: string): EncodedRuleVersion[] {
  return ENCODED_RULE_VERSIONS.filter(
    (row) =>
      row.ruleKey === ruleKey &&
      row.effectiveFrom <= asOf &&
      (row.effectiveTo === null || row.effectiveTo >= asOf),
  );
}

export function currentRuleVersion(ruleKey: string, asOf = RULES_REVIEWED_ON): EncodedRuleVersion | null {
  const matches = ruleVersionsAt(ruleKey, asOf);
  return matches.sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ?? null;
}

export function historicalRuleVersions(ruleKey: string): EncodedRuleVersion[] {
  return ENCODED_RULE_VERSIONS.filter((row) => row.ruleKey === ruleKey).sort((a, b) =>
    b.effectiveFrom.localeCompare(a.effectiveFrom),
  );
}

export function noticeAppliesToRoute(notice: EncodedRuleNotice, routeKeys: string[]): boolean {
  if (notice.routeKeys.includes("*")) return true;
  return notice.routeKeys.some((key) => routeKeys.includes(key));
}

export function noticesForProfile(
  profile: Pick<Profile, "pathwayId" | "currentVisaId">,
  asOf = RULES_REVIEWED_ON,
): EncodedRuleNotice[] {
  const keys: string[] = [profile.pathwayId];
  return ENCODED_RULE_NOTICES.filter((notice) => noticeAppliesToRoute(notice, keys)).filter(
    (notice) => notice.effectiveOn <= asOf,
  );
}

export function listRuleKeys(): string[] {
  return [...new Set(ENCODED_RULE_VERSIONS.map((row) => row.ruleKey))];
}

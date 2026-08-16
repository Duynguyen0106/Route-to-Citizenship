import { typicalProcessingWeeks } from "./processing";
import type { PathwayId, PlanResult, Profile } from "./types";

export const BENCHMARK_MIN_N = 5;

export type NationalityGroup =
  | "south-asia"
  | "east-asia"
  | "africa"
  | "eu-eea"
  | "middle-east"
  | "americas"
  | "other"
  | "unspecified";

const GROUP_BY_CODE: Record<string, NationalityGroup> = {
  IN: "south-asia",
  PK: "south-asia",
  BD: "south-asia",
  LK: "south-asia",
  NP: "south-asia",
  CN: "east-asia",
  HK: "east-asia",
  JP: "east-asia",
  KR: "east-asia",
  NG: "africa",
  GH: "africa",
  KE: "africa",
  ZA: "africa",
  EG: "middle-east",
  TR: "middle-east",
  IR: "middle-east",
  IQ: "middle-east",
  SA: "middle-east",
  AE: "middle-east",
  PL: "eu-eea",
  RO: "eu-eea",
  FR: "eu-eea",
  DE: "eu-eea",
  IT: "eu-eea",
  ES: "eu-eea",
  IE: "eu-eea",
  PT: "eu-eea",
  NL: "eu-eea",
  UA: "eu-eea",
  US: "americas",
  CA: "americas",
  BR: "americas",
  MX: "americas",
  JM: "americas",
  PH: "east-asia",
};

export function nationalityGroup(code: string | null | undefined): NationalityGroup {
  if (!code || code === "OTHER") return "unspecified";
  return GROUP_BY_CODE[code.toUpperCase()] ?? "other";
}

export interface BenchmarkSnapshotInput {
  pathwayId: PathwayId;
  currentVisaId: string;
  nationalityGroup: NationalityGroup;
  applyFromInside: boolean;
  yearsToIlrTenths: number | null;
  typicalWaitWeeks: number | null;
  reportedWaitWeeks: number | null;
  asOfMonth: string;
}

export interface CohortStats {
  n: number;
  avgYearsToIlr: number | null;
  avgReportedWaitWeeks: number | null;
  nationalitySplit: { group: NationalityGroup; n: number }[];
}

export interface TimelineBenchmark {
  yoursYearsToIlr: number | null;
  yoursTypicalWaitWeeks: number;
  encodedTypicalWaitWeeks: number;
  cohort: CohortStats | null;
  cohortHiddenReason: string | null;
}

export function yearsToIlrTenths(plan: PlanResult, asOf: string): number | null {
  if (!plan.ilrEligibleOn || plan.route.id === "ilr") return 0;
  const start = Date.parse(asOf);
  const end = Date.parse(plan.ilrEligibleOn);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  const years = (end - start) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.round(years * 10);
}

export function snapshotFromPlan(profile: Profile, plan: PlanResult): BenchmarkSnapshotInput {
  return {
    pathwayId: plan.pathwayId,
    currentVisaId: profile.currentVisaId,
    nationalityGroup: nationalityGroup(profile.nationality),
    applyFromInside: profile.applyFromInsideUk,
    yearsToIlrTenths: yearsToIlrTenths(plan, plan.asOf),
    typicalWaitWeeks: typicalProcessingWeeks(profile.currentVisaId, profile.applyFromInsideUk),
    reportedWaitWeeks: null,
    asOfMonth: plan.asOf.slice(0, 7),
  };
}

export function aggregateCohort(
  rows: Array<Pick<BenchmarkSnapshotInput, "yearsToIlrTenths" | "reportedWaitWeeks" | "nationalityGroup">>,
): CohortStats | null {
  if (rows.length < BENCHMARK_MIN_N) return null;
  const years = rows.map((row) => row.yearsToIlrTenths).filter((value): value is number => value !== null);
  const waits = rows
    .map((row) => row.reportedWaitWeeks)
    .filter((value): value is number => value !== null && value >= 1 && value <= 52);
  const groups = new Map<NationalityGroup, number>();
  for (const row of rows) {
    groups.set(row.nationalityGroup, (groups.get(row.nationalityGroup) ?? 0) + 1);
  }
  const nationalitySplit = [...groups.entries()]
    .map(([group, n]) => ({ group, n }))
    .filter((item) => item.n >= BENCHMARK_MIN_N)
    .sort((a, b) => b.n - a.n);
  return {
    n: rows.length,
    avgYearsToIlr: years.length ? Math.round((years.reduce((a, b) => a + b, 0) / years.length / 10) * 10) / 10 : null,
    avgReportedWaitWeeks: waits.length
      ? Math.round((waits.reduce((a, b) => a + b, 0) / waits.length) * 10) / 10
      : null,
    nationalitySplit,
  };
}

export function buildTimelineBenchmark(
  profile: Profile,
  plan: PlanResult,
  rows: Array<Pick<BenchmarkSnapshotInput, "yearsToIlrTenths" | "reportedWaitWeeks" | "nationalityGroup" | "currentVisaId" | "pathwayId">>,
): TimelineBenchmark {
  const encoded = typicalProcessingWeeks(profile.currentVisaId, profile.applyFromInsideUk);
  const yoursYears = yearsToIlrTenths(plan, plan.asOf);
  const similar = rows.filter(
    (row) => row.pathwayId === plan.pathwayId || row.currentVisaId === profile.currentVisaId,
  );
  const cohort = aggregateCohort(similar.length >= BENCHMARK_MIN_N ? similar : rows);
  return {
    yoursYearsToIlr: yoursYears === null ? null : yoursYears / 10,
    yoursTypicalWaitWeeks: encoded,
    encodedTypicalWaitWeeks: encoded,
    cohort,
    cohortHiddenReason: cohort
      ? null
      : `Need at least ${BENCHMARK_MIN_N} opt-in anonymous sketches before a cohort average is shown.`,
  };
}

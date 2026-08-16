import { prisma } from "./prisma";
import {
  aggregateCohort,
  buildTimelineBenchmark,
  nationalityGroup,
  type BenchmarkSnapshotInput,
} from "./benchmarks";
import type { PlanResult, Profile } from "./types";

export async function saveAnonymousSnapshot(input: BenchmarkSnapshotInput): Promise<void> {
  await prisma.anonymousBenchmark.create({
    data: {
      pathwayId: input.pathwayId,
      currentVisaId: input.currentVisaId,
      nationalityGroup: input.nationalityGroup,
      applyFromInside: input.applyFromInside,
      yearsToIlrTenths: input.yearsToIlrTenths,
      typicalWaitWeeks: input.typicalWaitWeeks,
      reportedWaitWeeks: input.reportedWaitWeeks,
      asOfMonth: input.asOfMonth,
    },
  });
}

export async function loadBenchmarkRows(): Promise<BenchmarkSnapshotInput[]> {
  try {
    const rows = await prisma.anonymousBenchmark.findMany({
      orderBy: { createdAt: "desc" },
      take: 2000,
    });
    return rows.map((row) => ({
      pathwayId: row.pathwayId as BenchmarkSnapshotInput["pathwayId"],
      currentVisaId: row.currentVisaId,
      nationalityGroup: row.nationalityGroup as BenchmarkSnapshotInput["nationalityGroup"],
      applyFromInside: row.applyFromInside,
      yearsToIlrTenths: row.yearsToIlrTenths,
      typicalWaitWeeks: row.typicalWaitWeeks,
      reportedWaitWeeks: row.reportedWaitWeeks,
      asOfMonth: row.asOfMonth,
    }));
  } catch {
    return [];
  }
}

export async function benchmarkForPlan(profile: Profile, plan: PlanResult) {
  const rows = await loadBenchmarkRows();
  const similar = rows.filter(
    (row) => row.pathwayId === plan.pathwayId || row.currentVisaId === profile.currentVisaId,
  );
  return {
    timeline: buildTimelineBenchmark(profile, plan, rows),
    overall: aggregateCohort(rows),
    similar: aggregateCohort(similar),
    nationalityGroup: nationalityGroup(profile.nationality),
  };
}

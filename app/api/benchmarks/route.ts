import { NextResponse } from "next/server";
import { calculatePlan } from "@/lib/calculate";
import { parseProfileInput } from "@/lib/api/profile-input";
import { asJsonObject, badRequest, readJsonBody } from "@/lib/api/session";
import { snapshotFromPlan } from "@/lib/benchmarks";
import { benchmarkForPlan, saveAnonymousSnapshot } from "@/lib/benchmark-store";

export async function GET() {
  return NextResponse.json({
    note: "POST a plan snapshot (opt-in) or POST { profile } with optIn false to read aggregates only.",
  });
}

export async function POST(request: Request) {
  const parsed = await readJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = asJsonObject(parsed.body);
  if (!body) return badRequest("Request body must be a JSON object.");

  const profile = parseProfileInput(body);
  if (!profile?.currentVisaId) return badRequest("Profile data with a current visa is required.");

  const plan = calculatePlan(profile);
  const optIn = body.optIn === true;
  const reported =
    typeof body.reportedWaitWeeks === "number" && Number.isFinite(body.reportedWaitWeeks)
      ? Math.round(body.reportedWaitWeeks)
      : null;

  if (optIn) {
    const snap = snapshotFromPlan(profile, plan);
    if (reported !== null && (reported < 1 || reported > 52)) {
      return badRequest("Reported wait must be between 1 and 52 weeks, or omitted.");
    }
    try {
      await saveAnonymousSnapshot({
        ...snap,
        reportedWaitWeeks: reported,
      });
    } catch {
      return badRequest("Could not store the anonymous sketch. Try again after the database is migrated.");
    }
  }

  const stats = await benchmarkForPlan(profile, plan);
  return NextResponse.json({
    saved: optIn,
    ...stats,
    disclaimer:
      "Cohort figures are opt-in anonymous sketches from this app, not Home Office statistics. Groups smaller than 5 are hidden.",
  });
}

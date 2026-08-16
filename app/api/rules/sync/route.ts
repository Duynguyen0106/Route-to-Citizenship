import { NextResponse } from "next/server";
import { asJsonObject, badRequest, readJsonBody } from "@/lib/api/session";
import { dispatch } from "@/lib/events/broker";
import { syncGovukContent } from "@/lib/rule-store";

export async function POST(request: Request) {
  const parsed = await readJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = asJsonObject(parsed.body) ?? {};
  const force = body.force === true;

  try {
    const result = await syncGovukContent({ force });
    await dispatch("rules.synced", "rule-engine", {
      fetched: result.fetched,
      changed: result.changed,
      skipped: result.skipped,
    });
    return NextResponse.json(result);
  } catch {
    return badRequest("Could not store GOV.UK snapshots. Try again after the database is migrated.");
  }
}

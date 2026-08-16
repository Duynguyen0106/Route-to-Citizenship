import { NextResponse } from "next/server";
import { parseISO } from "date-fns";
import { buildCalculateResponse } from "@/lib/api/calculate-response";
import { parseProfileInput } from "@/lib/api/profile-input";
import { badRequest } from "@/lib/api/session";
import { getSessionUser } from "@/lib/auth";
import { getPlannerProfileForUser } from "@/lib/db/plan-repository";

export async function POST(request: Request) {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  let profile = parseProfileInput(body);
  if (!profile?.currentVisaId) {
    const user = await getSessionUser();
    if (user) {
      profile = await getPlannerProfileForUser(user.id);
    }
  }

  if (!profile?.currentVisaId) {
    return badRequest("Profile data with a current visa is required.");
  }

  const record = body as { asOf?: string };
  const asOf = record.asOf ? parseISO(record.asOf) : new Date();
  return NextResponse.json(buildCalculateResponse(profile, asOf));
}

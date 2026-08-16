import { NextResponse } from "next/server";
import { checklistFor } from "@/lib/api/checklist-input";
import { parseProfileInput } from "@/lib/api/profile-input";
import { badRequest } from "@/lib/api/session";
import { getSessionUser } from "@/lib/auth";
import { getPlannerProfileForUser } from "@/lib/db/plan-repository";
import { CHECKLIST_GROUPS } from "@/lib/checklist";

export async function POST(request: Request) {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const record = body as { routeKey?: string; route?: string };
  const routeKey = record.routeKey ?? record.route;

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

  return NextResponse.json({
    routeKey: routeKey ?? null,
    groups: CHECKLIST_GROUPS,
    items: checklistFor(profile, routeKey),
  });
}

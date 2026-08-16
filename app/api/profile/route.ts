import { NextResponse } from "next/server";
import { parseProfileInput, profileIsComplete } from "@/lib/api/profile-input";
import { badRequest, requireUser } from "@/lib/api/session";
import { getPlannerProfileForUser, savePlannerProfile } from "@/lib/db/plan-repository";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const profile = await getPlannerProfileForUser(auth.user.id);
  return NextResponse.json({ profile });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be JSON.");
  }

  const existing = await getPlannerProfileForUser(auth.user.id);
  const profile = parseProfileInput(body, existing);
  if (!profile || !profileIsComplete(profile)) {
    return badRequest("A complete profile with current visa, grant date, and expiry date is required.");
  }

  const saved = await savePlannerProfile(auth.user.id, profile);
  return NextResponse.json({ profile: saved });
}

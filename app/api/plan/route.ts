import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  deletePlannerProfile,
  getPlannerProfileForUser,
  savePlannerProfile,
} from "@/lib/db/plan-repository";
import { normalizeProfile } from "@/lib/storage";
import type { Profile } from "@/lib/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const profile = await getPlannerProfileForUser(user.id);
  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const body = (await request.json()) as { profile?: Profile };
  if (!body.profile?.currentVisaId || !body.profile.visaGrantedOn) {
    return NextResponse.json({ error: "A complete profile is required." }, { status: 400 });
  }
  const saved = await savePlannerProfile(user.id, normalizeProfile(body.profile));
  return NextResponse.json({ profile: saved });
}

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  await deletePlannerProfile(user.id);
  return NextResponse.json({ ok: true });
}

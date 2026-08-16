import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { asJsonObject, badRequest, readJsonBody } from "@/lib/api/session";
import { BILLING_DISCLAIMER, BILLING_LIVE, parsePlan, stripeConfigured } from "@/lib/billing";

export async function GET() {
  const session = await getSessionUser();
  let plan = "basic";
  if (session) {
    try {
      const row = await prisma.user.findUnique({ where: { id: session.id }, select: { plan: true } });
      plan = parsePlan(row?.plan);
    } catch {
      plan = "basic";
    }
  }
  return NextResponse.json({
    plan,
    signedIn: Boolean(session),
    billingLive: BILLING_LIVE,
    stripeConfigured: stripeConfigured(),
    disclaimer: BILLING_DISCLAIMER,
  });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json(
      { error: "Sign in to save a preview plan to your account. Guests can preview in this browser." },
      { status: 401 },
    );
  }
  const parsed = await readJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = asJsonObject(parsed.body);
  const plan = parsePlan(body?.plan);
  try {
    await prisma.user.update({ where: { id: session.id }, data: { plan } });
  } catch {
    return badRequest("Could not save the preview plan.");
  }
  return NextResponse.json({
    plan,
    billingLive: BILLING_LIVE,
    disclaimer: BILLING_DISCLAIMER,
  });
}

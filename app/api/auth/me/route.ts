import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePlan } from "@/lib/billing";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ user: null, plan: "basic" });
  let plan = "basic";
  try {
    const row = await prisma.user.findUnique({ where: { id: session.id }, select: { plan: true } });
    plan = parsePlan(row?.plan);
  } catch {
    plan = "basic";
  }
  return NextResponse.json({ user: { ...session, plan }, plan });
}

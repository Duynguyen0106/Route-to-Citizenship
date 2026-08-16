import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJsonBody, requireUser } from "@/lib/api/session";
import { clearSessionCookie } from "@/lib/auth";
import { parsePlan } from "@/lib/billing";
import { calculatePlan } from "@/lib/calculate";
import { getPlannerProfileForUser } from "@/lib/db/plan-repository";
import { accountDeleteError, accountExportJson, buildAccountExport } from "@/lib/account-export";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const profile = await getPlannerProfileForUser(auth.user.id);
  const row = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { email: true, name: true, plan: true, createdAt: true },
  });
  if (!row) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const planResult = profile ? calculatePlan(profile) : null;
  const pack =
    profile && planResult
      ? buildAccountExport({
          email: row.email,
          name: row.name,
          plan: parsePlan(row.plan),
          profile,
          planResult,
        })
      : null;

  return NextResponse.json({
    account: {
      email: row.email,
      name: row.name,
      plan: parsePlan(row.plan),
      createdAt: row.createdAt.toISOString(),
    },
    hasPlan: Boolean(profile),
    export: pack,
    json: pack ? accountExportJson(pack) : null,
  });
}

export async function DELETE(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const parsed = await readJsonBody(request);
  if (parsed.error) return parsed.error;
  const confirmError = accountDeleteError(parsed.body);
  if (confirmError) {
    return NextResponse.json({ error: confirmError }, { status: 400 });
  }
  try {
    await prisma.user.delete({ where: { id: auth.user.id } });
  } catch {
    return NextResponse.json({ error: "Could not delete this account." }, { status: 400 });
  }
  await clearSessionCookie();
  return NextResponse.json({ deleted: true });
}

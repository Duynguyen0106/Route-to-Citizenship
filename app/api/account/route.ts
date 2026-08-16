import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJsonBody, requireUser } from "@/lib/api/session";
import { clearSessionCookie } from "@/lib/auth";
import { parsePlan } from "@/lib/billing";
import { calculatePlan } from "@/lib/calculate";
import { getPlannerProfileForUser } from "@/lib/db/plan-repository";
import { accountDeleteError, accountExportJson, buildGdprExport } from "@/lib/account-export";
import { dispatch } from "@/lib/events/broker";
import { erasePersonalData } from "@/lib/gdpr-erasure";

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
  const organisations = await loadOrganisations(auth.user.id);
  const enquiries = await loadEnquiries(auth.user.id, row.email);
  const shareLinks = await loadShareLinks(auth.user.id);

  const pack = buildGdprExport({
    email: row.email,
    name: row.name,
    plan: parsePlan(row.plan),
    createdAt: row.createdAt.toISOString(),
    profile,
    planResult,
    organisations,
    enquiries,
    shareLinks,
  });

  await dispatch("account.exported", "identity", { hasPlan: Boolean(profile) });

  return NextResponse.json({
    account: {
      email: row.email,
      name: row.name,
      plan: parsePlan(row.plan),
      createdAt: row.createdAt.toISOString(),
    },
    hasPlan: Boolean(profile),
    export: pack,
    json: accountExportJson(pack),
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
    const erased = await erasePersonalData(auth.user.id, auth.user.email);
    await dispatch("account.erased", "identity", {
      enquiries: erased.enquiries,
      reports: erased.reports,
      shareLinks: erased.shareLinks,
    });
  } catch {
    return NextResponse.json({ error: "Could not delete this account." }, { status: 400 });
  }
  await clearSessionCookie();
  return NextResponse.json({ deleted: true });
}

async function loadOrganisations(userId: string) {
  try {
    const orgs = await prisma.organisation.findMany({
      where: { ownerUserId: userId },
      include: { workers: true },
    });
    return orgs.map((org) => ({
      name: org.name,
      workers: org.workers.map((worker) => ({
        label: worker.label,
        visaType: worker.visaType,
        visaExpiresOn: worker.visaExpiresOn.toISOString().slice(0, 10),
      })),
    }));
  } catch {
    return [];
  }
}

async function loadEnquiries(userId: string, email: string) {
  try {
    const rows = await prisma.billingEnquiry.findMany({
      where: { OR: [{ userId }, { email }] },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      message: row.message,
      createdAt: row.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

async function loadShareLinks(userId: string) {
  try {
    const rows = await prisma.shareLink.findMany({
      where: { userId },
      select: { id: true, label: true, expiresAt: true, revokedAt: true },
    });
    return rows.map((row) => ({
      id: row.id,
      label: row.label,
      expiresAt: row.expiresAt.toISOString(),
      revokedAt: row.revokedAt?.toISOString() ?? null,
    }));
  } catch {
    return [];
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { asJsonObject, badRequest, readJsonBody, requireUser } from "@/lib/api/session";
import { enquiryLooksLikeIdentity } from "@/lib/billing";
import { EMPLOYER_TRIAL_SEATS, SPONSORED_VISA_OPTIONS } from "@/lib/employers";

const VISA_IDS = new Set(SPONSORED_VISA_OPTIONS.map((item) => item.id));

async function loadOrg(userId: string) {
  return prisma.organisation.findFirst({
    where: { ownerUserId: userId },
    include: { workers: true },
  });
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const parsed = await readJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = asJsonObject(parsed.body);
  const label = typeof body?.label === "string" ? body.label.trim() : "";
  if (label.length < 1 || label.length > 80) return badRequest("Enter a short staff label (not a passport number).");
  if (enquiryLooksLikeIdentity(label)) return badRequest("Do not put passport numbers in worker labels.");
  const visaType =
    typeof body?.visaType === "string" && (VISA_IDS as Set<string>).has(body.visaType) ? body.visaType : "";
  if (!visaType) return badRequest("Choose a visa type.");
  const visaExpiresOn = parseDate(body?.visaExpiresOn);
  if (!visaExpiresOn) return badRequest("Enter a visa expiry date.");
  const jobTitle = typeof body?.jobTitle === "string" ? body.jobTitle.trim().slice(0, 80) : "";
  const rtwCheckedOn = parseDate(body?.rtwCheckedOn);

  try {
    const org = await loadOrg(auth.user.id);
    if (!org) return badRequest("Create an organisation first.");
    if (org.workers.length >= (org.seatLimit || EMPLOYER_TRIAL_SEATS)) {
      return badRequest(`Preview seat limit is ${org.seatLimit} workers. Enquire to raise it — no invoice is raised here.`);
    }
    const worker = await prisma.sponsoredWorker.create({
      data: {
        organisationId: org.id,
        label,
        visaType,
        visaExpiresOn,
        jobTitle: jobTitle || null,
        rtwCheckedOn,
        hasCos: Boolean(body?.hasCos),
        hasBrpCopy: Boolean(body?.hasBrpCopy),
      },
    });
    return NextResponse.json({ worker });
  } catch {
    return badRequest("Could not add that worker sketch.");
  }
}

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const parsed = await readJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = asJsonObject(parsed.body);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return badRequest("Worker id is required.");
  const org = await loadOrg(auth.user.id);
  if (!org || !org.workers.some((item) => item.id === id)) return badRequest("Worker not found.");

  const data: {
    hasCos?: boolean;
    hasBrpCopy?: boolean;
    rtwCheckedOn?: Date | null;
  } = {};
  if (typeof body?.hasCos === "boolean") data.hasCos = body.hasCos;
  if (typeof body?.hasBrpCopy === "boolean") data.hasBrpCopy = body.hasBrpCopy;
  if (body?.rtwCheckedOn === "") data.rtwCheckedOn = null;
  else if (body?.rtwCheckedOn) {
    const date = parseDate(body.rtwCheckedOn);
    if (!date) return badRequest("Enter a valid right-to-work check date.");
    data.rtwCheckedOn = date;
  }

  try {
    const worker = await prisma.sponsoredWorker.update({ where: { id }, data });
    return NextResponse.json({ worker });
  } catch {
    return badRequest("Could not update that worker.");
  }
}

export async function DELETE(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const parsed = await readJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = asJsonObject(parsed.body);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return badRequest("Worker id is required.");
  const org = await loadOrg(auth.user.id);
  if (!org || !org.workers.some((item) => item.id === id)) return badRequest("Worker not found.");
  try {
    await prisma.sponsoredWorker.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch {
    return badRequest("Could not remove that worker.");
  }
}

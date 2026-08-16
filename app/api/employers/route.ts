import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { asJsonObject, badRequest, readJsonBody, requireUser } from "@/lib/api/session";
import { EMPLOYER_TRIAL_SEATS } from "@/lib/employers";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  try {
    const org = await prisma.organisation.findFirst({
      where: { ownerUserId: auth.user.id },
      include: { workers: { orderBy: { visaExpiresOn: "asc" } } },
    });
    return NextResponse.json({ organisation: org });
  } catch {
    return NextResponse.json({ organisation: null });
  }
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const parsed = await readJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = asJsonObject(parsed.body);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (name.length < 2) return badRequest("Enter an organisation name.");
  if (name.length > 120) return badRequest("Organisation name is too long.");

  try {
    const existing = await prisma.organisation.findFirst({ where: { ownerUserId: auth.user.id } });
    if (existing) {
      const org = await prisma.organisation.update({
        where: { id: existing.id },
        data: { name },
        include: { workers: { orderBy: { visaExpiresOn: "asc" } } },
      });
      return NextResponse.json({ organisation: org });
    }
    const org = await prisma.organisation.create({
      data: { name, ownerUserId: auth.user.id, seatLimit: EMPLOYER_TRIAL_SEATS },
      include: { workers: true },
    });
    return NextResponse.json({ organisation: org });
  } catch {
    return badRequest("Could not save the organisation.");
  }
}

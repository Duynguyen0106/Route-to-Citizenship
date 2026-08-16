import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/session";
import { isoDate } from "@/lib/db/mappers";
import { workersToCsv, type WorkerSketch } from "@/lib/employers";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  try {
    const org = await prisma.organisation.findFirst({
      where: { ownerUserId: auth.user.id },
      include: { workers: { orderBy: { visaExpiresOn: "asc" } } },
    });
    if (!org) return NextResponse.json({ error: "Create an organisation first." }, { status: 404 });
    const sketches: WorkerSketch[] = org.workers.map((row) => ({
      id: row.id,
      label: row.label,
      visaType: row.visaType,
      visaExpiresOn: isoDate(row.visaExpiresOn),
      jobTitle: row.jobTitle ?? "",
      rtwCheckedOn: row.rtwCheckedOn ? isoDate(row.rtwCheckedOn) : "",
      hasCos: row.hasCos,
      hasBrpCopy: row.hasBrpCopy,
    }));
    const csv = workersToCsv(sketches, new Date());
    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="sponsored-workers.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not build the report." }, { status: 400 });
  }
}

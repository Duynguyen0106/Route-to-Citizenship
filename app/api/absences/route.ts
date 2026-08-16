import { NextResponse } from "next/server";
import { parseISO } from "date-fns";
import { analyseAbsences, totalsByYear, twelveMonthPeriods } from "@/lib/absences";
import { badRequest, notFound, requireUser } from "@/lib/api/session";
import { daysAway, isoDate } from "@/lib/db/mappers";
import { addAbsenceRecord, getPlannerProfileForUser, listAbsenceRecords } from "@/lib/db/plan-repository";
import type { AbsenceTrip } from "@/lib/types";

function toTrip(row: { id: string; startDate: Date; endDate: Date; reason: string | null }): AbsenceTrip {
  return {
    id: row.id,
    departedOn: isoDate(row.startDate),
    returnedOn: isoDate(row.endDate),
    place: row.reason ?? "",
  };
}

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const rows = await listAbsenceRecords(auth.user.id);
  if (rows === null) return notFound("Create a profile before listing absences.");

  const profile = await getPlannerProfileForUser(auth.user.id);
  const trips = rows.map(toTrip);
  const asOf = new Date();
  const analysis = profile
    ? analyseAbsences(
        trips,
        asOf,
        parseISO(profile.qualifyingResidenceStart || profile.ukEntryDate || isoDate(asOf)),
      )
    : null;

  return NextResponse.json({
    absences: rows.map((row) => ({
      id: row.id,
      startDate: isoDate(row.startDate),
      endDate: isoDate(row.endDate),
      daysAway: daysAway(isoDate(row.startDate), isoDate(row.endDate)),
      reason: row.reason,
    })),
    totalsByYear: totalsByYear(trips),
    twelveMonthPeriods: analysis
      ? twelveMonthPeriods(
          trips,
          asOf,
          parseISO(profile?.qualifyingResidenceStart || profile?.ukEntryDate || isoDate(asOf)),
        )
      : [],
    last12Months: analysis?.last12Months ?? 0,
    exceeded180DaysInAny12Months: analysis?.breached180 ?? false,
  });
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

  const record = body as {
    startDate?: string;
    endDate?: string;
    departedOn?: string;
    returnedOn?: string;
    reason?: string;
    place?: string;
  };
  const startRaw = record.startDate ?? record.departedOn;
  const endRaw = record.endDate ?? record.returnedOn;
  if (!startRaw || !endRaw) {
    return badRequest("startDate and endDate are required.");
  }

  const startDate = parseISO(startRaw);
  const endDate = parseISO(endRaw);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return badRequest("Absence dates must be valid.");
  }
  if (endDate <= startDate) {
    return badRequest("endDate must be after startDate.");
  }

  const row = await addAbsenceRecord(auth.user.id, {
    startDate,
    endDate,
    reason: record.reason ?? record.place ?? null,
  });
  if (!row) return notFound("Create a profile before adding absences.");

  return NextResponse.json(
    {
      absence: {
        id: row.id,
        startDate: isoDate(row.startDate),
        endDate: isoDate(row.endDate),
        daysAway: row.daysAway,
        reason: row.reason,
      },
    },
    { status: 201 },
  );
}

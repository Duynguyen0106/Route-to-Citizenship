import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateInaccuracyReport } from "@/lib/api/report-input";
import { tryGetRouteByKey } from "@/lib/routes";
import { badRequest } from "@/lib/api/session";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be JSON.");
  }

  const parsed = validateInaccuracyReport(body);
  if ("error" in parsed) return badRequest(parsed.error);
  if (parsed.routeKey && !tryGetRouteByKey(parsed.routeKey)) {
    return badRequest("Unknown route key.");
  }

  const report = await prisma.inaccuracyReport.create({
    data: parsed,
  });

  return NextResponse.json({ ok: true, id: report.id }, { status: 201 });
}

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { asJsonObject, badRequest, readJsonBody } from "@/lib/api/session";
import { validateEnquiry } from "@/lib/api/enquiry-input";
import { BILLING_LIVE } from "@/lib/billing";

export async function POST(request: Request) {
  const parsed = await readJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = asJsonObject(parsed.body);
  const result = validateEnquiry(body);
  if ("error" in result) return badRequest(result.error);
  const session = await getSessionUser();

  try {
    const row = await prisma.billingEnquiry.create({
      data: {
        userId: session?.id ?? null,
        email: result.email,
        kind: result.kind,
        message: result.message,
        meta: result.adviserSlug ? ({ adviserSlug: result.adviserSlug } as Prisma.InputJsonValue) : undefined,
      },
    });
    return NextResponse.json({
      id: row.id,
      billingLive: BILLING_LIVE,
      note: "Enquiry stored. No payment has been taken and no adviser has been instructed yet.",
    });
  } catch {
    return badRequest("Could not store that enquiry. Try again after the database is migrated.");
  }
}

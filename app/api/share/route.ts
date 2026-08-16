import { addDays } from "date-fns";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { asJsonObject, badRequest, readJsonBody, requireUser } from "@/lib/api/session";
import {
  isSharePack,
  packContainsIdentityNumbers,
  sharePackJson,
} from "@/lib/share-pack";
import { hashShareToken, newShareToken } from "@/lib/share-token";

const MAX_BYTES = 80_000;
const LABELS = new Set(["adviser", "family", "employer"]);

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const parsed = await readJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = asJsonObject(parsed.body);
  if (!body) return badRequest("Request body must be a JSON object.");
  if (!isSharePack(body.pack)) return badRequest("A redacted share pack is required.");
  const json = sharePackJson(body.pack);
  if (json.length > MAX_BYTES) return badRequest("Share pack is too large.");
  if (packContainsIdentityNumbers(json)) {
    return badRequest("Do not include passport numbers. Export the redacted pack from the planner.");
  }
  const label = typeof body.label === "string" && LABELS.has(body.label) ? body.label : "adviser";
  const days = typeof body.days === "number" && body.days >= 1 && body.days <= 30 ? Math.round(body.days) : 7;
  const { token, tokenHash } = newShareToken();

  try {
    await prisma.shareLink.create({
      data: {
        tokenHash,
        label,
        payload: JSON.parse(json) as Prisma.InputJsonValue,
        expiresAt: addDays(new Date(), days),
      },
    });
  } catch {
    return badRequest("Could not store the share link. Try again after the database is migrated.");
  }

  return NextResponse.json({
    token,
    path: `/share/${token}`,
    expiresInDays: days,
    label,
  });
}

export async function DELETE(request: Request) {
  const parsed = await readJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = asJsonObject(parsed.body);
  const token = typeof body?.token === "string" ? body.token : "";
  if (!token) return badRequest("Token is required.");
  try {
    await prisma.shareLink.updateMany({
      where: { tokenHash: hashShareToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch {
    return badRequest("Could not revoke that link.");
  }
  return NextResponse.json({ revoked: true });
}

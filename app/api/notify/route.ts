import { NextResponse } from "next/server";
import { notifyConfigured, NOTIFY_UNAVAILABLE_REASON, sendGovukNotifyEmail } from "@/lib/notify";
import { asJsonObject, badRequest, readJsonBody, requireUser } from "@/lib/api/session";
import { dispatch } from "@/lib/events/broker";
import type { Reminder } from "@/lib/types";

export async function GET() {
  return NextResponse.json({
    available: notifyConfigured(),
    reason: notifyConfigured() ? null : NOTIFY_UNAVAILABLE_REASON,
  });
}

export async function POST(request: Request) {
  if (!notifyConfigured()) {
    return NextResponse.json({ sent: false, error: NOTIFY_UNAVAILABLE_REASON }, { status: 501 });
  }
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const parsed = await readJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = asJsonObject(parsed.body);
  if (!body) return badRequest("Request body must be a JSON object.");
  const reminders = Array.isArray(body.reminders) ? (body.reminders as Reminder[]) : [];
  if (reminders.length === 0) return badRequest("Reminders are required.");
  const result = await sendGovukNotifyEmail(auth.user.email, reminders);
  await dispatch("reminders.requested", "notifications", {
    count: reminders.length,
    sent: result.sent,
  });
  return NextResponse.json(result, { status: result.sent ? 200 : 502 });
}

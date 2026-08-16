import { NextResponse } from "next/server";
import { parseISO } from "date-fns";
import { badRequest, requireUser } from "@/lib/api/session";
import { reminderKindToType, isoDate } from "@/lib/db/mappers";
import { createReminderRecord, listUpcomingReminders } from "@/lib/db/plan-repository";
import type { Reminder } from "@/lib/types";

const REMINDER_TYPES = new Set([
  "VISA_EXPIRY",
  "ILR_ELIGIBILITY",
  "CITIZENSHIP_ELIGIBILITY",
  "LIFE_IN_UK_TEST",
]);

const KIND_TO_TYPE: Record<string, string> = {
  visa_expiry: "VISA_EXPIRY",
  ilr: "ILR_ELIGIBILITY",
  citizenship: "CITIZENSHIP_ELIGIBILITY",
  test: "LIFE_IN_UK_TEST",
};

function normalizeReminderType(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const upper = value.trim().toUpperCase();
  if (REMINDER_TYPES.has(upper)) return upper;
  if (value in KIND_TO_TYPE) return KIND_TO_TYPE[value];
  if (value === "visa_expiry" || value === "ilr" || value === "citizenship" || value === "test") {
    return reminderKindToType(value as Reminder["kind"]);
  }
  return null;
}

function serializeReminder(row: {
  id: string;
  title: string;
  dueDate: Date;
  type: string;
  isCompleted: boolean;
}) {
  return {
    id: row.id,
    title: row.title,
    dueDate: isoDate(row.dueDate),
    type: row.type,
    isCompleted: row.isCompleted,
  };
}

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const reminders = await listUpcomingReminders(auth.user.id);
  return NextResponse.json({ reminders: reminders.map(serializeReminder) });
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

  const record = body as { title?: string; dueDate?: string; date?: string; type?: string; kind?: string };
  const title = record.title?.trim();
  const dueDateRaw = record.dueDate ?? record.date;
  const type = normalizeReminderType(record.type ?? record.kind);

  if (!title) return badRequest("A reminder title is required.");
  if (!dueDateRaw) return badRequest("A due date is required.");
  if (!type) {
    return badRequest(
      "type must be VISA_EXPIRY, ILR_ELIGIBILITY, CITIZENSHIP_ELIGIBILITY, or LIFE_IN_UK_TEST.",
    );
  }

  const dueDate = parseISO(dueDateRaw);
  if (Number.isNaN(dueDate.getTime())) return badRequest("dueDate must be a valid date.");

  const reminder = await createReminderRecord(auth.user.id, { title, dueDate, type });
  return NextResponse.json({ reminder: serializeReminder(reminder) }, { status: 201 });
}

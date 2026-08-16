import { addDays, addMonths, isBefore } from "date-fns";
import type { Profile, Reminder, VisaRoute } from "./types";
import { englishMet, lifeInUkMet } from "./eligibility";
import { toIsoDate } from "./dates";

export function buildReminders(options: {
  profile: Profile;
  route: VisaRoute;
  asOf: Date;
  ilrApplyFrom: Date | null;
  ilrOn: Date | null;
  citizenshipOn: Date | null;
  visaExpiry: Date;
}): Reminder[] {
  const { profile, route, asOf, ilrApplyFrom, ilrOn, citizenshipOn, visaExpiry } = options;
  const reminders: Reminder[] = [];

  if (profile.reminderPrefs.visaExpiry && route.id !== "ilr") {
    for (const months of [6, 3, 1]) {
      const date = addMonths(visaExpiry, -months);
      reminders.push({
        id: `visa-${months}m`,
        title: `Visa expiry in ${months} month${months === 1 ? "" : "s"}`,
        date: toIsoDate(date),
        kind: "visa_expiry",
        detail: `Current leave expires on ${toIsoDate(visaExpiry)}. Start an extension or switch in good time.`,
        urgency: urgency(date, asOf),
      });
    }
  }

  if (profile.reminderPrefs.ilrWindow && ilrApplyFrom && route.leadsToIlr && route.id !== "ilr") {
    reminders.push({
      id: "ilr-6m",
      title: "Prepare ILR evidence (6 months out)",
      date: toIsoDate(addMonths(ilrApplyFrom, -6)),
      kind: "ilr",
      detail: `You can usually apply from ${toIsoDate(ilrApplyFrom)} (28 days before ${ilrOn ? toIsoDate(ilrOn) : "eligibility"}).`,
      urgency: urgency(addMonths(ilrApplyFrom, -6), asOf),
    });
    reminders.push({
      id: "ilr-window",
      title: "ILR application window opens",
      date: toIsoDate(ilrApplyFrom),
      kind: "ilr",
      detail: "Gather the final 6 months of payslips, absence records, and test passes before you submit.",
      urgency: urgency(ilrApplyFrom, asOf),
    });
  }

  if (profile.reminderPrefs.tests && route.leadsToIlr && route.id !== "ilr") {
    const target = ilrApplyFrom ?? addMonths(asOf, 6);
    if (route.englishRequiredForIlr && !englishMet(profile)) {
      const date = addMonths(target, -4);
      reminders.push({
        id: "english-test",
        title: "Book an English language test",
        date: toIsoDate(date),
        kind: "test",
        detail: "B1 SELT results can take time. Book well before your ILR window.",
        urgency: urgency(date, asOf),
      });
    }
    if (route.lifeInUkRequiredForIlr && !lifeInUkMet(profile)) {
      const date = addMonths(target, -3);
      reminders.push({
        id: "life-in-uk",
        title: "Book the Life in the UK test",
        date: toIsoDate(date),
        kind: "test",
        detail: "Test centres fill up. You need the pass notification for most ILR applications.",
        urgency: urgency(date, asOf),
      });
    }
  }

  if (profile.reminderPrefs.citizenship && citizenshipOn) {
    reminders.push({
      id: "citizenship-3m",
      title: "Citizenship application coming into view",
      date: toIsoDate(addMonths(citizenshipOn, -3)),
      kind: "citizenship",
      detail: `Estimated naturalisation eligibility from ${toIsoDate(citizenshipOn)}. Recheck absences and good character first.`,
      urgency: urgency(addMonths(citizenshipOn, -3), asOf),
    });
  }

  return reminders
    .filter((reminder) => reminder.date >= toIsoDate(addDays(asOf, -14)))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** One alert per dashboard category: visa expiry, ILR, citizenship, Life in the UK. */
export function dashboardAlerts(reminders: Reminder[]): Reminder[] {
  const visa =
    reminders.find((item) => item.id === "visa-3m") ??
    reminders.find((item) => item.kind === "visa_expiry");
  const ilr = reminders.find((item) => item.kind === "ilr");
  const citizenship = reminders.find((item) => item.kind === "citizenship");
  const lifeInUk =
    reminders.find((item) => item.id === "life-in-uk") ??
    reminders.find((item) => item.kind === "test" && item.title.toLowerCase().includes("life in the uk"));
  return [visa, ilr, citizenship, lifeInUk].filter((item): item is Reminder => Boolean(item));
}

function urgency(date: Date, asOf: Date): Reminder["urgency"] {
  if (isBefore(date, asOf)) return "overdue";
  const in30 = addDays(asOf, 30);
  if (!isBefore(in30, date)) return "soon";
  return "upcoming";
}

export function remindersToIcs(reminders: Reminder[], calendarName = "Route to Citizenship"): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Route to Citizenship//EN",
    `X-WR-CALNAME:${escapeIcs(calendarName)}`,
    "CALSCALE:GREGORIAN",
  ];

  for (const reminder of reminders) {
    const day = reminder.date.replaceAll("-", "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${reminder.id}@route-to-citizenship`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day}`,
      `SUMMARY:${escapeIcs(reminder.title)}`,
      `DESCRIPTION:${escapeIcs(reminder.detail)}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function escapeIcs(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll(";", "\\;").replaceAll(",", "\\,").replaceAll("\n", "\\n");
}

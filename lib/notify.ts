import { LEGAL_NOTICE } from "./legal";
import { remindersToIcs } from "./reminders";
import type { Reminder } from "./types";

export const NOTIFY_UNAVAILABLE_REASON =
  "GOV.UK Notify is a service for public-sector organisations. This private planner cannot send Home Office SMS. Use the calendar (.ics) download, browser alerts, or your own email.";

export function notifyConfigured(): boolean {
  return Boolean(process.env.GOVUK_NOTIFY_API_KEY && process.env.GOVUK_NOTIFY_TEMPLATE_ID);
}

export function reminderEmailBody(reminders: Reminder[]): string {
  const lines = [
    LEGAL_NOTICE,
    "",
    "Upcoming planner reminders (not Home Office messages):",
    ...reminders.map((item) => `- ${item.date}: ${item.title} — ${item.detail}`),
    "",
    "Confirm dates on GOV.UK before you act.",
  ];
  return lines.join("\n");
}

export function reminderMailto(reminders: Reminder[]): string {
  const subject = encodeURIComponent("Route to Citizenship reminders");
  const body = encodeURIComponent(reminderEmailBody(reminders).slice(0, 1800));
  return `mailto:?subject=${subject}&body=${body}`;
}

export function reminderCalendarFile(reminders: Reminder[]): string {
  return remindersToIcs(reminders);
}

/** Build a GOV.UK Notify-shaped payload. Only sent when an API key is configured. */
export function notifyEmailPayload(to: string, reminders: Reminder[]): {
  email_address: string;
  template_id: string;
  personalisation: { body: string };
} {
  return {
    email_address: to,
    template_id: process.env.GOVUK_NOTIFY_TEMPLATE_ID || "",
    personalisation: { body: reminderEmailBody(reminders) },
  };
}

export async function sendGovukNotifyEmail(
  to: string,
  reminders: Reminder[],
  fetcher: typeof fetch = fetch,
): Promise<{ sent: boolean; error?: string }> {
  if (!notifyConfigured()) {
    return { sent: false, error: NOTIFY_UNAVAILABLE_REASON };
  }
  if (!to.includes("@")) return { sent: false, error: "A valid email is required." };
  const apiKey = process.env.GOVUK_NOTIFY_API_KEY as string;
  const payload = notifyEmailPayload(to, reminders);
  try {
    const response = await fetcher("https://api.notifications.service.gov.uk/v2/notifications/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return { sent: false, error: `Notify returned ${response.status}` };
    }
    return { sent: true };
  } catch {
    return { sent: false, error: "Could not reach GOV.UK Notify." };
  }
}

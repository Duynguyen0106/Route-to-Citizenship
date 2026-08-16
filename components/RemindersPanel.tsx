"use client";

import { useEffect, useState } from "react";
import { remindersToIcs } from "@/lib/reminders";
import { reminderMailto } from "@/lib/notify";
import { formatLongDate } from "@/lib/format";
import type { Reminder, ReminderPrefs } from "@/lib/types";

const URGENCY: Record<Reminder["urgency"], string> = {
  overdue: "text-clay",
  soon: "text-gold-600",
  upcoming: "text-ink-muted",
};

export function RemindersPanel({
  reminders,
  prefs,
  onPrefsChange,
}: {
  reminders: Reminder[];
  prefs: ReminderPrefs;
  onPrefsChange: (prefs: ReminderPrefs) => void;
}) {
  const [notifyNote, setNotifyNote] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/notify")
      .then(async (response) => (await response.json()) as { available?: boolean; reason?: string | null })
      .then((body) => {
        if (!body.available) setNotifyNote(body.reason ?? null);
      })
      .catch(() => undefined);
  }, []);
  function downloadIcs() {
    const blob = new Blob([remindersToIcs(reminders)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "route-to-citizenship-reminders.ics";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function enableBrowserNotifications() {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    onPrefsChange({ ...prefs, browserNotifications: permission === "granted" });
    if (permission === "granted") {
      const due = reminders.filter((item) => item.urgency === "overdue" || item.urgency === "soon");
      const first = due[0] ?? reminders[0];
      if (first) {
        new Notification(first.title, { body: first.detail });
      }
    }
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
      <ul className="divide-y divide-navy/10 rounded-2xl border border-navy/10 bg-paper-50">
        {reminders.length === 0 && (
          <li className="px-4 py-5 text-sm text-ink-muted">No reminders fall in the modelled window.</li>
        )}
        {reminders.map((reminder) => (
          <li key={reminder.id} className="px-4 py-3">
            <p className="font-medium text-navy">{reminder.title}</p>
            <p className={`text-xs ${URGENCY[reminder.urgency]}`}>{formatLongDate(reminder.date)}</p>
            <p className="mt-1 text-sm text-ink-muted">{reminder.detail}</p>
          </li>
        ))}
      </ul>
      <aside className="space-y-4 rounded-2xl border border-navy/10 bg-paper-50 p-5 text-sm">
        <p className="font-medium text-navy">Reminder settings</p>
        {(
          [
            ["visaExpiry", "Visa expiry"],
            ["ilrWindow", "ILR window"],
            ["tests", "English & Life in the UK"],
            ["citizenship", "Citizenship"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={prefs[key]}
              onChange={(event) => onPrefsChange({ ...prefs, [key]: event.target.checked })}
            />
            {label}
          </label>
        ))}
        <a
          href={reminderMailto(reminders)}
          className="flex min-h-11 w-full items-center justify-center rounded-full border border-navy/20 px-4 py-2 text-center"
        >
          Email these reminders to yourself
        </a>
        <button
          type="button"
          onClick={() => {
            void fetch("/api/notify", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ reminders }),
            })
              .then(async (response) => {
                const body = (await response.json()) as { error?: string; sent?: boolean };
                if (response.status === 401) {
                  setNotifyNote("Sign in to send reminders to your account email. Notify is only used if this deployment has a public-sector API key.");
                  return;
                }
                setNotifyNote(
                  body.sent
                    ? "Sent to your account email (planner reminders, not Home Office messages)."
                    : (body.error ?? "Could not send via GOV.UK Notify."),
                );
              })
              .catch(() => setNotifyNote("Could not reach the reminder service."));
          }}
          className="min-h-11 w-full rounded-full border border-navy/20 px-4 py-2"
        >
          Send to my account email
        </button>
        <button
          type="button"
          onClick={downloadIcs}
          className="min-h-11 w-full rounded-full border border-navy/20 px-4 py-2"
        >
          Download calendar (.ics)
        </button>
        <button
          type="button"
          onClick={enableBrowserNotifications}
          className="min-h-11 w-full rounded-full bg-navy px-4 py-2 text-paper-50"
        >
          {prefs.browserNotifications ? "Browser alerts on" : "Enable browser alerts"}
        </button>
        <p className="text-xs text-ink-muted">
          {notifyNote ??
            "GOV.UK Notify is not used unless an API key is configured for a public-sector deployment. SMS from UKVI partners is not available here."}
        </p>
      </aside>
    </div>
  );
}

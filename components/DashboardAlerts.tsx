import { dashboardAlerts } from "@/lib/reminders";
import { formatLongDate } from "@/lib/format";
import type { Reminder } from "@/lib/types";

const URGENCY_STYLES: Record<Reminder["urgency"], string> = {
  overdue: "border-clay/40 bg-clay/10 text-clay-600",
  soon: "border-gold/40 bg-gold/10 text-navy",
  upcoming: "border-navy/10 bg-paper-50 text-ink-muted",
};

const KIND_LABEL: Record<Reminder["kind"], string> = {
  visa_expiry: "Visa expiry",
  ilr: "ILR eligibility",
  citizenship: "Citizenship eligibility",
  test: "Life in UK test",
};

export function DashboardAlerts({ reminders }: { reminders: Reminder[] }) {
  const alerts = dashboardAlerts(reminders);
  if (alerts.length === 0) return null;

  return (
    <section aria-label="Reminders and alerts" className="mt-8">
      <h2 className="font-serif text-2xl text-navy">Reminders and alerts</h2>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {alerts.map((alert) => (
          <li key={alert.id} className={`rounded-2xl border px-4 py-3 ${URGENCY_STYLES[alert.urgency]}`}>
            <p className="text-xs uppercase tracking-wide">{KIND_LABEL[alert.kind]}</p>
            <p className="mt-1 font-medium text-navy">{alert.title}</p>
            <p className="mt-1 text-xs">{formatLongDate(alert.date)}</p>
            <p className="mt-1 text-sm">{alert.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

import type { EligibilityItem } from "@/lib/types";

const STATUS: Record<
  EligibilityItem["status"],
  { label: string; className: string }
> = {
  met: { label: "Looks OK", className: "bg-moss/15 text-moss-700" },
  not_met: { label: "Gap", className: "bg-clay/15 text-clay-600" },
  attention: { label: "Check", className: "bg-gold/20 text-navy" },
  not_applicable: { label: "N/A", className: "bg-navy/10 text-ink-muted" },
};

export function EligibilityPanel({ items }: { items: EligibilityItem[] }) {
  return (
    <ul className="mt-6 grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <li key={item.id} className="rounded-2xl border border-navy/10 bg-paper-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-medium text-navy">{item.label}</h3>
            <span className={`rounded-full px-2.5 py-0.5 text-xs ${STATUS[item.status].className}`}>
              {STATUS[item.status].label}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.detail}</p>
        </li>
      ))}
    </ul>
  );
}

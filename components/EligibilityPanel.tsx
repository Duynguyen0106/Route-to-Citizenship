import type { EligibilityCheck, EligibilityItem } from "@/lib/types";
import { toIsoDate } from "@/lib/dates";
import { formatLongDate } from "@/lib/format";

const STATUS: Record<
  EligibilityItem["status"],
  { label: string; className: string }
> = {
  met: { label: "Looks OK", className: "bg-moss/15 text-moss-700" },
  not_met: { label: "Gap", className: "bg-clay/15 text-clay-600" },
  attention: { label: "Check", className: "bg-gold/20 text-navy" },
  not_applicable: { label: "N/A", className: "bg-navy/10 text-ink-muted" },
};

const REQUIREMENT_LABELS: Record<keyof EligibilityCheck["requirementsMet"], string> = {
  continuousResidence: "Continuous residence",
  absenceLimit: "Absence limit",
  english: "English",
  lifeInUK: "Life in the UK",
  feesKnown: "Fees known",
};

export function EligibilityPanel({
  items,
  check,
}: {
  items: EligibilityItem[];
  check?: EligibilityCheck;
}) {
  return (
    <div>
      {check && (
        <div className="rounded-2xl border border-navy/10 bg-paper-50 p-5">
          <p className="font-medium text-navy">
            {check.eligible
              ? "These basic ILR checks look met on the details you entered."
              : "These basic ILR checks show one or more gaps."}
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            Estimated ILR:{" "}
            {check.estimatedILRDate ? formatLongDate(toIsoDate(check.estimatedILRDate)) : "not yet"}
            {" · "}
            Estimated citizenship:{" "}
            {check.estimatedCitizenshipDate
              ? formatLongDate(toIsoDate(check.estimatedCitizenshipDate))
              : "not yet"}
          </p>
          <ul className="mt-4 flex flex-wrap gap-2 text-xs">
            {(Object.keys(REQUIREMENT_LABELS) as (keyof EligibilityCheck["requirementsMet"])[]).map(
              (key) => (
                <li
                  key={key}
                  className={`rounded-full px-2.5 py-0.5 ${
                    check.requirementsMet[key]
                      ? "bg-moss/15 text-moss-700"
                      : "bg-clay/15 text-clay-600"
                  }`}
                >
                  {REQUIREMENT_LABELS[key]}
                </li>
              ),
            )}
          </ul>
          {check.reasons.length > 0 && (
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-clay-600">
              {check.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}
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
    </div>
  );
}

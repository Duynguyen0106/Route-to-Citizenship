import { assessRouteRisk } from "@/lib/risk-score";
import type { PlanResult, Profile } from "@/lib/types";

const BAND_LABEL = {
  stronger: "Stronger readiness sketch",
  mixed: "Mixed — several gaps",
  weaker: "Weaker readiness sketch",
} as const;

export function RiskPanel({ profile, plan }: { profile: Profile; plan: PlanResult }) {
  const risk = assessRouteRisk(profile, plan);
  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm text-ink-muted">{risk.probabilityNote}</p>
      <div className="rounded-2xl border border-navy/10 bg-paper-50 p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-faint">{BAND_LABEL[risk.band]}</p>
        <p className="mt-2 font-serif text-4xl text-navy">{risk.readiness}<span className="text-lg text-ink-muted"> / 100</span></p>
        <p className="mt-2 text-sm text-ink-muted">
          Approval probability: not estimated. This app will not quote a percentage chance of ILR or
          citizenship based on “similar cases”.
        </p>
      </div>
      <ul className="space-y-2">
        {risk.factors.map((factor) => (
          <li
            key={factor.id}
            className={`rounded-xl border px-4 py-3 text-sm ${
              factor.impact === "helps"
                ? "border-moss/30 bg-moss/5"
                : factor.impact === "hurts"
                  ? "border-clay/30 bg-clay/5"
                  : "border-navy/10 bg-white"
            }`}
          >
            <p className="font-medium text-navy">
              {factor.label}
              <span className="ml-2 text-xs font-normal uppercase tracking-wide text-ink-faint">{factor.impact}</span>
            </p>
            <p className="mt-1 text-ink-muted">{factor.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

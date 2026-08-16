import { recommendRoutes } from "@/lib/recommend";
import type { PlanResult, Profile } from "@/lib/types";

export function RecommendationsPanel({ profile, plan }: { profile: Profile; plan: PlanResult }) {
  const ranked = recommendRoutes(profile, plan);
  return (
    <div className="mt-6">
      <p className="text-sm text-ink-muted">
        Ranked from this planner’s encoded rules and your answers — not a model trained on Home
        Office decisions or thousands of real files. Faster clocks are not always more reliable.
      </p>
      <ol className="mt-4 space-y-3">
        {ranked.map((item, index) => (
          <li key={item.key} className="rounded-xl border border-navy/10 bg-paper-50 px-4 py-3">
            <p className="font-medium text-navy">
              {index + 1}. {item.name}
              {item.current ? <span className="ml-2 text-xs uppercase tracking-wide text-moss">Current</span> : null}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Score {item.score} · {item.reliability.replaceAll("_", " ")}
              {item.yearsToILR !== null ? ` · ILR ~${item.yearsToILR}y` : ""}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
              {item.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}

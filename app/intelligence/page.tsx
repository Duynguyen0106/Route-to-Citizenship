import type { Metadata } from "next";
import Link from "next/link";
import { GoalInterpreter } from "@/components/GoalInterpreter";
import { GuidanceChat } from "@/components/GuidanceChat";
import { LEGAL_NOTICE } from "@/lib/legal";
import { ENCODED_RULE_VERSIONS, listRuleKeys } from "@/lib/rule-versions";
import { formatLongDate } from "@/lib/format";

export const metadata: Metadata = { title: "Data and guidance" };

export default function IntelligencePage() {
  const keys = listRuleKeys();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">Data</p>
      <h1 className="mt-3 font-serif text-4xl text-navy">Rules, guidance and benchmarks</h1>
      <p className="mt-6 text-[17px] leading-relaxed text-ink-muted">{LEGAL_NOTICE}</p>
      <p className="mt-4 text-[17px] leading-relaxed text-ink">
        This page is general information. It is not a recommendation engine trained on Home Office
        files, and it will not quote a percentage chance that your application succeeds.
      </p>

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-navy">Versioned encoded rules</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Facts this planner actually uses, with effective dates. Historic fee amounts before 8
          April 2026 are not invented.
        </p>
        <ul className="mt-4 space-y-3">
          {keys.map((key) => (
            <li key={key} className="rounded-xl border border-navy/10 bg-paper-50 px-4 py-3">
              <p className="font-medium text-navy">{key}</p>
              <ol className="mt-2 space-y-2 text-sm text-ink-muted">
                {ENCODED_RULE_VERSIONS.filter((row) => row.ruleKey === key).map((row) => (
                  <li key={`${row.ruleKey}-${row.effectiveFrom}`}>
                    {formatLongDate(row.effectiveFrom)}
                    {row.effectiveTo ? ` – ${formatLongDate(row.effectiveTo)}` : " – current"}:{" "}
                    {row.summary}
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-navy">Describe a goal</h2>
        <GoalInterpreter />
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-navy">Guidance assistant</h2>
        <GuidanceChat />
      </section>

      <p className="mt-12 text-sm">
        <Link href="/plan" className="text-navy underline">
          Open the planner
        </Link>{" "}
        for route-specific notices, readiness, and opt-in benchmarks.
      </p>
    </article>
  );
}

"use client";

import Link from "next/link";
import { PLAN_CATALOGUE, type FeatureId } from "@/lib/billing";
import { usePlan } from "@/components/PlanProvider";
import type { ReactNode } from "react";

export function FeatureGate({
  feature,
  children,
}: {
  feature: FeatureId;
  children: ReactNode;
}) {
  const { has, minPlan, loaded } = usePlan();
  if (!loaded) {
    return <p className="mt-4 text-sm text-ink-muted">Checking preview plan…</p>;
  }
  if (has(feature)) return <>{children}</>;
  const needed = PLAN_CATALOGUE[minPlan(feature)];
  return (
    <div className="mt-6 rounded-2xl border border-navy/10 bg-paper-50 px-5 py-4">
      <p className="text-xs uppercase tracking-[0.16em] text-moss">{needed.name} preview</p>
      <p className="mt-2 text-sm text-navy">
        This section is part of the {needed.name} tier. Preview it from the pricing page — no
        payment is taken.
      </p>
      <Link
        href={`/pricing#${needed.id}`}
        className="mt-3 inline-flex min-h-11 items-center rounded-full bg-navy px-4 py-2 text-sm text-paper-50"
      >
        See {needed.name} (£{needed.monthlyGbp ?? 0}/month indicative)
      </Link>
    </div>
  );
}

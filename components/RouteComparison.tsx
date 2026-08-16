"use client";

import { useState } from "react";
import Link from "next/link";
import { applyRouteSwitch, buildRouteComparison } from "@/lib/comparison";
import { fromIsoDate } from "@/lib/calculate";
import { formatLongDate } from "@/lib/format";
import type { PlanResult, Profile } from "@/lib/types";

export function RouteComparison({
  profile,
  plan,
  onSwitch,
}: {
  profile: Profile;
  plan: PlanResult;
  onSwitch: (profile: Profile) => void;
}) {
  const cards = buildRouteComparison(profile, plan, fromIsoDate(plan.asOf));
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  function switchTo(key: string, toVisaId: string) {
    if (pendingKey !== key) {
      setPendingKey(key);
      return;
    }
    onSwitch(applyRouteSwitch(profile, plan, toVisaId));
    setPendingKey(null);
  }

  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-2">
      {cards.map((card) => (
        <article
          key={card.key}
          className={`rounded-2xl border bg-paper-50 p-4 shadow-card sm:p-5 ${
            card.current ? "border-moss" : "border-navy/10"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-serif text-lg text-navy sm:text-xl">{card.name}</h3>
            {card.current ? (
              <span className="shrink-0 rounded-full bg-moss/15 px-2 py-0.5 text-xs text-moss">Current</span>
            ) : null}
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-faint">Years to ILR</dt>
              <dd className="mt-1 font-medium text-navy">
                {card.yearsToILR === null ? "No ILR clock yet" : card.yearsToILR}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-faint">Years to citizenship</dt>
              <dd className="mt-1 font-medium text-navy">
                {card.yearsToCitizenship === null ? "—" : card.yearsToCitizenship}
              </dd>
            </div>
          </dl>
          {card.ilrDate ? (
            <p className="mt-2 text-xs text-ink-muted">
              Est. ILR {formatLongDate(card.ilrDate)}
              {card.citizenshipDate ? ` · citizenship ${formatLongDate(card.citizenshipDate)}` : ""}
            </p>
          ) : null}
          <p className="mt-4 text-xs uppercase tracking-wide text-ink-faint">Main requirements</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
            {card.mainRequirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {card.eligibleToSwitch ? (
              <>
                <button
                  type="button"
                  onClick={() => switchTo(card.key, card.toVisaId)}
                  className={`min-h-11 rounded-full px-4 py-2 text-sm ${
                    pendingKey === card.key
                      ? "bg-clay text-white"
                      : "bg-navy text-paper-50"
                  }`}
                >
                  {pendingKey === card.key ? "Confirm switch" : "Switch to this route"}
                </button>
                {pendingKey === card.key ? (
                  <button
                    type="button"
                    className="text-sm text-ink-muted"
                    onClick={() => setPendingKey(null)}
                  >
                    Cancel
                  </button>
                ) : null}
              </>
            ) : card.current ? (
              <p className="text-xs text-ink-muted">This is the path we are modelling now.</p>
            ) : (
              <p className="text-xs text-ink-muted">
                Not modelled as an in-country switch from your current visa.
              </p>
            )}
            <Link href={`/routes/${card.key}`} className="text-xs text-navy underline-offset-2 hover:underline">
              Route notes
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

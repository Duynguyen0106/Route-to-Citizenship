"use client";

import Link from "next/link";
import { formatLongDate } from "@/lib/format";
import { buildRouteComparison } from "@/lib/comparison";
import { fromIsoDate } from "@/lib/calculate";
import { inferPathway } from "@/lib/pathways";
import { simulateSwitch } from "@/lib/simulate";
import { toIsoDate } from "@/lib/dates";
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

  function switchTo(toVisaId: string) {
    const simulation = simulateSwitch(
      profile,
      toVisaId,
      fromIsoDate(plan.asOf),
      plan.ilrEligibleOn && plan.route.id !== "ilr" ? fromIsoDate(plan.ilrEligibleOn) : null,
      plan.citizenshipEligibleOn ? fromIsoDate(plan.citizenshipEligibleOn) : null,
    );
    onSwitch({
      ...profile,
      currentVisaId: toVisaId,
      pathwayId: inferPathway(toVisaId),
      visaGrantedOn: toIsoDate(fromIsoDate(plan.asOf)),
      qualifyingResidenceStart: simulation.newQualifyingStart,
      plannedSwitchOn: "",
      plannedSwitchTo: toVisaId === "skilled-worker" ? "skilled-worker" : profile.plannedSwitchTo,
    });
  }

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {cards.map((card) => (
        <article
          key={card.key}
          className={`rounded-2xl border bg-paper-50 p-5 shadow-card ${
            card.current ? "border-moss" : "border-navy/10"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-serif text-xl text-navy">{card.name}</h3>
            {card.current ? (
              <span className="rounded-full bg-moss/15 px-2 py-0.5 text-xs text-moss">Current</span>
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
              <button
                type="button"
                onClick={() => switchTo(card.toVisaId)}
                className="rounded-full bg-navy px-4 py-2 text-sm text-paper-50"
              >
                Switch to this route
              </button>
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

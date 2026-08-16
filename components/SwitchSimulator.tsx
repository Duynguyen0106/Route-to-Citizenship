"use client";

import { useMemo, useState } from "react";
import { fromIsoDate } from "@/lib/calculate";
import { formatDayCount, formatGbp, formatLongDate } from "@/lib/format";
import { SWITCH_TARGETS } from "@/lib/pathways";
import { getPossibleSwitches, simulateSwitch } from "@/lib/simulate";
import { toIsoDate } from "@/lib/dates";
import type { PlanResult, Profile } from "@/lib/types";

export function SwitchSimulator({ profile, plan }: { profile: Profile; plan: PlanResult }) {
  const targets = SWITCH_TARGETS.filter((target) => target.visaId !== profile.currentVisaId);
  const [toVisaId, setToVisaId] = useState(targets[0]?.visaId ?? "skilled-worker");
  const [switchOn, setSwitchOn] = useState(toIsoDate(new Date()));

  const possible = useMemo(
    () => getPossibleSwitches(profile, fromIsoDate(plan.asOf)),
    [profile, plan.asOf],
  );
  const selected = targets.some((target) => target.visaId === toVisaId)
    ? toVisaId
    : (targets[0]?.visaId ?? "skilled-worker");

  const simulation = useMemo(() => {
    const requested = fromIsoDate(switchOn);
    const switchDate = Number.isNaN(requested.getTime()) ? fromIsoDate(plan.asOf) : requested;
    return simulateSwitch(
      profile,
      selected,
      switchDate,
      plan.ilrEligibleOn && plan.route.id !== "ilr" ? fromIsoDate(plan.ilrEligibleOn) : null,
      plan.citizenshipEligibleOn ? fromIsoDate(plan.citizenshipEligibleOn) : null,
    );
  }, [profile, selected, switchOn, plan]);

  return (
    <div className="mt-6 rounded-2xl border border-navy/10 bg-paper-50 p-4 sm:p-5">
      {possible.length > 0 ? (
        <div className="mb-6">
          <p className="text-sm font-medium text-navy">In-country switches from your current visa</p>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {possible.map((option) => (
              <li key={option.routeKey}>
                <button
                  type="button"
                  onClick={() => setToVisaId(option.toVisaId)}
                  className={`min-h-16 w-full rounded-xl border px-4 py-3 text-left ${
                    selected === option.toVisaId ? "border-moss bg-moss/10" : "border-navy/10 bg-white"
                  }`}
                >
                  <p className="font-medium text-navy">{option.name}</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    ILR:{" "}
                    {option.estimatedILRDate
                      ? formatLongDate(toIsoDate(option.estimatedILRDate))
                      : "No ILR path"}
                    {" · "}
                    Citizenship:{" "}
                    {option.estimatedCitizenshipDate
                      ? formatLongDate(toIsoDate(option.estimatedCitizenshipDate))
                      : "—"}
                  </p>
                  <p className="mt-2 text-xs text-ink-muted">{option.caveats[0]}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mb-6 text-sm text-ink-muted">
          No in-country switch onto another MVP route is modelled from this visa type. Visitor leave
          usually cannot be switched inside the UK.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="font-medium text-navy">Switch onto</span>
          <select
            value={selected}
            onChange={(event) => setToVisaId(event.target.value)}
            className="field-input"
          >
            {targets.map((target) => (
              <option key={target.visaId} value={target.visaId}>
                {target.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="font-medium text-navy">Switch date</span>
          <input
            type="date"
            value={switchOn}
            onChange={(event) => setSwitchOn(event.target.value)}
            className="field-input"
          />
        </label>
      </div>

      <p className="mt-4 text-sm text-ink-muted">{simulation.clockNote}</p>
      <p className="mt-1 text-xs text-ink-muted">
        {simulation.inCountrySwitch
          ? "In-country switching is often possible on this pair of visas."
          : "This pair is treated as an overseas application in the planner."}
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <CompareCard
          title="Stay on current route"
          ilr={simulation.stayIlrOn}
          citizenship={simulation.stayCitizenshipOn}
        />
        <CompareCard
          title={`If you switch to ${simulation.toLabel}`}
          ilr={simulation.newIlrOn}
          citizenship={simulation.newCitizenshipOn}
          highlight
        />
      </div>

      {simulation.daysSavedVsStay !== null && simulation.daysSavedVsStay > 30 && (
        <p className="mt-4 text-sm text-moss">
          ILR could come forward by about {formatDayCount(simulation.daysSavedVsStay)} if you
          qualify for the new route.
        </p>
      )}
      {simulation.daysSavedVsStay !== null && simulation.daysSavedVsStay < -30 && (
        <p className="mt-4 text-sm text-clay-600">
          This switch looks slower to ILR by about {formatDayCount(simulation.daysSavedVsStay)}.
        </p>
      )}
      {!simulation.newIlrOn && (
        <p className="mt-4 text-sm text-clay-600">
          That visa still would not lead to ILR. You would need a further qualifying switch.
        </p>
      )}

      <div className="mt-5 rounded-xl bg-navy/5 px-4 py-3 text-sm">
        <p className="font-medium text-navy">
          Estimated switch cost: {formatGbp(simulation.nextApplicationFee.totalGbp)}
        </p>
        <ul className="mt-2 space-y-1 text-ink-muted">
          {simulation.nextApplicationFee.lines.map((line) => (
            <li key={line.id}>
              {line.label}: {formatGbp(line.amountGbp)}
            </li>
          ))}
        </ul>
      </div>
      {simulation.caveats[0] && (
        <p className="mt-3 text-xs text-ink-muted">{simulation.caveats[0]}</p>
      )}
    </div>
  );
}

function CompareCard({
  title,
  ilr,
  citizenship,
  highlight,
}: {
  title: string;
  ilr: string | null;
  citizenship: string | null;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${highlight ? "border-moss bg-moss/10" : "border-navy/10"}`}>
      <p className="text-xs uppercase tracking-[0.16em] text-ink-faint">{title}</p>
      <p className="mt-2 text-sm text-navy">
        ILR: {ilr ? formatLongDate(ilr) : "No ILR path"}
      </p>
      <p className="text-sm text-ink-muted">
        Citizenship: {citizenship ? formatLongDate(citizenship) : "—"}
      </p>
    </div>
  );
}

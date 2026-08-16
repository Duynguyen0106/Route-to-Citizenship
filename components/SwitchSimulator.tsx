"use client";

import { useMemo, useState } from "react";
import { fromIsoDate } from "@/lib/calculate";
import { formatDayCount, formatGbp, formatLongDate } from "@/lib/format";
import { SWITCH_TARGETS } from "@/lib/pathways";
import { simulateSwitch } from "@/lib/simulate";
import { toIsoDate } from "@/lib/dates";
import type { PlanResult, Profile } from "@/lib/types";

export function SwitchSimulator({ profile, plan }: { profile: Profile; plan: PlanResult }) {
  const defaultTarget =
    profile.currentVisaId === "student"
      ? "graduate"
      : profile.currentVisaId === "graduate"
        ? "skilled-worker"
        : "global-talent-talent";
  const [toVisaId, setToVisaId] = useState(defaultTarget);
  const [switchOn, setSwitchOn] = useState(toIsoDate(new Date()));

  const simulation = useMemo(
    () =>
      simulateSwitch(
        profile,
        toVisaId,
        fromIsoDate(switchOn),
        plan.ilrEligibleOn && plan.route.id !== "ilr" ? fromIsoDate(plan.ilrEligibleOn) : null,
        plan.citizenshipEligibleOn ? fromIsoDate(plan.citizenshipEligibleOn) : null,
      ),
    [profile, toVisaId, switchOn, plan],
  );

  const targets = SWITCH_TARGETS.filter((target) => target.visaId !== profile.currentVisaId);

  return (
    <div className="mt-6 rounded-2xl border border-navy/10 bg-paper-50 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="font-medium text-navy">Switch onto</span>
          <select
            value={toVisaId}
            onChange={(event) => setToVisaId(event.target.value)}
            className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2"
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
            className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2"
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

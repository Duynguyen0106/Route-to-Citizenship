"use client";

import { useEffect, useState } from "react";
import { buildTimelineBenchmark, type TimelineBenchmark } from "@/lib/benchmarks";
import type { PlanResult, Profile } from "@/lib/types";

export function BenchmarkPanel({ profile, plan }: { profile: Profile; plan: PlanResult }) {
  const local = buildTimelineBenchmark(profile, plan, []);
  const [remote, setRemote] = useState<TimelineBenchmark>(local);
  const [note, setNote] = useState<string | null>(null);
  const [reported, setReported] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/benchmarks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...profile, optIn: false }),
    })
      .then(async (response) => (await response.json()) as { timeline?: TimelineBenchmark })
      .then((body) => {
        if (body.timeline) setRemote(body.timeline);
      })
      .catch(() => undefined);
  }, [profile]);

  const view = remote;
  const yours = view.yoursYearsToIlr;
  const cohortYears = view.cohort?.avgYearsToIlr ?? null;
  const max = Math.max(yours ?? 0, cohortYears ?? 0, 1);

  async function share() {
    setSaving(true);
    setNote(null);
    try {
      const weeks = reported.trim() ? Number(reported) : null;
      const response = await fetch("/api/benchmarks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...profile,
          optIn: true,
          reportedWaitWeeks: weeks && Number.isFinite(weeks) ? weeks : undefined,
        }),
      });
      const body = (await response.json()) as { timeline?: TimelineBenchmark; error?: string };
      if (!response.ok) {
        setNote(body.error ?? "Could not save the anonymous sketch.");
        return;
      }
      if (body.timeline) setRemote(body.timeline);
      setNote("Saved an anonymous sketch (visa type, coarse nationality group, timeline — no email or name).");
    } catch {
      setNote("Could not save the anonymous sketch.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm text-ink-muted">
        Compare your sketched years to ILR with this planner’s typical decision wait and, once enough
        people opt in, an anonymous cohort. Groups smaller than 5 are hidden. These are not Home
        Office statistics.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Your sketched years to ILR" value={yours === null ? "—" : `${yours.toFixed(1)}y`} />
        <Stat label="Encoded typical wait" value={`${view.encodedTypicalWaitWeeks} weeks`} />
        <Stat
          label="Anonymous cohort (same path)"
          value={cohortYears === null ? "Not enough data" : `${cohortYears.toFixed(1)}y avg`}
        />
      </div>
      <div className="space-y-2" role="img" aria-label="Years to ILR compared with the anonymous cohort">
        <Bar label="You" value={yours ?? 0} max={max} />
        <Bar label="Cohort" value={cohortYears ?? 0} max={max} muted={!cohortYears} />
      </div>
      {view.cohortHiddenReason ? <p className="text-xs text-ink-faint">{view.cohortHiddenReason}</p> : null}
      {view.cohort?.nationalitySplit.length ? (
        <ul className="text-sm text-ink-muted">
          {view.cohort.nationalitySplit.map((row) => (
            <li key={row.group}>
              {row.group}: {row.n} sketches
            </li>
          ))}
        </ul>
      ) : null}

      <div className="rounded-xl border border-navy/10 bg-white p-4">
        <p className="text-sm font-medium text-navy">Opt in to anonymous benchmarking</p>
        <p className="mt-1 text-sm text-ink-muted">
          Shares pathway, visa category, a coarse nationality region, and the sketched ILR wait. No
          account email, name, or document scans.
        </p>
        <label className="mt-3 block text-sm text-navy">
          Optional: weeks you actually waited for your last visa decision
          <input
            className="field-input"
            type="number"
            min={1}
            max={52}
            value={reported}
            onChange={(event) => setReported(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="mt-3 min-h-11 rounded-full bg-navy px-4 py-2 text-sm text-paper-50 disabled:opacity-60"
          onClick={() => void share()}
          disabled={saving}
        >
          {saving ? "Saving…" : "Share anonymously"}
        </button>
        {note ? <p className="mt-2 text-sm text-ink-muted">{note}</p> : null}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-navy/10 bg-paper-50 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-1 font-serif text-2xl text-navy">{value}</p>
    </div>
  );
}

function Bar({ label, value, max, muted }: { label: string; value: number; max: number; muted?: boolean }) {
  const width = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <p className="text-xs text-ink-muted">
        {label}
        {value ? ` · ${value.toFixed(1)} years` : ""}
      </p>
      <div className="mt-1 h-3 overflow-hidden rounded-full bg-navy/10">
        <div
          className={`h-full rounded-full ${muted ? "bg-navy/20" : "bg-moss"}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

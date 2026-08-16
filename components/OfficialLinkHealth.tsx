"use client";

import { useState } from "react";

interface HealthSummary {
  total: number;
  failed: number;
  live: boolean;
}

interface HealthResult {
  id: string;
  url: string;
  group: string;
  ok: boolean;
  status: number | null;
  error: string | null;
}

interface HealthResponse {
  checkedOn: string;
  live: boolean;
  results: HealthResult[];
  summary: HealthSummary;
}

export function OfficialLinkHealth() {
  const [report, setReport] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"https" | "live" | null>(null);

  async function run(live: boolean) {
    setPending(live ? "live" : "https");
    setError(null);
    try {
      const response = await fetch(live ? "/api/health/urls?live=1" : "/api/health/urls");
      const body = (await response.json()) as HealthResponse & { error?: string };
      if (!response.ok) {
        setError(body.error || "Could not check official URLs.");
        return;
      }
      setReport(body);
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="rounded-2xl border border-navy/10 bg-paper-50 p-5">
      <p className="text-sm text-ink-muted">
        Official links in this planner should be https. Live probes hit GOV.UK pages only when you
        ask — they are not run on page load, and a failed probe is not a visa decision.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-full bg-navy px-4 py-2 text-sm text-paper-50 disabled:opacity-60"
          disabled={pending !== null}
          onClick={() => void run(false)}
        >
          {pending === "https" ? "Checking…" : "Check https"}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-full border border-navy/20 bg-white px-4 py-2 text-sm text-navy disabled:opacity-60"
          disabled={pending !== null}
          onClick={() => void run(true)}
        >
          {pending === "live" ? "Probing…" : "Probe GOV.UK now"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-clay">{error}</p> : null}
      {report ? (
        <div className="mt-4 text-sm">
          <p className="text-navy">
            {report.summary.failed === 0
              ? `All ${report.summary.total} listed URLs passed.`
              : `${report.summary.failed} of ${report.summary.total} listed URLs failed.`}{" "}
            {report.live ? "Live probe." : "HTTPS check only."}
          </p>
          {report.results.some((item) => !item.ok) ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-clay-600">
              {report.results
                .filter((item) => !item.ok)
                .map((item) => (
                  <li key={item.id}>
                    {item.id}: {item.error || "Failed"} — {item.url}
                  </li>
                ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

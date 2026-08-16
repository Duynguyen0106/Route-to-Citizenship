"use client";

import { useEffect, useMemo, useState } from "react";
import { noticesForProfile, historicalRuleVersions } from "@/lib/rule-versions";
import { RULES_REVIEWED_ON } from "@/lib/types";
import type { Profile } from "@/lib/types";
import { formatLongDate } from "@/lib/format";

interface RemoteNotice {
  id: string;
  title: string;
  detail: string;
  kind: string;
  effectiveOn: string;
  sourceUrl: string;
  routeKeys: string[];
}

export function RuleUpdates({ profile }: { profile: Profile }) {
  const encoded = useMemo(() => noticesForProfile(profile), [profile]);
  const [remote, setRemote] = useState<RemoteNotice[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const feeHistory = historicalRuleVersions("fees.table");

  useEffect(() => {
    fetch("/api/rules", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(profile),
    })
      .then(async (response) => (await response.json()) as { notices?: RemoteNotice[] })
      .then((body) => setRemote(body.notices ?? []))
      .catch(() => setRemote([]));
  }, [profile]);

  const notices = remote.length ? remote : encoded;

  async function sync() {
    setSyncing(true);
    setSyncNote(null);
    try {
      const response = await fetch("/api/rules/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const body = (await response.json()) as { fetched?: number; changed?: number; skipped?: boolean; error?: string };
      if (!response.ok) {
        setSyncNote(body.error ?? "Could not reach GOV.UK just now.");
        return;
      }
      setSyncNote(
        body.skipped
          ? "Recently checked — try again in a few minutes."
          : `Checked ${body.fetched ?? 0} GOV.UK pages via the Content API. ${body.changed ?? 0} differed from the last snapshot.`,
      );
    } catch {
      setSyncNote("Could not reach GOV.UK just now.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <p className="text-sm text-ink-muted">
        Encoded rules were last reviewed on {formatLongDate(RULES_REVIEWED_ON)}. This planner polls the
        official GOV.UK Content API (JSON) — it does not scrape HTML. A page update is a prompt to
        re-read GOV.UK, not an automatic rewrite of the calculator.
      </p>
      <button
        type="button"
        className="min-h-11 rounded-full bg-navy px-4 py-2 text-sm text-paper-50 disabled:opacity-60"
        onClick={() => void sync()}
        disabled={syncing}
      >
        {syncing ? "Checking GOV.UK…" : "Check GOV.UK for page updates"}
      </button>
      {syncNote ? <p className="text-sm text-ink-muted">{syncNote}</p> : null}

      <ul className="space-y-3">
        {notices.map((notice) => (
          <li key={notice.id} className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-ink-faint">{notice.kind}</p>
            <p className="mt-1 font-medium text-navy">{notice.title}</p>
            <p className="mt-1 text-sm text-ink-muted">{notice.detail}</p>
            <p className="mt-2 text-xs text-ink-faint">Effective {formatLongDate(notice.effectiveOn)}</p>
            <a className="mt-2 inline-flex min-h-11 items-center text-sm text-navy underline" href={notice.sourceUrl} target="_blank" rel="noreferrer">
              Official GOV.UK page
            </a>
          </li>
        ))}
      </ul>

      <div>
        <h3 className="text-xs uppercase tracking-[0.16em] text-ink-faint">Fee table — historical vs current</h3>
        <ol className="mt-2 space-y-2">
          {feeHistory.map((row) => (
            <li key={`${row.ruleKey}-${row.effectiveFrom}`} className="rounded-xl border border-navy/10 bg-paper-50 px-4 py-3 text-sm">
              <p className="font-medium text-navy">
                From {formatLongDate(row.effectiveFrom)}
                {row.effectiveTo ? ` to ${formatLongDate(row.effectiveTo)}` : " (current encoded table)"}
              </p>
              <p className="mt-1 text-ink-muted">{row.summary}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

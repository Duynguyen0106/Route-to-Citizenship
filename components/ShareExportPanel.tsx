"use client";

import { useState } from "react";
import { buildSharePack, sharePackJson } from "@/lib/share-pack";
import { listVaultMeta } from "@/lib/document-vault";
import { LEGAL_NOTICE } from "@/lib/legal";
import { usePlan } from "@/components/PlanProvider";
import type { PlanResult, Profile } from "@/lib/types";

export function ShareExportPanel({ profile, plan }: { profile: Profile; plan: PlanResult }) {
  const { has } = usePlan();
  const [link, setLink] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [label, setLabel] = useState<"adviser" | "family" | "employer">("adviser");

  function pack() {
    return buildSharePack(profile, plan, listVaultMeta());
  }

  function downloadJson() {
    const blob = new Blob([sharePackJson(pack())], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "route-to-citizenship-share.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function printPdf() {
    window.print();
  }

  async function createLink() {
    setNote(null);
    const response = await fetch("/api/share", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pack: pack(), label, days: 7 }),
    });
    const body = (await response.json()) as { path?: string; token?: string; error?: string };
    if (!response.ok || !body.path || !body.token) {
      setNote(body.error ?? "Could not create a share link.");
      return;
    }
    setToken(body.token);
    setLink(`${window.location.origin}${body.path}`);
  }

  async function revoke() {
    if (!token) return;
    await fetch("/api/share", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    setLink(null);
    setToken(null);
    setNote("Link revoked.");
  }

  return (
    <div className="mt-6 space-y-4 print:hidden">
      <p className="text-sm text-ink-muted">
        Export a redacted sketch for an adviser, employer, or family member. Vault files stay on
        this device. Passport numbers are not included. Sign in to create a revocable 7-day link;
        guests can still download JSON or print a PDF. {LEGAL_NOTICE}
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="min-h-11 rounded-full bg-navy px-4 py-2 text-sm text-paper-50" onClick={downloadJson}>
          Download JSON
        </button>
        <button type="button" className="min-h-11 rounded-full border border-navy/20 px-4 py-2 text-sm" onClick={printPdf}>
          Print / save PDF
        </button>
      </div>
      <label className="block text-sm font-medium text-navy">
        Read-only link for
        <select className="field-input max-w-xs" value={label} onChange={(event) => setLabel(event.target.value as typeof label)}>
          <option value="adviser">Regulated adviser</option>
          <option value="family">Family member</option>
          <option value="employer">Employer / HR</option>
        </select>
      </label>
      {has("shareLink") ? (
        <button type="button" className="min-h-11 rounded-full border border-navy/20 px-4 py-2 text-sm" onClick={() => void createLink()}>
          Create 7-day read-only link
        </button>
      ) : (
        <p className="text-sm text-ink-muted">
          Revocable read-only links are a Premium preview feature. JSON and print stay available on
          Pro.
        </p>
      )}
      {link ? (
        <p className="break-all text-sm">
          <a className="text-navy underline" href={link}>
            {link}
          </a>
          <button type="button" className="ml-3 text-clay underline" onClick={() => void revoke()}>
            Revoke
          </button>
        </p>
      ) : null}
      {note ? <p className="text-sm text-ink-muted">{note}</p> : null}
    </div>
  );
}

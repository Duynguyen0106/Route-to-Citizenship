"use client";

import { useState } from "react";
import { LEGAL_NOTICE } from "@/lib/legal";
import type { GuidanceReply } from "@/lib/guidance-bot";

export function GuidanceChat() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<GuidanceReply | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    try {
      const response = await fetch("/api/guidance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const body = (await response.json()) as GuidanceReply & { error?: string };
      if (!response.ok) {
        setReply(null);
        return;
      }
      setReply(body);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <p className="rounded-xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay-600">
        {LEGAL_NOTICE} This assistant answers from a short FAQ aligned with GOV.UK public pages. It
        is not trained on OISC practice notes, your documents, or Home Office files. Messages are
        not stored.
      </p>
      <label className="block text-sm font-medium text-navy">
        Ask about ILR, absences, fees, English, or switching
        <textarea
          className="field-input min-h-24"
          value={message}
          maxLength={500}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>
      <button
        type="button"
        className="min-h-11 rounded-full bg-navy px-4 py-2 text-sm text-paper-50 disabled:opacity-60"
        onClick={() => void send()}
        disabled={busy || message.trim().length < 8}
      >
        {busy ? "Looking up…" : "Ask"}
      </button>
      {reply ? (
        <div className="rounded-xl border border-navy/10 bg-paper-50 px-4 py-3 text-sm" aria-live="polite">
          <p className="text-xs uppercase tracking-wide text-ink-faint">Not legal advice</p>
          <p className="mt-2 text-ink">{reply.answer}</p>
          <ul className="mt-3 space-y-1">
            {reply.officialLinks.map((link) => (
              <li key={link.url}>
                <a className="text-navy underline" href={link.url} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

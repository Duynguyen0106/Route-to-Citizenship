"use client";

import { useState, type FormEvent } from "react";
import type { EnquiryKind } from "@/lib/billing";

export function EnquiryForm({
  kind,
  adviserSlug,
  submitLabel = "Send enquiry",
  placeholder = "What do you need help with? Do not include passport numbers.",
}: {
  kind: EnquiryKind;
  adviserSlug?: string;
  submitLabel?: string;
  placeholder?: string;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNote(null);
    try {
      const response = await fetch("/api/billing/enquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, message, kind, adviserSlug }),
      });
      const body = (await response.json()) as { error?: string; note?: string };
      if (!response.ok) {
        setError(body.error ?? "Could not send that enquiry.");
        return;
      }
      setNote(body.note ?? "Enquiry stored.");
      setMessage("");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mt-4 space-y-3">
      <label className="block text-sm font-medium text-navy">
        Email
        <input
          className="field-input"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="block text-sm font-medium text-navy">
        Note
        <textarea
          className="field-input min-h-24"
          required
          minLength={12}
          maxLength={4000}
          placeholder={placeholder}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-full bg-navy px-4 py-2 text-sm text-paper-50 disabled:opacity-60"
      >
        {pending ? "Sending…" : submitLabel}
      </button>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      {note ? <p className="text-sm text-ink-muted">{note}</p> : null}
    </form>
  );
}

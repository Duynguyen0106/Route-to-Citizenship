"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DATA_MINIMISATION_NOTE } from "@/lib/legal";
import { listRoutes } from "@/lib/routes";

export function ReportForm() {
  const searchParams = useSearchParams();
  const presetRoute = searchParams.get("route") ?? "";
  const [routeKey, setRouteKey] = useState(presetRoute);
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        routeKey: routeKey || null,
        message,
        contactEmail: contactEmail || null,
      }),
    });
    const body = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(body.error || "Could not send the report.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <p className="mt-8 rounded-2xl border border-moss/30 bg-moss/10 px-5 py-4 text-sm text-navy">
        Thank you. We will use this to check the encoded rules. We do not store passport numbers or
        other identity documents with these reports.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <p className="rounded-xl border border-navy/10 bg-paper-50 px-4 py-3 text-sm text-ink-muted">
        {DATA_MINIMISATION_NOTE}
      </p>
      <label className="block text-sm">
        <span className="font-medium text-navy">Which route? (optional)</span>
        <select
          value={routeKey}
          onChange={(event) => setRouteKey(event.target.value)}
          className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2"
        >
          <option value="">General / not sure</option>
          {listRoutes().map((route) => (
            <option key={route.key} value={route.key}>
              {route.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="font-medium text-navy">What is inaccurate?</span>
        <textarea
          required
          minLength={20}
          maxLength={4000}
          rows={6}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2"
          placeholder="Describe the rule, date, fee, or GOV.UK link that looks wrong. Do not include passport numbers."
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-navy">Email if you want a reply (optional)</span>
        <input
          type="email"
          value={contactEmail}
          onChange={(event) => setContactEmail(event.target.value)}
          className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2"
          autoComplete="email"
        />
      </label>
      {error && <p className="text-sm text-clay">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-navy px-5 py-2 text-sm text-paper-50 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send report"}
      </button>
    </form>
  );
}

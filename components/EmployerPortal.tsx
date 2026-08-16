"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EnquiryForm } from "@/components/EnquiryForm";
import {
  EMPLOYER_PRICING_NOTE,
  EMPLOYER_TRIAL_SEATS,
  RIGHT_TO_WORK_LINKS,
  SPONSORED_VISA_OPTIONS,
  bucketWorkers,
  daysToExpiry,
  type WorkerSketch,
} from "@/lib/employers";
import { formatLongDate } from "@/lib/format";
import { LEGAL_NOTICE } from "@/lib/legal";

interface OrgPayload {
  id: string;
  name: string;
  seatLimit: number;
  workers: {
    id: string;
    label: string;
    visaType: string;
    visaExpiresOn: string;
    jobTitle: string | null;
    rtwCheckedOn: string | null;
    hasCos: boolean;
    hasBrpCopy: boolean;
  }[];
}

function toSketch(row: OrgPayload["workers"][number]): WorkerSketch {
  return {
    id: row.id,
    label: row.label,
    visaType: row.visaType,
    visaExpiresOn: row.visaExpiresOn.slice(0, 10),
    jobTitle: row.jobTitle ?? "",
    rtwCheckedOn: row.rtwCheckedOn ? row.rtwCheckedOn.slice(0, 10) : "",
    hasCos: row.hasCos,
    hasBrpCopy: row.hasBrpCopy,
  };
}

export function EmployerPortal() {
  const [org, setOrg] = useState<OrgPayload | null>(null);
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [visaType, setVisaType] = useState("skilled-worker");
  const [visaExpiresOn, setVisaExpiresOn] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const response = await fetch("/api/employers");
    if (response.status === 401) {
      setError("Sign in to open the employer preview.");
      return;
    }
    const body = (await response.json()) as { organisation?: OrgPayload | null };
    setOrg(body.organisation ?? null);
    if (body.organisation) setName(body.organisation.name);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const sketches = useMemo(() => (org ? org.workers.map(toSketch) : []), [org]);
  const buckets = useMemo(() => bucketWorkers(sketches, new Date()), [sketches]);

  async function saveOrg() {
    setError(null);
    const response = await fetch("/api/employers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const body = (await response.json()) as { organisation?: OrgPayload; error?: string };
    if (!response.ok) {
      setError(body.error ?? "Could not save the organisation.");
      return;
    }
    setOrg(body.organisation ?? null);
  }

  async function addWorker() {
    setError(null);
    const response = await fetch("/api/employers/workers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label, visaType, visaExpiresOn, jobTitle }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Could not add that worker.");
      return;
    }
    setLabel("");
    setJobTitle("");
    await refresh();
  }

  async function patchWorker(id: string, patch: Record<string, unknown>) {
    await fetch("/api/employers/workers", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    await refresh();
  }

  async function removeWorker(id: string) {
    await fetch("/api/employers/workers", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await refresh();
  }

  return (
    <div className="space-y-10">
      <p className="rounded-xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay-600">
        {LEGAL_NOTICE} {EMPLOYER_PRICING_NOTE} This portal cannot run a Home Office right-to-work
        check or read a share code. Use GOV.UK. Do not store passport numbers or share codes here.
      </p>

      <section>
        <h2 className="font-serif text-2xl text-navy">Organisation</h2>
        <label className="mt-3 block text-sm font-medium text-navy">
          Organisation name
          <input className="field-input max-w-md" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <button type="button" className="mt-3 min-h-11 rounded-full bg-navy px-4 py-2 text-sm text-paper-50" onClick={() => void saveOrg()}>
          Save organisation
        </button>
        {org ? (
          <p className="mt-2 text-sm text-ink-muted">
            {org.workers.length} / {org.seatLimit || EMPLOYER_TRIAL_SEATS} preview seats used.
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="font-serif text-2xl text-navy">Right to work (official)</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {RIGHT_TO_WORK_LINKS.map((item) => (
            <li key={item.url}>
              <a className="text-navy underline" href={item.url} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-navy">Add a sponsored worker sketch</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-navy">
            Staff label (initials or staff ID — not a passport)
            <input className="field-input" value={label} onChange={(event) => setLabel(event.target.value)} />
          </label>
          <label className="text-sm font-medium text-navy">
            Visa
            <select className="field-input" value={visaType} onChange={(event) => setVisaType(event.target.value)}>
              {SPONSORED_VISA_OPTIONS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-navy">
            Leave expires
            <input className="field-input" type="date" value={visaExpiresOn} onChange={(event) => setVisaExpiresOn(event.target.value)} />
          </label>
          <label className="text-sm font-medium text-navy">
            Job title (optional)
            <input className="field-input" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />
          </label>
        </div>
        <button type="button" className="mt-3 min-h-11 rounded-full border border-navy/20 px-4 py-2 text-sm" onClick={() => void addWorker()}>
          Add worker
        </button>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-navy">Bulk expiry alerts</h2>
        {(["overdue", "d30", "d60", "d90"] as const).map((key) => (
          <div key={key} className="mt-3">
            <h3 className="text-xs uppercase tracking-[0.16em] text-ink-faint">
              {key === "overdue" ? "Already expired" : `Within ${key.slice(1)} days`} ({buckets[key].length})
            </h3>
            {buckets[key].length === 0 ? (
              <p className="mt-1 text-sm text-ink-muted">None.</p>
            ) : (
              <ul className="mt-1 list-disc pl-5 text-sm text-navy">
                {buckets[key].map((worker) => (
                  <li key={worker.id}>
                    {worker.label} · {worker.visaType} · {formatLongDate(worker.visaExpiresOn)} (
                    {daysToExpiry(worker.visaExpiresOn, new Date())} days)
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-serif text-2xl text-navy">Document collection (ticks only)</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Files stay with the worker or your own HR system. This table only records whether a CoS
          and a BRP copy have been seen, and the date you ran a GOV.UK right-to-work check.
        </p>
        <ul className="mt-4 divide-y divide-navy/10 rounded-2xl border border-navy/10 bg-paper-50">
          {sketches.length === 0 ? (
            <li className="px-4 py-4 text-sm text-ink-muted">No workers yet.</li>
          ) : (
            sketches.map((worker) => (
              <li key={worker.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-navy">
                    {worker.label} · {worker.visaType} · expires {formatLongDate(worker.visaExpiresOn)}
                  </p>
                  <button type="button" className="min-h-11 text-clay" onClick={() => void removeWorker(worker.id)}>
                    Remove
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-4">
                  <label className="flex min-h-11 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={worker.hasCos}
                      onChange={(event) => void patchWorker(worker.id, { hasCos: event.target.checked })}
                    />
                    CoS seen
                  </label>
                  <label className="flex min-h-11 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={worker.hasBrpCopy}
                      onChange={(event) => void patchWorker(worker.id, { hasBrpCopy: event.target.checked })}
                    />
                    BRP / eVisa copy seen
                  </label>
                  <label className="text-navy">
                    RTW check date
                    <input
                      className="field-input"
                      type="date"
                      value={worker.rtwCheckedOn}
                      onChange={(event) => void patchWorker(worker.id, { rtwCheckedOn: event.target.value })}
                    />
                  </label>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-navy">Reporting</h2>
        <a className="mt-3 inline-flex min-h-11 items-center rounded-full bg-navy px-4 py-2 text-sm text-paper-50" href="/api/employers/report">
          Download CSV
        </a>
        <p className="mt-2 text-xs text-ink-muted">CSV columns are labels, visa type, dates and ticks — not identity numbers.</p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-navy">Raise the seat limit</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Enquire for more seats. No invoice is raised in this prototype.
        </p>
        <EnquiryForm kind="employer_seats" submitLabel="Enquire about seats" />
        {error ? <p className="mt-3 text-sm text-clay">{error}</p> : null}
        <p className="mt-4 text-sm">
          <Link href="/employers" className="text-navy underline">
            Back to employer overview
          </Link>
        </p>
      </section>
    </div>
  );
}

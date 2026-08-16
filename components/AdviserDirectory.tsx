"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ADVISER_COMMISSION_NOTE,
  ADVISER_DIRECTORY,
  filterAdvisers,
  indicativeCommissionGbp,
  OISC_REGISTER_URL,
  SRA_REGISTER_URL,
} from "@/lib/advisers";
import { EnquiryForm } from "@/components/EnquiryForm";
import { LEGAL_NOTICE } from "@/lib/legal";
import { formatGbp } from "@/lib/format";

export function AdviserDirectory() {
  const [area, setArea] = useState("all");
  const [city, setCity] = useState("");
  const [fee, setFee] = useState(180);
  const listings = useMemo(() => filterAdvisers({ area, city }), [area, city]);

  return (
    <div>
      <p className="rounded-xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay-600">
        {LEGAL_NOTICE} This directory is <strong>illustrative</strong>. It is not the OISC or SRA
        register. Always check{" "}
        <a className="underline" href={OISC_REGISTER_URL} target="_blank" rel="noreferrer">
          Find an immigration adviser
        </a>{" "}
        and the{" "}
        <a className="underline" href={SRA_REGISTER_URL} target="_blank" rel="noreferrer">
          SRA register
        </a>{" "}
        before you instruct anyone. {ADVISER_COMMISSION_NOTE}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium text-navy">
          Area of work
          <select className="field-input" value={area} onChange={(event) => setArea(event.target.value)}>
            <option value="all">Any</option>
            <option value="work">Work / sponsorship</option>
            <option value="family">Family</option>
            <option value="protection">Protection</option>
            <option value="nationality">Nationality</option>
            <option value="student">Study</option>
          </select>
        </label>
        <label className="text-sm font-medium text-navy">
          City
          <input className="field-input" value={city} onChange={(event) => setCity(event.target.value)} />
        </label>
        <label className="text-sm font-medium text-navy">
          Illustrative consultation fee
          <input
            className="field-input"
            type="number"
            min={0}
            value={fee}
            onChange={(event) => setFee(Number(event.target.value) || 0)}
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        Example commission on {formatGbp(fee)}: {formatGbp(indicativeCommissionGbp(fee))} (not charged
        here). {ADVISER_DIRECTORY.length} placeholder listings.
      </p>

      <ul className="mt-6 space-y-4">
        {listings.map((item) => (
          <li key={item.slug} className="rounded-2xl border border-navy/10 bg-paper-50 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-clay">Illustrative · not a live register row</p>
            <h2 className="mt-1 font-serif text-2xl text-navy">{item.name}</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {item.city}, {item.nation} · {item.kind === "oisc" ? "OISC-style practice" : "Solicitor-style practice"} ·{" "}
              {item.levelNote}
            </p>
            <p className="mt-2 text-sm text-navy">{item.areas.join(" · ")}</p>
            <p className="mt-2 text-sm">
              <a className="text-navy underline" href={item.registerUrl} target="_blank" rel="noreferrer">
                Verify on the official register
              </a>
            </p>
            <EnquiryForm
              kind="adviser_intro"
              adviserSlug={item.slug}
              submitLabel="Request a consultation introduction"
            />
          </li>
        ))}
      </ul>
      {listings.length === 0 ? <p className="mt-6 text-sm text-ink-muted">No placeholder listings match.</p> : null}

      <section id="white-label" className="mt-14 rounded-2xl border border-navy/10 bg-white p-6">
        <h2 className="font-serif text-2xl text-navy">White-label for law firms</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Firms can ask about a branded planner for their own clients. This is an enquiry, not a
          licence. The product still must not be presented as Home Office software.
        </p>
        <EnquiryForm kind="white_label" submitLabel="Ask about white-label" />
        <p className="mt-4 text-sm">
          <Link href="/pricing" className="text-navy underline">
            Consumer pricing
          </Link>
        </p>
      </section>
    </div>
  );
}

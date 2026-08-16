"use client";

import { useMemo, useState } from "react";
import { applicationPackText, buildApplicationPack } from "@/lib/govuk-apply";
import type { PlanResult, Profile } from "@/lib/types";

export function ApplicationPackPanel({ profile, plan }: { profile: Profile; plan: PlanResult }) {
  const pack = useMemo(() => buildApplicationPack(profile, plan), [profile, plan]);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(applicationPackText(pack));
    setCopied(true);
  }

  return (
    <div className="mt-6 space-y-6">
      <p className="rounded-xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay-600">
        {pack.cannotPrefill} There is no public UKVI API to pre-fill or submit a visa form.
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        <LinkList title="Apply on GOV.UK" items={pack.apply} />
        <LinkList title="Check status (official)" items={pack.status} />
        <LinkList title="Biometrics partners" items={pack.biometrics} />
      </div>
      <div>
        <h3 className="text-xs uppercase tracking-[0.16em] text-ink-faint">Answers to copy into the official form</h3>
        <dl className="mt-2 divide-y divide-navy/10 rounded-2xl border border-navy/10 bg-paper-50">
          {pack.fields.map((item) => (
            <div key={item.label} className="grid gap-1 px-4 py-2 sm:grid-cols-2">
              <dt className="text-xs text-ink-faint">{item.label}</dt>
              <dd className="text-sm text-navy">{item.value}</dd>
            </div>
          ))}
        </dl>
        <button type="button" className="mt-3 min-h-11 rounded-full bg-navy px-4 py-2 text-sm text-paper-50" onClick={() => void copy()}>
          {copied ? "Copied" : "Copy pack"}
        </button>
      </div>
      <ul className="list-disc pl-5 text-sm text-ink-muted">
        {pack.warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </div>
  );
}

function LinkList({
  title,
  items,
}: {
  title: string;
  items: { label: string; url: string; note: string }[];
}) {
  return (
    <div className="rounded-xl border border-navy/10 bg-paper-50 px-4 py-3">
      <h3 className="text-xs uppercase tracking-[0.16em] text-ink-faint">{title}</h3>
      <ul className="mt-2 space-y-3 text-sm">
        {items.map((item) => (
          <li key={item.url}>
            <a className="text-navy underline" href={item.url} target="_blank" rel="noreferrer">
              {item.label}
            </a>
            <p className="mt-0.5 text-xs text-ink-muted">{item.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

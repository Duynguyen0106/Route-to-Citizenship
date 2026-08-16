"use client";

import Link from "next/link";
import { BILLING_DISCLAIMER, PLAN_CATALOGUE, ONE_OFF_SERVICES } from "@/lib/billing";
import { formatGbp } from "@/lib/format";
import { EnquiryForm } from "@/components/EnquiryForm";
import { usePlan } from "@/components/PlanProvider";
import { LEGAL_NOTICE } from "@/lib/legal";

function priceLabel(monthlyGbp: number | null): string {
  if (monthlyGbp === null) return "Contact us";
  if (monthlyGbp === 0) return "Free";
  return `${formatGbp(monthlyGbp)}/month`;
}

export function PricingTables() {
  const { plan, setPreviewPlan, signedIn } = usePlan();

  return (
    <div>
      <p className="rounded-xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay-600">
        {BILLING_DISCLAIMER} {LEGAL_NOTICE}
      </p>
      <p className="mt-3 text-sm text-ink-muted">
        Current preview: <strong className="text-navy">{PLAN_CATALOGUE[plan].name}</strong>
        {signedIn ? " (saved on your account)" : " (this browser)"}.
      </p>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {Object.values(PLAN_CATALOGUE).map((tier) => (
          <article
            key={tier.id}
            id={tier.id}
            className={`rounded-2xl border p-5 ${
              plan === tier.id ? "border-navy bg-white shadow-card" : "border-navy/10 bg-paper-50"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.16em] text-moss">{tier.name}</p>
            <p className="mt-2 font-serif text-3xl text-navy">{priceLabel(tier.monthlyGbp)}</p>
            {tier.annualGbp ? (
              <p className="text-xs text-ink-muted">{formatGbp(tier.annualGbp)} / year indicative</p>
            ) : null}
            <p className="mt-3 text-sm text-ink-muted">{tier.blurb}</p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-navy">
              {tier.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-5 min-h-11 w-full rounded-full bg-navy px-4 py-2 text-sm text-paper-50"
              onClick={() => void setPreviewPlan(tier.id)}
            >
              {plan === tier.id ? "This is your preview" : `Preview ${tier.name}`}
            </button>
          </article>
        ))}
      </div>

      <section className="mt-14">
        <h2 className="font-serif text-2xl text-navy">One-off services</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Indicative fees for work by a regulated adviser. Enquiries are stored here; nobody is
          instructed until they confirm they are authorised under the Immigration and Asylum Act
          1999. Do not upload passport scans.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {ONE_OFF_SERVICES.map((service) => (
            <article key={service.id} className="rounded-2xl border border-navy/10 bg-paper-50 p-5">
              <h3 className="font-medium text-navy">{service.name}</h3>
              <p className="mt-1 font-serif text-2xl text-navy">{formatGbp(service.indicativeGbp)}</p>
              <p className="mt-2 text-sm text-ink-muted">{service.blurb}</p>
              <EnquiryForm kind={service.id} submitLabel="Request this service" />
            </article>
          ))}
        </div>
      </section>

      <p className="mt-10 text-sm text-ink-muted">
        Looking for a firm to white-label this planner?{" "}
        <Link href="/advisers#white-label" className="text-navy underline">
          Send a white-label enquiry
        </Link>
        . HR teams:{" "}
        <Link href="/employers" className="text-navy underline">
          employer portal
        </Link>
        .
      </p>
    </div>
  );
}

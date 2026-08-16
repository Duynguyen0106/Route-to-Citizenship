import type { Metadata } from "next";
import { PricingTables } from "@/components/PricingTables";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <article className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-clay">Monetisation</p>
      <h1 className="mt-3 font-serif text-4xl text-navy">Plans and one-off services</h1>
      <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink-muted">
        Basic stays free. Pro and Premium are indicative tiers you can preview in this prototype.
        They are not a live subscription and they do not turn this app into immigration advice.
      </p>
      <div className="mt-10">
        <PricingTables />
      </div>
    </article>
  );
}

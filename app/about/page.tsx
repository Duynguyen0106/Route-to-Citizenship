import type { Metadata } from "next";
import Link from "next/link";
import { RULES_REVIEWED_ON } from "@/lib/types";

export const metadata: Metadata = { title: "How it works" };

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">Method</p>
      <h1 className="mt-3 font-serif text-4xl text-navy">How the estimates are made</h1>
      <div className="mt-8 space-y-5 text-[17px] leading-relaxed text-ink">
        <p>
          You choose a current visa and enter dates. The planner adds the usual qualifying period
          for that route (for example 5 years on Skilled Worker, 3 years on Global Talent
          exceptional talent, 5 years on the partner route) to the qualifying-residence start date
          you provide.
        </p>
        <p>
          ILR applications can often be submitted up to 28 days before the qualifying date. British
          citizenship is estimated as 12 months after ILR (or immediately after ILR if you say you
          are married to a British citizen and already meet a 3-year residence period). These are
          common patterns — not a full reading of the Nationality Act or the Immigration Rules.
        </p>
        <p>
          Alternative routes assume a switch on today&apos;s date. Time on some work visas is treated
          as combining toward a 5-year work ILR clock; Global Talent (3-year) and Innovator Founder
          clocks are treated as starting on switch. Visitor leave is treated as not switchable
          in-country.
        </p>
        <p>
          Encoded rules were last reviewed on <strong>{RULES_REVIEWED_ON}</strong>. Official
          explanations live on GOV.UK, including{" "}
          <a className="underline" href="https://www.gov.uk/indefinite-leave-to-remain">
            Indefinite leave to remain
          </a>
          ,{" "}
          <a className="underline" href="https://www.gov.uk/british-citizenship">
            British citizenship
          </a>
          , and each visa page linked from your plan.
        </p>
        <p>
          <Link href="/plan" className="text-navy underline">
            Open the planner
          </Link>
          . Profiles never leave this device.
        </p>
      </div>
    </article>
  );
}

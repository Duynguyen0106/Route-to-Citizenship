import type { Metadata } from "next";
import Link from "next/link";
import { EMPLOYER_PRICING_NOTE, RIGHT_TO_WORK_LINKS } from "@/lib/employers";
import { LEGAL_NOTICE } from "@/lib/legal";

export const metadata: Metadata = { title: "For employers" };

export default function EmployersPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">B2B</p>
      <h1 className="mt-3 font-serif text-4xl text-navy">HR portal for sponsored workers</h1>
      <p className="mt-6 text-[17px] leading-relaxed text-ink-muted">{LEGAL_NOTICE}</p>
      <p className="mt-4 text-[17px] leading-relaxed text-ink">
        A preview dashboard for teams sponsoring Skilled Workers, Global Business Mobility and
        similar routes. {EMPLOYER_PRICING_NOTE}
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-6 text-[17px] leading-relaxed text-ink">
        <li>Bulk visa-expiry lists (90 / 60 / 30 days)</li>
        <li>Right-to-work reminders that send you to GOV.UK — not a live share-code check</li>
        <li>Document collection as ticks (CoS / BRP seen), not a file dump of passports</li>
        <li>CSV reporting of labels, visa types and dates</li>
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/employers/portal" className="inline-flex min-h-11 items-center rounded-full bg-navy px-5 py-2 text-sm text-paper-50">
          Open the HR preview
        </Link>
        <Link href="/login" className="inline-flex min-h-11 items-center rounded-full border border-navy/20 px-5 py-2 text-sm">
          Sign in first
        </Link>
      </div>
      <h2 className="mt-12 font-serif text-2xl text-navy">Official right-to-work tools</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {RIGHT_TO_WORK_LINKS.map((item) => (
          <li key={item.url}>
            <a className="text-navy underline" href={item.url} target="_blank" rel="noreferrer">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}

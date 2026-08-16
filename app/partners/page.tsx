import type { Metadata } from "next";
import { AFFILIATE_CATEGORIES, AFFILIATE_DISCLOSURE, AFFILIATE_LINKS } from "@/lib/affiliates";
import { LEGAL_NOTICE } from "@/lib/legal";

export const metadata: Metadata = { title: "Partners" };

export default function PartnersPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">Affiliates</p>
      <h1 className="mt-3 font-serif text-4xl text-navy">Tests, transfers and other services</h1>
      <p className="mt-6 text-[17px] leading-relaxed text-ink-muted">{LEGAL_NOTICE}</p>
      <p className="mt-4 rounded-xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay-600">
        {AFFILIATE_DISCLOSURE}
      </p>
      {AFFILIATE_CATEGORIES.map((category) => (
        <section key={category.id} className="mt-10">
          <h2 className="font-serif text-2xl text-navy">{category.label}</h2>
          <ul className="mt-4 space-y-3">
            {AFFILIATE_LINKS.filter((item) => item.category === category.id).map((item) => (
              <li key={item.id} className="rounded-xl border border-navy/10 bg-paper-50 px-4 py-3">
                <a className="text-navy underline" href={item.url} target="_blank" rel="noreferrer">
                  {item.name}
                </a>
                <p className="mt-1 text-sm text-ink-muted">{item.note}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}

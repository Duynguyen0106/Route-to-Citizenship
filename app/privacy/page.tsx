import type { Metadata } from "next";
import Link from "next/link";
import { DATA_MINIMISATION_NOTE, LEGAL_NOTICE } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-clay">Legal</p>
      <h1 className="mt-3 font-serif text-4xl text-navy">Privacy and data minimisation</h1>
      <div className="mt-8 space-y-5 text-[17px] leading-relaxed text-ink">
        <p>{LEGAL_NOTICE}</p>
        <p>{DATA_MINIMISATION_NOTE}</p>
        <p>In particular, this planner:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>does not ask for passport numbers, national insurance numbers, or biometric IDs;</li>
          <li>does not ask for Home Office unique application numbers unless you type them into a free-text box yourself — please do not;</li>
          <li>uses nationality only as a coarse English-language exemption check;</li>
          <li>stores guest plans in this browser only;</li>
          <li>
            stores signed-in plans in a local database (email, optional name, visa type, dates,
            absences, reminders) so you can reopen them.
          </li>
        </ul>
        <p>
          Accuracy reports may include an optional contact email. Do not put identity documents in
          those reports.
        </p>
        <p>
          <Link href="/disclaimer" className="text-navy underline">
            Read the full disclaimer
          </Link>
          .
        </p>
      </div>
    </article>
  );
}

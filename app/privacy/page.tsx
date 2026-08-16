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
            absences, reminders) so you can reopen them;
          </li>
          <li>
            keeps optional document copies (passport scans, BRPs, payslips) only in this browser,
            encrypted with a key that never leaves the device. Detected identity numbers are reduced
            to the last four characters. Files are not uploaded to our server, and this is not a
            cloud OCR service;
          </li>
          <li>
            polls GOV.UK’s public Content API for page titles, descriptions and update timestamps
            (not full HTML, and not your plan);
          </li>
          <li>
            may store an opt-in anonymous sketch (visa category, coarse nationality region,
            sketched years to ILR) so averages can be shown once at least five similar sketches
            exist. Name and email are not included.
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

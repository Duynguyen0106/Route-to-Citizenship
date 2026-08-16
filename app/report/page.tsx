import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportForm } from "@/components/ReportForm";
import { DATA_MINIMISATION_NOTE, LEGAL_NOTICE } from "@/lib/legal";

export const metadata: Metadata = { title: "Report inaccurate information" };

export default function ReportPage() {
  return (
    <article className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-clay">Accuracy</p>
      <h1 className="mt-3 font-serif text-4xl text-navy">Report inaccurate information</h1>
      <p className="mt-4 text-[17px] leading-relaxed text-ink">{LEGAL_NOTICE}</p>
      <p className="mt-3 text-sm text-ink-muted">{DATA_MINIMISATION_NOTE}</p>
      <Suspense fallback={<p className="mt-8 text-sm text-ink-muted">Loading the form…</p>}>
        <ReportForm />
      </Suspense>
    </article>
  );
}

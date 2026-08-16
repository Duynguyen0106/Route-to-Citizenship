"use client";

import Link from "next/link";
import { EnquiryForm } from "@/components/EnquiryForm";
import { LEGAL_NOTICE, GOVUK } from "@/lib/legal";

export function ExpertQaPanel() {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-navy/10 bg-paper-50 p-5">
        <h3 className="font-medium text-navy">Human expert Q&amp;A</h3>
        <p className="mt-2 text-sm text-ink-muted">
          {LEGAL_NOTICE} This is an introduction request, not a client-adviser relationship and not
          live chat. We will not send your vault files. Confirm the person is on the{" "}
          <a className="text-navy underline" href={GOVUK.adviser} target="_blank" rel="noreferrer">
            OISC / GOV.UK register
          </a>
          .
        </p>
        <EnquiryForm kind="expert_qa" submitLabel="Request an introduction" />
      </div>
      <div className="rounded-2xl border border-navy/10 bg-paper-50 p-5">
        <h3 className="font-medium text-navy">Priority support</h3>
        <p className="mt-2 text-sm text-ink-muted">
          Product questions about this planner (not case advice). No payment is taken.
        </p>
        <EnquiryForm kind="priority_support" submitLabel="Ask priority support" />
        <p className="mt-4 text-sm">
          <Link href="/advisers" className="text-navy underline">
            Open the adviser directory
          </Link>
        </p>
      </div>
    </div>
  );
}

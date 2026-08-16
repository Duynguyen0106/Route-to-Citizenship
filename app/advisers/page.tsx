import type { Metadata } from "next";
import { AdviserDirectory } from "@/components/AdviserDirectory";

export const metadata: Metadata = { title: "Advisers" };

export default function AdvisersPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">Marketplace</p>
      <h1 className="mt-3 font-serif text-4xl text-navy">Regulated advisers</h1>
      <p className="mt-6 text-[17px] leading-relaxed text-ink-muted">
        Use the official registers to find someone authorised to give immigration advice. The cards
        below are layout examples so you can see how introductions would work.
      </p>
      <div className="mt-10">
        <AdviserDirectory />
      </div>
    </article>
  );
}

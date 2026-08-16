import type { Metadata } from "next";
import { EmployerPortal } from "@/components/EmployerPortal";

export const metadata: Metadata = { title: "Employer portal" };

export default function EmployerPortalPage() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">B2B preview</p>
      <h1 className="mt-3 font-serif text-4xl text-navy">Sponsored worker dashboard</h1>
      <div className="mt-10">
        <EmployerPortal />
      </div>
    </article>
  );
}

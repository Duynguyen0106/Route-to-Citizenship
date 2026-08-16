import type { Metadata } from "next";
import { AccountPanel } from "@/components/AccountPanel";
import { LEGAL_NOTICE } from "@/lib/legal";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <article className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">Account</p>
      <h1 className="mt-3 font-serif text-4xl text-navy">Your data</h1>
      <p className="mt-3 text-ink-muted">{LEGAL_NOTICE}</p>
      <p className="mt-3 text-sm text-ink-muted">
        Download a redacted copy or delete what this planner holds. Vault files stay in this browser
        and are never uploaded. Passport numbers are not collected.
      </p>
      <AccountPanel />
    </article>
  );
}

import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <article className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">Account</p>
      <h1 className="mt-3 font-serif text-4xl text-navy">Create an account</h1>
      <p className="mt-3 text-ink-muted">
        Save your immigration plan across devices. We store email, optional name, visa dates and
        reminders — not passport numbers. Guest plans stay in this browser only.
      </p>
      <AuthForm mode="register" />
    </article>
  );
}

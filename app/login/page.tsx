import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <article className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">Account</p>
      <h1 className="mt-3 font-serif text-4xl text-navy">Sign in</h1>
      <p className="mt-3 text-ink-muted">
        Your profile, visa history, absences and reminders are stored against your account.
      </p>
      <AuthForm mode="login" />
    </article>
  );
}

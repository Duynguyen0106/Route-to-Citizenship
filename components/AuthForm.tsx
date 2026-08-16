"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      let body: { error?: string } = {};
      try {
        body = (await response.json()) as { error?: string };
      } catch {
        body = {};
      }
      if (!response.ok) {
        setError(body.error || t("auth.error"));
        return;
      }
      router.push("/plan");
      router.refresh();
    } catch {
      setError(t("auth.offline"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      {mode === "register" && (
        <label className="block text-sm">
          <span className="font-medium text-navy">{t("auth.name")}</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="field-input"
          />
        </label>
      )}
      <label className="block text-sm">
        <span className="font-medium text-navy">{t("auth.email")}</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="field-input"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-navy">{t("auth.password")}</span>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="field-input"
        />
      </label>
      {error && <p className="text-sm text-clay">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-full bg-navy px-5 py-2 text-sm text-paper-50 disabled:opacity-60"
      >
        {pending ? t("auth.wait") : mode === "login" ? t("auth.signIn") : t("auth.create")}
      </button>
      <p className="text-sm text-ink-muted">
        {mode === "login" ? (
          <>
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="underline">
              {t("auth.registerLink")}
            </Link>
          </>
        ) : (
          <>
            {t("auth.haveAccount")}{" "}
            <Link href="/login" className="underline">
              {t("auth.signInLink")}
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

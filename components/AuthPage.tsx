"use client";

import { AuthForm } from "@/components/AuthForm";
import { useLocale } from "@/components/LocaleProvider";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { t } = useLocale();
  return (
    <article className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">{t("auth.kicker")}</p>
      <h1 className="mt-3 font-serif text-4xl text-navy">
        {mode === "login" ? t("auth.loginTitle") : t("auth.registerTitle")}
      </h1>
      <p className="mt-3 text-ink-muted">
        {mode === "login" ? t("auth.loginLead") : t("auth.registerLead")}
      </p>
      <AuthForm mode={mode} />
    </article>
  );
}

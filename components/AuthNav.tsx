"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

type User = { id: string; email: string; name: string | null };

export function AuthNav() {
  const { t } = useLocale();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (response) => {
        try {
          return (await response.json()) as { user: User | null };
        } catch {
          return { user: null };
        }
      })
      .then((body) => setUser(body.user))
      .catch(() => setUser(null));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.reload();
  }

  if (user === undefined) {
    return <span className="hidden text-sm text-ink-faint sm:inline">…</span>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link href="/account" className="inline-flex min-h-11 items-center text-ink-muted hover:text-navy">
          {t("nav.account")}
        </Link>
        <Link href="/login" className="inline-flex min-h-11 items-center text-ink-muted hover:text-navy">
          {t("nav.signin")}
        </Link>
        <Link href="/register" className="inline-flex min-h-11 items-center rounded-full border border-navy/20 px-3 py-1.5 text-navy">
          {t("nav.register")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href="/account" className="inline-flex min-h-11 items-center text-ink-muted hover:text-navy">
        {t("nav.account")}
      </Link>
      <span className="hidden text-ink-muted sm:inline">{user.name || user.email}</span>
      <button type="button" onClick={logout} className="inline-flex min-h-11 items-center text-ink-muted hover:text-navy">
        {t("nav.signout")}
      </button>
    </div>
  );
}

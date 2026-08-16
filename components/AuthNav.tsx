"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = { id: string; email: string; name: string | null };

export function AuthNav() {
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
        <Link href="/login" className="text-ink-muted hover:text-navy">
          Sign in
        </Link>
        <Link href="/register" className="rounded-full border border-navy/20 px-3 py-1.5 text-navy">
          Create account
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden text-ink-muted sm:inline">{user.name || user.email}</span>
      <button type="button" onClick={logout} className="text-ink-muted hover:text-navy">
        Sign out
      </button>
    </div>
  );
}

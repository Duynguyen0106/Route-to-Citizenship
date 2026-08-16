"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ACCOUNT_DELETE_PHRASE,
  ACCOUNT_EXPORT_SCHEMA,
  GUEST_EXPORT_SCHEMA,
} from "@/lib/account-export";
import { STORAGE_PLAN } from "@/lib/billing";
import { STORAGE_LOCALE } from "@/lib/i18n";
import { clearGuestBrowserData } from "@/lib/guest-browser";
import { loadProfile } from "@/lib/storage";

type AccountPayload = {
  account: { email: string; name: string | null; plan: string; createdAt: string };
  hasPlan: boolean;
  json: string | null;
};

function downloadText(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function AccountPanel() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [account, setAccount] = useState<AccountPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [guestCleared, setGuestCleared] = useState(false);

  useEffect(() => {
    fetch("/api/account")
      .then(async (response) => {
        if (response.status === 401) {
          setSignedIn(false);
          return null;
        }
        const body = (await response.json()) as AccountPayload & { error?: string };
        if (!response.ok) {
          setError(body.error || "Could not load this account.");
          setSignedIn(false);
          return null;
        }
        setSignedIn(true);
        setAccount(body);
        return body;
      })
      .catch(() => {
        setSignedIn(false);
        setError("Could not reach the server.");
      });
  }, []);

  async function downloadAccount() {
    setError(null);
    if (account?.json) {
      downloadText("route-to-citizenship-account.json", account.json);
      return;
    }
    const response = await fetch("/api/account");
    const body = (await response.json()) as AccountPayload & { error?: string };
    if (!response.ok) {
      setError(body.error || "Could not export this account.");
      return;
    }
    if (!body.json) {
      setError("There is no saved plan on this account yet.");
      return;
    }
    downloadText("route-to-citizenship-account.json", body.json);
  }

  function downloadGuest() {
    const profile = loadProfile();
    const pack = {
      schema: GUEST_EXPORT_SCHEMA,
      exportedOn: new Date().toISOString(),
      locale: window.localStorage.getItem(STORAGE_LOCALE),
      previewPlan: window.localStorage.getItem(STORAGE_PLAN),
      profile,
      note: "Vault files stay in this browser and are not included. Passport numbers are not stored.",
    };
    downloadText("route-to-citizenship-guest.json", `${JSON.stringify(pack, null, 2)}\n`);
  }

  async function deleteAccount() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error || "Could not delete this account.");
        return;
      }
      clearGuestBrowserData();
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setPending(false);
    }
  }

  function clearGuest() {
    clearGuestBrowserData();
    setGuestCleared(true);
  }

  if (signedIn === null) {
    return <p className="mt-8 text-sm text-ink-muted">Loading account…</p>;
  }

  if (signedIn && account) {
    return (
      <div className="mt-8 space-y-8">
        <dl className="rounded-2xl border border-navy/10 bg-paper-50 p-5 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-ink-faint">Email</dt>
            <dd className="mt-1 text-navy">{account.account.email}</dd>
          </div>
          <div className="mt-3">
            <dt className="text-xs uppercase tracking-[0.16em] text-ink-faint">Preview plan</dt>
            <dd className="mt-1 text-navy">{account.account.plan}</dd>
          </div>
          <p className="mt-3 text-ink-muted">
            Export is a redacted JSON copy of the saved plan ({ACCOUNT_EXPORT_SCHEMA}). It does not
            include password hashes, vault files, or passport numbers.
          </p>
        </dl>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void downloadAccount()}
            className="inline-flex min-h-11 items-center rounded-full bg-navy px-4 py-2 text-sm text-paper-50"
          >
            Download my data
          </button>
          <Link href="/plan" className="inline-flex min-h-11 items-center rounded-full border border-navy/20 px-4 py-2 text-sm text-navy">
            Open planner
          </Link>
        </div>
        {error ? <p className="text-sm text-clay">{error}</p> : null}
        <form
          className="rounded-2xl border border-clay/30 bg-clay/10 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            void deleteAccount();
          }}
        >
          <h2 className="font-serif text-xl text-navy">Delete this account</h2>
          <p className="mt-2 text-sm text-ink-muted">
            This removes the signed-in profile from the server and signs you out. Type {ACCOUNT_DELETE_PHRASE}{" "}
            to confirm. Vault copies in this browser are also cleared. This cannot be undone.
          </p>
          <label className="mt-4 block text-sm">
            <span className="font-medium text-navy">Confirmation</span>
            <input
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="field-input"
              autoComplete="off"
            />
          </label>
          <button
            type="submit"
            disabled={pending || confirm !== ACCOUNT_DELETE_PHRASE}
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-clay px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {pending ? "Deleting…" : "Delete account"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      <p className="text-ink-muted">
        You are using this planner as a guest. The plan stays in this browser.{" "}
        <Link href="/register" className="text-navy underline">
          Create an account
        </Link>{" "}
        if you want it stored against an email address — still without passport numbers.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={downloadGuest}
          className="inline-flex min-h-11 items-center rounded-full bg-navy px-4 py-2 text-sm text-paper-50"
        >
          Download guest data
        </button>
        <button
          type="button"
          onClick={clearGuest}
          className="inline-flex min-h-11 items-center rounded-full border border-clay/40 px-4 py-2 text-sm text-clay-600"
        >
          Clear this browser
        </button>
      </div>
      {guestCleared ? (
        <p className="text-sm text-navy">
          Guest plan, locale, preview tier and vault copies in this browser have been cleared.
        </p>
      ) : null}
      {error ? <p className="text-sm text-clay">{error}</p> : null}
    </div>
  );
}

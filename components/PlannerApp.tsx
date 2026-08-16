"use client";

import { Dashboard } from "@/components/Dashboard";
import { OnboardingQuestionnaire } from "@/components/OnboardingQuestionnaire";
import { calculatePlan } from "@/lib/calculate";
import { clearProfile, loadProfile, saveProfile } from "@/lib/storage";
import type { Profile } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";

export function PlannerApp() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetch("/api/auth/me").then((response) => response.json());
        if (cancelled) return;
        if (me.user) {
          setSignedIn(true);
          const payload = await fetch("/api/plan").then((response) => response.json());
          if (cancelled) return;
          setProfile(payload.profile ?? null);
        } else {
          setSignedIn(false);
          setProfile(loadProfile());
        }
      } catch {
        setSignedIn(false);
        setProfile(loadProfile());
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const plan = useMemo(() => (profile ? calculatePlan(profile) : null), [profile]);

  function persistLocal(next: Profile) {
    saveProfile(next);
    setProfile(next);
    setEditing(false);
  }

  function persist(next: Profile) {
    setSaveError(null);
    persistLocal(next);
    if (!signedIn) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: next }),
      })
        .then(async (response) => {
          let body: { error?: string; profile?: Profile } = {};
          try {
            body = (await response.json()) as { error?: string; profile?: Profile };
          } catch {
            body = {};
          }
          if (!response.ok || !body.profile) {
            throw new Error(body.error || "Could not save to your account.");
          }
          return body.profile;
        })
        .then((saved) => setProfile(saved))
        .catch((error: Error) => setSaveError(error.message));
    }, 400);
  }

  async function reset() {
    setSaveError(null);
    if (signedIn) {
      try {
        const response = await fetch("/api/plan", { method: "DELETE" });
        let body: { error?: string } = {};
        try {
          body = (await response.json()) as { error?: string };
        } catch {
          body = {};
        }
        if (!response.ok) {
          throw new Error(body.error || "Could not delete the saved plan.");
        }
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : "Could not delete the saved plan.");
        return;
      }
    }
    clearProfile();
    setProfile(null);
    setEditing(false);
  }

  if (!ready) {
    return <div className="mx-auto max-w-6xl px-4 py-20 text-ink-muted sm:px-6">Loading your planner…</div>;
  }

  if (!profile || editing) {
    return (
      <>
        {saveError && (
          <p className="mx-auto max-w-3xl px-4 pt-8 text-sm text-clay sm:px-6">{saveError}</p>
        )}
        {signedIn && (
          <p className="mx-auto max-w-3xl px-4 pt-8 text-sm text-moss sm:px-6">
            Signed in — this plan is saved to your account.
          </p>
        )}
        <OnboardingQuestionnaire
          initial={profile}
          onComplete={persist}
          onCancel={profile ? () => setEditing(false) : undefined}
          onLoadSample={persist}
        />
      </>
    );
  }

  if (!plan) return null;

  return (
    <>
      {saveError && (
        <p className="mx-auto max-w-6xl px-4 pt-6 text-sm text-clay sm:px-6">{saveError}</p>
      )}
      <Dashboard
        profile={profile}
        plan={plan}
        onEdit={() => setEditing(true)}
        onReset={reset}
        onProfileChange={persist}
      />
    </>
  );
}

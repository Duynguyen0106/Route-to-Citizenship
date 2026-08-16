"use client";

import { useMemo, useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { ProfileWizard } from "@/components/ProfileWizard";
import { calculatePlan } from "@/lib/calculate";
import { clearProfile, loadProfile, saveProfile } from "@/lib/storage";
import type { Profile } from "@/lib/types";

export function PlannerApp() {
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile());
  const [editing, setEditing] = useState(false);

  const plan = useMemo(
    () => (profile ? calculatePlan(profile) : null),
    [profile],
  );

  function persist(next: Profile) {
    saveProfile(next);
    setProfile(next);
    setEditing(false);
  }

  function reset() {
    clearProfile();
    setProfile(null);
    setEditing(false);
  }

  if (!profile || editing) {
    return (
      <ProfileWizard
        initial={profile}
        onSave={persist}
        onCancel={profile ? () => setEditing(false) : undefined}
        onLoadSample={(sample) => persist(sample)}
      />
    );
  }

  if (!plan) return null;

  return (
    <Dashboard
      profile={profile}
      plan={plan}
      onEdit={() => setEditing(true)}
      onReset={reset}
      onProfileChange={persist}
    />
  );
}

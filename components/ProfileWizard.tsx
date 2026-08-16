"use client";

import { OnboardingQuestionnaire } from "@/components/OnboardingQuestionnaire";
import type { Profile } from "@/lib/types";

/** @deprecated Use OnboardingQuestionnaire. Kept so existing imports keep working. */
export function ProfileWizard({
  initial,
  onSave,
  onCancel,
  onLoadSample,
}: {
  initial: Profile | null;
  onSave: (profile: Profile) => void;
  onCancel?: () => void;
  onLoadSample: (profile: Profile) => void;
}) {
  return (
    <OnboardingQuestionnaire
      initial={initial}
      onComplete={onSave}
      onCancel={onCancel}
      onLoadSample={onLoadSample}
    />
  );
}

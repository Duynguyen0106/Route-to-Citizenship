import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { calculatePlan } from "@/lib/calculate";
import { buildNextActions, type NextActionSet } from "@/lib/next-actions";
import type { PlanResult, Profile } from "@/lib/types";
import { clearMobileProfile, loadMobileProfile, saveMobileProfile } from "./storage";

type PlanContextValue = {
  ready: boolean;
  profile: Profile | null;
  plan: PlanResult | null;
  next: NextActionSet | null;
  save: (profile: Profile) => Promise<void>;
  patch: (updater: (current: Profile) => Profile) => Promise<void>;
  clear: () => Promise<void>;
};

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMobileProfile().then((loaded) => {
      if (!cancelled) {
        setProfile(loaded);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(async (nextProfile: Profile) => {
    await saveMobileProfile(nextProfile);
    setProfile(nextProfile);
  }, []);

  const patch = useCallback(
    async (updater: (current: Profile) => Profile) => {
      if (!profile) return;
      const nextProfile = updater(profile);
      await saveMobileProfile(nextProfile);
      setProfile(nextProfile);
    },
    [profile],
  );

  const clear = useCallback(async () => {
    await clearMobileProfile();
    setProfile(null);
  }, []);

  const asOf = useMemo(() => new Date(), [profile?.updatedAt]);
  const plan = useMemo(() => (profile ? calculatePlan(profile, asOf) : null), [profile, asOf]);
  const next = useMemo(
    () => (profile && plan ? buildNextActions(profile, plan, asOf) : null),
    [profile, plan, asOf],
  );

  const value = useMemo(
    () => ({ ready, profile, plan, next, save, patch, clear }),
    [ready, profile, plan, next, save, patch, clear],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanContextValue {
  const value = useContext(PlanContext);
  if (!value) throw new Error("usePlan must be used inside PlanProvider");
  return value;
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  FEATURE_MIN_PLAN,
  STORAGE_PLAN,
  hasFeature,
  parsePlan,
  type FeatureId,
  type PlanId,
} from "@/lib/billing";

const PlanContext = createContext<{
  plan: PlanId;
  signedIn: boolean;
  loaded: boolean;
  setPreviewPlan: (plan: PlanId) => Promise<void>;
  has: (feature: FeatureId) => boolean;
  minPlan: (feature: FeatureId) => PlanId;
}>({
  plan: "basic",
  signedIn: false,
  loaded: false,
  setPreviewPlan: async () => undefined,
  has: () => false,
  minPlan: (feature) => FEATURE_MIN_PLAN[feature],
});

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<PlanId>("basic");
  const [signedIn, setSignedIn] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = parsePlan(window.localStorage.getItem(STORAGE_PLAN));
    setPlan(stored);
    fetch("/api/billing")
      .then(async (response) => (await response.json()) as { plan?: string; signedIn?: boolean })
      .then((body) => {
        setSignedIn(Boolean(body.signedIn));
        if (body.signedIn) setPlan(parsePlan(body.plan));
        else setPlan(stored);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  const setPreviewPlan = useCallback(async (next: PlanId) => {
    window.localStorage.setItem(STORAGE_PLAN, next);
    setPlan(next);
    await fetch("/api/billing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan: next }),
    }).catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({
      plan,
      signedIn,
      loaded,
      setPreviewPlan,
      has: (feature: FeatureId) => hasFeature(plan, feature),
      minPlan: (feature: FeatureId) => FEATURE_MIN_PLAN[feature],
    }),
    [plan, signedIn, loaded, setPreviewPlan],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  return useContext(PlanContext);
}

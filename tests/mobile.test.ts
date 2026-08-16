import { parseISO } from "date-fns";
import { describe, expect, it } from "vitest";
import { calculatePlan } from "../lib/calculate";
import { buildNextActions, FOCUS_LIMIT } from "../lib/next-actions";
import { ONBOARDING_STEPS } from "../lib/onboarding";
import { FEATURED_ROUTE_KEYS } from "../lib/routes";
import { SAMPLE_PROFILES } from "../lib/samples";

const AS_OF = parseISO("2026-08-16");

describe("phone app shared engine", () => {
  it("keeps the seven-step questionnaire and five featured routes", () => {
    expect(ONBOARDING_STEPS.map((step) => step.id)).toEqual([
      "nationality",
      "visa",
      "dates",
      "entry",
      "relationship",
      "english",
      "lifeInUk",
    ]);
    expect(FEATURED_ROUTE_KEYS).toHaveLength(5);
    expect(SAMPLE_PROFILES).toHaveLength(5);
  });

  it("builds a Skilled Worker plan the native app can render", () => {
    const profile = SAMPLE_PROFILES[0].profile;
    const plan = calculatePlan(profile, AS_OF);
    const next = buildNextActions(profile, plan, AS_OF);
    expect(plan.route.id).toBe("skilled-worker");
    expect(plan.ilrEligibleOn).toBeTruthy();
    expect(plan.timeline.length).toBeGreaterThan(0);
    expect(plan.checklist.length).toBeGreaterThan(0);
    expect(next.focus.length).toBeGreaterThan(0);
    expect(next.focus.length).toBeLessThanOrEqual(FOCUS_LIMIT);
    expect(plan.fees.totalGbp).toBeGreaterThan(0);
  });
});

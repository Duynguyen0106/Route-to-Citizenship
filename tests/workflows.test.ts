import { parseISO } from "date-fns";
import { describe, expect, it } from "vitest";
import { calculatePlan } from "../lib/calculate";
import { applyRouteSwitch, buildRouteComparison, expiryAfterSwitch } from "../lib/comparison";
import {
  ONBOARDING_STEPS,
  ONBOARDING_VISA_OPTIONS,
  emptyOnboardingValues,
  firstInvalidOnboardingStep,
  onboardingSchema,
  onboardingToProfile,
  resolvePathwayId,
} from "../lib/onboarding";
import { SAMPLE_PROFILES } from "../lib/samples";
import { getPossibleSwitches } from "../lib/simulate";
import { formatLongDate, formatShortDate } from "../lib/format";
import { keyTimelineEvents } from "../lib/timeline";
import { listRoutes } from "../lib/routes";

const AS_OF = parseISO("2026-08-16");

const COMPLETE = {
  nationality: "IN",
  visaGrantDate: "2024-03-01",
  visaExpiryDate: "2029-03-01",
  ukEntryDate: "2024-03-01",
  relationship: "none" as const,
  englishLevel: "B1" as const,
  lifeInUkPassed: "no" as const,
};

describe("full onboarding workflow", () => {
  it("has seven ordered steps", () => {
    expect(ONBOARDING_STEPS).toHaveLength(7);
  });

  it("sends an incomplete form back to visa dates", () => {
    expect(firstInvalidOnboardingStep(emptyOnboardingValues())).toBe(2);
  });

  it("accepts a complete questionnaire for every visa in the dropdown", () => {
    for (const visa of ONBOARDING_VISA_OPTIONS) {
      const values = {
        ...COMPLETE,
        currentVisaId: visa.id,
        relationship: visa.id.startsWith("spouse") ? ("british_citizen" as const) : COMPLETE.relationship,
      };
      const parsed = onboardingSchema.safeParse(values);
      expect(parsed.success, visa.id).toBe(true);
      if (!parsed.success) continue;
      const profile = onboardingToProfile(parsed.data);
      const plan = calculatePlan(profile, AS_OF);
      expect(plan.timeline.length).toBeGreaterThan(1);
      expect(plan.checklist.length).toBeGreaterThan(3);
      expect(plan.reminders).toBeDefined();
      expect(() => formatLongDate(profile.visaExpiresOn)).not.toThrow();
    }
  });
});

describe("five MVP routes end to end", () => {
  it("builds a plan, comparison cards, key timeline markers and switches for every sample", () => {
    expect(SAMPLE_PROFILES).toHaveLength(5);
    for (const sample of SAMPLE_PROFILES) {
      const plan = calculatePlan(sample.profile, AS_OF);
      expect(plan.pathwayId).toBe(sample.profile.pathwayId);
      const keys = keyTimelineEvents(plan.timeline).map((event) => event.kind);
      expect(keys).toContain("now");
      expect(keys).toContain("visa");
      const cards = buildRouteComparison(sample.profile, plan, AS_OF);
      expect(cards).toHaveLength(listRoutes().length);
      expect(cards.filter((card) => card.current)).toHaveLength(1);
      const switches = getPossibleSwitches(sample.profile, AS_OF);
      for (const option of switches) {
        const next = applyRouteSwitch(sample.profile, plan, option.toVisaId);
        expect(next.currentVisaId).toBe(option.toVisaId);
        expect(next.visaExpiresOn >= next.visaGrantedOn).toBe(true);
        expect(() => calculatePlan(next, AS_OF)).not.toThrow();
      }
    }
  });

  it("keeps the long-residence pathway when the current visa is still mixed leave", () => {
    expect(resolvePathwayId("skilled-worker", SAMPLE_PROFILES[4].profile)).toBe("long-residence");
    expect(resolvePathwayId("long-residence")).toBe("long-residence");
    expect(resolvePathwayId("spouse-5")).toBe("family");
    expect(resolvePathwayId("spouse-5", SAMPLE_PROFILES[4].profile)).toBe("family");
  });

  it("models in-country switches from the long-residence visa option", () => {
    const profile = onboardingToProfile({
      ...COMPLETE,
      currentVisaId: "long-residence",
      ukEntryDate: "2016-09-01",
      relationship: "british_citizen",
    });
    const switches = getPossibleSwitches(profile, AS_OF);
    expect(switches.some((item) => item.routeKey === "skilled-worker")).toBe(true);
    expect(switches.some((item) => item.routeKey === "family")).toBe(true);
  });

  it("extends an already-expired visa when switching", () => {
    expect(expiryAfterSwitch("skilled-worker", "2026-08-16", "2026-01-15")).toBe("2031-08-16");
    expect(expiryAfterSwitch("skilled-worker", "2026-08-16", "2029-03-01")).toBe("2029-03-01");
  });

  it("does not throw on missing dates", () => {
    expect(formatLongDate("")).toBe("—");
    expect(formatShortDate("not-a-date")).toBe("—");
  });
});

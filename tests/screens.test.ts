import { parseISO } from "date-fns";
import { describe, expect, it } from "vitest";
import { twelveMonthPeriods } from "../lib/absences";
import { calculatePlan } from "../lib/calculate";
import { buildRouteComparison } from "../lib/comparison";
import {
  ONBOARDING_STEPS,
  onboardingSchema,
  onboardingToProfile,
  profileToOnboarding,
} from "../lib/onboarding";
import { dashboardAlerts } from "../lib/reminders";
import { SAMPLE_PROFILES } from "../lib/samples";
import { timelineScale } from "../lib/timeline";

const AS_OF = parseISO("2026-08-16");

describe("onboarding questionnaire", () => {
  it("has seven steps covering the spec fields", () => {
    expect(ONBOARDING_STEPS.map((step) => step.id)).toEqual([
      "nationality",
      "visa",
      "dates",
      "entry",
      "relationship",
      "english",
      "lifeInUk",
    ]);
  });

  it("rejects an expiry on or before the visa start date", () => {
    const result = onboardingSchema.safeParse({
      nationality: "IN",
      currentVisaId: "skilled-worker",
      visaGrantDate: "2024-03-01",
      visaExpiryDate: "2024-03-01",
      ukEntryDate: "",
      relationship: "none",
      englishLevel: "B1",
      lifeInUkPassed: "no",
    });
    expect(result.success).toBe(false);
  });

  it("maps a family-route questionnaire onto the partner pathway", () => {
    const profile = onboardingToProfile({
      nationality: "PH",
      currentVisaId: "spouse-5",
      visaGrantDate: "2023-06-15",
      visaExpiryDate: "2026-01-15",
      ukEntryDate: "2023-06-15",
      relationship: "british_citizen",
      englishLevel: "A2",
      lifeInUkPassed: "no",
    });
    expect(profile.pathwayId).toBe("family");
    expect(profile.marriedToBritishCitizen).toBe(true);
    expect(profile.englishStatus).toBe("not_met");
    expect(profile.lifeInUkStatus).toBe("not_taken");
    expect(profileToOnboarding(profile).relationship).toBe("british_citizen");
  });

  it("uses first UK entry as the long-residence qualifying start", () => {
    const profile = onboardingToProfile({
      nationality: "NG",
      currentVisaId: "long-residence",
      visaGrantDate: "2024-01-01",
      visaExpiryDate: "2026-01-01",
      ukEntryDate: "2016-09-01",
      relationship: "none",
      englishLevel: "B1",
      lifeInUkPassed: "yes",
    });
    expect(profile.pathwayId).toBe("long-residence");
    expect(profile.qualifyingResidenceStart).toBe("2016-09-01");
    expect(profile.lifeInUkStatus).toBe("passed");
  });
});

describe("dashboard screens", () => {
  it("builds comparison cards with years, requirements, and in-country switch flags", () => {
    const sample = SAMPLE_PROFILES[0].profile;
    const plan = calculatePlan(sample, AS_OF);
    const cards = buildRouteComparison(sample, plan, AS_OF);
    expect(cards).toHaveLength(5);
    const current = cards.find((card) => card.current);
    expect(current?.key).toBe("skilled-worker");
    expect(current?.yearsToILR).toBe(5);
    expect(current?.yearsToCitizenship).toBe(6);
    expect(current?.mainRequirements.some((item) => item.includes("Life in the UK"))).toBe(true);
    expect(cards.find((card) => card.key === "global-talent")?.eligibleToSwitch).toBe(true);
  });

  it("scales the timeline so today sits between residence start and later milestones", () => {
    const sample = SAMPLE_PROFILES[0].profile;
    const plan = calculatePlan(sample, AS_OF);
    const scale = timelineScale(
      plan.timeline,
      sample.ukEntryDate || sample.qualifyingResidenceStart,
      plan.asOf,
    );
    expect(scale.progress).toBeGreaterThan(0);
    expect(scale.progress).toBeLessThan(1);
    expect(plan.timeline.some((event) => event.kind === "now")).toBe(true);
    expect(plan.timeline.some((event) => event.kind === "visa")).toBe(true);
    expect(plan.timeline.some((event) => event.kind === "ilr")).toBe(true);
    expect(plan.timeline.some((event) => event.kind === "citizenship")).toBe(true);
  });

  it("surfaces visa, ILR, citizenship and Life in the UK alerts", () => {
    const plan = calculatePlan(SAMPLE_PROFILES[0].profile, AS_OF);
    const alerts = dashboardAlerts(plan.reminders);
    const kinds = new Set(alerts.map((item) => item.kind));
    expect(kinds.has("visa_expiry")).toBe(true);
    expect(kinds.has("ilr")).toBe(true);
    expect(kinds.has("citizenship")).toBe(true);
    expect(kinds.has("test")).toBe(true);
  });

  it("labels the next-application checklist with the spec documents", () => {
    const plan = calculatePlan(SAMPLE_PROFILES[0].profile, AS_OF);
    const labels = plan.checklist.map((item) => item.label);
    expect(labels).toEqual(expect.arrayContaining([
      "Passport",
      "Biometric residence permit",
      "Proof of English",
      "Life in UK test pass certificate",
      "Proof of residence (council tax, utility bills)",
      "Salary slips / bank statements",
    ]));
  });

  it("warns when a 12-month absence window exceeds 180 days", () => {
    const periods = twelveMonthPeriods(
      [{ id: "1", departedOn: "2025-09-01", returnedOn: "2026-04-01", place: "Family visit" }],
      AS_OF,
      parseISO("2024-03-01"),
    );
    expect(periods.some((period) => period.overLimit)).toBe(true);
    expect(periods[0]?.days).toBeGreaterThan(180);
  });
});

import { parseISO } from "date-fns";
import { describe, expect, it } from "vitest";
import { calculatePlan } from "../lib/calculate";
import { EXTRA_SCENARIO_PROFILES } from "../lib/samples";
import { normalizeProfile } from "../lib/storage";
import { DEFAULT_REMINDER_PREFS, type Profile } from "../lib/types";

const AS_OF = parseISO("2026-08-16");

function profile(overrides: Partial<Profile> = {}): Profile {
  return normalizeProfile({
    id: "test",
    updatedAt: "2026-08-16T00:00:00.000Z",
    currentVisaId: "skilled-worker",
    visaGrantedOn: "2024-03-01",
    visaExpiresOn: "2029-03-01",
    qualifyingResidenceStart: "2024-03-01",
    ukEntryDate: "2024-03-01",
    englishStatus: "b1_or_higher",
    lifeInUkStatus: "passed",
    nationality: "IN",
    reminderPrefs: { ...DEFAULT_REMINDER_PREFS },
    ...overrides,
  });
}

describe("hyper-personalised route engine", () => {
  it("projects Student → Skilled Worker → Global Talent from a switch chain", () => {
    const plan = calculatePlan(
      profile({
        currentVisaId: "student",
        pathwayId: "student-to-skilled",
        visaGrantedOn: "2024-09-01",
        visaExpiresOn: "2027-09-01",
        qualifyingResidenceStart: "2024-09-01",
        ukEntryDate: "2024-09-01",
        plannedSwitches: [
          { toVisaId: "skilled-worker", on: "2027-09-01" },
          { toVisaId: "global-talent-talent", on: "2028-09-01" },
        ],
      }),
      AS_OF,
    );
    expect(plan.switchChain).toHaveLength(2);
    expect(plan.ilrEligibleOn).toBe("2031-09-01");
    expect(plan.timeline.some((event) => event.id === "planned-switch")).toBe(true);
  });

  it("combines Student + Graduate + Skilled Worker time toward 10-year long residence", () => {
    const plan = calculatePlan(
      profile({
        currentVisaId: "skilled-worker",
        pathwayId: "skilled-worker",
        visaGrantedOn: "2024-01-01",
        visaExpiresOn: "2027-01-01",
        qualifyingResidenceStart: "2024-01-01",
        ukEntryDate: "2016-09-01",
        priorStages: [
          { visaId: "student", start: "2016-09-01", end: "2022-09-01" },
          { visaId: "graduate", start: "2022-09-01", end: "2024-01-01" },
        ],
      }),
      AS_OF,
    );
    expect(plan.longResidenceIlrOn).toBe("2026-09-01");
    expect(plan.ilrEligibleOn).toBe("2026-09-01");
  });

  it("uses ILR first on the 3-year spouse citizenship route", () => {
    const plan = calculatePlan(
      profile({
        marriedToBritishCitizen: true,
        hasSettledPartner: true,
      }),
      AS_OF,
    );
    expect(plan.ilrEligibleOn).toBe("2029-03-01");
    expect(plan.citizenshipEligibleOn).toBe("2029-03-01");
    expect(plan.citizenshipPath).toBe("naturalisation_spouse");
  });

  it("registers a UK-born child from the parent’s ILR date", () => {
    const plan = calculatePlan(
      profile({
        currentVisaId: "child-registration",
        pathwayId: "child-registration",
        ageBand: "under_18",
        bornInUk: true,
        hasBritishParent: false,
        mainApplicantIlrOn: "2029-03-01",
      }),
      AS_OF,
    );
    expect(plan.ilrEligibleOn).toBeNull();
    expect(plan.citizenshipPath).toBe("registration_birth");
    expect(plan.citizenshipEligibleOn).toBe("2029-03-01");
    expect(plan.checklist.some((item) => item.id === "registration-form")).toBe(true);
  });

  it("aligns a partner dependant’s ILR with five years and the main applicant", () => {
    const plan = calculatePlan(
      profile({
        currentVisaId: "dependant",
        pathwayId: "dependant",
        visaGrantedOn: "2024-03-01",
        visaExpiresOn: "2027-03-01",
        mainApplicantIlrOn: "2029-03-01",
      }),
      AS_OF,
    );
    expect(plan.ilrEligibleOn).toBe("2029-03-01");
    expect(plan.citizenshipEligibleOn).toBe("2030-03-01");
  });

  it("sketches household ILR when dependantCount is set on a Skilled Worker plan", () => {
    const plan = calculatePlan(profile({ dependantCount: 2 }), AS_OF);
    expect(plan.dependantPlans).toHaveLength(2);
    expect(plan.dependantPlans[0]?.ilrEligibleOn).toBe("2029-03-01");
  });

  it("loads extra scenario samples without throwing", () => {
    for (const sample of EXTRA_SCENARIO_PROFILES) {
      const plan = calculatePlan(sample.profile, AS_OF);
      expect(plan.timeline.length).toBeGreaterThan(1);
    }
  });
});

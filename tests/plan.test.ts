import { addDays, formatISO, parseISO } from "date-fns";
import { describe, expect, it } from "vitest";
import { calculatePlan, ILR_EARLY_APPLY_DAYS } from "../lib/calculate";
import { englishMet, lifeInUkMet } from "../lib/eligibility";
import { getRoute } from "../lib/visas";
import { SAMPLE_PROFILES } from "../lib/samples";
import { normalizeProfile } from "../lib/storage";
import { DEFAULT_REMINDER_PREFS, type Profile } from "../lib/types";
import { remindersToIcs } from "../lib/reminders";

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
    daysAbsentLast12Months: 20,
    exceeded180DaysInAny12Months: false,
    daysAbsentLast5Years: 40,
    daysAbsentLast12MonthsCitizenship: 20,
    englishStatus: "b1_or_higher",
    lifeInUkStatus: "passed",
    nationality: "IN",
    ageBand: "18_to_64",
    marriedToBritishCitizen: false,
    hasSettledPartner: false,
    reminderPrefs: { ...DEFAULT_REMINDER_PREFS },
    checkedDocumentIds: [],
    ...overrides,
  });
}

describe("calculatePlan — Skilled Worker", () => {
  it("estimates ILR five years from qualifying start and citizenship 12 months later", () => {
    const plan = calculatePlan(profile({}), AS_OF);
    expect(plan.ilrEligibleOn).toBe("2029-03-01");
    expect(plan.ilrApplyFrom).toBe(
      formatISO(addDays(parseISO("2029-03-01"), -ILR_EARLY_APPLY_DAYS), {
        representation: "date",
      }),
    );
    expect(plan.citizenshipEligibleOn).toBe("2030-03-01");
    expect(plan.needsVisaExtension).toBe(false);
    expect(plan.hasIlrPath).toBe(true);
  });

  it("flags a visa that expires before the ILR application window", () => {
    const plan = calculatePlan(
      profile({ visaExpiresOn: "2027-03-01" }),
      AS_OF,
    );
    expect(plan.needsVisaExtension).toBe(true);
    expect(plan.extensionNote).toMatch(/extension or a switch/i);
  });
});

describe("calculatePlan — Global Talent 3-year", () => {
  it("uses a 3-year ILR clock", () => {
    const plan = calculatePlan(
      profile({
        currentVisaId: "global-talent-talent",
        qualifyingResidenceStart: "2025-01-10",
        ukEntryDate: "2025-01-10",
        visaGrantedOn: "2025-01-10",
        visaExpiresOn: "2030-01-10",
      }),
      AS_OF,
    );
    expect(plan.ilrEligibleOn).toBe("2028-01-10");
    // 12 months after ILR is 2029-01-10, but standard naturalisation still needs 5 years' residence.
    expect(plan.citizenshipEligibleOn).toBe("2030-01-10");
  });
});

describe("calculatePlan — spouse of British citizen", () => {
  it("does not add a 12-month ILR wait when married to a British citizen", () => {
    const plan = calculatePlan(
      profile({
        currentVisaId: "spouse-5",
        qualifyingResidenceStart: "2023-06-15",
        ukEntryDate: "2023-06-15",
        visaGrantedOn: "2023-06-15",
        visaExpiresOn: "2028-06-15",
        marriedToBritishCitizen: true,
        hasSettledPartner: true,
      }),
      AS_OF,
    );
    expect(plan.ilrEligibleOn).toBe("2028-06-15");
    expect(plan.citizenshipEligibleOn).toBe("2028-06-15");
  });
});

describe("calculatePlan — Graduate visa", () => {
  it("has no ILR date and suggests qualifying switches", () => {
    const plan = calculatePlan(
      profile({
        currentVisaId: "graduate",
        visaGrantedOn: "2025-09-01",
        visaExpiresOn: "2027-09-01",
        qualifyingResidenceStart: "2025-09-01",
      }),
      AS_OF,
    );
    expect(plan.hasIlrPath).toBe(false);
    expect(plan.ilrEligibleOn).toBeNull();
    expect(plan.alternatives.length).toBeGreaterThan(0);
    expect(plan.alternatives.some((alt) => alt.routeId === "skilled-worker")).toBe(true);
  });
});

describe("calculatePlan — already settled", () => {
  it("skips ILR and points at citizenship", () => {
    const plan = calculatePlan(
      profile({
        currentVisaId: "ilr",
        visaGrantedOn: "2025-08-16",
        visaExpiresOn: "2099-01-01",
        qualifyingResidenceStart: "2020-08-16",
        ukEntryDate: "2020-08-16",
      }),
      AS_OF,
    );
    expect(plan.hasIlrPath).toBe(true);
    expect(plan.citizenshipEligibleOn).toBe("2026-08-16");
    expect(plan.needsVisaExtension).toBe(false);
  });
});

describe("alternatives", () => {
  it("suggests Global Talent 3-year as a faster option from Skilled Worker", () => {
    const plan = calculatePlan(profile({}), AS_OF);
    const gt = plan.alternatives.find((alt) => alt.routeId === "global-talent-talent");
    expect(gt).toBeDefined();
    expect(gt?.ilrEligibleOn).toBe("2029-08-16");
    expect(gt?.inCountrySwitch).toBe(true);
  });

  it("does not treat visitor time as an in-country switch onto work routes", () => {
    const plan = calculatePlan(
      profile({
        currentVisaId: "visitor",
        visaGrantedOn: "2026-07-01",
        visaExpiresOn: "2026-12-01",
        qualifyingResidenceStart: "2026-07-01",
      }),
      AS_OF,
    );
    expect(plan.alternatives.every((alt) => alt.inCountrySwitch === false)).toBe(true);
  });
});

describe("eligibility helpers", () => {
  it("treats majority English-speaking nationality as meeting English", () => {
    expect(englishMet(profile({ nationality: "US", englishStatus: "not_met" }))).toBe(true);
    expect(englishMet(profile({ nationality: "IN", englishStatus: "not_met" }))).toBe(false);
  });

  it("exempts over-65s from Life in the UK", () => {
    expect(lifeInUkMet(profile({ ageBand: "65_plus", lifeInUkStatus: "not_taken" }))).toBe(
      true,
    );
  });

  it("flags 180-day absence breaches", () => {
    const plan = calculatePlan(
      profile({ daysAbsentLast12Months: 200, exceeded180DaysInAny12Months: true }),
      AS_OF,
    );
    const absences = plan.eligibility.find((item) => item.id === "absences");
    expect(absences?.status).toBe("not_met");
  });
});

describe("checklist and reminders", () => {
  it("includes COS evidence for Skilled Worker", () => {
    const plan = calculatePlan(profile({}), AS_OF);
    expect(plan.checklist.some((item) => item.id === "cos")).toBe(true);
  });

  it("builds an ICS calendar payload", () => {
    const plan = calculatePlan(profile({}), AS_OF);
    const ics = remindersToIcs(plan.reminders);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("ILR");
  });

  it("sample profiles produce a plan without throwing", () => {
    for (const sample of SAMPLE_PROFILES) {
      const plan = calculatePlan(sample.profile, AS_OF);
      expect(plan.route.id).toBe(sample.profile.currentVisaId);
      expect(plan.timeline.length).toBeGreaterThan(1);
    }
  });
});

describe("route catalogue", () => {
  it("exposes official GOV.UK URLs", () => {
    expect(getRoute("skilled-worker").officialUrl).toContain("gov.uk");
  });
});

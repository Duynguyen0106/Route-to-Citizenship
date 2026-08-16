import { parseISO } from "date-fns";
import { describe, expect, it } from "vitest";
import {
  checkEligibility,
  checkFamilyEligibility,
  checkGlobalTalentEligibility,
  checkLongResidenceEligibility,
  checkSkilledWorkerEligibility,
  checkStudentToGraduateToSkilledEligibility,
} from "../lib/eligibility";
import { ROUTES } from "../lib/routes";
import { normalizeProfile } from "../lib/storage";
import { DEFAULT_REMINDER_PREFS, type Profile } from "../lib/types";
import { toIsoDate } from "../lib/dates";

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

describe("checkEligibility — Skilled Worker", () => {
  it("passes when visa type, absences, English and Life in the UK look met", () => {
    const result = checkSkilledWorkerEligibility(profile(), AS_OF);
    expect(result.eligible).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(toIsoDate(result.estimatedILRDate!)).toBe("2029-03-01");
    expect(toIsoDate(result.estimatedCitizenshipDate!)).toBe("2030-03-01");
    expect(result.requirementsMet).toEqual({
      continuousResidence: true,
      absenceLimit: true,
      english: true,
      lifeInUK: true,
      feesKnown: true,
    });
  });

  it("still uses 12 months after ILR when married to a British citizen", () => {
    const result = checkEligibility(
      profile({ marriedToBritishCitizen: true }),
      ROUTES.skilledWorker,
      AS_OF,
    );
    expect(toIsoDate(result.estimatedCitizenshipDate!)).toBe("2030-03-01");
  });

  it("rejects a visa type that is not Skilled Worker", () => {
    const result = checkSkilledWorkerEligibility(profile({ currentVisaId: "visitor" }), AS_OF);
    expect(result.eligible).toBe(false);
    expect(result.estimatedILRDate).toBeNull();
    expect(result.reasons[0]).toMatch(/not one of the visa types/i);
  });

  it("accepts Skilled Worker as the last visa event", () => {
    const result = checkSkilledWorkerEligibility(
      profile({
        currentVisaId: "visitor",
        priorStages: [{ visaId: "skilled-worker", start: "2024-03-01", end: "2029-03-01" }],
      }),
      AS_OF,
    );
    expect(result.eligible).toBe(true);
    expect(toIsoDate(result.estimatedILRDate!)).toBe("2029-03-01");
  });

  it("fails the absence limit over 180 days", () => {
    const result = checkSkilledWorkerEligibility(
      profile({ daysAbsentLast12Months: 200, exceeded180DaysInAny12Months: true }),
      AS_OF,
    );
    expect(result.eligible).toBe(false);
    expect(result.requirementsMet.absenceLimit).toBe(false);
    expect(result.reasons.some((reason) => /180 days/.test(reason))).toBe(true);
  });

  it("fails English and Life in the UK when they are not met", () => {
    const result = checkSkilledWorkerEligibility(
      profile({ englishStatus: "not_met", lifeInUkStatus: "not_taken", nationality: "IN" }),
      AS_OF,
    );
    expect(result.eligible).toBe(false);
    expect(result.requirementsMet.english).toBe(false);
    expect(result.requirementsMet.lifeInUK).toBe(false);
    expect(result.reasons).toHaveLength(2);
  });

  it("fails continuous residence when leave has a gap over 180 days", () => {
    const result = checkSkilledWorkerEligibility(
      profile({
        priorStages: [{ visaId: "skilled-worker", start: "2020-01-01", end: "2020-06-01" }],
        visaGrantedOn: "2024-03-01",
        qualifyingResidenceStart: "2024-03-01",
      }),
      AS_OF,
    );
    expect(result.requirementsMet.continuousResidence).toBe(false);
    expect(result.eligible).toBe(false);
  });
});

describe("checkEligibility — other routes", () => {
  it("uses 10 years on the family 10-year partner visa", () => {
    const result = checkFamilyEligibility(
      profile({
        pathwayId: "family",
        currentVisaId: "spouse-10",
        qualifyingResidenceStart: "2021-01-01",
        visaGrantedOn: "2021-01-01",
      }),
      AS_OF,
    );
    expect(result.eligible).toBe(true);
    expect(toIsoDate(result.estimatedILRDate!)).toBe("2031-01-01");
  });

  it("does not start an ILR clock on Student leave without a planned switch", () => {
    const result = checkStudentToGraduateToSkilledEligibility(
      profile({
        pathwayId: "student-to-skilled",
        currentVisaId: "student",
        visaGrantedOn: "2024-09-01",
        visaExpiresOn: "2027-09-01",
        qualifyingResidenceStart: "2024-09-01",
      }),
      AS_OF,
    );
    expect(result.eligible).toBe(false);
    expect(result.estimatedILRDate).toBeNull();
    expect(result.reasons[0]).toMatch(/switch to skilled worker/i);
  });

  it("starts the study-path clock from a planned Skilled Worker switch", () => {
    const result = checkStudentToGraduateToSkilledEligibility(
      profile({
        pathwayId: "student-to-skilled",
        currentVisaId: "graduate",
        visaGrantedOn: "2025-09-01",
        plannedSwitchOn: "2026-09-01",
        plannedSwitchTo: "skilled-worker",
        qualifyingResidenceStart: "2022-09-01",
      }),
      AS_OF,
    );
    expect(result.eligible).toBe(true);
    expect(toIsoDate(result.estimatedILRDate!)).toBe("2031-09-01");
    expect(toIsoDate(result.estimatedCitizenshipDate!)).toBe("2032-09-01");
  });

  it("uses 3 years for Global Talent and 5 years for exceptional promise", () => {
    const talent = checkGlobalTalentEligibility(
      profile({
        pathwayId: "global-talent",
        currentVisaId: "global-talent-talent",
        visaGrantedOn: "2024-01-01",
        qualifyingResidenceStart: "2024-01-01",
      }),
      AS_OF,
    );
    const promise = checkGlobalTalentEligibility(
      profile({
        pathwayId: "global-talent",
        currentVisaId: "global-talent-promise",
        visaGrantedOn: "2024-01-01",
        qualifyingResidenceStart: "2024-01-01",
      }),
      AS_OF,
    );
    expect(toIsoDate(talent.estimatedILRDate!)).toBe("2027-01-01");
    expect(toIsoDate(promise.estimatedILRDate!)).toBe("2029-01-01");
  });

  it("uses 10 years from UK entry on long residence", () => {
    const result = checkLongResidenceEligibility(
      profile({
        pathwayId: "long-residence",
        currentVisaId: "student",
        ukEntryDate: "2017-08-16",
        qualifyingResidenceStart: "2017-08-16",
      }),
      AS_OF,
    );
    expect(result.eligible).toBe(true);
    expect(toIsoDate(result.estimatedILRDate!)).toBe("2027-08-16");
  });
});

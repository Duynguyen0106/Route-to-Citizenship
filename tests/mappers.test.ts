import { describe, expect, it } from "vitest";
import {
  dbProfileToPlanner,
  englishStatusToLevel,
  pathwayToRouteKey,
  reminderKindToType,
  relationshipToSettled,
  visaIdToCurrentVisaType,
} from "../lib/db/mappers";
import { normalizeProfile } from "../lib/storage";

describe("Prisma field mapping", () => {
  it("maps planner visa ids onto Profile.currentVisaType", () => {
    expect(visaIdToCurrentVisaType("skilled-worker")).toBe("SKILLED_WORKER");
    expect(visaIdToCurrentVisaType("spouse-5")).toBe("FAMILY");
    expect(visaIdToCurrentVisaType("student")).toBe("STUDENT");
    expect(visaIdToCurrentVisaType("graduate")).toBe("GRADUATE");
    expect(visaIdToCurrentVisaType("global-talent-promise")).toBe("GLOBAL_TALENT");
    expect(visaIdToCurrentVisaType("long-residence")).toBe("OTHER");
  });

  it("uses the specified routeKey pattern", () => {
    expect(pathwayToRouteKey("student-to-skilled")).toBe("student-graduate-skilled-worker");
  });

  it("maps English and relationship columns", () => {
    const profile = normalizeProfile({
      currentVisaId: "spouse-5",
      marriedToBritishCitizen: true,
      hasSettledPartner: true,
      englishStatus: "degree_taught_in_english",
    });
    expect(relationshipToSettled(profile)).toBe("spouse");
    expect(englishStatusToLevel(profile.englishStatus)).toBe("degree");
  });

  it("maps reminder kinds onto Reminder.type", () => {
    expect(reminderKindToType("visa_expiry")).toBe("VISA_EXPIRY");
    expect(reminderKindToType("ilr")).toBe("ILR_ELIGIBILITY");
    expect(reminderKindToType("citizenship")).toBe("CITIZENSHIP_ELIGIBILITY");
    expect(reminderKindToType("test")).toBe("LIFE_IN_UK_TEST");
  });

  it("rehydrates a planner profile from the relational models", () => {
    const profile = dbProfileToPlanner({
      id: "prof_1",
      nationality: "IN",
      currentVisaType: "SKILLED_WORKER",
      visaStartDate: new Date("2024-03-01"),
      visaExpiryDate: new Date("2029-03-01"),
      firstEntryUK: new Date("2024-03-01"),
      relationshipToSettled: "none",
      englishLevel: "B1",
      lifeInUKPassed: false,
      plannerState: {
        currentVisaId: "skilled-worker",
        pathwayId: "skilled-worker",
        qualifyingResidenceStart: "2024-03-01",
        englishStatus: "b1_or_higher",
      },
      updatedAt: new Date("2026-08-16"),
      visaEvents: [
        {
          visaType: "skilled-worker",
          startDate: new Date("2024-03-01"),
          endDate: new Date("2029-03-01"),
          notes: "current",
        },
      ],
      absenceRecords: [
        {
          id: "abs_1",
          startDate: new Date("2025-12-20"),
          endDate: new Date("2026-01-10"),
          reason: "India",
        },
      ],
      routeSelections: [{ routeKey: "skilled-worker-ilr-citizenship", isCurrent: true }],
    });

    expect(profile.currentVisaId).toBe("skilled-worker");
    expect(profile.pathwayId).toBe("skilled-worker");
    expect(profile.absences[0]?.place).toBe("India");
    expect(profile.absences[0]?.departedOn).toBe("2025-12-20");
  });
});

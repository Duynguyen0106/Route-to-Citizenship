import { parseISO } from "date-fns";
import { describe, expect, it } from "vitest";
import { toIsoDate } from "../lib/dates";
import { ROUTES, canSwitchToRouteInCountry, visaIdToCurrentVisaType } from "../lib/routes";
import { getPossibleSwitches } from "../lib/simulate";
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

describe("getPossibleSwitches", () => {
  it("lets a student switch in-country to Skilled Worker and estimates a 5-year ILR clock", () => {
    const options = getPossibleSwitches(
      profile({
        pathwayId: "student-to-skilled",
        currentVisaId: "student",
        visaGrantedOn: "2024-09-01",
        visaExpiresOn: "2027-09-01",
      }),
      AS_OF,
    );
    const skilled = options.find((option) => option.routeKey === "skilled-worker");
    expect(skilled).toBeDefined();
    expect(skilled?.inCountrySwitch).toBe(true);
    expect(toIsoDate(skilled!.estimatedILRDate!)).toBe("2031-08-16");
    expect(toIsoDate(skilled!.estimatedCitizenshipDate!)).toBe("2032-08-16");
    expect(options.map((option) => option.routeKey)).not.toContain("student-graduate-skilled-worker");
  });

  it("lets a Skilled Worker switch in-country to Global Talent on a 3-year clock", () => {
    const options = getPossibleSwitches(profile({ currentVisaId: "skilled-worker" }), AS_OF);
    expect(options.map((option) => option.routeKey)).toEqual(
      expect.arrayContaining(["global-talent", "long-residence"]),
    );
    expect(options.map((option) => option.routeKey)).not.toContain("skilled-worker");
    const talent = options.find((option) => option.routeKey === "global-talent");
    expect(toIsoDate(talent!.estimatedILRDate!)).toBe("2029-08-16");
  });

  it("lets a family visa holder switch in-country to Skilled Worker", () => {
    const options = getPossibleSwitches(
      profile({
        pathwayId: "family",
        currentVisaId: "spouse-5",
        hasSettledPartner: true,
        marriedToBritishCitizen: true,
      }),
      AS_OF,
    );
    const skilled = options.find((option) => option.routeKey === "skilled-worker");
    expect(skilled).toBeDefined();
    expect(skilled?.caveats[0]).toMatch(/family visa holder/i);
    expect(toIsoDate(skilled!.estimatedILRDate!)).toBe("2031-08-16");
  });

  it("only offers the family route when a British or settled partner is recorded", () => {
    const withoutPartner = getPossibleSwitches(profile({ currentVisaId: "skilled-worker" }), AS_OF);
    const withPartner = getPossibleSwitches(
      profile({ currentVisaId: "skilled-worker", hasSettledPartner: true }),
      AS_OF,
    );
    expect(withoutPartner.map((option) => option.routeKey)).not.toContain("family");
    expect(withPartner.map((option) => option.routeKey)).toContain("family");
  });

  it("returns no in-country switches from visitor leave", () => {
    expect(getPossibleSwitches(profile({ currentVisaId: "visitor" }), AS_OF)).toEqual([]);
  });

  it("returns no switches once ILR is already held", () => {
    expect(getPossibleSwitches(profile({ currentVisaId: "ilr" }), AS_OF)).toEqual([]);
  });
});

describe("in-country switch map", () => {
  it("allows Student → Skilled Worker, Skilled Worker → Global Talent, Family → Skilled Worker", () => {
    expect(canSwitchToRouteInCountry("STUDENT", ROUTES.skilledWorker)).toBe(true);
    expect(canSwitchToRouteInCountry("SKILLED_WORKER", ROUTES.globalTalent)).toBe(true);
    expect(canSwitchToRouteInCountry("FAMILY", ROUTES.skilledWorker)).toBe(true);
    expect(canSwitchToRouteInCountry("SKILLED_WORKER", ROUTES.skilledWorker)).toBe(false);
    expect(canSwitchToRouteInCountry("OTHER", ROUTES.skilledWorker)).toBe(false);
    expect(visaIdToCurrentVisaType("student")).toBe("STUDENT");
  });
});

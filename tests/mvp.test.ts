import { parseISO } from "date-fns";
import { describe, expect, it } from "vitest";
import { analyseAbsences, tripDays } from "../lib/absences";
import { calculatePlan } from "../lib/calculate";
import { estimateFees, SKILLED_WORKER } from "../lib/fees";
import { inferPathway } from "../lib/pathways";
import { simulateSwitch } from "../lib/simulate";
import { DEFAULT_REMINDER_PREFS, type AbsenceTrip, type Profile } from "../lib/types";

const AS_OF = parseISO("2026-08-16");

function profile(overrides: Partial<Profile> & Pick<Profile, "currentVisaId">): Profile {
  return {
    id: "test",
    updatedAt: "2026-08-16T00:00:00.000Z",
    pathwayId: inferPathway(overrides.currentVisaId),
    visaGrantedOn: "2024-03-01",
    visaExpiresOn: "2029-03-01",
    qualifyingResidenceStart: "2024-03-01",
    ukEntryDate: "2024-03-01",
    priorStages: [],
    plannedSwitchOn: "",
    plannedSwitchTo: "skilled-worker",
    absences: [],
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
    dependantCount: 0,
    applyFromInsideUk: true,
    sponsorshipOverThreeYears: true,
    reminderPrefs: { ...DEFAULT_REMINDER_PREFS },
    checkedDocumentIds: [],
    ...overrides,
  };
}

describe("absence tracker", () => {
  it("counts whole days away excluding the return date", () => {
    const trip: AbsenceTrip = {
      id: "1",
      departedOn: "2026-01-01",
      returnedOn: "2026-01-11",
      place: "France",
    };
    expect(tripDays(trip)).toBe(10);
  });

  it("flags a rolling 12-month window over 180 days", () => {
    const trips: AbsenceTrip[] = [
      { id: "1", departedOn: "2025-09-01", returnedOn: "2026-04-01", place: "Home country" },
    ];
    const analysis = analyseAbsences(trips, AS_OF, parseISO("2024-03-01"));
    expect(analysis.last12Months).toBeGreaterThan(180);
    expect(analysis.breached180).toBe(true);
  });
});

describe("five MVP pathways", () => {
  it("projects ILR five years after a planned Student → Skilled Worker switch", () => {
    const plan = calculatePlan(
      profile({
        currentVisaId: "graduate",
        pathwayId: "student-to-skilled",
        visaGrantedOn: "2025-09-01",
        visaExpiresOn: "2027-09-01",
        qualifyingResidenceStart: "2025-09-01",
        ukEntryDate: "2022-09-15",
        plannedSwitchOn: "2027-03-01",
        plannedSwitchTo: "skilled-worker",
      }),
      AS_OF,
    );
    expect(plan.hasIlrPath).toBe(true);
    expect(plan.ilrEligibleOn).toBe("2032-03-01");
    expect(plan.timeline.some((event) => event.id === "planned-switch")).toBe(true);
  });

  it("uses a 10-year clock on the long residence pathway even on Skilled Worker leave", () => {
    const plan = calculatePlan(
      profile({
        currentVisaId: "skilled-worker",
        pathwayId: "long-residence",
        qualifyingResidenceStart: "2018-09-01",
        ukEntryDate: "2018-09-01",
        visaGrantedOn: "2024-01-01",
        visaExpiresOn: "2027-01-01",
      }),
      AS_OF,
    );
    expect(plan.ilrEligibleOn).toBe("2028-09-01");
    expect(plan.pathwayId).toBe("long-residence");
  });
});

describe("fee calculator", () => {
  it("multiplies the in-UK Skilled Worker over-3-years fee by dependants", () => {
    const breakdown = estimateFees({
      currentVisaId: "skilled-worker",
      pathwayId: "skilled-worker",
      applyFromInsideUk: true,
      sponsorshipOverThreeYears: true,
      dependantCount: 1,
      includeNextVisa: true,
      includeIhs: false,
      ihsYears: 0,
      includeIlr: false,
      includeCitizenship: false,
      includeTests: false,
      needsEnglishTest: false,
      needsLifeInUk: false,
      globalTalentNeedsEndorsement: false,
    });
    expect(breakdown.totalGbp).toBe(SKILLED_WORKER.insideOver3 * 2);
  });
});

describe("switching simulator", () => {
  it("restarts the Global Talent 3-year clock on the switch date", () => {
    const result = simulateSwitch(
      profile({ currentVisaId: "skilled-worker" }),
      "global-talent-talent",
      AS_OF,
      parseISO("2029-03-01"),
      parseISO("2030-03-01"),
    );
    expect(result.newIlrOn).toBe("2029-08-16");
    expect(result.inCountrySwitch).toBe(true);
    expect(result.nextApplicationFee.totalGbp).toBeGreaterThan(0);
  });
});

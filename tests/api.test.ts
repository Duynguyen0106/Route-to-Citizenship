import { parseISO } from "date-fns";
import { describe, expect, it } from "vitest";
import { GET as getRoutes } from "../app/api/routes/route";
import { POST as postCalculate } from "../app/api/calculate/route";
import { POST as postChecklist } from "../app/api/checklist/route";
import { buildCalculateResponse } from "../lib/api/calculate-response";
import { daysAwayByYear, totalsByYear } from "../lib/absences";
import { normalizeProfile } from "../lib/storage";
import { DEFAULT_REMINDER_PREFS, type Profile } from "../lib/types";

const AS_OF = parseISO("2026-08-16");

function profile(overrides: Partial<Profile> = {}): Profile {
  return normalizeProfile({
    id: "test",
    updatedAt: "2026-08-16T00:00:00.000Z",
    currentVisaId: "skilled-worker",
    visaGrantedOn: "2022-08-15",
    visaExpiresOn: "2027-08-15",
    qualifyingResidenceStart: "2022-08-15",
    ukEntryDate: "2022-08-15",
    daysAbsentLast12Months: 20,
    exceeded180DaysInAny12Months: false,
    daysAbsentLast5Years: 40,
    daysAbsentLast12MonthsCitizenship: 20,
    englishStatus: "b1_or_higher",
    lifeInUkStatus: "not_taken",
    nationality: "IN",
    ageBand: "18_to_64",
    marriedToBritishCitizen: false,
    hasSettledPartner: false,
    reminderPrefs: { ...DEFAULT_REMINDER_PREFS },
    checkedDocumentIds: [],
    ...overrides,
  });
}

describe("POST /api/calculate", () => {
  it("returns current-route eligibility and alternative switches", async () => {
    const result = buildCalculateResponse(profile(), AS_OF);
    expect(result.currentRoute).toMatchObject({
      key: "skilled-worker",
      eligible: true,
      estimatedILRDate: "2027-08-15",
      estimatedCitizenshipDate: "2028-08-15",
      requirements: {
        continuousResidence: true,
        absenceLimit: true,
        english: true,
        lifeInUK: false,
      },
    });
    const talent = result.alternatives.find((item) => item.key === "global-talent");
    expect(talent).toMatchObject({
      key: "global-talent",
      eligible: false,
      reason: "Not currently on Global Talent visa",
      inCountrySwitch: true,
    });
    expect(talent?.estimatedILRDate).toBe("2029-08-16");

    const response = await postCalculate(
      new Request("http://localhost/api/calculate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...profile(), asOf: "2026-08-16" }),
      }),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.currentRoute.key).toBe("skilled-worker");
    expect(json.alternatives.length).toBeGreaterThan(4);
  });
});

describe("GET /api/routes", () => {
  it("lists settlement routes with rule metadata, including the original five", async () => {
    const response = await getRoutes();
    const json = await response.json();
    expect(json.routes.length).toBeGreaterThan(5);
    expect(json.routes.some((route: { key: string }) => route.key === "skilled-worker")).toBe(true);
    expect(json.routes.some((route: { key: string }) => route.key === "innovator-founder")).toBe(true);
    const skilled = json.routes.find((route: { key: string }) => route.key === "skilled-worker");
    expect(skilled).toMatchObject({
      key: "skilled-worker",
      minYearsToILR: 5,
      absenceLimitPerYear: 180,
      englishRequirement: "B1",
      lifeInUKRequired: true,
      lastReviewedOn: "2026-08-01",
    });
    expect(skilled.officialUrls[0].url).toContain("gov.uk");
  });
});

describe("POST /api/checklist", () => {
  it("builds a document list for the current visa", async () => {
    const response = await postChecklist(
      new Request("http://localhost/api/checklist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(profile()),
      }),
    );
    const json = await response.json();
    expect(json.items.some((item: { id: string }) => item.id === "cos")).toBe(true);
    expect(json.groups.length).toBeGreaterThan(0);
  });
});

describe("absence year totals", () => {
  it("splits a trip that crosses 1 January", () => {
    expect(daysAwayByYear(parseISO("2025-12-20"), parseISO("2026-01-10"))).toEqual({
      "2025": 12,
      "2026": 9,
    });
    expect(
      totalsByYear([
        { id: "1", departedOn: "2025-12-20", returnedOn: "2026-01-10", place: "India" },
      ]),
    ).toEqual({ "2025": 12, "2026": 9 });
  });
});

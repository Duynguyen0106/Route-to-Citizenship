import { parseISO } from "date-fns";
import { describe, expect, it } from "vitest";
import { POST as postLogin } from "../app/api/auth/login/route";
import { POST as postRegister } from "../app/api/auth/register/route";
import { POST as postCalculate } from "../app/api/calculate/route";
import { POST as postChecklist } from "../app/api/checklist/route";
import { PUT as putPlan } from "../app/api/plan/route";
import { POST as postReport } from "../app/api/report/route";
import { GET as getRoutes } from "../app/api/routes/route";
import { daysAbsentInRange, tripDays } from "../lib/absences";
import { validateInaccuracyReport } from "../lib/api/report-input";
import { calculatePlan } from "../lib/calculate";
import { applyRouteSwitch, expiryAfterSwitch } from "../lib/comparison";
import { estimateFees, FEES_FROM, ILR_FEE, NATURALISATION_FEE } from "../lib/fees";
import {
  onboardingToProfile,
  profileToOnboarding,
  resolvePathwayId,
} from "../lib/onboarding";
import { SWITCH_TARGETS } from "../lib/pathways";
import { remindersToIcs } from "../lib/reminders";
import { SAMPLE_PROFILES } from "../lib/samples";
import { simulateSwitch } from "../lib/simulate";
import { LEGAL_NOTICE } from "../lib/legal";

const AS_OF = parseISO("2026-08-16");

function jsonRequest(url: string, method: string, body?: unknown, raw?: string) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
}

describe("onboarding round-trips and pathway edits", () => {
  it("round-trips every sample through the questionnaire without dropping pathway data", () => {
    for (const sample of SAMPLE_PROFILES) {
      const values = profileToOnboarding(sample.profile);
      const next = onboardingToProfile(values, sample.profile);
      expect(next.currentVisaId, sample.id).toBe(sample.profile.currentVisaId);
      expect(next.pathwayId, sample.id).toBe(sample.profile.pathwayId);
      expect(next.nationality, sample.id).toBe(sample.profile.nationality);
      expect(next.visaGrantedOn, sample.id).toBe(sample.profile.visaGrantedOn);
      expect(next.visaExpiresOn, sample.id).toBe(sample.profile.visaExpiresOn);
      expect(next.absences, sample.id).toEqual(sample.profile.absences);
      expect(next.englishStatus, sample.id).toBe(sample.profile.englishStatus);
      expect(next.lifeInUkStatus, sample.id).toBe(sample.profile.lifeInUkStatus);
      expect(() => calculatePlan(next, AS_OF)).not.toThrow();
    }
  });

  it("leaves long residence when the current visa itself changes", () => {
    expect(resolvePathwayId("spouse-5", SAMPLE_PROFILES[4].profile)).toBe("family");
    expect(resolvePathwayId("student", SAMPLE_PROFILES[4].profile)).toBe("student-to-skilled");
    expect(resolvePathwayId("skilled-worker", SAMPLE_PROFILES[4].profile)).toBe("long-residence");
  });
});

describe("absence totals stay numeric with incomplete trips", () => {
  it("returns 0 rather than NaN for blank or invalid dates", () => {
    expect(tripDays({ id: "1", departedOn: "", returnedOn: "", place: "" })).toBe(0);
    expect(tripDays({ id: "2", departedOn: "not-a-date", returnedOn: "2026-01-10", place: "" })).toBe(0);
    const days = daysAbsentInRange(
      [
        { id: "1", departedOn: "", returnedOn: "2026-01-10", place: "" },
        { id: "2", departedOn: "2025-12-01", returnedOn: "nope", place: "" },
      ],
      parseISO("2025-01-01"),
      parseISO("2026-08-16"),
    );
    expect(Number.isNaN(days)).toBe(false);
    expect(days).toBe(0);
  });
});

describe("switching simulator across MVP targets", () => {
  it("simulates every SWITCH_TARGET from a Skilled Worker profile", () => {
    const sample = SAMPLE_PROFILES[0].profile;
    const plan = calculatePlan(sample, AS_OF);
    for (const target of SWITCH_TARGETS) {
      if (target.visaId === sample.currentVisaId) continue;
      const simulation = simulateSwitch(
        sample,
        target.visaId,
        AS_OF,
        plan.ilrEligibleOn ? parseISO(plan.ilrEligibleOn) : null,
        plan.citizenshipEligibleOn ? parseISO(plan.citizenshipEligibleOn) : null,
      );
      expect(simulation.toVisaId).toBe(target.visaId);
      expect(simulation.nextApplicationFee.totalGbp).toBeGreaterThan(0);
      expect(() => applyRouteSwitch(sample, plan, target.visaId)).not.toThrow();
    }
  });

  it("does not throw when estimating a grant after an invalid expiry", () => {
    expect(expiryAfterSwitch("skilled-worker", "2026-08-16", "")).toBe("2031-08-16");
    expect(expiryAfterSwitch("skilled-worker", "not-a-date", "")).toBe("");
  });
});

describe("fees, ICS and legal copy", () => {
  it("builds a Skilled Worker fee estimate from the April 2026 table", () => {
    const sample = SAMPLE_PROFILES[0].profile;
    const fees = estimateFees({
      currentVisaId: sample.currentVisaId,
      pathwayId: sample.pathwayId,
      applyFromInsideUk: true,
      sponsorshipOverThreeYears: true,
      dependantCount: 0,
      includeNextVisa: true,
      includeIhs: true,
      ihsYears: 5,
      includeIlr: true,
      includeCitizenship: true,
      includeTests: true,
      needsEnglishTest: false,
      needsLifeInUk: true,
      globalTalentNeedsEndorsement: false,
    });
    expect(fees.totalGbp).toBeGreaterThan(ILR_FEE + NATURALISATION_FEE);
    expect(fees.disclaimer).toContain(FEES_FROM);
  });

  it("emits a downloadable calendar for reminders", () => {
    const ics = remindersToIcs(calculatePlan(SAMPLE_PROFILES[0].profile, AS_OF).reminders);
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("DTSTART;VALUE=DATE:");
  });

  it("keeps the not-advice notice on the product", () => {
    expect(LEGAL_NOTICE).toMatch(/does not constitute legal advice/i);
    expect(validateInaccuracyReport({ message: "short" })).toMatchObject({ error: expect.any(String) });
  });
});

describe("API error handling and happy paths", () => {
  it("rejects non-JSON bodies on login, register, plan and report", async () => {
    const raw = jsonRequest("http://localhost/api/auth/login", "POST", undefined, "{not-json");
    expect((await postLogin(raw)).status).toBe(400);
    expect((await postRegister(jsonRequest("http://localhost/api/auth/register", "POST", undefined, "nope"))).status).toBe(
      400,
    );
    expect((await putPlan(jsonRequest("http://localhost/api/plan", "PUT", undefined, "{"))).status).toBe(400);
    expect((await postReport(jsonRequest("http://localhost/api/report", "POST", undefined, "oops"))).status).toBe(400);
  });

  it("rejects null or array JSON bodies without crashing", async () => {
    expect((await postLogin(jsonRequest("http://localhost/api/auth/login", "POST", null))).status).toBe(400);
    expect((await postLogin(jsonRequest("http://localhost/api/auth/login", "POST", []))).status).toBe(400);
    expect((await postRegister(jsonRequest("http://localhost/api/auth/register", "POST", null))).status).toBe(400);
    expect((await postReport(jsonRequest("http://localhost/api/report", "POST", null))).status).toBe(400);
    expect((await putPlan(jsonRequest("http://localhost/api/plan", "PUT", []))).status).toBe(400);
  });

  it("lists routes and calculates / checklists every sample profile", async () => {
    const listed = await (await getRoutes()).json();
    expect(listed.routes.length).toBeGreaterThan(5);
    expect(listed.routes.some((route: { key: string }) => route.key === "innovator-founder")).toBe(true);

    for (const sample of SAMPLE_PROFILES) {
      const calc = await postCalculate(
        jsonRequest("http://localhost/api/calculate", "POST", { ...sample.profile, asOf: "2026-08-16" }),
      );
      expect(calc.status, sample.id).toBe(200);
      const calcJson = await calc.json();
      expect(calcJson.currentRoute.key, sample.id).toBeTruthy();
      expect(calcJson.alternatives.length, sample.id).toBeGreaterThan(4);

      const checklist = await postChecklist(jsonRequest("http://localhost/api/checklist", "POST", sample.profile));
      expect(checklist.status, sample.id).toBe(200);
      const listJson = await checklist.json();
      expect(listJson.items.length, sample.id).toBeGreaterThan(3);
    }
  });

  it("stores a valid inaccuracy report and rejects passport numbers", async () => {
    const blocked = await postReport(
      jsonRequest("http://localhost/api/report", "POST", {
        message: "The Skilled Worker page lists passport 12345678 incorrectly.",
      }),
    );
    expect(blocked.status).toBe(400);

    const saved = await postReport(
      jsonRequest("http://localhost/api/report", "POST", {
        routeKey: "skilled-worker",
        message: "The 180-day absence rule on the Skilled Worker route page looks out of date.",
      }),
    );
    expect(saved.status).toBe(201);
    const json = await saved.json();
    expect(json.ok).toBe(true);
    expect(json.id).toBeTruthy();
  });

  it("requires email and password on login without crashing", async () => {
    const response = await postLogin(jsonRequest("http://localhost/api/auth/login", "POST", { email: "" }));
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toMatch(/email and password/i);
  });
});

import { parseISO } from "date-fns";
import { describe, expect, it } from "vitest";
import { POST as postGuidance } from "../app/api/guidance/route";
import { POST as postGoals } from "../app/api/goals/route";
import { GET as getRules } from "../app/api/rules/route";
import { aggregateCohort, nationalityGroup } from "../lib/benchmarks";
import { calculatePlan } from "../lib/calculate";
import { interpretGoal } from "../lib/goal-nlp";
import { parseGovukContentItem, snapshotDiffers, type GovukContentSource } from "../lib/govuk-content";
import { answerGuidance, looksLikeIdentityDocument } from "../lib/guidance-bot";
import { recommendRoutes } from "../lib/recommend";
import { assessRouteRisk } from "../lib/risk-score";
import { currentRuleVersion, historicalRuleVersions, noticesForProfile } from "../lib/rule-versions";
import { SAMPLE_PROFILES } from "../lib/samples";
import { pageNoticesFromSnapshots } from "../lib/rule-store";

const AS_OF = parseISO("2026-08-16");
const SOURCE: GovukContentSource = {
  key: "skilled-worker",
  path: "/skilled-worker-visa",
  routeKeys: ["skilled-worker"],
  label: "Skilled Worker visa",
};

describe("GOV.UK content snapshots", () => {
  it("parses a Content API item without keeping HTML", () => {
    const parsed = parseGovukContentItem(
      {
        title: "Skilled Worker visa",
        description: "Work in the UK",
        public_updated_at: "2026-08-01T12:00:00+00:00",
        base_path: "/skilled-worker-visa",
        details: { body: "<p>secret</p>" },
      },
      SOURCE,
    );
    expect(parsed).toMatchObject({
      sourceKey: "skilled-worker",
      title: "Skilled Worker visa",
      govukPath: "/skilled-worker-visa",
    });
    expect(JSON.stringify(parsed)).not.toContain("<p>");
  });

  it("flags a GOV.UK page updated after the encoded review date", () => {
    const notices = pageNoticesFromSnapshots(
      [
        {
          sourceKey: "skilled-worker",
          govukPath: "/skilled-worker-visa",
          title: "Skilled Worker visa",
          description: "Work in the UK",
          publicUpdatedAt: "2026-08-10T00:00:00.000Z",
          contentHash: "abc",
          fetchedAt: "2026-08-16T00:00:00.000Z",
        },
      ],
      "2026-08-01",
    );
    expect(notices[0]?.kind).toBe("page");
    expect(notices[0]?.title).toMatch(/updated/i);
  });

  it("treats identical hashes as unchanged", () => {
    const parsed = parseGovukContentItem({ title: "ILR", description: "Settle", public_updated_at: "2026-01-01" }, SOURCE);
    expect(parsed && snapshotDiffers(parsed, parsed)).toBe(false);
  });
});

describe("versioned encoded rules", () => {
  it("uses the 8 April 2026 fee table as current", () => {
    const current = currentRuleVersion("fees.table", "2026-08-16");
    expect(current?.effectiveFrom).toBe("2026-04-08");
    expect(current?.value).toMatchObject({ ilrGbp: 3226 });
  });

  it("keeps a historic fee row without inventing earlier amounts", () => {
    const historic = historicalRuleVersions("fees.table").find((row) => row.effectiveTo === "2026-04-07");
    expect(historic?.value).toBeNull();
  });

  it("notifies Skilled Worker users about the April 2024 salary change", () => {
    const notices = noticesForProfile(SAMPLE_PROFILES[0].profile, "2026-08-16");
    expect(notices.some((notice) => notice.id === "sw-salary-2024-04-04")).toBe(true);
  });
});

describe("goal matching", () => {
  it("maps bringing parents to the restricted family path", () => {
    const matches = interpretGoal("I want to bring my parents to the UK");
    expect(matches[0]?.intent).toBe("bring_parents");
    expect(matches[0]?.summary).toMatch(/Adult Dependent Relative/i);
  });
});

describe("recommendations and readiness", () => {
  it("ranks the current Skilled Worker path first for the sample profile", () => {
    const plan = calculatePlan(SAMPLE_PROFILES[0].profile, AS_OF);
    const ranked = recommendRoutes(SAMPLE_PROFILES[0].profile, plan, AS_OF);
    expect(ranked[0]?.current).toBe(true);
    expect(ranked[0]?.key).toBe("skilled-worker");
  });

  it("does not invent an approval probability", () => {
    const plan = calculatePlan(SAMPLE_PROFILES[0].profile, AS_OF);
    const risk = assessRouteRisk(SAMPLE_PROFILES[0].profile, plan);
    expect(risk.approvalProbability).toBeNull();
    expect(risk.readiness).toBeGreaterThan(0);
    expect(risk.factors.some((factor) => factor.id === "character" && factor.impact === "unscored")).toBe(true);
  });

  it("raises concern when absences breach 180 days", () => {
    const profile = {
      ...SAMPLE_PROFILES[0].profile,
      absences: [{ id: "long", departedOn: "2025-09-01", returnedOn: "2026-04-01", place: "Family" }],
      exceeded180DaysInAny12Months: true,
    };
    const plan = calculatePlan(profile, AS_OF);
    const risk = assessRouteRisk(profile, plan);
    expect(risk.band).toBe("weaker");
    expect(risk.factors.some((factor) => factor.id === "absence-breach")).toBe(true);
  });
});

describe("guidance assistant", () => {
  it("always includes the not-advice disclaimer", () => {
    const reply = answerGuidance("When can I apply for ILR early?");
    expect(reply.notLegalAdvice).toBe(true);
    expect(reply.disclaimer).toMatch(/does not constitute legal advice/);
    expect(reply.answer).toMatch(/28 days/);
  });

  it("refuses passport numbers", () => {
    expect(looksLikeIdentityDocument("My passport 12345678 expires soon")).toBe(true);
    const reply = answerGuidance("My passport 12345678 expires soon please advise");
    expect(reply.refused).toBe(true);
  });
});

describe("anonymous benchmarks", () => {
  it("hides nationality splits and averages below five sketches", () => {
    expect(aggregateCohort([{ yearsToIlrTenths: 40, reportedWaitWeeks: 8, nationalityGroup: "south-asia" }])).toBeNull();
    const stats = aggregateCohort(
      Array.from({ length: 5 }, () => ({
        yearsToIlrTenths: 50,
        reportedWaitWeeks: 8,
        nationalityGroup: "south-asia" as const,
      })),
    );
    expect(stats?.n).toBe(5);
    expect(stats?.avgYearsToIlr).toBe(5);
    expect(nationalityGroup("IN")).toBe("south-asia");
  });
});

describe("intelligence APIs", () => {
  it("returns encoded rule versions from GET /api/rules", async () => {
    const response = await getRules();
    const json = await response.json();
    expect(json.source).toBe("govuk-content-api");
    expect(json.versions.some((row: { ruleKey: string }) => row.ruleKey === "fees.table")).toBe(true);
  });

  it("answers a guidance question over JSON", async () => {
    const response = await postGuidance(
      new Request("http://localhost/api/guidance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "How many days can I spend outside the UK?" }),
      }),
    );
    const json = await response.json();
    expect(json.notLegalAdvice).toBe(true);
    expect(json.answer).toMatch(/180/);
  });

  it("interprets a goal over JSON", async () => {
    const response = await postGoals(
      new Request("http://localhost/api/goals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "I want to bring my parents to the UK" }),
      }),
    );
    const json = await response.json();
    expect(json.matches[0].intent).toBe("bring_parents");
  });
});

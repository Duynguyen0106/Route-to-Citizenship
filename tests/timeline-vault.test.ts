import { parseISO } from "date-fns";
import { describe, expect, it } from "vitest";
import { calculatePlan } from "../lib/calculate";
import { assessDocumentCompleteness } from "../lib/document-completeness";
import { extractDocumentFields, redactIdentityNumbers } from "../lib/document-extract";
import { extraAr, extraEn, extraPa, extraPl, extraRo, extraUr, extraVi } from "../lib/i18n-copy";
import { LOCALES, LOCALE_META, extraCopyKeys, interpolate, translate } from "../lib/i18n";
import { typicalProcessingWeeks } from "../lib/processing";
import { buildResidenceCalendar } from "../lib/residence-calendar";
import { SAMPLE_PROFILES } from "../lib/samples";
import { simulateWhatIfAbsence } from "../lib/what-if";

const AS_OF = parseISO("2026-08-16");

describe("application windows and processing times", () => {
  it("quotes an in-UK Skilled Worker wait of about 8 weeks", () => {
    expect(typicalProcessingWeeks("skilled-worker", true)).toBe(8);
  });

  it("opens the ILR window 28 days before the qualifying date", () => {
    const plan = calculatePlan(SAMPLE_PROFILES[0].profile, AS_OF);
    expect(plan.ilrEligibleOn).toBe("2029-03-01");
    expect(plan.ilrApplyFrom).toBe("2029-02-01");
    const window = plan.applicationWindows.find((item) => item.kind === "ilr");
    expect(window?.opensOn).toBe("2029-02-01");
    expect(window?.detail).toMatch(/28 days/);
    expect(plan.processingEstimates.some((item) => item.id === "ilr-wait" && item.typicalWeeks === 26)).toBe(
      true,
    );
    expect(plan.timeline.some((event) => event.kind === "window")).toBe(true);
    expect(plan.timeline.some((event) => event.kind === "processing")).toBe(true);
    expect(plan.timeline.some((event) => event.kind === "ilr")).toBe(true);
    expect(plan.timeline.some((event) => event.kind === "citizenship")).toBe(true);
  });
});

describe("what-if absences", () => {
  it("adds a 90-day trip to last-12-month absences", () => {
    const result = simulateWhatIfAbsence(
      SAMPLE_PROFILES[0].profile,
      { departedOn: "2026-08-16", days: 90 },
      AS_OF,
    );
    expect(result.last12Delta).toBeGreaterThanOrEqual(90);
    expect(result.breachedAfter).toBe(false);
  });

  it("flags a 200-day trip as a 180-day breach", () => {
    const result = simulateWhatIfAbsence(
      SAMPLE_PROFILES[0].profile,
      { departedOn: "2026-08-16", days: 200 },
      AS_OF,
    );
    expect(result.breachedAfter).toBe(true);
    expect(result.flags.some((flag) => /180/.test(flag))).toBe(true);
  });
});

describe("residence calendar", () => {
  it("marks days inside a logged trip as away", () => {
    const months = buildResidenceCalendar(
      [{ id: "t1", departedOn: "2025-12-20", returnedOn: "2026-01-10", place: "India" }],
      parseISO("2026-01-05"),
      3,
    );
    const days = months.flatMap((month) => month.days);
    const christmas = days.find((day) => day.date === "2025-12-25" && day.inMonth);
    expect(christmas?.away).toBe(true);
    expect(christmas?.tone).toBe("away");
  });
});

describe("document extraction and completeness", () => {
  it("redacts a passport number to the last four characters", () => {
    const raw = "United Kingdom passport 12345678 expires 1 March 2029";
    const extracted = extractDocumentFields(raw);
    expect(extracted.expiresOn).toBe("2029-03-01");
    expect(extracted.last4).toBe("5678");
    expect(extracted.kind).toBe("passport");
    const redacted = redactIdentityNumbers(raw);
    expect(redacted.text).not.toContain("12345678");
    expect(redacted.text).toContain("••••5678");
  });

  it("flags passport and eVisa as missing when the vault is empty", () => {
    const plan = calculatePlan(SAMPLE_PROFILES[0].profile, AS_OF);
    const rows = assessDocumentCompleteness(plan.checklist, [], plan.asOf);
    expect(rows.find((row) => row.checklistId === "passport")?.status).toBe("missing");
    expect(rows.find((row) => row.checklistId === "evisa")?.status).toBe("missing");
  });
});

describe("i18n", () => {
  it("translates the planner nav label into Polish", () => {
    expect(translate("pl", "nav.planner")).toBe("Planer");
  });

  it("adds Vietnamese as a left-to-right UI language", () => {
    expect(LOCALES).toContain("vi");
    expect(LOCALE_META.vi.dir).toBe("ltr");
    expect(LOCALE_META.vi.native).toBe("Tiếng Việt");
    expect(translate("vi", "nav.planner")).toBe("Lộ trình");
    expect(translate("vi", "nav.next")).toBe("90 ngày tới");
    expect(translate("vi", "lang.label")).toBe("Ngôn ngữ");
  });

  it("keeps legal copy in English when the UI is Vietnamese", () => {
    expect(translate("vi", "brand")).toBe("Route to Citizenship");
  });

  it("interpolates placeholders", () => {
    expect(interpolate("Apply from {date}", { date: "1 March 2029" })).toBe("Apply from 1 March 2029");
    expect(translate("vi", "dash.applyFrom", { date: "1 tháng 3 2029" })).toContain("1 tháng 3 2029");
  });

  it("translates homepage and onboarding body copy in every UI language", () => {
    const keys = extraCopyKeys();
    const extras = { vi: extraVi, pl: extraPl, ro: extraRo, pa: extraPa, ur: extraUr, ar: extraAr };
    expect(keys).toContain("home.hero");
    expect(keys).toContain("onboard.intro");
    for (const [locale, dict] of Object.entries(extras)) {
      expect(Object.keys(dict).sort()).toEqual(Object.keys(extraEn).sort());
      expect(dict["home.hero"]).not.toBe(extraEn["home.hero"]);
      expect(dict["onboard.intro"]).not.toBe(extraEn["onboard.intro"]);
      expect(translate(locale as (typeof LOCALES)[number], "home.hero")).not.toMatch(/^home\./);
    }
  });

  it("keeps Vietnamese homepage and onboarding strings in Vietnamese", () => {
    expect(translate("vi", "home.hero")).toMatch(/visa/i);
    expect(translate("vi", "home.hero")).toMatch(/quốc tịch/i);
    expect(translate("vi", "onboard.intro")).toMatch(/hộ chiếu/i);
    expect(translate("vi", "onboard.nationality")).toBe("Quốc tịch");
    expect(translate("vi", "next90.horizon.now")).toBe("Làm ngay");
  });

  it("marks Arabic and Urdu as right-to-left", () => {
    expect(LOCALE_META.ar.dir).toBe("rtl");
    expect(LOCALE_META.ur.dir).toBe("rtl");
  });
});

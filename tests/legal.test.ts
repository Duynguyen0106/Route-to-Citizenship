import { describe, expect, it } from "vitest";
import { validateInaccuracyReport } from "../lib/api/report-input";
import { LEGAL_NOTICE } from "../lib/legal";

describe("legal copy", () => {
  it("states that the app is not legal advice and points to GOV.UK", () => {
    expect(LEGAL_NOTICE).toContain("does not constitute legal advice");
    expect(LEGAL_NOTICE).toContain("GOV.UK");
    expect(LEGAL_NOTICE).toContain("regulated immigration adviser");
  });
});

describe("inaccuracy reports", () => {
  it("rejects short messages and passport numbers", () => {
    expect(validateInaccuracyReport({ message: "too short" })).toMatchObject({ error: expect.any(String) });
    expect(validateInaccuracyReport(null)).toMatchObject({ error: expect.any(String) });
    expect(
      validateInaccuracyReport({
        message: "The Skilled Worker page lists passport 12345678 incorrectly.",
      }),
    ).toMatchObject({ error: expect.stringMatching(/passport/i) });
  });

  it("accepts a rule description without identity documents", () => {
    const result = validateInaccuracyReport({
      routeKey: "skilled-worker",
      message: "The 180-day absence rule on the Skilled Worker route page looks out of date.",
    });
    expect(result).toMatchObject({
      routeKey: "skilled-worker",
      contactEmail: null,
    });
  });
});

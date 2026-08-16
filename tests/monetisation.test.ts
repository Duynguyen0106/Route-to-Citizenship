import { describe, expect, it } from "vitest";
import { parseISO } from "date-fns";
import { POST as postEnquiry } from "@/app/api/billing/enquiry/route";
import { POST as postBilling } from "@/app/api/billing/route";
import { GET as getEmployers } from "@/app/api/employers/route";
import { POST as postWorkers } from "@/app/api/employers/workers/route";
import { ADVISER_DIRECTORY, filterAdvisers, indicativeCommissionGbp } from "@/lib/advisers";
import { AFFILIATE_DISCLOSURE, AFFILIATE_LINKS } from "@/lib/affiliates";
import { forecastAbsenceRisk } from "@/lib/absence-forecast";
import { validateEnquiry } from "@/lib/api/enquiry-input";
import {
  BILLING_LIVE,
  hasFeature,
  parsePlan,
  vaultAllowsAnother,
} from "@/lib/billing";
import { bucketWorkers, workersToCsv, type WorkerSketch } from "@/lib/employers";
import { GOVUK } from "@/lib/legal";

describe("subscription entitlements", () => {
  it("keeps Basic on route mapping and reminders only", () => {
    expect(hasFeature("basic", "timeline")).toBe(true);
    expect(hasFeature("basic", "reminders")).toBe(true);
    expect(hasFeature("basic", "vault")).toBe(false);
    expect(hasFeature("basic", "chat")).toBe(false);
    expect(hasFeature("basic", "risk")).toBe(false);
  });

  it("gives Pro the vault, absences and FAQ, not risk scoring", () => {
    expect(hasFeature("pro", "vault")).toBe(true);
    expect(hasFeature("pro", "absences")).toBe(true);
    expect(hasFeature("pro", "chat")).toBe(true);
    expect(hasFeature("pro", "risk")).toBe(false);
    expect(hasFeature("pro", "shareLink")).toBe(false);
  });

  it("gives Premium risk scoring, share links and a higher vault cap", () => {
    expect(hasFeature("premium", "risk")).toBe(true);
    expect(hasFeature("premium", "shareLink")).toBe(true);
    expect(hasFeature("premium", "unlimitedVault")).toBe(true);
    expect(vaultAllowsAnother("pro", 5, 0, 100).ok).toBe(false);
    expect(vaultAllowsAnother("premium", 5, 0, 100).ok).toBe(true);
  });

  it("does not treat unknown plan ids as paid", () => {
    expect(parsePlan("enterprise")).toBe("basic");
    expect(BILLING_LIVE).toBe(false);
  });
});

describe("absence forecast", () => {
  it("flags a trip load heading toward 180 days", () => {
    const asOf = parseISO("2026-08-16");
    const start = parseISO("2024-06-01");
    const forecast = forecastAbsenceRisk(
      [{ id: "1", departedOn: "2025-09-01", returnedOn: "2026-03-01", place: "Family" }],
      asOf,
      start,
    );
    expect(forecast.last12Months).toBeGreaterThan(150);
    expect(forecast.flags.some((flag) => /180/.test(flag))).toBe(true);
  });
});

describe("adviser marketplace", () => {
  it("marks every directory row as illustrative and points at official registers", () => {
    expect(ADVISER_DIRECTORY.length).toBeGreaterThan(0);
    expect(ADVISER_DIRECTORY.every((item) => item.illustrative)).toBe(true);
    expect(filterAdvisers({ area: "work" }).every((item) => item.areas.includes("work"))).toBe(true);
    expect(ADVISER_DIRECTORY.some((item) => item.registerUrl === GOVUK.adviser)).toBe(true);
    expect(indicativeCommissionGbp(200)).toBe(30);
  });
});

describe("affiliates", () => {
  it("discloses that commissions are not live", () => {
    expect(AFFILIATE_DISCLOSURE).toMatch(/does not receive a live commission/i);
    expect(AFFILIATE_LINKS.some((item) => item.category === "money")).toBe(true);
    expect(AFFILIATE_LINKS.some((item) => item.url.includes("gov.uk"))).toBe(true);
  });
});

describe("employer reporting", () => {
  it("exports labels and dates without passport columns", () => {
    const workers: WorkerSketch[] = [
      {
        id: "w1",
        label: "AB",
        visaType: "skilled-worker",
        visaExpiresOn: "2026-09-01",
        jobTitle: "Nurse",
        rtwCheckedOn: "2026-08-01",
        hasCos: true,
        hasBrpCopy: false,
      },
    ];
    const csv = workersToCsv(workers, parseISO("2026-08-16"));
    expect(csv).toContain("skilled-worker");
    expect(csv.toLowerCase()).not.toContain("passport");
    expect(bucketWorkers(workers, parseISO("2026-08-16")).d30).toHaveLength(1);
  });
});

describe("enquiries", () => {
  it("rejects passport-like notes", () => {
    expect(
      validateEnquiry({
        email: "a@b.com",
        kind: "oneoff_review",
        message: "Please review passport 123456789 for me",
      }),
    ).toMatchObject({ error: expect.stringMatching(/passport/i) });
  });

  it("accepts a clean one-off request", () => {
    const result = validateEnquiry({
      email: "a@b.com",
      kind: "oneoff_audit",
      message: "Please audit my Skilled Worker dates and absence log.",
    });
    expect(result).toMatchObject({ kind: "oneoff_audit", email: "a@b.com" });
  });

  it("POST /api/billing/enquiry stores nothing when the body is invalid", async () => {
    const res = await postEnquiry(
      new Request("http://localhost/api/billing/enquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "nope" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("POST /api/billing without a session is 401", async () => {
    const res = await postBilling(
      new Request("http://localhost/api/billing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("employer APIs require a session", async () => {
    expect((await getEmployers()).status).toBe(401);
    expect(
      (
        await postWorkers(
          new Request("http://localhost/api/employers/workers", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ label: "AB", visaType: "skilled-worker", visaExpiresOn: "2027-01-01" }),
          }),
        )
      ).status,
    ).toBe(401);
  });
});

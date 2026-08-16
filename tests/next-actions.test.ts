import { parseISO } from "date-fns";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as getAccount, DELETE as deleteAccount } from "../app/api/account/route";
import { GET as getUrlHealth } from "../app/api/health/urls/route";
import {
  ACCOUNT_EXPORT_SCHEMA,
  accountDeleteError,
  accountExportJson,
  buildAccountExport,
} from "../lib/account-export";
import * as auth from "../lib/auth";
import { calculatePlan } from "../lib/calculate";
import { GOVUK } from "../lib/legal";
import { buildNextActions } from "../lib/next-actions";
import { assertHttpsOfficialUrl, listOfficialUrls } from "../lib/official-urls";
import { currentRuleVersion } from "../lib/rule-versions";
import { SAMPLE_PROFILES } from "../lib/samples";
import { normalizeProfile } from "../lib/storage";
import { probeOfficialUrl } from "../lib/url-health";

const AS_OF = parseISO("2026-08-16");

describe("next 90 days", () => {
  it("puts salary/CoS and Life in the UK on a Skilled Worker sketch", () => {
    const profile = SAMPLE_PROFILES[0].profile;
    const plan = calculatePlan(profile, AS_OF);
    const next = buildNextActions(profile, plan, AS_OF);
    const ids = next.focus.map((item) => item.id);
    expect(ids).toContain("salary-cos");
    expect(ids).toContain("life-in-uk");
    expect(next.needsAdviser).toBe(false);
    expect(next.focus.find((item) => item.id === "life-in-uk")?.fact?.ruleKey).toBe("lifeInUk.ilr");
    expect(next.focus.find((item) => item.id === "salary-cos")?.officialUrl).toBe(GOVUK.skilledWorker);
  });

  it("sends visitor leave and 180-day absence risk to a regulated adviser", () => {
    const visitor = normalizeProfile({
      id: "visitor-test",
      updatedAt: "2026-08-16T00:00:00.000Z",
      currentVisaId: "visitor",
      visaGrantedOn: "2026-06-01",
      visaExpiresOn: "2026-11-01",
      qualifyingResidenceStart: "2026-06-01",
      ukEntryDate: "2026-06-01",
    });
    const visitorPlan = calculatePlan(visitor, AS_OF);
    const visitorNext = buildNextActions(visitor, visitorPlan, AS_OF);
    expect(visitorNext.needsAdviser).toBe(true);
    const adviser = visitorNext.focus.find((item) => item.id === "adviser");
    expect(adviser?.officialUrl).toBe(GOVUK.adviser);
    expect(adviser?.href).toBe("/advisers");

    const sw = {
      ...SAMPLE_PROFILES[0].profile,
      absences: [{ id: "long", departedOn: "2025-09-01", returnedOn: "2026-04-01", place: "Family visit" }],
    };
    const absencePlan = calculatePlan(sw, AS_OF);
    expect(absencePlan.absences.breached180).toBe(true);
    const absenceNext = buildNextActions(sw, absencePlan, AS_OF);
    expect(absenceNext.needsAdviser).toBe(true);
    expect(absenceNext.focus.some((item) => item.id === "adviser" && item.officialUrl === GOVUK.adviser)).toBe(
      true,
    );
  });
});

describe("encoded Life in the UK fact", () => {
  it("has a current ILR version", () => {
    const row = currentRuleVersion("lifeInUk.ilr");
    expect(row?.effectiveFrom).toBe("2013-10-28");
    expect(row?.sourceUrl).toBe(GOVUK.lifeInUk);
    expect(row?.effectiveTo).toBeNull();
  });
});

describe("official URLs", () => {
  it("lists only https addresses", () => {
    const urls = listOfficialUrls();
    expect(urls.length).toBeGreaterThan(10);
    expect(urls.every((item) => assertHttpsOfficialUrl(item.url))).toBe(true);
    expect(urls.some((item) => item.url === GOVUK.adviser)).toBe(true);
  });

  it("probes with HEAD then GET when mocked", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ status: 405 })
      .mockResolvedValueOnce({ status: 200 });
    const result = await probeOfficialUrl("https://www.gov.uk/indefinite-leave-to-remain", fetcher);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ method: "HEAD" });
    expect(fetcher.mock.calls[1]?.[1]).toMatchObject({ method: "GET" });
  });

  it("rejects non-https URLs without fetching", async () => {
    const fetcher = vi.fn();
    const result = await probeOfficialUrl("http://www.gov.uk/indefinite-leave-to-remain", fetcher);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/https/i);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("account export and delete", () => {
  it("wraps a redacted share pack and requires DELETE to confirm", () => {
    const profile = SAMPLE_PROFILES[0].profile;
    const pack = buildAccountExport({
      email: "user@example.com",
      name: "Test",
      plan: "basic",
      profile,
      planResult: calculatePlan(profile, AS_OF),
    });
    expect(pack.schema).toBe(ACCOUNT_EXPORT_SCHEMA);
    const json = accountExportJson(pack);
    expect(json).toContain("user@example.com");
    expect(json).not.toMatch(/passwordHash/i);
    expect(json).not.toMatch(/passport\s+\d{8,}/i);
    expect(accountDeleteError({ confirm: "DELETE" })).toBeNull();
    expect(accountDeleteError({ confirm: "delete" })).toMatch(/DELETE/);
    expect(accountDeleteError(null)).toMatch(/DELETE/);
  });

  it("returns 401 for GET /api/account without a session", async () => {
    const response = await getAccount();
    expect(response.status).toBe(401);
  });

  it("returns 400 when DELETE /api/account is not confirmed", async () => {
    vi.spyOn(auth, "getSessionUser").mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      name: null,
    });
    const response = await deleteAccount(
      new Request("http://localhost/api/account", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: "nope" }),
      }),
    );
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toMatch(/DELETE/);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/health/urls", () => {
  it("checks https without live probes by default", async () => {
    const response = await getUrlHealth(new Request("http://localhost/api/health/urls"));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.live).toBe(false);
    expect(json.summary.failed).toBe(0);
    expect(json.results.length).toBeGreaterThan(10);
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { parseISO } from "date-fns";
import { POST as postNotify, GET as getNotify } from "@/app/api/notify/route";
import { POST as postShare } from "@/app/api/share/route";
import { eventsToTrips, isRoughlyInUnitedKingdom, parseIcsEvents } from "@/lib/absence-import";
import { calculatePlan } from "@/lib/calculate";
import { IHS_ADULT_PER_YEAR } from "@/lib/fees";
import { applyUrlForVisa, buildApplicationPack } from "@/lib/govuk-apply";
import { GOVUK } from "@/lib/legal";
import { notifyConfigured, sendGovukNotifyEmail } from "@/lib/notify";
import { applyEnglishResult, ihsSketchGbp, translationMailto } from "@/lib/partner-services";
import { buildReminders } from "@/lib/reminders";
import { getRoute } from "@/lib/visas";
import {
  buildSharePack,
  packContainsIdentityNumbers,
  sharePackJson,
} from "@/lib/share-pack";
import { hashShareToken, newShareToken } from "@/lib/share-token";
import { normalizeProfile } from "@/lib/storage";
import { DEFAULT_REMINDER_PREFS, type Profile } from "@/lib/types";

const AS_OF = parseISO("2026-08-16");

function sampleProfile(over: Partial<Profile> = {}): Profile {
  return normalizeProfile({
    id: "test",
    updatedAt: "2026-08-16T00:00:00.000Z",
    currentVisaId: "skilled-worker",
    visaGrantedOn: "2024-06-01",
    visaExpiresOn: "2029-06-01",
    qualifyingResidenceStart: "2024-06-01",
    ukEntryDate: "2024-06-01",
    englishStatus: "not_met",
    lifeInUkStatus: "not_taken",
    nationality: "IN",
    reminderPrefs: { ...DEFAULT_REMINDER_PREFS },
    ...over,
  });
}

describe("GOV.UK apply pack", () => {
  it("points Skilled Worker at the official apply page", () => {
    expect(applyUrlForVisa("skilled-worker")).toContain("/skilled-worker-visa/apply");
  });

  it("does not invent a form-injection API", () => {
    const profile = sampleProfile();
    const pack = buildApplicationPack(profile, calculatePlan(profile, AS_OF));
    expect(pack.cannotPrefill).toMatch(/cannot inject data into those forms/i);
    expect(JSON.stringify(pack.fields)).not.toMatch(/passport number/i);
  });

  it("links status and biometrics to GOV.UK / VFS, not a private API", () => {
    const profile = sampleProfile();
    const pack = buildApplicationPack(profile, calculatePlan(profile, AS_OF));
    expect(pack.status.some((item) => item.url === GOVUK.viewProve)).toBe(true);
    expect(pack.biometrics.some((item) => item.url === GOVUK.vfsUk)).toBe(true);
  });
});

describe("Notify", () => {
  afterEach(() => {
    delete process.env.GOVUK_NOTIFY_API_KEY;
    delete process.env.GOVUK_NOTIFY_TEMPLATE_ID;
  });

  it("is off unless both env vars are set", () => {
    expect(notifyConfigured()).toBe(false);
    process.env.GOVUK_NOTIFY_API_KEY = "key";
    expect(notifyConfigured()).toBe(false);
    process.env.GOVUK_NOTIFY_TEMPLATE_ID = "tpl";
    expect(notifyConfigured()).toBe(true);
  });

  it("posts a Notify-shaped payload only when configured", async () => {
    process.env.GOVUK_NOTIFY_API_KEY = "key";
    process.env.GOVUK_NOTIFY_TEMPLATE_ID = "tpl";
    const calls: string[] = [];
    const result = await sendGovukNotifyEmail(
      "user@example.com",
      [
        {
          id: "visa-1m",
          title: "Visa expiry",
          date: "2026-09-01",
          kind: "visa_expiry",
          detail: "Check GOV.UK",
          urgency: "soon",
        },
      ],
      async (url, init) => {
        calls.push(String(url));
        expect(init?.headers).toMatchObject({ authorization: "Bearer key" });
        return new Response("{}", { status: 201 });
      },
    );
    expect(result.sent).toBe(true);
    expect(calls[0]).toContain("notifications.service.gov.uk");
  });
});

describe("English result import", () => {
  it("maps B1+ to the profile flag and stores last-4 only", () => {
    const next = applyEnglishResult(sampleProfile(), {
      provider: "ielts-ukvi",
      level: "B1",
      takenOn: "2025-01-01",
      last4: "12345678",
    });
    expect(next.englishStatus).toBe("b1_or_higher");
    expect(next.englishTest?.last4).toBe("5678");
    expect(JSON.stringify(next.englishTest)).not.toContain("12345678");
  });
});

describe("partner sketches", () => {
  it("sketches adult IHS and builds a translator mailto without a fake checkout", () => {
    expect(ihsSketchGbp(sampleProfile({ dependantCount: 0 }), 1)).toBe(IHS_ADULT_PER_YEAR);
    expect(translationMailto(["Birth certificate"])).toMatch(/^mailto:/);
    expect(translationMailto(["Birth certificate"])).toContain("Birth%20certificate");
  });
});

describe("ICS trip import", () => {
  it("treats a Paris holiday as likely outside the UK", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "SUMMARY:Holiday",
      "DTSTART:20260301",
      "DTEND:20260308",
      "LOCATION:Paris, France",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n");
    const trips = eventsToTrips(parseIcsEvents(ics));
    expect(trips).toHaveLength(1);
    expect(trips[0].departedOn).toBe("2026-03-01");
    expect(trips[0].returnedOn).toBe("2026-03-08");
  });

  it("does not treat a London meeting as travel", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "SUMMARY:Team meeting",
      "DTSTART:20260301T090000Z",
      "DTEND:20260301T100000Z",
      "LOCATION:London, UK",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n");
    expect(eventsToTrips(parseIcsEvents(ics))).toHaveLength(0);
  });
});

describe("GPS bbox", () => {
  it("classifies London as in the UK and Paris as not", () => {
    expect(isRoughlyInUnitedKingdom(51.5074, -0.1278)).toBe(true);
    expect(isRoughlyInUnitedKingdom(48.8566, 2.3522)).toBe(false);
  });
});

describe("Life in the UK booking reminder", () => {
  it("surfaces the saved centre date", () => {
    const profile = sampleProfile({
      lifeInUkBooking: { centre: "Manchester", bookedOn: "2026-09-01" },
    });
    const reminders = buildReminders({
      profile,
      route: getRoute("skilled-worker"),
      asOf: AS_OF,
      ilrApplyFrom: parseISO("2029-05-04"),
      ilrOn: parseISO("2029-06-01"),
      citizenshipOn: parseISO("2030-06-01"),
      visaExpiry: parseISO("2029-06-01"),
    });
    expect(reminders.some((item) => item.id === "life-in-uk-booking" && item.title.includes("Manchester"))).toBe(
      true,
    );
  });
});

describe("Share pack", () => {
  it("uses the v1 schema and omits identity numbers", () => {
    const profile = sampleProfile();
    const pack = buildSharePack(profile, calculatePlan(profile, AS_OF));
    expect(pack.schema).toBe("route-to-citizenship.share.v1");
    expect(packContainsIdentityNumbers(sharePackJson(pack))).toBe(false);
    expect(pack.profile.englishTest).toBeNull();
  });

  it("flags passport-like text", () => {
    expect(packContainsIdentityNumbers("Passport 123456789")).toBe(true);
  });

  it("hashes share tokens", () => {
    const { token, tokenHash } = newShareToken();
    expect(hashShareToken(token)).toBe(tokenHash);
    expect(tokenHash).toHaveLength(64);
  });
});

describe("HTTP integration endpoints", () => {
  it("GET /api/notify reports whether Notify is configured", async () => {
    const res = await getNotify();
    const body = (await res.json()) as { available: boolean };
    expect(body.available).toBe(false);
  });

  it("POST /api/notify is 501 when Notify is not configured", async () => {
    const res = await postNotify(
      new Request("http://localhost/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminders: [] }),
      }),
    );
    expect(res.status).toBe(501);
  });

  it("POST /api/share without a session is 401", async () => {
    const profile = sampleProfile();
    const res = await postShare(
      new Request("http://localhost/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pack: buildSharePack(profile, calculatePlan(profile, AS_OF)),
        }),
      }),
    );
    expect(res.status).toBe(401);
  });
});

"use client";

import { useMemo, useState } from "react";
import { defaultIhsYears } from "@/lib/fees";
import { formatGbp } from "@/lib/format";
import { GOVUK } from "@/lib/legal";
import {
  LITUK_CENTRES,
  SELT_PROVIDERS,
  TRANSLATION_REGISTERS,
  applyEnglishResult,
  applyLifeInUkBooking,
  ihsOfficialLinks,
  ihsSketchGbp,
  translationMailto,
} from "@/lib/partner-services";
import type { EnglishTestRecord, PlanResult, Profile } from "@/lib/types";

export function PartnerServicesPanel({
  profile,
  plan,
  onProfileChange,
}: {
  profile: Profile;
  plan: PlanResult;
  onProfileChange: (profile: Profile) => void;
}) {
  const ihsYears = defaultIhsYears(profile.currentVisaId, profile.sponsorshipOverThreeYears);
  const ihs = ihsSketchGbp(profile, ihsYears);
  const docs = plan.checklist.filter((item) => item.group === "identity" || item.id === "birth-certificate").map((item) => item.label);
  const [provider, setProvider] = useState<EnglishTestRecord["provider"]>("ielts-ukvi");
  const [level, setLevel] = useState<EnglishTestRecord["level"]>("B1");
  const [takenOn, setTakenOn] = useState("");
  const [last4, setLast4] = useState("");
  const [centre, setCentre] = useState(LITUK_CENTRES[0]?.city ?? "London");
  const [bookedOn, setBookedOn] = useState("");

  const translationHref = useMemo(() => translationMailto(docs), [docs]);

  return (
    <div className="mt-6 space-y-8">
      <p className="text-sm text-ink-muted">
        Booking and results stay on the provider’s site. This planner does not have IELTS, Trinity,
        or Life in the UK slot APIs, and cannot import scores automatically.
      </p>

      <section>
        <h3 className="font-medium text-navy">English tests (SELT)</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {SELT_PROVIDERS.map((item) => (
            <li key={item.id} className="rounded-xl border border-navy/10 bg-paper-50 px-4 py-3">
              <a className="text-navy underline" href={item.bookUrl} target="_blank" rel="noreferrer">
                Book {item.name}
              </a>
              <p className="mt-1 text-xs text-ink-muted">{item.note}</p>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs">
          <a className="text-navy underline" href={GOVUK.proveEnglish} target="_blank" rel="noreferrer">
            Official approved English tests on GOV.UK
          </a>
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-medium text-navy">
            Provider
            <select className="field-input" value={provider} onChange={(event) => setProvider(event.target.value as EnglishTestRecord["provider"])}>
              {SELT_PROVIDERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-navy">
            Level
            <select className="field-input" value={level} onChange={(event) => setLevel(event.target.value as EnglishTestRecord["level"])}>
              {["A1", "A2", "B1", "B2", "C1", "C2"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-navy">
            Test date
            <input className="field-input" type="date" value={takenOn} onChange={(event) => setTakenOn(event.target.value)} />
          </label>
          <label className="text-sm font-medium text-navy">
            Candidate number (last 4 only)
            <input className="field-input" maxLength={4} value={last4} onChange={(event) => setLast4(event.target.value.replace(/\D/g, "").slice(-4))} />
          </label>
        </div>
        <button
          type="button"
          className="mt-3 min-h-11 rounded-full border border-navy/20 px-4 py-2 text-sm"
          onClick={() => {
            if (!takenOn) return;
            onProfileChange(applyEnglishResult(profile, { provider, takenOn, level, last4: last4 || null }));
          }}
        >
          Save result to this plan
        </button>
        {profile.englishTest ? (
          <p className="mt-2 text-sm text-ink-muted">
            Stored: {profile.englishTest.provider} {profile.englishTest.level} on {profile.englishTest.takenOn}
            {profile.englishTest.last4 ? ` · ending ${profile.englishTest.last4}` : ""}
          </p>
        ) : null}
      </section>

      <section>
        <h3 className="font-medium text-navy">Life in the UK test</h3>
        <p className="mt-1 text-sm text-ink-muted">
          Centres below are typical cities, not live availability. Book on GOV.UK, then save the date
          so this planner can remind you.
        </p>
        <a className="mt-2 inline-flex min-h-11 items-center text-sm text-navy underline" href={GOVUK.lifeInUk} target="_blank" rel="noreferrer">
          Book the Life in the UK test on GOV.UK
        </a>
        <ul className="mt-3 flex flex-wrap gap-2 text-xs text-ink-muted">
          {LITUK_CENTRES.map((item) => (
            <li key={item.id} className="rounded-full bg-navy/10 px-3 py-1 text-navy">
              {item.city}
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-navy">
            Centre city
            <select className="field-input" value={centre} onChange={(event) => setCentre(event.target.value)}>
              {LITUK_CENTRES.map((item) => (
                <option key={item.id} value={item.city}>
                  {item.city} ({item.nation})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-navy">
            Booked for
            <input className="field-input" type="date" value={bookedOn} onChange={(event) => setBookedOn(event.target.value)} />
          </label>
        </div>
        <button
          type="button"
          className="mt-3 min-h-11 rounded-full border border-navy/20 px-4 py-2 text-sm"
          onClick={() => {
            if (!bookedOn) return;
            onProfileChange(applyLifeInUkBooking(profile, { centre, bookedOn }));
          }}
        >
          Save booking date
        </button>
        {profile.lifeInUkBooking ? (
          <p className="mt-2 text-sm text-ink-muted">
            Booked: {profile.lifeInUkBooking.centre} on {profile.lifeInUkBooking.bookedOn}
          </p>
        ) : null}
      </section>

      <section>
        <h3 className="font-medium text-navy">Immigration Health Surcharge</h3>
        <p className="mt-1 font-serif text-3xl text-navy">{formatGbp(ihs)}</p>
        <p className="mt-1 text-sm text-ink-muted">
          Sketch for about {ihsYears} year{ihsYears === 1 ? "" : "s"} including dependants on this
          profile. The official IHS service calculates the amount you actually pay — GOV.UK pages
          cannot be embedded here.
        </p>
        <ul className="mt-2 text-sm">
          {ihsOfficialLinks().map((link) => (
            <li key={link.url}>
              <a className="text-navy underline" href={link.url} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="font-medium text-navy">Certified translation</h3>
        <p className="mt-1 text-sm text-ink-muted">
          There is no in-app checkout with a translation firm. Use a qualified translator from a
          public register, then email them a document list.
        </p>
        <ul className="mt-2 text-sm">
          {TRANSLATION_REGISTERS.map((item) => (
            <li key={item.url}>
              <a className="text-navy underline" href={item.url} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <a className="mt-3 inline-flex min-h-11 items-center rounded-full bg-navy px-4 py-2 text-sm text-paper-50" href={translationHref}>
          Email a translation request
        </a>
      </section>
    </div>
  );
}

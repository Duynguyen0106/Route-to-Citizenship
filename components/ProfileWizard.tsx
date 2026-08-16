"use client";

import { useState } from "react";
import { ROUTES, ROUTES_BY_CATEGORY } from "@/lib/routes";
import { SAMPLE_PROFILES } from "@/lib/samples";
import { createProfile, emptyProfile } from "@/lib/storage";
import {
  MAJORITY_ENGLISH_SPEAKING_COUNTRIES,
  OTHER_COMMON_NATIONALITIES,
  type AgeBand,
  type EnglishStatus,
  type LifeInUkStatus,
  type Profile,
} from "@/lib/types";

const STEPS = [
  "Visa",
  "Dates",
  "Absences",
  "Tests",
  "You",
  "Review",
] as const;

type Draft = ReturnType<typeof emptyProfile>;

export function ProfileWizard({
  initial,
  onSave,
  onCancel,
  onLoadSample,
}: {
  initial: Profile | null;
  onSave: (profile: Profile) => void;
  onCancel?: () => void;
  onLoadSample: (profile: Profile) => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() =>
    initial ? { ...emptyProfile(), ...initial } : emptyProfile(),
  );
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function next() {
    const message = validateStep(step, draft);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function save() {
    const message = validateStep(1, draft) ?? validateStep(0, draft);
    if (message) {
      setError(message);
      setStep(message.includes("visa") ? 0 : 1);
      return;
    }
    const profile = initial
      ? { ...initial, ...draft, updatedAt: new Date().toISOString() }
      : createProfile(draft);
    onSave(profile);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">Your profile</p>
      <h1 className="mt-2 font-serif text-4xl text-navy">
        {initial ? "Edit your immigration profile" : "Tell us where you are now"}
      </h1>
      <p className="mt-3 text-ink-muted">
        Answers stay in this browser. Use a sample plan if you only want to explore the MVP.
      </p>

      {!initial && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {SAMPLE_PROFILES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onLoadSample({ ...sample.profile, id: crypto.randomUUID() })}
              className="rounded-xl border border-navy/10 bg-paper-50 p-4 text-left hover:border-moss/40"
            >
              <p className="font-medium text-navy">{sample.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{sample.blurb}</p>
            </button>
          ))}
        </div>
      )}

      <ol className="mt-8 flex flex-wrap gap-2 text-xs">
        {STEPS.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => setStep(index)}
              className={`rounded-full px-3 py-1 ${
                index === step ? "bg-navy text-paper-50" : "bg-navy/10 text-navy"
              }`}
            >
              {index + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-2xl border border-navy/10 bg-paper-50 p-6 shadow-card">
        {step === 0 && (
          <fieldset>
            <legend className="font-serif text-2xl text-navy">Current visa or status</legend>
            <p className="mt-1 text-sm text-ink-muted">
              Choose the leave you hold today, not the visa you hope to get.
            </p>
            <div className="mt-5 space-y-4">
              {ROUTES_BY_CATEGORY.map((group) => {
                const routes = ROUTES.filter((route) => route.category === group.category);
                if (routes.length === 0) return null;
                return (
                  <div key={group.category}>
                    <p className="text-xs uppercase tracking-[0.16em] text-ink-faint">
                      {group.label}
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {routes.map((route) => (
                        <label
                          key={route.id}
                          className={`cursor-pointer rounded-xl border px-3 py-2 text-sm ${
                            draft.currentVisaId === route.id
                              ? "border-moss bg-moss/10"
                              : "border-navy/10"
                          }`}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            name="visa"
                            checked={draft.currentVisaId === route.id}
                            onChange={() => update("currentVisaId", route.id)}
                          />
                          <span className="font-medium text-navy">{route.shortName}</span>
                          <span className="mt-0.5 block text-xs text-ink-muted">
                            {route.leadsToIlr
                              ? `Typically ${route.ilrYears}-year ILR`
                              : "No ILR path unless you switch"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <fieldset className="space-y-4">
            <legend className="font-serif text-2xl text-navy">Key dates</legend>
            <Field
              label="Current leave granted"
              type="date"
              value={draft.visaGrantedOn}
              onChange={(value) => update("visaGrantedOn", value)}
            />
            <Field
              label="Current leave expires"
              type="date"
              value={draft.visaExpiresOn}
              onChange={(value) => update("visaExpiresOn", value)}
            />
            <Field
              label="Qualifying residence start"
              hint="Usually the date this qualifying visa began, or the date you entered the UK on it."
              type="date"
              value={draft.qualifyingResidenceStart}
              onChange={(value) => update("qualifyingResidenceStart", value)}
            />
            <Field
              label="First UK entry (optional, for citizenship residence)"
              type="date"
              value={draft.ukEntryDate}
              onChange={(value) => update("ukEntryDate", value)}
            />
          </fieldset>
        )}

        {step === 2 && (
          <fieldset className="space-y-4">
            <legend className="font-serif text-2xl text-navy">Residence and absences</legend>
            <Field
              label="Days outside the UK in the last 12 months"
              type="number"
              value={String(draft.daysAbsentLast12Months)}
              onChange={(value) => update("daysAbsentLast12Months", Number(value) || 0)}
            />
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={draft.exceeded180DaysInAny12Months}
                onChange={(event) => update("exceeded180DaysInAny12Months", event.target.checked)}
              />
              <span>
                I have been outside the UK for more than 180 days in any 12-month period during
                my qualifying residence.
              </span>
            </label>
            <Field
              label="Days outside the UK in the last 5 years (citizenship)"
              type="number"
              value={String(draft.daysAbsentLast5Years)}
              onChange={(value) => update("daysAbsentLast5Years", Number(value) || 0)}
            />
            <Field
              label="Days outside the UK in the last 12 months (citizenship figure)"
              hint="Naturalisation usually looks at a 90-day limit in the last 12 months."
              type="number"
              value={String(draft.daysAbsentLast12MonthsCitizenship)}
              onChange={(value) =>
                update("daysAbsentLast12MonthsCitizenship", Number(value) || 0)
              }
            />
          </fieldset>
        )}

        {step === 3 && (
          <fieldset className="space-y-4">
            <legend className="font-serif text-2xl text-navy">English and Life in the UK</legend>
            <Select
              label="English language"
              value={draft.englishStatus}
              onChange={(value) => update("englishStatus", value as EnglishStatus)}
              options={[
                { value: "not_met", label: "Not yet met" },
                { value: "b1_or_higher", label: "Passed an approved B1 (or higher) test" },
                { value: "degree_taught_in_english", label: "Degree taught in English" },
                { value: "majority_english_national", label: "National of a majority English-speaking country" },
                { value: "exempt_age", label: "Exempt because of age" },
                { value: "exempt_medical", label: "Exempt for a long-term medical reason" },
              ]}
            />
            <Select
              label="Life in the UK test"
              value={draft.lifeInUkStatus}
              onChange={(value) => update("lifeInUkStatus", value as LifeInUkStatus)}
              options={[
                { value: "not_taken", label: "Not taken" },
                { value: "passed", label: "Passed" },
                { value: "exempt_age", label: "Exempt because of age" },
                { value: "exempt_under_18", label: "Exempt (under 18)" },
                { value: "exempt_medical", label: "Exempt for a long-term medical reason" },
              ]}
            />
          </fieldset>
        )}

        {step === 4 && (
          <fieldset className="space-y-4">
            <legend className="font-serif text-2xl text-navy">About you</legend>
            <Select
              label="Nationality"
              value={draft.nationality}
              onChange={(value) => update("nationality", value)}
              options={[...MAJORITY_ENGLISH_SPEAKING_COUNTRIES, ...OTHER_COMMON_NATIONALITIES].map(
                (item) => ({ value: item.code, label: item.name }),
              )}
            />
            <Select
              label="Age band"
              value={draft.ageBand}
              onChange={(value) => update("ageBand", value as AgeBand)}
              options={[
                { value: "under_18", label: "Under 18" },
                { value: "18_to_64", label: "18 to 64" },
                { value: "65_plus", label: "65 or over" },
              ]}
            />
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={draft.marriedToBritishCitizen}
                onChange={(event) => update("marriedToBritishCitizen", event.target.checked)}
              />
              <span>I am married to, or in a civil partnership with, a British citizen.</span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={draft.hasSettledPartner}
                onChange={(event) => update("hasSettledPartner", event.target.checked)}
              />
              <span>I have a partner who is British or already settled in the UK.</span>
            </label>
          </fieldset>
        )}

        {step === 5 && (
          <div>
            <h2 className="font-serif text-2xl text-navy">Review</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Check the dates. The planner will treat qualifying residence as starting on{" "}
              <strong>{draft.qualifyingResidenceStart || "—"}</strong> and current leave as
              expiring on <strong>{draft.visaExpiresOn || "—"}</strong>.
            </p>
            <div className="mt-4 rounded-xl bg-clay/10 px-4 py-3 text-sm text-clay-600">
              This is not immigration advice. Estimates can be wrong if your history is mixed,
              if rules have changed, or if a requirement this MVP does not model applies to you.
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-clay">{error}</p>}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep((current) => Math.max(0, current - 1));
            }}
            className="text-sm text-ink-muted disabled:opacity-40"
            disabled={step === 0}
          >
            Back
          </button>
          <div className="flex gap-3">
            {onCancel && (
              <button type="button" onClick={onCancel} className="text-sm text-ink-muted">
                Cancel
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="rounded-full bg-navy px-5 py-2 text-sm text-paper-50"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={save}
                className="rounded-full bg-moss px-5 py-2 text-sm text-white"
              >
                Build my plan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function validateStep(step: number, draft: Draft): string | null {
  if (step === 0 && !draft.currentVisaId) return "Choose a visa.";
  if (step === 1) {
    if (!draft.visaGrantedOn || !draft.visaExpiresOn || !draft.qualifyingResidenceStart) {
      return "Please complete the grant, expiry, and qualifying start dates.";
    }
    if (draft.visaExpiresOn < draft.visaGrantedOn) {
      return "Expiry cannot be before the grant date.";
    }
  }
  return null;
}

function Field({
  label,
  hint,
  type,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-navy">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-ink-muted">{hint}</span>}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-navy">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

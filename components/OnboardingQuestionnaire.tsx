"use client";

import { useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  NATIONALITY_OPTIONS,
  ONBOARDING_STEPS,
  ONBOARDING_VISA_OPTIONS,
  emptyOnboardingValues,
  onboardingSchema,
  onboardingToProfile,
  pathwayHint,
  profileToOnboarding,
  type OnboardingValues,
} from "@/lib/onboarding";
import { SAMPLE_PROFILES } from "@/lib/samples";
import type { Profile } from "@/lib/types";

type Props = {
  initial?: Profile | null;
  onComplete: (profile: Profile) => void;
  onCancel?: () => void;
  onLoadSample?: (profile: Profile) => void;
};

export function OnboardingQuestionnaire({ initial, onComplete, onCancel, onLoadSample }: Props) {
  const [step, setStep] = useState(0);
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: initial ? profileToOnboarding(initial) : emptyOnboardingValues(),
    mode: "onTouched",
  });

  const current = ONBOARDING_STEPS[step];
  const visaId = form.watch("currentVisaId");

  async function next() {
    const valid = await form.trigger([...current.fields]);
    if (!valid) return;
    if (step < ONBOARDING_STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    const parsed = onboardingSchema.safeParse(form.getValues());
    if (!parsed.success) return;
    onComplete(onboardingToProfile(parsed.data, initial));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">Onboarding</p>
      <h1 className="mt-2 font-serif text-4xl text-navy">
        {initial ? "Edit your immigration profile" : "Seven questions to sketch your route"}
      </h1>
      <p className="mt-3 text-ink-muted">
        We map your answers onto one of five MVP paths. We never ask for passport numbers. This is
        not immigration advice.
      </p>

      {!initial && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_PROFILES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => (onLoadSample ?? onComplete)({ ...sample.profile, id: crypto.randomUUID() })}
              className="rounded-xl border border-navy/10 bg-paper-50 p-4 text-left hover:border-moss/40"
            >
              <p className="font-medium text-navy">{sample.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{sample.blurb}</p>
            </button>
          ))}
        </div>
      )}

      <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-moss">
        Step {step + 1} of {ONBOARDING_STEPS.length}
      </p>
      <ol className="mt-3 flex flex-wrap gap-2 text-xs">
        {ONBOARDING_STEPS.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setStep(index)}
              className={`rounded-full px-3 py-1 ${
                index === step ? "bg-navy text-paper-50" : index < step ? "bg-moss/15 text-moss" : "bg-navy/10 text-navy"
              }`}
            >
              {index + 1}. {item.title}
            </button>
          </li>
        ))}
      </ol>

      <form
        className="mt-6 rounded-2xl border border-navy/10 bg-paper-50 p-6 shadow-card"
        onSubmit={(event) => {
          event.preventDefault();
          void next();
        }}
      >
        <h2 className="font-serif text-2xl text-navy">{current.title}</h2>

        <div className="mt-5 space-y-4">
          {step === 0 ? (
            <Field label="Nationality" error={form.formState.errors.nationality?.message}>
              <select className="field-input" {...form.register("nationality")}>
                {NATIONALITY_OPTIONS.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-ink-muted">
                Used only as a coarse English-language exemption. Do not enter passport numbers.
              </p>
            </Field>
          ) : null}

          {step === 1 ? (
            <Field label="Current visa type" error={form.formState.errors.currentVisaId?.message}>
              <select className="field-input" {...form.register("currentVisaId")}>
                {ONBOARDING_VISA_OPTIONS.map((visa) => (
                  <option key={visa.id} value={visa.id}>
                    {visa.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-ink-muted">Maps to MVP pathway: {pathwayHint(visaId)}</p>
            </Field>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Visa start date" error={form.formState.errors.visaGrantDate?.message}>
                <input className="field-input" type="date" {...form.register("visaGrantDate")} />
              </Field>
              <Field label="Visa expiry date" error={form.formState.errors.visaExpiryDate?.message}>
                <input className="field-input" type="date" {...form.register("visaExpiryDate")} />
              </Field>
            </div>
          ) : null}

          {step === 3 ? (
            <Field
              label="Date first entered the UK (optional)"
              error={form.formState.errors.ukEntryDate?.message}
            >
              <input className="field-input" type="date" {...form.register("ukEntryDate")} />
              <p className="mt-2 text-xs text-ink-muted">
                Used for the 10-year long residence route and citizenship residence. Leave blank if
                you are not counting from first arrival.
              </p>
            </Field>
          ) : null}

          {step === 4 ? (
            <Controller
              control={form.control}
              name="relationship"
              render={({ field }) => (
                <fieldset>
                  <legend className="text-sm font-medium text-navy">
                    Relationship to a British citizen or settled person
                  </legend>
                  <div className="mt-3 grid gap-2">
                    {(
                      [
                        ["none", "None / not relying on a partner"],
                        ["british_citizen", "Partner or spouse is a British citizen"],
                        ["settled", "Partner or spouse is settled (ILR / settled status)"],
                      ] as const
                    ).map(([value, label]) => (
                      <label
                        key={value}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                          field.value === value ? "border-moss bg-moss/10" : "border-navy/10"
                        }`}
                      >
                        <input
                          type="radio"
                          value={value}
                          checked={field.value === value}
                          onChange={() => field.onChange(value)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            />
          ) : null}

          {step === 5 ? (
            <Field label="English level" error={form.formState.errors.englishLevel?.message}>
              <select className="field-input" {...form.register("englishLevel")}>
                <option value="none">Not yet evidenced</option>
                <option value="A2">A2</option>
                <option value="B1">B1 (usual ILR / citizenship level)</option>
                <option value="B2">B2 or higher</option>
              </select>
            </Field>
          ) : null}

          {step === 6 ? (
            <Controller
              control={form.control}
              name="lifeInUkPassed"
              render={({ field }) => (
                <fieldset>
                  <legend className="text-sm font-medium text-navy">Have you passed the Life in the UK test?</legend>
                  <div className="mt-3 flex gap-3">
                    {(["yes", "no"] as const).map((value) => (
                      <label
                        key={value}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm ${
                          field.value === value ? "border-moss bg-moss/10" : "border-navy/10"
                        }`}
                      >
                        <input
                          type="radio"
                          value={value}
                          checked={field.value === value}
                          onChange={() => field.onChange(value)}
                        />
                        {value === "yes" ? "Yes" : "No"}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            />
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="text-sm text-ink-muted disabled:opacity-40"
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
          >
            Back
          </button>
          <div className="flex gap-3">
            {onCancel ? (
              <button type="button" onClick={onCancel} className="text-sm text-ink-muted">
                Cancel
              </button>
            ) : null}
            <button type="submit" className="rounded-full bg-navy px-5 py-2 text-sm text-paper-50">
              {step === ONBOARDING_STEPS.length - 1 ? "See my timeline" : "Continue"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-navy">
      {label}
      {children}
      {error ? <p className="mt-1 text-xs text-clay">{error}</p> : null}
    </label>
  );
}

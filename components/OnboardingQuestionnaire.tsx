"use client";

import { useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  NATIONALITY_OPTIONS,
  ONBOARDING_STEPS,
  ONBOARDING_VISA_OPTIONS,
  emptyOnboardingValues,
  firstInvalidOnboardingStep,
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
  const [maxReached, setMaxReached] = useState(initial ? ONBOARDING_STEPS.length - 1 : 0);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: initial ? profileToOnboarding(initial) : emptyOnboardingValues(),
    mode: "onTouched",
  });

  const current = ONBOARDING_STEPS[step];
  const visaId = form.watch("currentVisaId");
  const progress = ((step + 1) / ONBOARDING_STEPS.length) * 100;

  async function goTo(index: number) {
    if (index < 0 || index >= ONBOARDING_STEPS.length) return;
    if (index > maxReached) return;
    setFormError(null);
    setStep(index);
  }

  async function next() {
    setFormError(null);
    const valid = await form.trigger([...current.fields]);
    if (!valid) return;
    if (step < ONBOARDING_STEPS.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      setMaxReached((currentMax) => Math.max(currentMax, nextStep));
      return;
    }
    const values = form.getValues();
    const parsed = onboardingSchema.safeParse(values);
    if (!parsed.success) {
      const invalid = firstInvalidOnboardingStep(values) ?? 0;
      setStep(invalid);
      setFormError("Please complete the highlighted fields before we can build a timeline.");
      await form.trigger();
      return;
    }
    onComplete(onboardingToProfile(parsed.data, initial));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">Onboarding</p>
      <h1 className="mt-2 font-serif text-3xl text-navy sm:text-4xl">
        {initial ? "Edit your immigration profile" : "Seven questions to sketch your route"}
      </h1>
      <p className="mt-3 text-sm text-ink-muted sm:text-base">
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
              className="min-h-16 rounded-xl border border-navy/10 bg-paper-50 p-4 text-left hover:border-moss/40"
            >
              <p className="font-medium text-navy">{sample.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{sample.blurb}</p>
            </button>
          ))}
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-moss">
            Step {step + 1} of {ONBOARDING_STEPS.length}
            <span className="ml-2 normal-case tracking-normal text-ink-muted">· {current.title}</span>
          </p>
          <p className="text-xs text-ink-muted">{Math.round(progress)}%</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy/10" aria-hidden>
          <div className="h-full rounded-full bg-moss transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <ol className="mt-3 hidden flex-wrap gap-2 text-xs sm:flex">
        {ONBOARDING_STEPS.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => void goTo(index)}
              disabled={index > maxReached}
              className={`rounded-full px-3 py-1.5 ${
                index === step
                  ? "bg-navy text-paper-50"
                  : index <= maxReached
                    ? "bg-moss/15 text-moss"
                    : "cursor-not-allowed bg-navy/10 text-ink-faint"
              }`}
            >
              {index + 1}. {item.title}
            </button>
          </li>
        ))}
      </ol>

      <form
        className="mt-6 rounded-2xl border border-navy/10 bg-paper-50 p-4 shadow-card sm:p-6"
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
              <p className="mt-2 text-xs font-normal text-ink-muted">
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
              <p className="mt-2 text-xs font-normal text-ink-muted">
                Maps to MVP pathway: {pathwayHint(visaId, initial)}
              </p>
              {visaId === "student" || visaId === "graduate" ? (
                <p className="mt-2 text-xs font-normal text-clay-600">
                  Student and Graduate leave do not count toward ILR until you switch to Skilled
                  Worker or another qualifying route.
                </p>
              ) : null}
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
              <p className="mt-2 text-xs font-normal text-ink-muted">
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
                        className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm ${
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
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {(["yes", "no"] as const).map((value) => (
                      <label
                        key={value}
                        className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm ${
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

        {formError ? <p className="mt-4 text-sm text-clay">{formError}</p> : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="min-h-11 px-2 text-sm text-ink-muted disabled:opacity-40"
            disabled={step === 0}
            onClick={() => void goTo(step - 1)}
          >
            Back
          </button>
          <div className="flex gap-3">
            {onCancel ? (
              <button type="button" onClick={onCancel} className="min-h-11 px-2 text-sm text-ink-muted">
                Cancel
              </button>
            ) : null}
            <button
              type="submit"
              className="min-h-11 rounded-full bg-navy px-5 py-2 text-sm text-paper-50"
            >
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
      {error ? <p className="mt-1 text-xs font-normal text-clay">{error}</p> : null}
    </label>
  );
}

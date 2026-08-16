"use client";

import { useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import {
  NATIONALITY_OPTIONS,
  ONBOARDING_STEPS,
  ONBOARDING_VISA_GROUPS,
  SWITCH_VISA_OPTIONS,
  emptyOnboardingValues,
  firstInvalidOnboardingStep,
  onboardingSchema,
  onboardingToProfile,
  pathwayHint,
  profileToOnboarding,
  type OnboardingValues,
} from "@/lib/onboarding";
import { EXTRA_SCENARIO_PROFILES, SAMPLE_PROFILES } from "@/lib/samples";
import { useLocale } from "@/components/LocaleProvider";
import type { Profile } from "@/lib/types";

type Props = {
  initial?: Profile | null;
  onComplete: (profile: Profile) => void;
  onCancel?: () => void;
  onLoadSample?: (profile: Profile) => void;
};

export function OnboardingQuestionnaire({ initial, onComplete, onCancel, onLoadSample }: Props) {
  const { t } = useLocale();
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(initial ? ONBOARDING_STEPS.length - 1 : 0);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema) as Resolver<OnboardingValues>,
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
      setFormError(t("onboard.formError"));
      await form.trigger();
      return;
    }
    onComplete(onboardingToProfile(parsed.data, initial));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">{t("onboard.kicker")}</p>
      <h1 className="mt-2 font-serif text-3xl text-navy sm:text-4xl">
        {initial ? t("onboard.editTitle") : t("onboard.title")}
      </h1>
      <p className="mt-3 text-sm text-ink-muted sm:text-base">{t("onboard.intro")}</p>

      {!initial && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_PROFILES.concat(EXTRA_SCENARIO_PROFILES).map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => (onLoadSample ?? onComplete)({ ...sample.profile, id: crypto.randomUUID() })}
              className="min-h-16 rounded-xl border border-navy/10 bg-paper-50 p-4 text-left hover:border-moss/40"
            >
              <p className="font-medium text-navy">{t(`sample.${sample.id}.title`)}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{t(`sample.${sample.id}.blurb`)}</p>
            </button>
          ))}
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-moss">
            {t("onboard.stepOf", { current: step + 1, total: ONBOARDING_STEPS.length })}
            <span className="ml-2 normal-case tracking-normal text-ink-muted">
              · {t(`onboard.step.${current.id}`)}
            </span>
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
              {index + 1}. {t(`onboard.step.${item.id}`)}
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
        <h2 className="font-serif text-2xl text-navy">{t(`onboard.step.${current.id}`)}</h2>

        <div className="mt-5 space-y-4">
          {step === 0 ? (
            <Field label={t("onboard.nationality")} error={form.formState.errors.nationality?.message}>
              <select className="field-input" {...form.register("nationality")}>
                {NATIONALITY_OPTIONS.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs font-normal text-ink-muted">{t("onboard.nationalityHint")}</p>
            </Field>
          ) : null}

          {step === 1 ? (
            <Field label={t("onboard.visaType")} error={form.formState.errors.currentVisaId?.message}>
              <select className="field-input" {...form.register("currentVisaId")}>
                {ONBOARDING_VISA_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((visa) => (
                      <option key={visa.id} value={visa.id}>
                        {visa.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="mt-2 text-xs font-normal text-ink-muted">
                {t("onboard.pathwayMaps", { pathway: pathwayHint(visaId, initial) })}
              </p>
              {visaId === "student" || visaId === "graduate" || visaId === "gbm" || visaId === "hpi" || visaId === "youth-mobility" ? (
                <p className="mt-2 text-xs font-normal text-clay-600">{t("onboard.noIlrOwn")}</p>
              ) : null}
            </Field>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("onboard.visaStart")} error={form.formState.errors.visaGrantDate?.message}>
                  <input className="field-input" type="date" {...form.register("visaGrantDate")} />
                </Field>
                <Field label={t("onboard.visaExpiry")} error={form.formState.errors.visaExpiryDate?.message}>
                  <input className="field-input" type="date" {...form.register("visaExpiryDate")} />
                </Field>
              </div>
              <p className="text-xs text-ink-muted">{t("onboard.earlierHint")}</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={t("onboard.earlierVisa")}>
                  <select className="field-input" {...form.register("priorVisaId")}>
                    <option value="">{t("onboard.noneSkip")}</option>
                    {SWITCH_VISA_OPTIONS.filter((item) => item.id).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                    <option value="student">Student</option>
                  </select>
                </Field>
                <Field label={t("onboard.earlierStart")}>
                  <input className="field-input" type="date" {...form.register("priorVisaStart")} />
                </Field>
                <Field label={t("onboard.earlierEnd")}>
                  <input className="field-input" type="date" {...form.register("priorVisaEnd")} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("onboard.nextSwitch")}>
                  <select className="field-input" {...form.register("plannedSwitch1To")}>
                    {SWITCH_VISA_OPTIONS.map((item) => (
                      <option key={item.id || "none"} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("onboard.switchDate")}>
                  <input className="field-input" type="date" {...form.register("plannedSwitch1On")} />
                </Field>
                <Field label={t("onboard.laterSwitch")}>
                  <select className="field-input" {...form.register("plannedSwitch2To")}>
                    {SWITCH_VISA_OPTIONS.map((item) => (
                      <option key={`2-${item.id || "none"}`} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("onboard.laterSwitchDate")}>
                  <input className="field-input" type="date" {...form.register("plannedSwitch2On")} />
                </Field>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <Field
                label={t("onboard.entryDate")}
                error={form.formState.errors.ukEntryDate?.message}
              >
                <input className="field-input" type="date" {...form.register("ukEntryDate")} />
                <p className="mt-2 text-xs font-normal text-ink-muted">{t("onboard.entryHint")}</p>
              </Field>
              <Field label={t("onboard.ageBand")}>
                <select className="field-input" {...form.register("ageBand")}>
                  <option value="18_to_64">{t("onboard.age18")}</option>
                  <option value="under_18">{t("onboard.ageUnder18")}</option>
                  <option value="65_plus">{t("onboard.age65")}</option>
                </select>
              </Field>
              <label className="flex items-center gap-2 text-sm text-navy">
                <input type="checkbox" {...form.register("bornInUk")} />
                {t("onboard.bornUk")}
              </label>
              <label className="flex items-center gap-2 text-sm text-navy">
                <input type="checkbox" {...form.register("hasBritishParent")} />
                {t("onboard.britishParent")}
              </label>
              <p className="text-xs text-ink-muted">{t("onboard.registrationHint")}</p>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <Controller
                control={form.control}
                name="relationship"
                render={({ field }) => (
                  <fieldset>
                    <legend className="text-sm font-medium text-navy">
                      {t("onboard.relationshipLegend")}
                    </legend>
                    <div className="mt-3 grid gap-2">
                      {(
                        [
                          ["none", t("onboard.rel.none")],
                          ["british_citizen", t("onboard.rel.british")],
                          ["settled", t("onboard.rel.settled")],
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
                    <p className="mt-2 text-xs text-ink-muted">{t("onboard.relHint")}</p>
                  </fieldset>
                )}
              />
              <Field label={t("onboard.dependants")}>
                <input
                  className="field-input"
                  type="number"
                  min={0}
                  max={8}
                  {...form.register("dependantCount", { valueAsNumber: true })}
                />
              </Field>
              {(visaId === "dependant" || visaId === "child-registration") && (
                <Field label={t("onboard.mainIlr")}>
                  <input className="field-input" type="date" {...form.register("mainApplicantIlrOn")} />
                </Field>
              )}
            </div>
          ) : null}

          {step === 5 ? (
            <Field label={t("onboard.englishLevel")} error={form.formState.errors.englishLevel?.message}>
              <select className="field-input" {...form.register("englishLevel")}>
                <option value="none">{t("onboard.english.none")}</option>
                <option value="A2">{t("onboard.english.A2")}</option>
                <option value="B1">{t("onboard.english.B1")}</option>
                <option value="B2">{t("onboard.english.B2")}</option>
              </select>
            </Field>
          ) : null}

          {step === 6 ? (
            <Controller
              control={form.control}
              name="lifeInUkPassed"
              render={({ field }) => (
                <fieldset>
                  <legend className="text-sm font-medium text-navy">{t("onboard.lifeLegend")}</legend>
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
                        {value === "yes" ? t("onboard.yes") : t("onboard.no")}
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
            {t("onboard.back")}
          </button>
          <div className="flex gap-3">
            {onCancel ? (
              <button type="button" onClick={onCancel} className="min-h-11 px-2 text-sm text-ink-muted">
                {t("onboard.cancel")}
              </button>
            ) : null}
            <button
              type="submit"
              className="min-h-11 rounded-full bg-navy px-5 py-2 text-sm text-paper-50"
            >
              {step === ONBOARDING_STEPS.length - 1 ? t("onboard.seeTimeline") : t("onboard.continue")}
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

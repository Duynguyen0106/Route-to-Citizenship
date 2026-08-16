import { useMemo, useState } from "react";
import { router } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  NATIONALITY_OPTIONS,
  ONBOARDING_STEPS,
  ONBOARDING_VISA_GROUPS,
  emptyOnboardingValues,
  firstInvalidOnboardingStep,
  onboardingSchema,
  onboardingToProfile,
  pathwayHint,
  profileToOnboarding,
  type OnboardingValues,
} from "@/lib/onboarding";
import {
  Choice,
  ErrorText,
  Field,
  Kicker,
  PrimaryButton,
  ScrollScreen,
  SecondaryButton,
  Subtitle,
  Title,
} from "../src/components/ui";
import { usePlan } from "../src/plan-context";
import { useLocale } from "../src/locale-context";
import { colors } from "../src/theme";

export default function OnboardingScreen() {
  const { profile, save } = usePlan();
  const { t } = useLocale();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<OnboardingValues>(() =>
    profile ? profileToOnboarding(profile) : emptyOnboardingValues(),
  );

  const current = ONBOARDING_STEPS[step];
  const progress = ((step + 1) / ONBOARDING_STEPS.length) * 100;
  const hint = useMemo(() => pathwayHint(values.currentVisaId, profile), [values.currentVisaId, profile]);

  function patch(partial: Partial<OnboardingValues>) {
    setValues((currentValues) => ({ ...currentValues, ...partial }));
    setError(null);
  }

  function validateCurrent(): boolean {
    const parsed = onboardingSchema.safeParse(values);
    if (parsed.success) return true;
    const paths = new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? "")));
    const relevant = current.fields.some((field) => paths.has(field));
    if (!relevant && step < ONBOARDING_STEPS.length - 1) return true;
    const issue = parsed.error.issues.find((item) => current.fields.includes(item.path[0] as never));
    setError(issue?.message ?? parsed.error.issues[0]?.message ?? t("mobile.checkStep"));
    return false;
  }

  async function next() {
    if (!validateCurrent()) return;
    if (step < ONBOARDING_STEPS.length - 1) {
      setStep((value) => value + 1);
      return;
    }
    const parsed = onboardingSchema.safeParse(values);
    if (!parsed.success) {
      const invalid = firstInvalidOnboardingStep(values) ?? 0;
      setStep(invalid);
      setError(t("onboard.formError"));
      return;
    }
    await save(onboardingToProfile(parsed.data, profile));
    router.replace("/(plan)");
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollScreen>
        <Kicker>{t("onboard.kicker")}</Kicker>
        <Title>{profile ? t("dash.edit") : t("onboard.title")}</Title>
        <Subtitle>
          {t("onboard.stepOf", { current: step + 1, total: ONBOARDING_STEPS.length })}:{" "}
          {t(`onboard.step.${current.id}`)}. {t("onboard.notApplication")}
        </Subtitle>
        <View
          style={{
            marginTop: 16,
            height: 6,
            borderRadius: 99,
            backgroundColor: colors.paper200,
            overflow: "hidden",
          }}
        >
          <View style={{ width: `${progress}%`, height: "100%", backgroundColor: colors.navy }} />
        </View>

        {current.id === "nationality" ? (
          <View style={{ marginTop: 8 }}>
            {NATIONALITY_OPTIONS.map((option) => (
              <Choice
                key={option.code}
                label={option.name}
                selected={values.nationality === option.code}
                onPress={() => patch({ nationality: option.code })}
              />
            ))}
          </View>
        ) : null}

        {current.id === "visa" ? (
          <View style={{ marginTop: 8 }}>
            <Text style={{ marginTop: 8, color: colors.inkMuted, fontSize: 13, lineHeight: 19 }}>
              {t("mobile.mappedPathway", { pathway: hint })}
            </Text>
            {ONBOARDING_VISA_GROUPS.map((group) => (
              <View key={group.label} style={{ marginTop: 16 }}>
                <Text
                  style={{
                    fontSize: 11,
                    letterSpacing: 1.6,
                    textTransform: "uppercase",
                    color: colors.moss,
                    fontWeight: "700",
                  }}
                >
                  {group.label}
                </Text>
                {group.options.map((option) => (
                  <Choice
                    key={option.id}
                    label={option.label}
                    selected={values.currentVisaId === option.id}
                    onPress={() => patch({ currentVisaId: option.id })}
                  />
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {current.id === "dates" ? (
          <View>
            <Field
              label={t("mobile.visaStart")}
              value={values.visaGrantDate}
              onChangeText={(visaGrantDate) => patch({ visaGrantDate })}
              placeholder="2024-03-01"
            />
            <Field
              label={t("mobile.visaExpiry")}
              value={values.visaExpiryDate}
              onChangeText={(visaExpiryDate) => patch({ visaExpiryDate })}
              placeholder="2029-03-01"
            />
          </View>
        ) : null}

        {current.id === "entry" ? (
          <View>
            <Field
              label={t("mobile.entryDate")}
              value={values.ukEntryDate}
              onChangeText={(ukEntryDate) => patch({ ukEntryDate })}
              placeholder={t("mobile.entryPlaceholder")}
            />
            <Text style={{ marginTop: 10, color: colors.inkMuted, fontSize: 13, lineHeight: 19 }}>
              {t("mobile.entryHint")}
            </Text>
          </View>
        ) : null}

        {current.id === "relationship" ? (
          <View style={{ marginTop: 8 }}>
            {(["none", "british_citizen", "settled"] as const).map((id) => (
              <Choice
                key={id}
                label={t(`mobile.rel.${id === "british_citizen" ? "british" : id === "settled" ? "settled" : "none"}`)}
                selected={values.relationship === id}
                onPress={() => patch({ relationship: id })}
              />
            ))}
          </View>
        ) : null}

        {current.id === "english" ? (
          <View style={{ marginTop: 8 }}>
            {(["none", "A2", "B1", "B2"] as const).map((id) => (
              <Choice
                key={id}
                label={t(`mobile.english.${id}`)}
                selected={values.englishLevel === id}
                onPress={() => patch({ englishLevel: id })}
              />
            ))}
          </View>
        ) : null}

        {current.id === "lifeInUk" ? (
          <View style={{ marginTop: 8 }}>
            <Choice
              label={t("mobile.lifeYes")}
              selected={values.lifeInUkPassed === "yes"}
              onPress={() => patch({ lifeInUkPassed: "yes" })}
            />
            <Choice
              label={t("mobile.lifeNo")}
              selected={values.lifeInUkPassed === "no"}
              onPress={() => patch({ lifeInUkPassed: "no" })}
            />
          </View>
        ) : null}

        <ErrorText>{error}</ErrorText>
        <PrimaryButton
          label={step === ONBOARDING_STEPS.length - 1 ? t("onboard.build") : t("onboard.continue")}
          onPress={next}
        />
        {step > 0 ? (
          <SecondaryButton label={t("onboard.back")} onPress={() => setStep((value) => value - 1)} />
        ) : (
          <SecondaryButton label={t("onboard.cancel")} onPress={() => router.back()} />
        )}
        <Pressable onPress={() => router.replace("/")} style={{ marginTop: 18, alignItems: "center" }}>
          <Text style={{ color: colors.inkMuted, fontSize: 14 }}>{t("mobile.leaveUnsaved")}</Text>
        </Pressable>
      </ScrollScreen>
    </KeyboardAvoidingView>
  );
}

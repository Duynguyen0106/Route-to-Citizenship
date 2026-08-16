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

const RELATIONSHIP = [
  { id: "none", label: "No British or settled partner" },
  { id: "british_citizen", label: "Partner is a British citizen" },
  { id: "settled", label: "Partner has ILR or settled status" },
] as const;

const ENGLISH = [
  { id: "none", label: "Not yet at B1" },
  { id: "A2", label: "A2 (not usually enough for ILR)" },
  { id: "B1", label: "B1 or equivalent" },
  { id: "B2", label: "B2 or higher" },
] as const;

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
    setError(issue?.message ?? parsed.error.issues[0]?.message ?? "Please check this step.");
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
      setError("Please complete the highlighted fields before we can build a timeline.");
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
          {t("onboard.kicker")} {step + 1}/{ONBOARDING_STEPS.length}: {current.title}. This is not an application.
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
              Mapped pathway: {hint}
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
              label="Visa start date (YYYY-MM-DD)"
              value={values.visaGrantDate}
              onChangeText={(visaGrantDate) => patch({ visaGrantDate })}
              placeholder="2024-03-01"
            />
            <Field
              label="Visa expiry date (YYYY-MM-DD)"
              value={values.visaExpiryDate}
              onChangeText={(visaExpiryDate) => patch({ visaExpiryDate })}
              placeholder="2029-03-01"
            />
          </View>
        ) : null}

        {current.id === "entry" ? (
          <View>
            <Field
              label="First UK entry date (optional)"
              value={values.ukEntryDate}
              onChangeText={(ukEntryDate) => patch({ ukEntryDate })}
              placeholder="Leave blank if the same as visa start"
            />
            <Text style={{ marginTop: 10, color: colors.inkMuted, fontSize: 13, lineHeight: 19 }}>
              Used for long residence and citizenship sketches. Confirm the live stamp or eVisa, not this
              app.
            </Text>
          </View>
        ) : null}

        {current.id === "relationship" ? (
          <View style={{ marginTop: 8 }}>
            {RELATIONSHIP.map((option) => (
              <Choice
                key={option.id}
                label={option.label}
                selected={values.relationship === option.id}
                onPress={() => patch({ relationship: option.id })}
              />
            ))}
          </View>
        ) : null}

        {current.id === "english" ? (
          <View style={{ marginTop: 8 }}>
            {ENGLISH.map((option) => (
              <Choice
                key={option.id}
                label={option.label}
                selected={values.englishLevel === option.id}
                onPress={() => patch({ englishLevel: option.id })}
              />
            ))}
          </View>
        ) : null}

        {current.id === "lifeInUk" ? (
          <View style={{ marginTop: 8 }}>
            <Choice
              label="I have passed the Life in the UK test"
              selected={values.lifeInUkPassed === "yes"}
              onPress={() => patch({ lifeInUkPassed: "yes" })}
            />
            <Choice
              label="Not passed yet"
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
          <Text style={{ color: colors.inkMuted, fontSize: 14 }}>Leave without saving</Text>
        </Pressable>
      </ScrollScreen>
    </KeyboardAvoidingView>
  );
}

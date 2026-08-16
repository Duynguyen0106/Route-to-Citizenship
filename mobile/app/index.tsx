import { Redirect, router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { LEGAL_NOTICE } from "@/lib/legal";
import { SAMPLE_PROFILES } from "@/lib/samples";
import { RULES_REVIEWED_ON } from "@/lib/types";
import {
  Card,
  DisclaimerBanner,
  Kicker,
  LoadingScreen,
  PrimaryButton,
  ScrollScreen,
  SecondaryButton,
  Subtitle,
  Title,
} from "../src/components/ui";
import { LanguagePicker } from "../src/language-picker";
import { useLocale } from "../src/locale-context";
import { usePlan } from "../src/plan-context";
import { colors } from "../src/theme";

export default function WelcomeScreen() {
  const { ready, profile, save } = usePlan();
  const { t } = useLocale();

  if (!ready) return <LoadingScreen />;
  if (profile) return <Redirect href="/(plan)" />;

  return (
    <ScrollScreen>
      <Kicker>{t("brand.tag")}</Kicker>
      <Title>{t("brand")}</Title>
      <Subtitle>{t("mobile.welcomeLead")}</Subtitle>
      <DisclaimerBanner />
      <LanguagePicker />
      <PrimaryButton label={t("nav.start")} onPress={() => router.push("/onboarding")} />
      <Text
        style={{
          marginTop: 28,
          fontSize: 11,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: colors.moss,
          fontWeight: "600",
        }}
      >
        {t("mobile.featuredSamples")}
      </Text>
      <Text style={{ marginTop: 6, color: colors.inkMuted, fontSize: 13, lineHeight: 19 }}>
        {t("mobile.featuredLead")}
      </Text>
      {SAMPLE_PROFILES.map((sample) => (
        <Pressable
          key={sample.id}
          accessibilityRole="button"
          onPress={async () => {
            await save(sample.profile);
            router.replace("/(plan)");
          }}
        >
          <Card>
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.navy }}>{t(`sample.${sample.id}.title`)}</Text>
            <Text style={{ marginTop: 6, color: colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
              {t(`sample.${sample.id}.blurb`)}
            </Text>
          </Card>
        </Pressable>
      ))}
      <SecondaryButton
        label={t("dash.edit")}
        onPress={() => router.push("/onboarding")}
      />
      <View style={{ marginTop: 28 }}>
        <Text style={{ color: colors.inkFaint, fontSize: 12, lineHeight: 18 }}>{LEGAL_NOTICE}</Text>
        <Text style={{ marginTop: 8, color: colors.inkFaint, fontSize: 12 }}>
          {t("mobile.rulesFees", { date: RULES_REVIEWED_ON })}
        </Text>
      </View>
    </ScrollScreen>
  );
}

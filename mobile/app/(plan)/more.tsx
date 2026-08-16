import { router } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";
import { formatGbp } from "@/lib/format";
import { GOVUK, LEGAL_NOTICE } from "@/lib/legal";
import { SAMPLE_PROFILES } from "@/lib/samples";
import { FEES_FROM } from "@/lib/fees";
import { RULES_REVIEWED_ON } from "@/lib/types";
import {
  Card,
  Kicker,
  LoadingScreen,
  ScrollScreen,
  SecondaryButton,
  Subtitle,
  Title,
} from "../../src/components/ui";
import { LanguagePicker } from "../../src/language-picker";
import { openOfficial } from "../../src/open-official";
import { useLocale } from "../../src/locale-context";
import { usePlan } from "../../src/plan-context";
import { colors } from "../../src/theme";

const OFFICIAL = [
  { label: "Browse visas on GOV.UK", url: GOVUK.browse },
  { label: "Indefinite leave to remain", url: GOVUK.ilr },
  { label: "British citizenship", url: GOVUK.citizenship },
  { label: "Prove your English", url: GOVUK.proveEnglish },
  { label: "Life in the UK test", url: GOVUK.lifeInUk },
  { label: "Find an immigration adviser", url: GOVUK.adviser },
  { label: "UKVI account / eVisa", url: GOVUK.ukviAccount },
];

export default function MoreScreen() {
  const { profile, plan, save, clear } = usePlan();
  const { t } = useLocale();
  if (!profile || !plan) return <LoadingScreen />;

  function confirmClear() {
    Alert.alert("Clear this plan?", "The sketch is stored only on this phone. This cannot be undone.", [
      { text: "Keep plan", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await clear();
          router.replace("/");
        },
      },
    ]);
  }

  return (
    <ScrollScreen>
      <Kicker>{t("nav.more")}</Kicker>
      <Title>{t("mobile.moreTitle")}</Title>
      <Subtitle>
        Official pages open in your phone browser. This app does not wrap GOV.UK, fill UKVI forms, or
        take card payments.
      </Subtitle>
      <LanguagePicker />

      <Card>
        <Text style={{ fontWeight: "700", color: colors.navy, fontSize: 16 }}>Sketch fees</Text>
        <Text style={{ marginTop: 6, color: colors.inkMuted, fontSize: 13 }}>
          Home Office table from {FEES_FROM}. Totals are illustrative.
        </Text>
        {plan.fees.lines.map((line) => (
          <View
            key={line.id}
            style={{ marginTop: 10, flexDirection: "row", justifyContent: "space-between", gap: 12 }}
          >
            <Text style={{ flex: 1, color: colors.ink, fontSize: 14 }}>{line.label}</Text>
            <Text style={{ fontWeight: "700", color: colors.navy }}>{formatGbp(line.amountGbp)}</Text>
          </View>
        ))}
        <Text style={{ marginTop: 12, fontSize: 18, fontWeight: "700", color: colors.navy }}>
          {formatGbp(plan.fees.totalGbp)}
        </Text>
        <Text style={{ marginTop: 8, color: colors.inkFaint, fontSize: 12, lineHeight: 18 }}>
          {plan.fees.disclaimer}
        </Text>
      </Card>

      <Text
        style={{
          marginTop: 24,
          fontSize: 11,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          color: colors.moss,
          fontWeight: "700",
        }}
      >
        Official pages
      </Text>
      <Pressable onPress={() => openOfficial(plan.route.officialUrl)}>
        <Card>
          <Text style={{ fontWeight: "700", color: colors.navy }}>{plan.route.name} on GOV.UK</Text>
          <Text style={{ marginTop: 4, color: colors.moss, fontWeight: "700" }}>Open official page →</Text>
        </Card>
      </Pressable>
      {OFFICIAL.map((link) => (
        <Pressable key={link.url} onPress={() => openOfficial(link.url)}>
          <Card>
            <Text style={{ fontWeight: "700", color: colors.navy }}>{link.label}</Text>
          </Card>
        </Pressable>
      ))}

      <SecondaryButton label={t("dash.edit")} onPress={() => router.push("/onboarding")} />

      <Text
        style={{
          marginTop: 24,
          fontSize: 11,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          color: colors.moss,
          fontWeight: "700",
        }}
      >
        Load a featured sample
      </Text>
      {SAMPLE_PROFILES.map((sample) => (
        <Pressable
          key={sample.id}
          onPress={async () => {
            await save(sample.profile);
          }}
        >
          <Card>
            <Text style={{ fontWeight: "700", color: colors.navy }}>{sample.title}</Text>
            <Text style={{ marginTop: 4, color: colors.inkMuted, fontSize: 13 }}>{sample.blurb}</Text>
          </Card>
        </Pressable>
      ))}

      <SecondaryButton label={t("dash.reset")} onPress={confirmClear} />

      <View style={{ marginTop: 28 }}>
        <Text style={{ color: colors.inkFaint, fontSize: 12, lineHeight: 18 }}>{LEGAL_NOTICE}</Text>
        <Text style={{ marginTop: 8, color: colors.inkFaint, fontSize: 12, lineHeight: 18 }}>
          Rules last reviewed {RULES_REVIEWED_ON}. Guest plans stay in on-device storage. We never collect
          full passport numbers. The encrypted document vault is website-only and is never uploaded.
        </Text>
      </View>
    </ScrollScreen>
  );
}

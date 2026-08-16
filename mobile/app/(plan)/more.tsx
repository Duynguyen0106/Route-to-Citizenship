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
  { key: "govuk.browse", url: GOVUK.browse },
  { key: "govuk.ilr", url: GOVUK.ilr },
  { key: "govuk.citizenship", url: GOVUK.citizenship },
  { key: "govuk.english", url: GOVUK.proveEnglish },
  { key: "govuk.life", url: GOVUK.lifeInUk },
  { key: "govuk.adviser", url: GOVUK.adviser },
  { key: "govuk.ukvi", url: GOVUK.ukviAccount },
] as const;

export default function MoreScreen() {
  const { profile, plan, save, clear } = usePlan();
  const { t } = useLocale();
  if (!profile || !plan) return <LoadingScreen />;

  function confirmClear() {
    Alert.alert(t("mobile.clearTitle"), t("mobile.clearBody"), [
      { text: t("mobile.keepPlan"), style: "cancel" },
      {
        text: t("mobile.clear"),
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
      <Subtitle>{t("mobile.moreLead")}</Subtitle>
      <LanguagePicker />

      <Card>
        <Text style={{ fontWeight: "700", color: colors.navy, fontSize: 16 }}>{t("mobile.sketchFees")}</Text>
        <Text style={{ marginTop: 6, color: colors.inkMuted, fontSize: 13 }}>
          {t("mobile.feesFrom", { date: FEES_FROM })}
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
        {t("mobile.officialPages")}
      </Text>
      <Pressable onPress={() => openOfficial(plan.route.officialUrl)}>
        <Card>
          <Text style={{ fontWeight: "700", color: colors.navy }}>{t("mobile.onGovuk", { name: plan.route.name })}</Text>
          <Text style={{ marginTop: 4, color: colors.moss, fontWeight: "700" }}>{t("mobile.openOfficial")}</Text>
        </Card>
      </Pressable>
      {OFFICIAL.map((link) => (
        <Pressable key={link.url} onPress={() => openOfficial(link.url)}>
          <Card>
            <Text style={{ fontWeight: "700", color: colors.navy }}>{t(link.key)}</Text>
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
        {t("mobile.loadSample")}
      </Text>
      {SAMPLE_PROFILES.map((sample) => (
        <Pressable
          key={sample.id}
          onPress={async () => {
            await save(sample.profile);
          }}
        >
          <Card>
            <Text style={{ fontWeight: "700", color: colors.navy }}>{t(`sample.${sample.id}.title`)}</Text>
            <Text style={{ marginTop: 4, color: colors.inkMuted, fontSize: 13 }}>
              {t(`sample.${sample.id}.blurb`)}
            </Text>
          </Card>
        </Pressable>
      ))}

      <SecondaryButton label={t("dash.reset")} onPress={confirmClear} />

      <View style={{ marginTop: 28 }}>
        <Text style={{ color: colors.inkFaint, fontSize: 12, lineHeight: 18 }}>{LEGAL_NOTICE}</Text>
        <Text style={{ marginTop: 8, color: colors.inkFaint, fontSize: 12, lineHeight: 18 }}>
          {t("mobile.guestVault", { date: RULES_REVIEWED_ON })}
        </Text>
      </View>
    </ScrollScreen>
  );
}

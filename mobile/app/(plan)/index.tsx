import { Pressable, Text, View } from "react-native";
import { formatLongDate } from "@/lib/format";
import { localiseActionCopy } from "@/lib/i18n";
import { GOVUK, LEGAL_NOTICE } from "@/lib/legal";
import type { ActionHorizon, NextAction } from "@/lib/next-actions";
import {
  Card,
  DisclaimerBanner,
  Kicker,
  LoadingScreen,
  ScrollScreen,
  Subtitle,
  Title,
} from "../../src/components/ui";
import { openOfficial } from "../../src/open-official";
import { useLocale } from "../../src/locale-context";
import { usePlan } from "../../src/plan-context";
import { colors } from "../../src/theme";

const HORIZON_COLOR: Record<ActionHorizon, string> = {
  overdue: colors.clay,
  now: colors.gold,
  soon: colors.navy,
  later: colors.inkFaint,
};

export default function Next90DaysScreen() {
  const { profile, plan, next } = usePlan();
  const { t } = useLocale();
  if (!profile || !plan || !next) return <LoadingScreen />;

  function display(action: NextAction): NextAction {
    const date = action.dueOn
      ? formatLongDate(action.dueOn)
      : String(action.copyVars?.date ?? "");
    return { ...action, ...localiseActionCopy(t, action.copyKey, { ...action.copyVars, date }) };
  }

  return (
    <ScrollScreen>
      <Kicker>{t("nav.next")}</Kicker>
      <Title>{plan.route.name}</Title>
      <Subtitle>
        {t("section.next")} {t("mobile.nextConfirm")}
      </Subtitle>
      <DisclaimerBanner />

      {next.needsAdviser ? (
        <Pressable onPress={() => openOfficial(GOVUK.adviser)}>
          <Card>
            <Text style={{ color: colors.clay, fontWeight: "700" }}>{t("mobile.adviserTitle")}</Text>
            <Text style={{ marginTop: 6, color: colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
              {t("mobile.adviserBody")}
            </Text>
          </Card>
        </Pressable>
      ) : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        {next.milestones.slice(0, 3).map((milestone) => (
          <View
            key={`${milestone.id}-${milestone.date}`}
            style={{
              flexGrow: 1,
              minWidth: 140,
              backgroundColor: colors.white,
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: "rgba(27, 42, 74, 0.1)",
            }}
          >
            <Text style={{ fontSize: 11, color: colors.inkFaint, textTransform: "uppercase" }}>
              {t(`milestone.${milestone.id}`)}
            </Text>
            <Text style={{ marginTop: 6, fontSize: 16, color: colors.navy, fontWeight: "700" }}>
              {formatLongDate(milestone.date)}
            </Text>
          </View>
        ))}
      </View>

      {next.focus.map((action) => {
        const copy = display(action);
        return (
          <Pressable key={action.id} onPress={() => openOfficial(action.officialUrl)}>
            <Card>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  color: HORIZON_COLOR[action.horizon],
                }}
              >
                {t(`next90.horizon.${action.horizon}`)}
              </Text>
              <Text style={{ marginTop: 6, fontSize: 17, fontWeight: "700", color: colors.navy }}>
                {copy.title}
              </Text>
              <Text style={{ marginTop: 6, color: colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
                {copy.detail}
              </Text>
              <Text style={{ marginTop: 10, color: colors.moss, fontWeight: "700", fontSize: 13 }}>
                {copy.officialLabel} →
              </Text>
            </Card>
          </Pressable>
        );
      })}

      <Text style={{ marginTop: 24, color: colors.inkFaint, fontSize: 12, lineHeight: 18 }}>
        {LEGAL_NOTICE}
      </Text>
    </ScrollScreen>
  );
}

import { Pressable, Text, View } from "react-native";
import { formatLongDate } from "@/lib/format";
import { GOVUK, LEGAL_NOTICE } from "@/lib/legal";
import type { ActionHorizon } from "@/lib/next-actions";
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
import { usePlan } from "../../src/plan-context";
import { colors } from "../../src/theme";

const HORIZON_LABEL: Record<ActionHorizon, string> = {
  overdue: "Overdue",
  now: "Do now",
  soon: "Next 90 days",
  later: "Later",
};

const HORIZON_COLOR: Record<ActionHorizon, string> = {
  overdue: colors.clay,
  now: colors.gold,
  soon: colors.navy,
  later: colors.inkFaint,
};

export default function Next90DaysScreen() {
  const { profile, plan, next } = usePlan();
  if (!profile || !plan || !next) return <LoadingScreen />;

  return (
    <ScrollScreen>
      <Kicker>Next 90 days</Kicker>
      <Title>{plan.route.name}</Title>
      <Subtitle>
        Dated next steps from your sketch and encoded GOV.UK facts. Confirm every date in your UKVI
        account.
      </Subtitle>
      <DisclaimerBanner />

      {next.needsAdviser ? (
        <Pressable onPress={() => openOfficial(GOVUK.adviser)}>
          <Card>
            <Text style={{ color: colors.clay, fontWeight: "700" }}>Speak to a regulated adviser</Text>
            <Text style={{ marginTop: 6, color: colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
              This sketch looks non-straightforward. Find an OISC adviser on GOV.UK — this app does not
              instruct anyone for you.
            </Text>
          </Card>
        </Pressable>
      ) : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        {next.milestones.slice(0, 3).map((milestone) => (
          <View
            key={`${milestone.label}-${milestone.date}`}
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
              {milestone.label}
            </Text>
            <Text style={{ marginTop: 6, fontSize: 16, color: colors.navy, fontWeight: "700" }}>
              {formatLongDate(milestone.date)}
            </Text>
          </View>
        ))}
      </View>

      {next.focus.map((action) => (
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
              {HORIZON_LABEL[action.horizon]}
            </Text>
            <Text style={{ marginTop: 6, fontSize: 17, fontWeight: "700", color: colors.navy }}>
              {action.title}
            </Text>
            <Text style={{ marginTop: 6, color: colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
              {action.detail}
            </Text>
            <Text style={{ marginTop: 10, color: colors.moss, fontWeight: "700", fontSize: 13 }}>
              {action.officialLabel} →
            </Text>
          </Card>
        </Pressable>
      ))}

      <Text style={{ marginTop: 24, color: colors.inkFaint, fontSize: 12, lineHeight: 18 }}>
        {LEGAL_NOTICE}
      </Text>
    </ScrollScreen>
  );
}

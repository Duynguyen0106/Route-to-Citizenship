import { Text, View } from "react-native";
import { formatLongDate } from "@/lib/format";
import type { TimelineEvent } from "@/lib/types";
import { Card, Kicker, LoadingScreen, ScrollScreen, Subtitle, Title } from "../../src/components/ui";
import { useLocale } from "../../src/locale-context";
import { usePlan } from "../../src/plan-context";
import { colors } from "../../src/theme";

const KIND_COLOR: Record<TimelineEvent["kind"], string> = {
  past: colors.inkFaint,
  now: colors.gold,
  visa: colors.navy,
  ilr: colors.moss,
  citizenship: colors.moss,
  warning: colors.clay,
  stage: colors.navy700,
  window: colors.gold,
  processing: colors.inkMuted,
};

export default function TimelineScreen() {
  const { plan } = usePlan();
  const { t } = useLocale();
  if (!plan) return <LoadingScreen />;

  return (
    <ScrollScreen>
      <Kicker>{t("nav.timeline")}</Kicker>
      <Title>{t("section.timeline")}</Title>
      <Subtitle>
        {plan.summary} This is not a Home Office calculation and not an approval chance.
      </Subtitle>
      {plan.extensionNote ? (
        <Card>
          <Text style={{ color: colors.clay, fontWeight: "700" }}>Leave may expire first</Text>
          <Text style={{ marginTop: 6, color: colors.ink, fontSize: 14, lineHeight: 20 }}>
            {plan.extensionNote}
          </Text>
        </Card>
      ) : null}
      {plan.timeline.map((event) => (
        <View key={event.id} style={{ flexDirection: "row", marginTop: 14, gap: 12 }}>
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 99,
              marginTop: 6,
              backgroundColor: KIND_COLOR[event.kind],
            }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: colors.inkFaint }}>{formatLongDate(event.date)}</Text>
            <Text style={{ marginTop: 2, fontSize: 16, fontWeight: "700", color: colors.navy }}>
              {event.label}
            </Text>
            {event.note ? (
              <Text style={{ marginTop: 4, color: colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
                {event.note}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </ScrollScreen>
  );
}

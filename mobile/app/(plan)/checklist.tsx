import { Pressable, Text, View } from "react-native";
import { Card, Kicker, LoadingScreen, ScrollScreen, Subtitle, Title } from "../../src/components/ui";
import { usePlan } from "../../src/plan-context";
import { colors } from "../../src/theme";

export default function ChecklistScreen() {
  const { profile, plan, patch } = usePlan();
  if (!profile || !plan) return <LoadingScreen />;

  async function toggle(id: string) {
    await patch((current) => {
      const has = current.checkedDocumentIds.includes(id);
      return {
        ...current,
        checkedDocumentIds: has
          ? current.checkedDocumentIds.filter((item) => item !== id)
          : [...current.checkedDocumentIds, id],
      };
    });
  }

  const groups = ["identity", "residence", "route", "english", "application"] as const;
  const grouped = groups
    .map((group) => ({
      group,
      items: plan.checklist.filter((item) => item.group === group),
    }))
    .filter((row) => row.items.length > 0);

  return (
    <ScrollScreen>
      <Kicker>Checklist</Kicker>
      <Title>Evidence to gather</Title>
      <Subtitle>
        Tick items as you collect them. This planner never asks for passport numbers or Home Office
        references. Confirm the live list on GOV.UK.
      </Subtitle>
      {grouped.map((row) => (
        <View key={row.group} style={{ marginTop: 8 }}>
          <Text
            style={{
              marginTop: 16,
              fontSize: 11,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: colors.moss,
              fontWeight: "700",
            }}
          >
            {row.group}
          </Text>
          {row.items.map((item) => {
            const checked = profile.checkedDocumentIds.includes(item.id);
            return (
              <Pressable key={item.id} onPress={() => toggle(item.id)} accessibilityRole="checkbox">
                <Card>
                  <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: checked ? colors.moss : colors.inkFaint,
                        backgroundColor: checked ? colors.moss : colors.white,
                        marginTop: 2,
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.navy }}>
                        {item.label}
                        {item.required ? "" : " (optional)"}
                      </Text>
                      <Text style={{ marginTop: 6, color: colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
                        {item.detail}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollScreen>
  );
}

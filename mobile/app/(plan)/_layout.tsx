import { Redirect, Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";
import { LoadingScreen } from "../../src/components/ui";
import { useLocale } from "../../src/locale-context";
import { usePlan } from "../../src/plan-context";
import { colors } from "../../src/theme";

function Glyph({ label, color }: { label: string; color: ColorValue }) {
  return (
    <Text style={{ color, fontSize: 12, fontWeight: "800", letterSpacing: 0.4 }}>{label}</Text>
  );
}

export default function PlanTabsLayout() {
  const { ready, profile } = usePlan();
  const { t } = useLocale();
  if (!ready) return <LoadingScreen />;
  if (!profile) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: { backgroundColor: colors.paper50, borderTopColor: colors.paper200 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("nav.next"),
          tabBarIcon: ({ color }) => <Glyph label="90" color={color} />,
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: t("nav.timeline"),
          tabBarIcon: ({ color }) => <Glyph label="TL" color={color} />,
        }}
      />
      <Tabs.Screen
        name="checklist"
        options={{
          title: t("nav.checklist"),
          tabBarIcon: ({ color }) => <Glyph label="CK" color={color} />,
        }}
      />
      <Tabs.Screen
        name="absences"
        options={{
          title: t("nav.absences"),
          tabBarIcon: ({ color }) => <Glyph label="AB" color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t("nav.more"),
          tabBarIcon: ({ color }) => <Glyph label="··" color={color} />,
        }}
      />
    </Tabs>
  );
}

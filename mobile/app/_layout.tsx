import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PlanProvider } from "../src/plan-context";
import { LocaleProvider } from "../src/locale-context";
import { colors } from "../src/theme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LocaleProvider>
        <PlanProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.paper },
            }}
          />
        </PlanProvider>
      </LocaleProvider>
    </GestureHandlerRootView>
  );
}

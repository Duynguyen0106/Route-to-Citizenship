import { Link, Stack } from "expo-router";
import { Text } from "react-native";
import { ScrollScreen, Title } from "../src/components/ui";
import { colors } from "../src/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Not found" }} />
      <ScrollScreen>
        <Title>That screen is not in this app</Title>
        <Link href="/" style={{ marginTop: 16 }}>
          <Text style={{ color: colors.navy, fontWeight: "700" }}>Back to the start</Text>
        </Link>
      </ScrollScreen>
    </>
  );
}

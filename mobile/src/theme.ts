import { Platform, StyleSheet } from "react-native";

export const colors = {
  paper: "#F6F1E8",
  paper50: "#FBF8F3",
  paper200: "#EDE4D4",
  ink: "#1C1917",
  inkMuted: "#57534E",
  inkFaint: "#A8A29E",
  navy: "#1B2A4A",
  navy700: "#24365E",
  navy800: "#152238",
  white: "#FFFFFF",
  moss: "#2F5D45",
  gold: "#C4A35A",
  clay: "#B85C38",
};

export const serif = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "serif",
});

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: colors.moss,
    fontWeight: "600",
  },
  title: {
    marginTop: 8,
    fontSize: 28,
    lineHeight: 34,
    color: colors.navy,
    fontFamily: serif,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkMuted,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(27, 42, 74, 0.1)",
    padding: 16,
    marginTop: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.navy,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(27, 42, 74, 0.18)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.paper50,
  },
});

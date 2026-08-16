import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, styles } from "../theme";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      {children}
    </SafeAreaView>
  );
}

export function ScrollScreen({ children }: { children: ReactNode }) {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </Screen>
  );
}

export function LoadingScreen() {
  return (
    <View style={[styles.screen, { alignItems: "center", justifyContent: "center" }]}>
      <ActivityIndicator color={colors.navy} />
    </View>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return <Text style={styles.kicker}>{children}</Text>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  ...rest
}: { label: string } & TextInputProps) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        {...rest}
      />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={{
        marginTop: 16,
        backgroundColor: disabled ? colors.inkFaint : colors.navy,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
      }}
    >
      <Text style={{ color: colors.white, fontWeight: "700", fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        marginTop: 10,
        borderRadius: 14,
        paddingVertical: 13,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(27, 42, 74, 0.2)",
        backgroundColor: colors.white,
      }}
    >
      <Text style={{ color: colors.navy, fontWeight: "700", fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

export function Choice({
  label,
  selected,
  onPress,
  detail,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  detail?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        marginTop: 8,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: selected ? colors.navy : "rgba(27, 42, 74, 0.12)",
        backgroundColor: selected ? colors.navy : colors.white,
        paddingVertical: 12,
        paddingHorizontal: 14,
      }}
    >
      <Text style={{ color: selected ? colors.white : colors.navy, fontWeight: "600", fontSize: 15 }}>
        {label}
      </Text>
      {detail ? (
        <Text style={{ marginTop: 4, color: selected ? colors.paper200 : colors.inkMuted, fontSize: 13 }}>
          {detail}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function DisclaimerBanner() {
  return (
    <View
      style={{
        marginTop: 16,
        borderRadius: 14,
        padding: 14,
        backgroundColor: "rgba(184, 92, 56, 0.1)",
        borderWidth: 1,
        borderColor: "rgba(184, 92, 56, 0.28)",
      }}
    >
      <Text style={{ color: colors.clay, fontWeight: "700", fontSize: 12, letterSpacing: 0.4 }}>
        NOT IMMIGRATION ADVICE
      </Text>
      <Text style={{ marginTop: 6, color: colors.ink, fontSize: 13, lineHeight: 19 }}>
        This app is a planning aid. It is not immigration advice, legal advice, or a Home Office
        service. Confirm every date and fee on GOV.UK or with an OISC-regulated adviser before you
        apply.
      </Text>
    </View>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <Text style={{ marginTop: 10, color: colors.clay, fontSize: 14, lineHeight: 20 }}>{children}</Text>
  );
}

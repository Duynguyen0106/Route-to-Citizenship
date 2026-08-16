import { Pressable, Text, View } from "react-native";
import { LOCALES, LOCALE_META } from "@/lib/i18n";
import { useLocale } from "./locale-context";
import { colors } from "./theme";

export function LanguagePicker() {
  const { locale, setLocale, t } = useLocale();
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy, marginBottom: 8 }}>
        {t("lang.label")}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {LOCALES.map((code) => {
          const selected = locale === code;
          return (
            <Pressable
              key={code}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={LOCALE_META[code].label}
              onPress={() => void setLocale(code)}
              style={{
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: selected ? colors.navy : "rgba(27, 42, 74, 0.15)",
                backgroundColor: selected ? colors.navy : colors.white,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: selected ? colors.white : colors.navy, fontWeight: "600", fontSize: 13 }}>
                {LOCALE_META[code].native}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

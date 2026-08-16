import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { tripDays } from "@/lib/absences";
import { GOVUK } from "@/lib/legal";
import {
  Card,
  Field,
  Kicker,
  LoadingScreen,
  PrimaryButton,
  ScrollScreen,
  Subtitle,
  Title,
} from "../../src/components/ui";
import { openOfficial } from "../../src/open-official";
import { useLocale } from "../../src/locale-context";
import { usePlan } from "../../src/plan-context";
import { newLocalId } from "../../src/storage";
import { colors } from "../../src/theme";

export default function AbsencesScreen() {
  const { profile, plan, patch } = usePlan();
  const { t } = useLocale();
  const [departedOn, setDepartedOn] = useState("");
  const [returnedOn, setReturnedOn] = useState("");
  const [place, setPlace] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!profile || !plan) return <LoadingScreen />;
  const absences = plan.absences;

  async function addTrip() {
    if (!departedOn || !returnedOn) {
      setError(t("mobile.errDates"));
      return;
    }
    if (returnedOn <= departedOn) {
      setError(t("mobile.errReturn"));
      return;
    }
    await patch((current) => ({
      ...current,
      absences: [
        ...current.absences,
        { id: newLocalId("trip"), departedOn, returnedOn, place: place.trim() || t("mobile.defaultPlace") },
      ],
    }));
    setDepartedOn("");
    setReturnedOn("");
    setPlace("");
    setError(null);
  }

  return (
    <ScrollScreen>
      <Kicker>{t("nav.absences")}</Kicker>
      <Title>{t("section.absences")}</Title>
      <Subtitle>{t("mobile.absencesLead")}</Subtitle>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        <Stat label={t("mobile.last12")} value={t("mobile.daysCount", { days: absences.last12Months })} warn={absences.breached180} />
        <Stat label={t("mobile.left180")} value={t("mobile.daysCount", { days: absences.remainingLast12 })} />
        <Stat label={t("mobile.cit12")} value={t("mobile.daysCount", { days: absences.remainingCitizenship12 })} />
      </View>
      {absences.breached180 ? (
        <Pressable onPress={() => openOfficial(GOVUK.ilr)}>
          <Card>
            <Text style={{ color: colors.clay, fontWeight: "700" }}>{t("mobile.risk180")}</Text>
            <Text style={{ marginTop: 6, color: colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
              {t("mobile.risk180Body")}
            </Text>
          </Card>
        </Pressable>
      ) : null}

      {profile.absences.map((trip) => (
        <Card key={trip.id}>
          <Text style={{ fontWeight: "700", color: colors.navy }}>{trip.place}</Text>
          <Text style={{ marginTop: 4, color: colors.inkMuted, fontSize: 14 }}>
            {trip.departedOn} → {trip.returnedOn} · {tripDays(trip)} days
          </Text>
          <Pressable
            onPress={() =>
              patch((current) => ({
                ...current,
                absences: current.absences.filter((item) => item.id !== trip.id),
              }))
            }
            style={{ marginTop: 10 }}
          >
            <Text style={{ color: colors.clay, fontWeight: "700" }}>{t("mobile.remove")}</Text>
          </Pressable>
        </Card>
      ))}

      <Text
        style={{
          marginTop: 24,
          fontSize: 11,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          color: colors.moss,
          fontWeight: "700",
        }}
      >
        {t("mobile.addTrip")}
      </Text>
      <Field label={t("mobile.departed")} value={departedOn} onChangeText={setDepartedOn} placeholder="2025-12-20" />
      <Field label={t("mobile.returned")} value={returnedOn} onChangeText={setReturnedOn} placeholder="2026-01-10" />
      <Field label={t("mobile.place")} value={place} onChangeText={setPlace} placeholder="Country or city" autoCapitalize="words" />
      {error ? <Text style={{ marginTop: 8, color: colors.clay }}>{error}</Text> : null}
      <PrimaryButton label={t("mobile.saveTrip")} onPress={addTrip} />
      <Text style={{ marginTop: 16, color: colors.inkFaint, fontSize: 12, lineHeight: 18 }}>
        {t("mobile.absencesNote")}
      </Text>
    </ScrollScreen>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <View
      style={{
        flexGrow: 1,
        minWidth: 140,
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: warn ? "rgba(184, 92, 56, 0.35)" : "rgba(27, 42, 74, 0.1)",
      }}
    >
      <Text style={{ fontSize: 11, color: colors.inkFaint }}>{label}</Text>
      <Text style={{ marginTop: 6, fontSize: 18, fontWeight: "700", color: warn ? colors.clay : colors.navy }}>
        {value}
      </Text>
    </View>
  );
}

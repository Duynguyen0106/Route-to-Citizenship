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
      setError("Enter departure and return dates as YYYY-MM-DD.");
      return;
    }
    if (returnedOn <= departedOn) {
      setError("Return date must be after departure.");
      return;
    }
    await patch((current) => ({
      ...current,
      absences: [
        ...current.absences,
        { id: newLocalId("trip"), departedOn, returnedOn, place: place.trim() || "Outside the UK" },
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
      <Subtitle>
        ILR usually looks at 180 days in any 12 months. Citizenship uses different windows. This is a
        sketch, not a Home Office calculation.
      </Subtitle>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        <Stat label="Last 12 months" value={`${absences.last12Months} days`} warn={absences.breached180} />
        <Stat label="Left under 180-day sketch" value={`${absences.remainingLast12} days`} />
        <Stat label="Citizenship 12-month remainder" value={`${absences.remainingCitizenship12} days`} />
      </View>
      {absences.breached180 ? (
        <Pressable onPress={() => openOfficial(GOVUK.ilr)}>
          <Card>
            <Text style={{ color: colors.clay, fontWeight: "700" }}>180-day risk sketched</Text>
            <Text style={{ marginTop: 6, color: colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
              Logged trips sketch more than 180 days outside the UK in a 12-month window. Confirm the
              live rule on GOV.UK.
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
            <Text style={{ color: colors.clay, fontWeight: "700" }}>Remove</Text>
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
        Add a trip
      </Text>
      <Field label="Departed (YYYY-MM-DD)" value={departedOn} onChangeText={setDepartedOn} placeholder="2025-12-20" />
      <Field label="Returned (YYYY-MM-DD)" value={returnedOn} onChangeText={setReturnedOn} placeholder="2026-01-10" />
      <Field label="Place (optional)" value={place} onChangeText={setPlace} placeholder="Country or city" autoCapitalize="words" />
      {error ? <Text style={{ marginTop: 8, color: colors.clay }}>{error}</Text> : null}
      <PrimaryButton label="Save trip on this device" onPress={addTrip} />
      <Text style={{ marginTop: 16, color: colors.inkFaint, fontSize: 12, lineHeight: 18 }}>
        GPS import and the encrypted document vault stay on the website. This phone app only stores the
        dates you type here.
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

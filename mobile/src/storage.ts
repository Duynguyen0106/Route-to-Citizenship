import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeProfile, STORAGE_KEY } from "@/lib/storage";
import type { Profile } from "@/lib/types";

export async function loadMobileProfile(): Promise<Profile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Profile> & Pick<Profile, "currentVisaId">;
    if (!parsed.currentVisaId || !parsed.qualifyingResidenceStart) return null;
    return normalizeProfile(parsed);
  } catch {
    return null;
  }
}

export async function saveMobileProfile(profile: Profile): Promise<void> {
  const next = normalizeProfile({ ...profile, updatedAt: new Date().toISOString() });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function clearMobileProfile(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function newLocalId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

import { DEFAULT_REMINDER_PREFS, type Profile } from "./types";

export const STORAGE_KEY = "rtc-profile-v1";

export function emptyProfile(): Omit<Profile, "id" | "updatedAt"> {
  return {
    currentVisaId: "skilled-worker",
    visaGrantedOn: "",
    visaExpiresOn: "",
    qualifyingResidenceStart: "",
    ukEntryDate: "",
    daysAbsentLast12Months: 0,
    exceeded180DaysInAny12Months: false,
    daysAbsentLast5Years: 0,
    daysAbsentLast12MonthsCitizenship: 0,
    englishStatus: "not_met",
    lifeInUkStatus: "not_taken",
    nationality: "OTHER",
    ageBand: "18_to_64",
    marriedToBritishCitizen: false,
    hasSettledPartner: false,
    reminderPrefs: { ...DEFAULT_REMINDER_PREFS },
    checkedDocumentIds: [],
  };
}

export function createProfile(partial: Omit<Profile, "id" | "updatedAt">): Profile {
  return {
    ...partial,
    id: crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
  };
}

export function loadProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Profile;
    if (!parsed.currentVisaId || !parsed.qualifyingResidenceStart) return null;
    return {
      ...emptyProfile(),
      ...parsed,
      reminderPrefs: { ...DEFAULT_REMINDER_PREFS, ...parsed.reminderPrefs },
      checkedDocumentIds: parsed.checkedDocumentIds ?? [],
    };
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  const next = { ...profile, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearProfile(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

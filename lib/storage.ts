import { inferPathway } from "./pathways";
import { DEFAULT_REMINDER_PREFS, type Profile } from "./types";
import { syncLegacyPlannedSwitch } from "./switch-chain";

export const STORAGE_KEY = "rtc-profile-v1";

export function emptyProfile(): Omit<Profile, "id" | "updatedAt"> {
  return {
    pathwayId: "skilled-worker",
    currentVisaId: "skilled-worker",
    visaGrantedOn: "",
    visaExpiresOn: "",
    qualifyingResidenceStart: "",
    ukEntryDate: "",
    priorStages: [],
    plannedSwitchOn: "",
    plannedSwitchTo: "skilled-worker",
    plannedSwitches: [],
    dependants: [],
    mainApplicantIlrOn: "",
    bornInUk: false,
    hasBritishParent: false,
    absences: [],
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
    dependantCount: 0,
    applyFromInsideUk: true,
    sponsorshipOverThreeYears: true,
    reminderPrefs: { ...DEFAULT_REMINDER_PREFS },
    checkedDocumentIds: [],
  };
}

export function normalizeProfile(profile: Partial<Profile> & Pick<Profile, "currentVisaId">): Profile {
  const base = emptyProfile();
  const merged = {
    ...base,
    ...profile,
    id: profile.id ?? "profile",
    updatedAt: profile.updatedAt ?? new Date().toISOString(),
    pathwayId: profile.pathwayId ?? inferPathway(profile.currentVisaId),
    priorStages: profile.priorStages ?? [],
    plannedSwitchOn: profile.plannedSwitchOn ?? "",
    plannedSwitchTo: profile.plannedSwitchTo || "skilled-worker",
    plannedSwitches: profile.plannedSwitches ?? [],
    dependants: profile.dependants ?? [],
    mainApplicantIlrOn: profile.mainApplicantIlrOn ?? "",
    bornInUk: profile.bornInUk ?? false,
    hasBritishParent: profile.hasBritishParent ?? false,
    absences: profile.absences ?? [],
    reminderPrefs: { ...DEFAULT_REMINDER_PREFS, ...profile.reminderPrefs },
    checkedDocumentIds: profile.checkedDocumentIds ?? [],
    dependantCount: profile.dependantCount ?? 0,
    applyFromInsideUk: profile.applyFromInsideUk ?? true,
    sponsorshipOverThreeYears: profile.sponsorshipOverThreeYears ?? true,
  };
  return {
    ...merged,
    ...syncLegacyPlannedSwitch(merged),
  };
}

export function createProfile(partial: Omit<Profile, "id" | "updatedAt">): Profile {
  return normalizeProfile({
    ...partial,
    id: crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
  });
}

export function loadProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Profile> & Pick<Profile, "currentVisaId">;
    if (!parsed.currentVisaId || !parsed.qualifyingResidenceStart) return null;
    return normalizeProfile(parsed);
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  const next = normalizeProfile({ ...profile, updatedAt: new Date().toISOString() });
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearProfile(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

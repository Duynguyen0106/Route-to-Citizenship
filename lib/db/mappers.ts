import { differenceInCalendarDays, parseISO } from "date-fns";
import type { EnglishStatus, PathwayId, Profile, Reminder } from "../types";
import { inferPathway } from "../pathways";
import { normalizeProfile } from "../storage";

export const CURRENT_VISA_TYPES = [
  "SKILLED_WORKER",
  "FAMILY",
  "STUDENT",
  "GRADUATE",
  "GLOBAL_TALENT",
  "OTHER",
] as const;

export type CurrentVisaType = (typeof CURRENT_VISA_TYPES)[number];

export const ROUTE_KEYS: Record<PathwayId, string> = {
  "skilled-worker": "skilled-worker-ilr-citizenship",
  family: "family-ilr-citizenship",
  "student-to-skilled": "student-graduate-skilled-worker-ilr-citizenship",
  "global-talent": "global-talent-ilr-citizenship",
  "long-residence": "long-residence-ilr-citizenship",
};

const ROUTE_KEY_TO_PATHWAY = Object.fromEntries(
  Object.entries(ROUTE_KEYS).map(([pathway, key]) => [key, pathway]),
) as Record<string, PathwayId>;

export function visaIdToCurrentVisaType(visaId: string): CurrentVisaType {
  if (visaId === "skilled-worker" || visaId === "health-care-worker") return "SKILLED_WORKER";
  if (visaId.startsWith("spouse") || visaId === "parent") return "FAMILY";
  if (visaId === "student") return "STUDENT";
  if (visaId === "graduate") return "GRADUATE";
  if (visaId.startsWith("global-talent")) return "GLOBAL_TALENT";
  return "OTHER";
}

export function pathwayToRouteKey(pathwayId: PathwayId): string {
  return ROUTE_KEYS[pathwayId];
}

export function routeKeyToPathway(routeKey: string): PathwayId {
  return ROUTE_KEY_TO_PATHWAY[routeKey] ?? inferPathway(routeKey);
}

export function englishStatusToLevel(status: EnglishStatus): string | null {
  switch (status) {
    case "b1_or_higher":
      return "B1";
    case "degree_taught_in_english":
      return "degree";
    case "majority_english_national":
    case "exempt_age":
    case "exempt_medical":
      return "exempt";
    default:
      return null;
  }
}

export function relationshipToSettled(profile: Profile): string {
  if (profile.marriedToBritishCitizen) return "spouse";
  if (profile.hasSettledPartner) return "partner";
  return "none";
}

export function reminderKindToType(kind: Reminder["kind"]): string {
  switch (kind) {
    case "visa_expiry":
      return "VISA_EXPIRY";
    case "ilr":
      return "ILR_ELIGIBILITY";
    case "citizenship":
      return "CITIZENSHIP_ELIGIBILITY";
    case "test":
      return "LIFE_IN_UK_TEST";
    default:
      return "VISA_EXPIRY";
  }
}

export interface PlannerState {
  currentVisaId: string;
  pathwayId: PathwayId;
  qualifyingResidenceStart: string;
  plannedSwitchOn: string;
  plannedSwitchTo: string;
  ageBand: Profile["ageBand"];
  dependantCount: number;
  applyFromInsideUk: boolean;
  sponsorshipOverThreeYears: boolean;
  reminderPrefs: Profile["reminderPrefs"];
  checkedDocumentIds: string[];
  englishStatus: EnglishStatus;
  lifeInUkStatus: Profile["lifeInUkStatus"];
  marriedToBritishCitizen: boolean;
  hasSettledPartner: boolean;
}

export function plannerStateFromProfile(profile: Profile): PlannerState {
  return {
    currentVisaId: profile.currentVisaId,
    pathwayId: profile.pathwayId,
    qualifyingResidenceStart: profile.qualifyingResidenceStart,
    plannedSwitchOn: profile.plannedSwitchOn,
    plannedSwitchTo: profile.plannedSwitchTo,
    ageBand: profile.ageBand,
    dependantCount: profile.dependantCount,
    applyFromInsideUk: profile.applyFromInsideUk,
    sponsorshipOverThreeYears: profile.sponsorshipOverThreeYears,
    reminderPrefs: profile.reminderPrefs,
    checkedDocumentIds: profile.checkedDocumentIds,
    englishStatus: profile.englishStatus,
    lifeInUkStatus: profile.lifeInUkStatus,
    marriedToBritishCitizen: profile.marriedToBritishCitizen,
    hasSettledPartner: profile.hasSettledPartner,
  };
}

export function isoDate(value: Date | string): string {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

export function daysAway(start: string, end: string): number {
  return Math.max(0, differenceInCalendarDays(parseISO(end), parseISO(start)));
}

export interface DbProfileShape {
  id: string;
  nationality: string;
  currentVisaType: string;
  visaStartDate: Date;
  visaExpiryDate: Date;
  firstEntryUK: Date | null;
  relationshipToSettled: string | null;
  englishLevel: string | null;
  lifeInUKPassed: boolean;
  plannerState: unknown;
  updatedAt: Date;
  visaEvents: {
    visaType: string;
    startDate: Date;
    endDate: Date | null;
    notes: string | null;
  }[];
  absenceRecords: {
    id: string;
    startDate: Date;
    endDate: Date;
    reason: string | null;
  }[];
  routeSelections: { routeKey: string; isCurrent: boolean }[];
}

export function dbProfileToPlanner(row: DbProfileShape): Profile {
  const state = (row.plannerState ?? {}) as Partial<PlannerState>;
  const currentRoute = row.routeSelections.find((item) => item.isCurrent)?.routeKey;
  const historyEvents = row.visaEvents.filter((event) => event.notes === "history");
  const planned = row.visaEvents.find((event) => event.notes === "planned-switch");

  return normalizeProfile({
    id: row.id,
    updatedAt: row.updatedAt.toISOString(),
    nationality: row.nationality,
    currentVisaId: state.currentVisaId ?? currentVisaTypeToDefaultVisaId(row.currentVisaType),
    pathwayId: state.pathwayId ?? (currentRoute ? routeKeyToPathway(currentRoute) : inferPathway(state.currentVisaId ?? "other")),
    visaGrantedOn: isoDate(row.visaStartDate),
    visaExpiresOn: isoDate(row.visaExpiryDate),
    qualifyingResidenceStart: state.qualifyingResidenceStart ?? isoDate(row.firstEntryUK ?? row.visaStartDate),
    ukEntryDate: row.firstEntryUK ? isoDate(row.firstEntryUK) : "",
    priorStages: historyEvents.map((event) => ({
      visaId: event.visaType,
      start: isoDate(event.startDate),
      end: event.endDate ? isoDate(event.endDate) : "",
    })),
    plannedSwitchOn: state.plannedSwitchOn ?? (planned ? isoDate(planned.startDate) : ""),
    plannedSwitchTo: state.plannedSwitchTo ?? planned?.visaType ?? "skilled-worker",
    absences: row.absenceRecords.map((record) => ({
      id: record.id,
      departedOn: isoDate(record.startDate),
      returnedOn: isoDate(record.endDate),
      place: record.reason ?? "",
    })),
    englishStatus: state.englishStatus ?? levelToEnglishStatus(row.englishLevel),
    lifeInUkStatus: state.lifeInUkStatus ?? (row.lifeInUKPassed ? "passed" : "not_taken"),
    ageBand: state.ageBand ?? "18_to_64",
    dependantCount: state.dependantCount ?? 0,
    applyFromInsideUk: state.applyFromInsideUk ?? true,
    sponsorshipOverThreeYears: state.sponsorshipOverThreeYears ?? true,
    reminderPrefs: state.reminderPrefs,
    checkedDocumentIds: state.checkedDocumentIds ?? [],
    marriedToBritishCitizen: state.marriedToBritishCitizen ?? row.relationshipToSettled === "spouse",
    hasSettledPartner:
      state.hasSettledPartner ??
      (row.relationshipToSettled === "partner" || row.relationshipToSettled === "spouse"),
  });
}

export function currentVisaTypeToDefaultVisaId(type: string): string {
  switch (type) {
    case "SKILLED_WORKER":
      return "skilled-worker";
    case "FAMILY":
      return "spouse-5";
    case "STUDENT":
      return "student";
    case "GRADUATE":
      return "graduate";
    case "GLOBAL_TALENT":
      return "global-talent-talent";
    default:
      return "long-residence";
  }
}

function levelToEnglishStatus(level: string | null): EnglishStatus {
  if (level === "B1" || level === "B2") return "b1_or_higher";
  if (level === "degree") return "degree_taught_in_english";
  if (level === "exempt") return "exempt_age";
  return "not_met";
}

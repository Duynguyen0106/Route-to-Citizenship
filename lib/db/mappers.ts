import { differenceInCalendarDays, parseISO } from "date-fns";
import type { EnglishStatus, PathwayId, Profile, Reminder } from "../types";
import { inferPathway } from "../pathways";
import {
  getRouteForPathway,
  PATHWAY_TO_ROUTE,
  visaIdToCurrentVisaType,
  type CurrentVisaType,
  type RouteId,
} from "../routes";
import { normalizeProfile } from "../storage";

export type { CurrentVisaType };
export { visaIdToCurrentVisaType };

const LEGACY_ROUTE_KEYS: Record<string, PathwayId> = {
  "skilled-worker-ilr-citizenship": "skilled-worker",
  "family-ilr-citizenship": "family",
  "student-graduate-skilled-worker-ilr-citizenship": "student-to-skilled",
  "global-talent-ilr-citizenship": "global-talent",
  "long-residence-ilr-citizenship": "long-residence",
};

export function pathwayToRouteKey(pathwayId: PathwayId): string {
  return getRouteForPathway(pathwayId).key;
}

export function routeKeyToPathway(routeKey: string): PathwayId {
  if (routeKey in LEGACY_ROUTE_KEYS) return LEGACY_ROUTE_KEYS[routeKey];
  for (const [pathwayId, routeId] of Object.entries(PATHWAY_TO_ROUTE) as [PathwayId, RouteId][]) {
    if (routeId === routeKey || getRouteForPathway(pathwayId).key === routeKey) {
      return pathwayId;
    }
  }
  return inferPathway(routeKey);
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
  plannedSwitches: Profile["plannedSwitches"];
  dependants: Profile["dependants"];
  mainApplicantIlrOn: string;
  bornInUk: boolean;
  hasBritishParent: boolean;
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
    plannedSwitches: profile.plannedSwitches,
    dependants: profile.dependants,
    mainApplicantIlrOn: profile.mainApplicantIlrOn,
    bornInUk: profile.bornInUk,
    hasBritishParent: profile.hasBritishParent,
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
  const from = parseISO(start);
  const to = parseISO(end);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
  return Math.max(0, differenceInCalendarDays(to, from));
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
    plannedSwitches: state.plannedSwitches ?? [],
    dependants: state.dependants ?? [],
    mainApplicantIlrOn: state.mainApplicantIlrOn ?? "",
    bornInUk: state.bornInUk ?? false,
    hasBritishParent: state.hasBritishParent ?? false,
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
    case "INNOVATOR_FOUNDER":
      return "innovator-founder";
    case "SCALE_UP":
      return "scale-up";
    case "SPORTSPERSON":
      return "sportsperson";
    case "MINISTER_OF_RELIGION":
      return "minister-of-religion";
    case "GBM":
      return "gbm";
    case "YOUTH_MOBILITY":
      return "youth-mobility";
    case "ANCESTRY":
      return "ancestry";
    case "BNO":
      return "bno";
    case "HPI":
      return "hpi";
    case "PROTECTION":
      return "refugee";
    case "EUSS":
      return "pre-settled";
    case "DEPENDANT":
      return "dependant";
    case "CHILD_REGISTRATION":
      return "child-registration";
    case "VISITOR":
      return "visitor";
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

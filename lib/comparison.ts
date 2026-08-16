import { addYears, parseISO } from "date-fns";
import { toIsoDate } from "@/lib/dates";
import { inferPathway } from "@/lib/pathways";
import {
  effectiveMinYearsToILR,
  getRouteForPathway,
  listRoutes,
  visaIdToCurrentVisaType,
  type RouteDefinition,
} from "@/lib/routes";
import { getPossibleSwitches, simulateSwitch } from "@/lib/simulate";
import { getRoute } from "@/lib/visas";
import type { PlanResult, PossibleSwitch, Profile } from "@/lib/types";

export interface RouteComparisonCard {
  key: string;
  name: string;
  yearsToILR: number | null;
  yearsToCitizenship: number | null;
  mainRequirements: string[];
  current: boolean;
  eligibleToSwitch: boolean;
  toVisaId: string;
  ilrDate: string | null;
  citizenshipDate: string | null;
  clockNote?: string;
}

function yearsToCitizenshipFromIlr(
  yearsToILR: number | null,
  marriedToBritishCitizen: boolean,
): number | null {
  if (yearsToILR === null) return null;
  return marriedToBritishCitizen ? yearsToILR : yearsToILR + 1;
}

export function routeRequirements(route: RouteDefinition): string[] {
  const items: string[] = [];
  if (route.englishRequirement) {
    items.push(`English at ${route.englishRequirement} (or an accepted equivalent)`);
  }
  if (route.lifeInUKRequired) items.push("Life in the UK test pass");
  if (route.ilrRequiresContinuousResidence) {
    items.push(
      route.absenceLimit
        ? `Continuous residence (usually under ${route.absenceLimit} days away in any 12 months)`
        : "Continuous residence",
    );
  }
  const note = route.notes.split(".")[0]?.trim();
  if (note) items.push(note);
  return items.slice(0, 4);
}

function switchForRoute(route: RouteDefinition, possible: PossibleSwitch[]): PossibleSwitch | undefined {
  return possible.find((item) => item.routeKey === route.key);
}

export function buildRouteComparison(
  profile: Profile,
  plan: PlanResult,
  asOf: Date = new Date(),
): RouteComparisonCard[] {
  const possible = getPossibleSwitches(profile, asOf);
  const currentType = visaIdToCurrentVisaType(profile.currentVisaId);

  return listRoutes().map((route) => {
    const current = getRouteForPathway(profile.pathwayId).key === route.key;
    const option = switchForRoute(route, possible);
    const yearsToILR = current
      ? effectiveMinYearsToILR(route, currentType, {
          plannedSwitch: Boolean(profile.plannedSwitchOn),
          currentVisaId: profile.currentVisaId,
        })
      : (option?.yearsToILR ?? route.minYearsToILR);
    const ilrDate = current
      ? plan.ilrEligibleOn
      : option?.estimatedILRDate
        ? toIsoDate(option.estimatedILRDate)
        : null;
    const citizenshipDate = current
      ? plan.citizenshipEligibleOn
      : option?.estimatedCitizenshipDate
        ? toIsoDate(option.estimatedCitizenshipDate)
        : null;

    return {
      key: route.key,
      name: route.name,
      yearsToILR,
      yearsToCitizenship: yearsToCitizenshipFromIlr(yearsToILR, profile.marriedToBritishCitizen),
      mainRequirements: routeRequirements(route),
      current,
      eligibleToSwitch: Boolean(option),
      toVisaId: option?.toVisaId ?? profile.currentVisaId,
      ilrDate,
      citizenshipDate,
      clockNote: option?.clockNote,
    };
  });
}

export function expiryAfterSwitch(toVisaId: string, asOf: string, currentExpiry: string): string {
  if (currentExpiry && currentExpiry > asOf) return currentExpiry;
  const years = getRoute(toVisaId).typicalGrantYears ?? 3;
  return toIsoDate(addYears(parseISO(asOf), years));
}

export function applyRouteSwitch(profile: Profile, plan: PlanResult, toVisaId: string): Profile {
  const asOf = parseISO(plan.asOf);
  const simulation = simulateSwitch(
    profile,
    toVisaId,
    asOf,
    plan.ilrEligibleOn && plan.route.id !== "ilr" ? parseISO(plan.ilrEligibleOn) : null,
    plan.citizenshipEligibleOn ? parseISO(plan.citizenshipEligibleOn) : null,
  );
  return {
    ...profile,
    currentVisaId: toVisaId,
    pathwayId: inferPathway(toVisaId),
    visaGrantedOn: plan.asOf,
    visaExpiresOn: expiryAfterSwitch(toVisaId, plan.asOf, profile.visaExpiresOn),
    qualifyingResidenceStart: simulation.newQualifyingStart,
    plannedSwitchOn: "",
    plannedSwitchTo: toVisaId === "skilled-worker" ? "skilled-worker" : profile.plannedSwitchTo,
  };
}

import type { PathwayId } from "./types";

export const CURRENT_VISA_TYPES = [
  "SKILLED_WORKER",
  "FAMILY",
  "STUDENT",
  "GRADUATE",
  "GLOBAL_TALENT",
  "OTHER",
] as const;

export type CurrentVisaType = (typeof CURRENT_VISA_TYPES)[number];

export type EnglishRequirement = "A1" | "B1" | "B2" | "degree" | null;

export interface RouteDefinition {
  key: string;
  name: string;
  visaTypes: CurrentVisaType[];
  visaTypesInvolved: CurrentVisaType[];
  minYearsToILR: number | null;
  ilrRequiresContinuousResidence: boolean;
  absenceLimit: number | null;
  absenceLimitPerYear: number | null;
  englishRequirement: EnglishRequirement;
  lifeInUKRequired: boolean;
  switchingAllowed: boolean;
  notes: string;
}

function defineRoute(
  route: Omit<RouteDefinition, "visaTypesInvolved" | "absenceLimitPerYear">,
): RouteDefinition {
  return {
    ...route,
    visaTypesInvolved: route.visaTypes,
    absenceLimitPerYear: route.absenceLimit,
  };
}

export const ROUTES = {
  skilledWorker: defineRoute({
    key: "skilled-worker",
    name: "Skilled Worker to ILR to Citizenship",
    visaTypes: ["SKILLED_WORKER"],
    minYearsToILR: 5,
    ilrRequiresContinuousResidence: true,
    absenceLimit: 180,
    englishRequirement: "B1",
    lifeInUKRequired: true,
    switchingAllowed: true,
    notes:
      "Time usually counts toward 5-year work settlement if you keep meeting salary and sponsorship rules. Absences of more than 180 days in any 12-month period can break continuous residence.",
  }),
  family: defineRoute({
    key: "family",
    name: "Family visa (spouse/partner) to ILR to Citizenship",
    visaTypes: ["FAMILY"],
    minYearsToILR: 5,
    ilrRequiresContinuousResidence: true,
    absenceLimit: 180,
    englishRequirement: "B1",
    lifeInUKRequired: true,
    switchingAllowed: true,
    notes:
      "Standard partner route is 5 years (two 2.5-year grants). A 10-year route applies if the 5-year financial or other requirements are not met. Family time does not usually combine with a work ILR clock.",
  }),
  studentToGraduateToSkilled: defineRoute({
    key: "student-graduate-skilled-worker",
    name: "Student to Graduate to Skilled Worker to ILR to Citizenship",
    visaTypes: ["STUDENT", "GRADUATE", "SKILLED_WORKER"],
    minYearsToILR: 5,
    ilrRequiresContinuousResidence: true,
    absenceLimit: 180,
    englishRequirement: "B1",
    lifeInUKRequired: true,
    switchingAllowed: true,
    notes:
      "Student and Graduate leave do not lead to ILR. The 5-year ILR clock usually starts only after a switch to Skilled Worker (or another qualifying route). Switching is typically allowed in-country from Student or Graduate.",
  }),
  globalTalent: defineRoute({
    key: "global-talent",
    name: "Global Talent to ILR to Citizenship",
    visaTypes: ["GLOBAL_TALENT"],
    minYearsToILR: 3,
    ilrRequiresContinuousResidence: true,
    absenceLimit: 180,
    englishRequirement: "B1",
    lifeInUKRequired: true,
    switchingAllowed: true,
    notes:
      "ILR after 3 years if endorsed as exceptional talent or holding an eligible prize; 5 years if endorsed as exceptional promise. The 3-year clock usually requires time spent on Global Talent.",
  }),
  longResidence: defineRoute({
    key: "long-residence",
    name: "10-year long residence to ILR to Citizenship",
    visaTypes: ["SKILLED_WORKER", "FAMILY", "STUDENT", "GRADUATE", "GLOBAL_TALENT", "OTHER"],
    minYearsToILR: 10,
    ilrRequiresContinuousResidence: true,
    absenceLimit: 180,
    englishRequirement: "B1",
    lifeInUKRequired: true,
    switchingAllowed: true,
    notes:
      "Settlement based on 10 years of continuous lawful residence, which can combine different visas. The 180-day absence rule is applied strictly. Not all leave counts.",
  }),
} as const satisfies Record<string, RouteDefinition>;

export type RouteId = keyof typeof ROUTES;

export const PATHWAY_TO_ROUTE: Record<PathwayId, RouteId> = {
  "skilled-worker": "skilledWorker",
  family: "family",
  "student-to-skilled": "studentToGraduateToSkilled",
  "global-talent": "globalTalent",
  "long-residence": "longResidence",
};

const ROUTES_BY_KEY = new Map(Object.values(ROUTES).map((route) => [route.key, route]));

export function listRoutes(): RouteDefinition[] {
  return Object.values(ROUTES);
}

export function getRouteByKey(key: string): RouteDefinition {
  const route = ROUTES_BY_KEY.get(key);
  if (!route) {
    throw new Error(`Unknown route key: ${key}`);
  }
  return route;
}

export function tryGetRouteByKey(key: string): RouteDefinition | undefined {
  return ROUTES_BY_KEY.get(key);
}

export function getRouteById(id: RouteId): RouteDefinition {
  return ROUTES[id];
}

export function getRouteForPathway(pathwayId: PathwayId): RouteDefinition {
  return ROUTES[PATHWAY_TO_ROUTE[pathwayId]];
}

export function getRoutesForVisaType(visaType: CurrentVisaType): RouteDefinition[] {
  return listRoutes().filter((route) => route.visaTypesInvolved.includes(visaType));
}

/** Map a planner visa catalogue id onto the current-visa enum used by route rules. */
export function visaIdToCurrentVisaType(visaId: string): CurrentVisaType {
  if (visaId === "skilled-worker" || visaId === "health-care-worker") return "SKILLED_WORKER";
  if (visaId.startsWith("spouse") || visaId === "parent") return "FAMILY";
  if (visaId === "student") return "STUDENT";
  if (visaId === "graduate") return "GRADUATE";
  if (visaId.startsWith("global-talent")) return "GLOBAL_TALENT";
  return "OTHER";
}

export function routeLeadsToIlr(route: RouteDefinition): boolean {
  return route.minYearsToILR !== null;
}

/**
 * On the study path the ILR clock does not run until the person is on Skilled Worker
 * (or has a planned switch). Other routes use minYearsToILR as soon as they are selected.
 */
export function effectiveMinYearsToILR(
  route: RouteDefinition,
  currentVisaType: CurrentVisaType,
  options?: { plannedSwitch?: boolean; currentVisaId?: string },
): number | null {
  if (route.minYearsToILR === null) return null;
  if (route.key === ROUTES.globalTalent.key && options?.currentVisaId === "global-talent-promise") {
    return 5;
  }
  if (route.key === ROUTES.family.key && options?.currentVisaId === "spouse-10") {
    return 10;
  }
  if (route.key === ROUTES.studentToGraduateToSkilled.key) {
    if (currentVisaType === "SKILLED_WORKER" || options?.plannedSwitch) {
      return route.minYearsToILR;
    }
    return null;
  }
  if (!route.visaTypesInvolved.includes(currentVisaType)) {
    return null;
  }
  return route.minYearsToILR;
}

export function switchingTargets(from: RouteDefinition): RouteDefinition[] {
  if (!from.switchingAllowed) return [];
  return listRoutes().filter((route) => route.key !== from.key && route.switchingAllowed);
}

export function isSwitchingAllowed(from: RouteDefinition, to: RouteDefinition): boolean {
  return from.switchingAllowed && to.switchingAllowed && from.key !== to.key;
}

import type { PathwayId } from "./types";
import { RULES_REVIEWED_ON } from "./types";
import { GOVUK, SETTLEMENT_LINKS, type OfficialLink } from "./legal";

export const CURRENT_VISA_TYPES = [
  "SKILLED_WORKER",
  "FAMILY",
  "STUDENT",
  "GRADUATE",
  "GLOBAL_TALENT",
  "INNOVATOR_FOUNDER",
  "SCALE_UP",
  "SPORTSPERSON",
  "MINISTER_OF_RELIGION",
  "GBM",
  "YOUTH_MOBILITY",
  "ANCESTRY",
  "BNO",
  "HPI",
  "PROTECTION",
  "EUSS",
  "DEPENDANT",
  "CHILD_REGISTRATION",
  "VISITOR",
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
  lastReviewedOn: string;
  officialUrls: OfficialLink[];
}

function defineRoute(
  route: Omit<RouteDefinition, "visaTypesInvolved" | "absenceLimitPerYear" | "lastReviewedOn"> &
    Partial<Pick<RouteDefinition, "lastReviewedOn">>,
): RouteDefinition {
  return {
    ...route,
    visaTypesInvolved: route.visaTypes,
    absenceLimitPerYear: route.absenceLimit,
    lastReviewedOn: route.lastReviewedOn ?? RULES_REVIEWED_ON,
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
    officialUrls: [
      { label: "Skilled Worker visa", url: GOVUK.skilledWorker },
      ...SETTLEMENT_LINKS,
    ],
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
    officialUrls: [
      { label: "Family visa (partner)", url: GOVUK.familyPartner },
      ...SETTLEMENT_LINKS,
    ],
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
    officialUrls: [
      { label: "Student visa", url: GOVUK.student },
      { label: "Graduate visa", url: GOVUK.graduate },
      { label: "Skilled Worker visa", url: GOVUK.skilledWorker },
      ...SETTLEMENT_LINKS,
    ],
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
    officialUrls: [
      { label: "Global Talent visa", url: GOVUK.globalTalent },
      ...SETTLEMENT_LINKS,
    ],
  }),
  longResidence: defineRoute({
    key: "long-residence",
    name: "10-year long residence to ILR to Citizenship",
    visaTypes: [
      "SKILLED_WORKER",
      "FAMILY",
      "STUDENT",
      "GRADUATE",
      "GLOBAL_TALENT",
      "INNOVATOR_FOUNDER",
      "SCALE_UP",
      "SPORTSPERSON",
      "MINISTER_OF_RELIGION",
      "GBM",
      "YOUTH_MOBILITY",
      "ANCESTRY",
      "BNO",
      "HPI",
      "PROTECTION",
      "DEPENDANT",
      "OTHER",
    ],
    minYearsToILR: 10,
    ilrRequiresContinuousResidence: true,
    absenceLimit: 180,
    englishRequirement: "B1",
    lifeInUKRequired: true,
    switchingAllowed: true,
    notes:
      "Settlement based on 10 years of continuous lawful residence, which can combine different visas (Student, Graduate, work, family, GBM and others). Visitor leave does not count. The 180-day absence rule is applied strictly.",
    officialUrls: SETTLEMENT_LINKS,
  }),
  innovatorFounder: defineRoute({
    key: "innovator-founder",
    name: "Innovator Founder to ILR to Citizenship",
    visaTypes: ["INNOVATOR_FOUNDER"],
    minYearsToILR: 3,
    ilrRequiresContinuousResidence: true,
    absenceLimit: 180,
    englishRequirement: "B1",
    lifeInUKRequired: true,
    switchingAllowed: true,
    notes:
      "ILR after 3 years if the business receives a settlement endorsement. Time on other work routes does not usually shorten this 3-year clock.",
    officialUrls: [
      { label: "Innovator Founder visa", url: GOVUK.innovatorFounder },
      ...SETTLEMENT_LINKS,
    ],
  }),
  scaleUp: defineRoute({
    key: "scale-up",
    name: "Scale-up to ILR to Citizenship",
    visaTypes: ["SCALE_UP"],
    minYearsToILR: 5,
    ilrRequiresContinuousResidence: true,
    absenceLimit: 180,
    englishRequirement: "B1",
    lifeInUKRequired: true,
    switchingAllowed: true,
    notes:
      "A sponsored scale-up visa. Time usually counts toward 5-year work settlement. The first grant is often 2 years.",
    officialUrls: [{ label: "Scale-up visa", url: GOVUK.scaleUp }, ...SETTLEMENT_LINKS],
  }),
  sportsperson: defineRoute({
    key: "sportsperson",
    name: "International Sportsperson to ILR to Citizenship",
    visaTypes: ["SPORTSPERSON"],
    minYearsToILR: 5,
    ilrRequiresContinuousResidence: true,
    absenceLimit: 180,
    englishRequirement: "B1",
    lifeInUKRequired: true,
    switchingAllowed: true,
    notes: "A sponsored sporting route that can lead to ILR after 5 years.",
    officialUrls: [{ label: "International Sportsperson visa", url: GOVUK.sportsperson }, ...SETTLEMENT_LINKS],
  }),
  ministerOfReligion: defineRoute({
    key: "minister-of-religion",
    name: "Minister of Religion to ILR to Citizenship",
    visaTypes: ["MINISTER_OF_RELIGION"],
    minYearsToILR: 5,
    ilrRequiresContinuousResidence: true,
    absenceLimit: 180,
    englishRequirement: "B1",
    lifeInUKRequired: true,
    switchingAllowed: true,
    notes: "A sponsored religious worker route that can lead to ILR after 5 years.",
    officialUrls: [
      { label: "Minister of Religion visa", url: GOVUK.ministerOfReligion },
      ...SETTLEMENT_LINKS,
    ],
  }),
  globalBusinessMobility: defineRoute({
    key: "global-business-mobility",
    name: "Global Business Mobility (no ILR clock)",
    visaTypes: ["GBM"],
    minYearsToILR: null,
    ilrRequiresContinuousResidence: false,
    absenceLimit: null,
    englishRequirement: "B1",
    lifeInUKRequired: false,
    switchingAllowed: true,
    notes:
      "GBM routes do not lead to ILR. Time can still count toward 10-year long residence. Switch to Skilled Worker, Global Talent or another settlement visa to start a 5- or 3-year clock.",
    officialUrls: [{ label: "Global Business Mobility", url: GOVUK.gbm }, ...SETTLEMENT_LINKS],
  }),
  youthMobility: defineRoute({
    key: "youth-mobility",
    name: "Youth Mobility Scheme (no ILR clock)",
    visaTypes: ["YOUTH_MOBILITY"],
    minYearsToILR: null,
    ilrRequiresContinuousResidence: false,
    absenceLimit: null,
    englishRequirement: null,
    lifeInUKRequired: false,
    switchingAllowed: true,
    notes:
      "YMS is temporary. It does not lead to ILR. Switching to a qualifying work, talent or family visa is usually required. Time may count toward 10-year long residence.",
    officialUrls: [{ label: "Youth Mobility Scheme", url: GOVUK.youthMobility }, ...SETTLEMENT_LINKS],
  }),
  ancestry: defineRoute({
    key: "ancestry",
    name: "UK Ancestry to ILR to Citizenship",
    visaTypes: ["ANCESTRY"],
    minYearsToILR: 5,
    ilrRequiresContinuousResidence: true,
    absenceLimit: 180,
    englishRequirement: "B1",
    lifeInUKRequired: true,
    switchingAllowed: true,
    notes:
      "For Commonwealth citizens with a UK-born grandparent. Settlement is typically after 5 years with a work requirement.",
    officialUrls: [{ label: "UK Ancestry visa", url: GOVUK.ancestry }, ...SETTLEMENT_LINKS],
  }),
  bno: defineRoute({
    key: "bno",
    name: "BN(O) visa to ILR to Citizenship",
    visaTypes: ["BNO"],
    minYearsToILR: 5,
    ilrRequiresContinuousResidence: true,
    absenceLimit: 180,
    englishRequirement: "B1",
    lifeInUKRequired: true,
    switchingAllowed: true,
    notes: "A 5-year path to settlement for eligible BN(O) status holders and family members.",
    officialUrls: [{ label: "BN(O) visa", url: GOVUK.bno }, ...SETTLEMENT_LINKS],
  }),
  hpi: defineRoute({
    key: "hpi",
    name: "High Potential Individual (no ILR clock)",
    visaTypes: ["HPI"],
    minYearsToILR: null,
    ilrRequiresContinuousResidence: false,
    absenceLimit: null,
    englishRequirement: "B1",
    lifeInUKRequired: false,
    switchingAllowed: true,
    notes:
      "HPI does not lead to ILR. Switch to Skilled Worker, Global Talent or another qualifying route. Time may count toward 10-year long residence.",
    officialUrls: [{ label: "High Potential Individual visa", url: GOVUK.hpi }, ...SETTLEMENT_LINKS],
  }),
  protection: defineRoute({
    key: "protection",
    name: "Refugee / humanitarian protection to settlement",
    visaTypes: ["PROTECTION"],
    minYearsToILR: 5,
    ilrRequiresContinuousResidence: true,
    absenceLimit: 180,
    englishRequirement: "B1",
    lifeInUKRequired: true,
    switchingAllowed: true,
    notes:
      "People with refugee status or humanitarian protection have typically been able to apply for settlement after 5 years. Protection policy has been under reform — confirm GOV.UK.",
    officialUrls: [
      { label: "Refugee settlement", url: GOVUK.refugeeSettlement },
      ...SETTLEMENT_LINKS,
    ],
  }),
  euss: defineRoute({
    key: "euss",
    name: "EU Settlement Scheme pre-settled to settled status",
    visaTypes: ["EUSS"],
    minYearsToILR: 5,
    ilrRequiresContinuousResidence: true,
    absenceLimit: null,
    englishRequirement: null,
    lifeInUKRequired: false,
    switchingAllowed: true,
    notes:
      "Pre-settled status can convert to settled status after 5 years’ continuous residence under EUSS rules. English and Life in the UK tests are not required. Absence rules differ from the 180-day ILR rule.",
    officialUrls: [{ label: "EU Settlement Scheme", url: GOVUK.euss }, ...SETTLEMENT_LINKS],
  }),
  dependant: defineRoute({
    key: "dependant",
    name: "Dependant of a worker/talent/business visa to ILR to Citizenship",
    visaTypes: ["DEPENDANT"],
    minYearsToILR: 5,
    ilrRequiresContinuousResidence: true,
    absenceLimit: 180,
    englishRequirement: "B1",
    lifeInUKRequired: true,
    switchingAllowed: true,
    notes:
      "Partners and children as dependants typically apply for ILR after 5 years, often alongside the main applicant. Children may instead register as British.",
    officialUrls: [
      { label: "Family members of a Skilled Worker", url: GOVUK.dependants },
      ...SETTLEMENT_LINKS,
    ],
  }),
  childRegistration: defineRoute({
    key: "child-registration",
    name: "British citizenship by registration (child)",
    visaTypes: ["CHILD_REGISTRATION"],
    minYearsToILR: null,
    ilrRequiresContinuousResidence: false,
    absenceLimit: null,
    englishRequirement: null,
    lifeInUKRequired: false,
    switchingAllowed: false,
    notes:
      "A child born in the UK whose parent later becomes settled, or a child under 18 with a British parent, may register as British rather than naturalise. This is not an ILR clock.",
    officialUrls: [
      { label: "Register as a British citizen", url: GOVUK.registerCitizen },
      { label: "British citizenship", url: GOVUK.citizenship },
    ],
  }),
} as const satisfies Record<string, RouteDefinition>;

export type RouteId = keyof typeof ROUTES;

export const PATHWAY_TO_ROUTE: Record<PathwayId, RouteId> = {
  "skilled-worker": "skilledWorker",
  family: "family",
  "student-to-skilled": "studentToGraduateToSkilled",
  "global-talent": "globalTalent",
  "long-residence": "longResidence",
  "innovator-founder": "innovatorFounder",
  "scale-up": "scaleUp",
  sportsperson: "sportsperson",
  "minister-of-religion": "ministerOfReligion",
  "global-business-mobility": "globalBusinessMobility",
  "youth-mobility": "youthMobility",
  ancestry: "ancestry",
  bno: "bno",
  hpi: "hpi",
  protection: "protection",
  euss: "euss",
  dependant: "dependant",
  "child-registration": "childRegistration",
};

export const FEATURED_ROUTE_KEYS = [
  ROUTES.skilledWorker.key,
  ROUTES.family.key,
  ROUTES.studentToGraduateToSkilled.key,
  ROUTES.globalTalent.key,
  ROUTES.longResidence.key,
] as const;

export function listFeaturedRoutes(): RouteDefinition[] {
  return FEATURED_ROUTE_KEYS.map((key) => getRouteByKey(key));
}

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
  if (visaId === "innovator-founder") return "INNOVATOR_FOUNDER";
  if (visaId === "scale-up") return "SCALE_UP";
  if (visaId === "sportsperson") return "SPORTSPERSON";
  if (visaId === "minister-of-religion") return "MINISTER_OF_RELIGION";
  if (visaId === "gbm" || visaId.startsWith("gbm-")) return "GBM";
  if (visaId === "youth-mobility") return "YOUTH_MOBILITY";
  if (visaId === "ancestry") return "ANCESTRY";
  if (visaId === "bno") return "BNO";
  if (visaId === "hpi") return "HPI";
  if (visaId === "refugee" || visaId === "humanitarian") return "PROTECTION";
  if (visaId === "pre-settled") return "EUSS";
  if (visaId === "dependant") return "DEPENDANT";
  if (visaId === "child-registration") return "CHILD_REGISTRATION";
  if (visaId === "visitor") return "VISITOR";
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
  if (route.minYearsToILR === null) return null;
  if (!route.visaTypesInvolved.includes(currentVisaType) && route.key !== ROUTES.longResidence.key) {
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

const SETTLEMENT_SWITCH_IDS: RouteId[] = [
  "skilledWorker",
  "family",
  "globalTalent",
  "longResidence",
  "innovatorFounder",
  "scaleUp",
  "sportsperson",
  "ministerOfReligion",
  "ancestry",
  "bno",
];

/**
 * Typical in-country switches onto settlement-leading routes.
 * Extra criteria (sponsor, endorsement, partner) are described by getPossibleSwitches.
 */
export const IN_COUNTRY_SWITCH_TARGETS: Record<CurrentVisaType, RouteId[]> = {
  STUDENT: SETTLEMENT_SWITCH_IDS,
  GRADUATE: SETTLEMENT_SWITCH_IDS,
  SKILLED_WORKER: SETTLEMENT_SWITCH_IDS.filter((id) => id !== "skilledWorker"),
  FAMILY: SETTLEMENT_SWITCH_IDS.filter((id) => id !== "family"),
  GLOBAL_TALENT: SETTLEMENT_SWITCH_IDS.filter((id) => id !== "globalTalent"),
  INNOVATOR_FOUNDER: SETTLEMENT_SWITCH_IDS.filter((id) => id !== "innovatorFounder"),
  SCALE_UP: SETTLEMENT_SWITCH_IDS.filter((id) => id !== "scaleUp"),
  SPORTSPERSON: SETTLEMENT_SWITCH_IDS.filter((id) => id !== "sportsperson"),
  MINISTER_OF_RELIGION: SETTLEMENT_SWITCH_IDS.filter((id) => id !== "ministerOfReligion"),
  GBM: SETTLEMENT_SWITCH_IDS,
  YOUTH_MOBILITY: SETTLEMENT_SWITCH_IDS,
  ANCESTRY: SETTLEMENT_SWITCH_IDS.filter((id) => id !== "ancestry"),
  BNO: SETTLEMENT_SWITCH_IDS.filter((id) => id !== "bno"),
  HPI: SETTLEMENT_SWITCH_IDS,
  PROTECTION: ["longResidence", "family"],
  EUSS: ["longResidence", "family", "skilledWorker"],
  DEPENDANT: SETTLEMENT_SWITCH_IDS,
  CHILD_REGISTRATION: [],
  VISITOR: [],
  OTHER: [],
};

export function canSwitchToRouteInCountry(
  fromVisaType: CurrentVisaType,
  toRoute: RouteDefinition,
): boolean {
  return IN_COUNTRY_SWITCH_TARGETS[fromVisaType].some((id) => ROUTES[id].key === toRoute.key);
}

/** Representative visa catalogue id used when modelling a switch onto this pathway. */
export function switchTargetVisaId(route: RouteDefinition): string {
  switch (route.key) {
    case ROUTES.skilledWorker.key:
      return "skilled-worker";
    case ROUTES.family.key:
      return "spouse-5";
    case ROUTES.studentToGraduateToSkilled.key:
      return "skilled-worker";
    case ROUTES.globalTalent.key:
      return "global-talent-talent";
    case ROUTES.longResidence.key:
      return "long-residence";
    case ROUTES.innovatorFounder.key:
      return "innovator-founder";
    case ROUTES.scaleUp.key:
      return "scale-up";
    case ROUTES.sportsperson.key:
      return "sportsperson";
    case ROUTES.ministerOfReligion.key:
      return "minister-of-religion";
    case ROUTES.globalBusinessMobility.key:
      return "gbm";
    case ROUTES.youthMobility.key:
      return "youth-mobility";
    case ROUTES.ancestry.key:
      return "ancestry";
    case ROUTES.bno.key:
      return "bno";
    case ROUTES.hpi.key:
      return "hpi";
    case ROUTES.protection.key:
      return "refugee";
    case ROUTES.euss.key:
      return "pre-settled";
    case ROUTES.dependant.key:
      return "dependant";
    case ROUTES.childRegistration.key:
      return "child-registration";
    default:
      return "skilled-worker";
  }
}

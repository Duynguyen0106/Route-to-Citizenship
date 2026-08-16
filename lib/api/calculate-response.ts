import { toIsoDate } from "@/lib/dates";
import { alreadyHoldsIlr, checkEligibility, visaMatchesRoute } from "@/lib/eligibility";
import { getRouteForPathway, listRoutes, type RouteDefinition } from "@/lib/routes";
import { getPossibleSwitches } from "@/lib/simulate";
import type { Profile } from "@/lib/types";

export interface CalculateRouteOption {
  key: string;
  eligible: boolean;
  estimatedILRDate: string | null;
  estimatedCitizenshipDate: string | null;
  requirements: {
    continuousResidence: boolean;
    absenceLimit: boolean;
    english: boolean;
    lifeInUK: boolean;
  };
  reasons: string[];
}

export interface CalculateAlternative {
  key: string;
  eligible: boolean;
  reason: string;
  estimatedILRDate: string | null;
  estimatedCitizenshipDate: string | null;
  inCountrySwitch: boolean;
}

export interface CalculateResponse {
  currentRoute: CalculateRouteOption;
  alternatives: CalculateAlternative[];
}

function isoOrNull(value: Date | null): string | null {
  return value ? toIsoDate(value) : null;
}

function alternativeReason(profile: Profile, route: RouteDefinition, reasons: string[]): string {
  if (!visaMatchesRoute(profile, route)) {
    if (route.key === "global-talent") return "Not currently on Global Talent visa";
    if (route.key === "skilled-worker") return "Not currently on Skilled Worker visa";
    if (route.key === "family") return "Not currently on a family visa";
    if (route.key === "student-graduate-skilled-worker") {
      return "Not currently on the Student / Graduate / Skilled Worker path";
    }
    if (route.key === "long-residence") return "Not currently counting 10-year long residence";
  }
  return reasons[0] ?? `${route.name} is an alternative to consider.`;
}

export function buildCalculateResponse(
  profile: Profile,
  asOf: Date = new Date(),
): CalculateResponse {
  const current = getRouteForPathway(profile.pathwayId);
  const check = checkEligibility(profile, current, asOf);
  const onCurrentRoute = visaMatchesRoute(profile, current) || alreadyHoldsIlr(profile);
  const hasIlrClock = check.estimatedILRDate !== null || alreadyHoldsIlr(profile);
  const switches = getPossibleSwitches(profile, asOf);
  const switchByKey = new Map(switches.map((item) => [item.routeKey, item]));

  return {
    currentRoute: {
      key: current.key,
      eligible: onCurrentRoute && hasIlrClock,
      estimatedILRDate: isoOrNull(check.estimatedILRDate),
      estimatedCitizenshipDate: isoOrNull(check.estimatedCitizenshipDate),
      requirements: {
        continuousResidence: check.requirementsMet.continuousResidence,
        absenceLimit: check.requirementsMet.absenceLimit,
        english: check.requirementsMet.english,
        lifeInUK: check.requirementsMet.lifeInUK,
      },
      reasons: check.reasons,
    },
    alternatives: listRoutes()
      .filter((route) => route.key !== current.key)
      .map((route) => {
        const option = checkEligibility(profile, route, asOf);
        const planned = switchByKey.get(route.key);
        return {
          key: route.key,
          eligible: false,
          reason: alternativeReason(profile, route, option.reasons),
          estimatedILRDate: isoOrNull(planned?.estimatedILRDate ?? option.estimatedILRDate),
          estimatedCitizenshipDate: isoOrNull(
            planned?.estimatedCitizenshipDate ?? option.estimatedCitizenshipDate,
          ),
          inCountrySwitch: Boolean(planned?.inCountrySwitch),
        };
      }),
  };
}

export function serializeRoute(route: RouteDefinition) {
  return {
    key: route.key,
    name: route.name,
    visaTypesInvolved: route.visaTypesInvolved,
    minYearsToILR: route.minYearsToILR,
    ilrRequiresContinuousResidence: route.ilrRequiresContinuousResidence,
    absenceLimitPerYear: route.absenceLimitPerYear,
    englishRequirement: route.englishRequirement,
    lifeInUKRequired: route.lifeInUKRequired,
    switchingAllowed: route.switchingAllowed,
    notes: route.notes,
    lastReviewedOn: route.lastReviewedOn,
    officialUrls: route.officialUrls,
  };
}

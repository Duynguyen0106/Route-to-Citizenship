import { switchTargetVisaId, tryGetRouteByKey, visaIdToCurrentVisaType } from "@/lib/routes";
import { getRoute } from "@/lib/visas";
import { buildChecklist } from "@/lib/checklist";
import type { Profile } from "@/lib/types";

export function visaIdForChecklist(profile: Profile, routeKey?: string): string {
  if (!routeKey) return profile.currentVisaId;
  const rule = tryGetRouteByKey(routeKey);
  if (!rule) return profile.currentVisaId;
  const currentType = visaIdToCurrentVisaType(profile.currentVisaId);
  if (rule.visaTypesInvolved.includes(currentType) && profile.currentVisaId !== "ilr") {
    return profile.currentVisaId;
  }
  return switchTargetVisaId(rule);
}

export function checklistFor(profile: Profile, routeKey?: string) {
  const visaId = visaIdForChecklist(profile, routeKey);
  return buildChecklist(profile, getRoute(visaId));
}

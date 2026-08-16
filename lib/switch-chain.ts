import { parseISO } from "date-fns";
import { citizenshipEligibleDate, ilrEligibleDate, toIsoDate } from "./settlement";
import { inferPathway } from "./pathways";
import { getRoute, isFamilyCombination, isQualifyingWorkCombination, tryGetRoute } from "./visas";
import type { PlannedSwitch, Profile, SwitchChainHop } from "./types";

export function qualifyingStartAfterSwitch(
  profile: Profile,
  toVisaId: string,
  switchOn: Date,
): { start: Date; note: string } {
  const current = getRoute(profile.currentVisaId);
  const candidate = getRoute(toVisaId);
  const existingStart = parseISO(profile.qualifyingResidenceStart);
  const ukEntry = parseISO(profile.ukEntryDate || profile.qualifyingResidenceStart);

  if (toVisaId === "long-residence") {
    return {
      start: ukEntry,
      note: "Long residence usually counts continuous lawful time from when that residence began — not from the switch date. Student, Graduate, GBM and other lawful leave can combine if there is no gap.",
    };
  }
  if (toVisaId === "global-talent-talent" || toVisaId === "innovator-founder") {
    return {
      start: switchOn,
      note: `The ${candidate.ilrYears}-year ${candidate.shortName} ILR clock usually starts on that visa, not from earlier work leave.`,
    };
  }
  if (!candidate.leadsToIlr) {
    return {
      start: switchOn,
      note: `${candidate.shortName} does not lead to ILR. You would still need a later qualifying switch. Time may still count toward 10-year long residence.`,
    };
  }
  if (!current.leadsToIlr && candidate.leadsToIlr) {
    return {
      start: switchOn,
      note: `${current.shortName} time does not usually count toward this ILR clock. The ${candidate.ilrYears}-year clock starts on the ${candidate.shortName} grant.`,
    };
  }
  if (isQualifyingWorkCombination(current, candidate) || isFamilyCombination(current, candidate)) {
    return {
      start: existingStart,
      note: "Time on your current qualifying route may combine with the new visa toward ILR.",
    };
  }
  return {
    start: switchOn,
    note: "This switch is treated as starting a new qualifying clock on the switch date.",
  };
}

export function plannedSwitchList(profile: Profile): PlannedSwitch[] {
  const extra = (profile.plannedSwitches ?? []).filter((item) => item.toVisaId && item.on);
  if (extra.length) {
    return [...extra].sort((a, b) => a.on.localeCompare(b.on));
  }
  if (profile.plannedSwitchOn && profile.plannedSwitchTo) {
    return [{ toVisaId: profile.plannedSwitchTo, on: profile.plannedSwitchOn }];
  }
  return [];
}

export function syncLegacyPlannedSwitch(profile: Profile): Pick<Profile, "plannedSwitchOn" | "plannedSwitchTo" | "plannedSwitches"> {
  const hops = plannedSwitchList(profile);
  return {
    plannedSwitches: hops,
    plannedSwitchOn: hops[0]?.on ?? "",
    plannedSwitchTo: hops[0]?.toVisaId ?? profile.plannedSwitchTo ?? "skilled-worker",
  };
}

/**
 * Walk Student → Graduate → Skilled Worker → Global Talent (or any other hop list)
 * and return the ILR clock after the last modelled switch.
 */
export function projectSwitchChain(profile: Profile): {
  hops: SwitchChainHop[];
  visaId: string;
  qualifyingStart: Date;
  ilrOn: Date | null;
  citizenshipOn: Date | null;
} {
  let visaId = profile.currentVisaId;
  let cursor: Profile = { ...profile };
  const hops: SwitchChainHop[] = [];

  for (const hop of plannedSwitchList(profile)) {
    const switchOn = parseISO(hop.on);
    if (Number.isNaN(switchOn.getTime())) continue;
    const { start, note } = qualifyingStartAfterSwitch(cursor, hop.toVisaId, switchOn);
    const route = tryGetRoute(hop.toVisaId);
    const ilrOn = route ? ilrEligibleDate(route, start) : null;
    hops.push({
      toVisaId: hop.toVisaId,
      on: hop.on,
      qualifyingStart: toIsoDate(start),
      ilrEligibleOn: ilrOn ? toIsoDate(ilrOn) : null,
      note,
    });
    cursor = {
      ...cursor,
      currentVisaId: hop.toVisaId,
      pathwayId: inferPathway(hop.toVisaId),
      visaGrantedOn: hop.on,
      qualifyingResidenceStart: toIsoDate(start),
    };
    visaId = hop.toVisaId;
  }

  const finalRoute = tryGetRoute(visaId);
  const qualifyingStart = parseISO(cursor.qualifyingResidenceStart || profile.qualifyingResidenceStart);
  const ilrOn = finalRoute ? ilrEligibleDate(finalRoute, qualifyingStart) : null;
  const citizenshipOn = citizenshipEligibleDate({
    ilrEligibleOn: ilrOn,
    ilrGrantedOn: null,
    residenceStart: parseISO(profile.ukEntryDate || profile.qualifyingResidenceStart),
    marriedToBritishCitizen: profile.marriedToBritishCitizen,
    alreadyHasIlr: false,
  });

  return { hops, visaId, qualifyingStart, ilrOn, citizenshipOn };
}

import { addWeeks, parseISO, subDays } from "date-fns";
import { toIsoDate } from "./dates";
import { ILR_EARLY_APPLY_DAYS } from "./settlement";
import type {
  ApplicationWindow,
  ProcessingEstimate,
  Profile,
  TimelineEvent,
  VisaRoute,
} from "./types";

const PROCESSING_CAVEAT =
  "Home Office service standards change and are not a guarantee. Priority services and complexity can shorten or lengthen a decision. Check GOV.UK before you book travel.";

/** Typical published waiting periods in weeks — estimates, not a service-standard promise. */
export function typicalProcessingWeeks(visaId: string, insideUk: boolean): number {
  if (visaId === "ilr" || visaId === "long-residence") return 26;
  if (visaId === "citizenship" || visaId === "child-registration") return 26;
  if (visaId === "student") return insideUk ? 8 : 3;
  if (visaId === "graduate") return 8;
  if (visaId.startsWith("spouse") || visaId === "parent") return insideUk ? 8 : 24;
  if (visaId.startsWith("global-talent")) return 8;
  if (visaId === "visitor") return 3;
  return insideUk ? 8 : 3;
}

export function decisionDateFromApply(applyOn: Date, weeks: number): Date {
  return addWeeks(applyOn, weeks);
}

export function buildProcessingEstimates(options: {
  profile: Profile;
  route: VisaRoute;
  asOf: Date;
  ilrApplyFrom: Date | null;
  ilrOn: Date | null;
  citizenshipOn: Date | null;
}): ProcessingEstimate[] {
  const { profile, route, asOf, ilrApplyFrom, citizenshipOn } = options;
  const estimates: ProcessingEstimate[] = [];
  const inside = profile.applyFromInsideUk;

  if (route.id !== "ilr" && route.id !== "child-registration") {
    const weeks = typicalProcessingWeeks(profile.currentVisaId, inside);
    const applyOn = subDays(asOf, 0);
    estimates.push({
      id: "current-visa-wait",
      label: `${route.shortName} decision wait`,
      applyOn: toIsoDate(applyOn),
      decisionOn: toIsoDate(decisionDateFromApply(applyOn, weeks)),
      typicalWeeks: weeks,
      caveat: `A typical ${inside ? "in-UK" : "out-of-UK"} wait is about ${weeks} weeks if you applied today. ${PROCESSING_CAVEAT}`,
    });
  }

  if (ilrApplyFrom) {
    const weeks = typicalProcessingWeeks("ilr", true);
    estimates.push({
      id: "ilr-wait",
      label: "ILR decision wait",
      applyOn: toIsoDate(ilrApplyFrom),
      decisionOn: toIsoDate(decisionDateFromApply(ilrApplyFrom, weeks)),
      typicalWeeks: weeks,
      caveat: `ILR is often quoted at about ${weeks} weeks. ${PROCESSING_CAVEAT}`,
    });
  }

  if (citizenshipOn) {
    const weeks = typicalProcessingWeeks("citizenship", true);
    estimates.push({
      id: "citizenship-wait",
      label: "Citizenship decision wait",
      applyOn: toIsoDate(citizenshipOn),
      decisionOn: toIsoDate(decisionDateFromApply(citizenshipOn, weeks)),
      typicalWeeks: weeks,
      caveat: `Naturalisation is often quoted at about ${weeks} weeks, then a ceremony. ${PROCESSING_CAVEAT}`,
    });
  }

  return estimates;
}

export function buildApplicationWindows(options: {
  profile: Profile;
  route: VisaRoute;
  asOf: Date;
  ilrApplyFrom: Date | null;
  ilrOn: Date | null;
  citizenshipOn: Date | null;
}): ApplicationWindow[] {
  const { profile, route, ilrApplyFrom, ilrOn, citizenshipOn } = options;
  const windows: ApplicationWindow[] = [];
  const expiry = profile.visaExpiresOn;

  if (route.id !== "ilr" && expiry) {
    const expiryDate = parseISO(expiry);
    if (!Number.isNaN(expiryDate.getTime())) {
      windows.push({
        id: "extend",
        title: "Extension / switch before visa expiry",
        opensOn: toIsoDate(subDays(expiryDate, 28)),
        closesOn: expiry,
        kind: "extension",
        detail:
          "Keep valid leave. Many in-country applications can be submitted in the weeks before your current visa ends — do not wait until the last day. Confirm the live rule on GOV.UK for your visa.",
      });
    }
  }

  if (ilrApplyFrom && ilrOn) {
    windows.push({
      id: "ilr",
      title: `ILR application window (up to ${ILR_EARLY_APPLY_DAYS} days early)`,
      opensOn: toIsoDate(ilrApplyFrom),
      closesOn: null,
      kind: "ilr",
      detail: `You can usually apply for ILR up to ${ILR_EARLY_APPLY_DAYS} days before your qualifying period ends on ${toIsoDate(ilrOn)}. Submitting earlier than that is often rejected as premature.`,
    });
  }

  if (citizenshipOn) {
    windows.push({
      id: "citizenship",
      title: "Citizenship application window",
      opensOn: toIsoDate(citizenshipOn),
      closesOn: null,
      kind: "citizenship",
      detail:
        "Naturalisation is usually only possible after ILR (or settled status) and the residence period. There is no 28-day early window like ILR — apply once the dates and tests are met.",
    });
  }

  if (profile.plannedSwitchOn) {
    const weeks = typicalProcessingWeeks(profile.plannedSwitchTo || "skilled-worker", true);
    const switchOn = parseISO(profile.plannedSwitchOn);
    if (!Number.isNaN(switchOn.getTime())) {
      const applyOn = subDays(switchOn, weeks * 7);
      windows.push({
        id: "planned-switch",
        title: "Planned switch application",
        opensOn: toIsoDate(applyOn),
        closesOn: profile.plannedSwitchOn,
        kind: "switch",
        detail: `If the new visa is granted on ${profile.plannedSwitchOn}, allow about ${weeks} weeks for a decision and apply before your current leave ends.`,
      });
    }
  }

  return windows;
}

export function processingTimelineEvents(
  windows: ApplicationWindow[],
  estimates: ProcessingEstimate[],
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const window of windows) {
    events.push({
      id: `window-${window.id}`,
      label: window.title,
      date: window.opensOn,
      kind: "window",
      note: window.detail,
    });
  }

  for (const estimate of estimates) {
    if (estimate.id === "current-visa-wait") continue;
    events.push({
      id: `decision-${estimate.id}`,
      label: `${estimate.label} (about ${estimate.typicalWeeks} weeks)`,
      date: estimate.decisionOn,
      kind: "processing",
      note: estimate.caveat,
    });
  }

  return events;
}

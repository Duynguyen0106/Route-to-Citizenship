import { buildRouteComparison, type RouteComparisonCard } from "./comparison";
import { englishMet, lifeInUkMet } from "./eligibility";
import type { PlanResult, Profile } from "./types";

export interface RouteRecommendation {
  key: string;
  name: string;
  score: number;
  reliability: "current_clock" | "modelled_switch" | "no_ilr_yet";
  reasons: string[];
  yearsToILR: number | null;
  yearsToCitizenship: number | null;
  current: boolean;
  eligibleToSwitch: boolean;
}

function reliability(card: RouteComparisonCard): RouteRecommendation["reliability"] {
  if (card.current && card.yearsToILR !== null) return "current_clock";
  if (card.eligibleToSwitch && card.yearsToILR !== null) return "modelled_switch";
  return "no_ilr_yet";
}

export function recommendRoutes(profile: Profile, plan: PlanResult, asOf?: Date): RouteRecommendation[] {
  const cards = buildRouteComparison(profile, plan, asOf);
  const english = englishMet(profile);
  const life = lifeInUkMet(profile);
  const absenceHit = plan.absences.breached180 || profile.exceeded180DaysInAny12Months;

  return cards
    .map((card) => {
      const reasons: string[] = [];
      let score = 20;
      const rel = reliability(card);

      if (card.current) {
        score += 25;
        reasons.push("This is your current sketched path — fewer switching unknowns.");
      }
      if (rel === "current_clock") {
        score += 20;
        reasons.push("The ILR clock is already running on this visa in the planner’s model.");
      } else if (rel === "modelled_switch") {
        score += 8;
        reasons.push("An in-country switch is modelled, but the planner does not check if you qualify.");
      } else {
        score -= 10;
        reasons.push("No ILR date is modelled until you are on a qualifying visa.");
      }

      if (card.yearsToILR !== null) {
        score += Math.max(0, 18 - card.yearsToILR * 2);
        reasons.push(
          card.yearsToILR <= 5
            ? `Sketched ILR in about ${card.yearsToILR} years.`
            : `Longer ILR clock (${card.yearsToILR} years).`,
        );
      }

      if (english) score += 6;
      else {
        score -= 8;
        reasons.push("English is not marked as met — most ILR routes still need B1 or an exemption.");
      }
      if (life) score += 4;
      else if (card.key !== "student-graduate-skilled-worker") {
        reasons.push("Life in the UK is not marked as passed.");
      }

      if (absenceHit) {
        score -= 20;
        reasons.push("Logged absences look close to or over the usual 180-day ILR limit.");
      }

      return {
        key: card.key,
        name: card.name,
        score: Math.max(0, Math.min(100, Math.round(score))),
        reliability: rel,
        reasons: reasons.slice(0, 4),
        yearsToILR: card.yearsToILR,
        yearsToCitizenship: card.yearsToCitizenship,
        current: card.current,
        eligibleToSwitch: card.eligibleToSwitch,
      };
    })
    .sort((a, b) => b.score - a.score || Number(b.current) - Number(a.current));
}

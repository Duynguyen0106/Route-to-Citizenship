import { calculatePlan } from "../calculate";

export const RULE_ENGINE = {
  id: "rule-engine" as const,
  location: "on-device" as const,
  note: "The dashboard runs this function in the browser. /api/calculate is the same function for API clients and does not store the result.",
  run: calculatePlan,
};

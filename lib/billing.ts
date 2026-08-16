export const PLAN_IDS = ["basic", "pro", "premium"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type FeatureId =
  | "timeline"
  | "windows"
  | "household"
  | "routes"
  | "checklist"
  | "fees"
  | "reminders"
  | "apply"
  | "eligibility"
  | "absences"
  | "whatif"
  | "vault"
  | "chat"
  | "switch"
  | "recommend"
  | "goals"
  | "services"
  | "shareExport"
  | "rules"
  | "risk"
  | "benchmarks"
  | "shareLink"
  | "expertQa"
  | "prioritySupport"
  | "unlimitedVault";

export const BILLING_LIVE = false;

export const BILLING_DISCLAIMER =
  "These prices are indicative for this prototype. No card payment is taken. Choosing a paid tier previews the features. It is not a subscription contract and not immigration advice.";

export const PLAN_RANK: Record<PlanId, number> = { basic: 0, pro: 1, premium: 2 };

/** Indicative monthly prices in GBP. Not live Stripe amounts. */
export const PLAN_CATALOGUE: Record<
  PlanId,
  {
    id: PlanId;
    name: string;
    monthlyGbp: number | null;
    annualGbp: number | null;
    blurb: string;
    highlights: string[];
  }
> = {
  basic: {
    id: "basic",
    name: "Basic",
    monthlyGbp: 0,
    annualGbp: 0,
    blurb: "Route mapping, a manual timeline, a checklist, fee sketch, and basic reminders.",
    highlights: [
      "Current-visa to ILR / citizenship sketch",
      "Timeline and application windows",
      "Basic reminders and calendar download",
      "Official GOV.UK apply links",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyGbp: 9,
    annualGbp: 90,
    blurb: "Advanced eligibility, absence tracking with forecasts, a limited local vault, and the FAQ assistant.",
    highlights: [
      "Advanced eligibility checks (still not a full Rules reading)",
      "Absence tracker, calendar import, and predictive 180-day alerts",
      "Document vault — up to 5 encrypted files in this browser",
      "FAQ assistant (not OISC advice)",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium",
    monthlyGbp: 19,
    annualGbp: 190,
    blurb: "Higher local vault cap, rule-change notices, readiness scoring, and human-expert introductions.",
    highlights: [
      "Larger local vault (still on this device — not cloud storage)",
      "Encoded rule-change notices from GOV.UK timestamps",
      "Readiness sketch — not an approval probability",
      "Priority support and OISC adviser introductions (enquiry, not live chat)",
    ],
  },
};

export const FEATURE_MIN_PLAN: Record<FeatureId, PlanId> = {
  timeline: "basic",
  windows: "basic",
  household: "basic",
  routes: "basic",
  checklist: "basic",
  fees: "basic",
  reminders: "basic",
  apply: "basic",
  eligibility: "pro",
  absences: "pro",
  whatif: "pro",
  vault: "pro",
  chat: "pro",
  switch: "pro",
  recommend: "pro",
  goals: "pro",
  services: "pro",
  shareExport: "pro",
  rules: "premium",
  risk: "premium",
  benchmarks: "premium",
  shareLink: "premium",
  expertQa: "premium",
  prioritySupport: "premium",
  unlimitedVault: "premium",
};

export const ONE_OFF_SERVICES = [
  {
    id: "oneoff_review",
    name: "Document review",
    indicativeGbp: 149,
    blurb: "An OISC-regulated adviser reviews a redacted document list. Files are not uploaded here.",
  },
  {
    id: "oneoff_audit",
    name: "Mock application audit",
    indicativeGbp: 249,
    blurb: "A structured check of dates, absences and evidence against the public Rules — not a Home Office filing.",
  },
  {
    id: "oneoff_statement",
    name: "Statement of intent review",
    indicativeGbp: 99,
    blurb: "Feedback on a personal statement you paste. Do not include passport numbers.",
  },
] as const;

export type OneOffServiceId = (typeof ONE_OFF_SERVICES)[number]["id"];

export const PRO_VAULT_MAX_FILES = 5;
export const PRO_VAULT_MAX_BYTES = 25 * 1024 * 1024;
export const PREMIUM_VAULT_MAX_FILES = 40;
export const PREMIUM_VAULT_MAX_BYTES = 200 * 1024 * 1024;
export const VAULT_FILE_MAX_BYTES = 8 * 1024 * 1024;

export const STORAGE_PLAN = "rtc-plan";

export function parsePlan(value: unknown): PlanId {
  if (value === "pro" || value === "premium" || value === "basic") return value;
  return "basic";
}

export function hasFeature(plan: PlanId, feature: FeatureId): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[FEATURE_MIN_PLAN[feature]];
}

export function vaultLimits(plan: PlanId): { maxFiles: number; maxBytes: number } | null {
  if (!hasFeature(plan, "vault")) return null;
  if (hasFeature(plan, "unlimitedVault")) {
    return { maxFiles: PREMIUM_VAULT_MAX_FILES, maxBytes: PREMIUM_VAULT_MAX_BYTES };
  }
  return { maxFiles: PRO_VAULT_MAX_FILES, maxBytes: PRO_VAULT_MAX_BYTES };
}

export function vaultAllowsAnother(
  plan: PlanId,
  fileCount: number,
  usedBytes: number,
  incomingBytes: number,
): { ok: true } | { ok: false; reason: string } {
  const limits = vaultLimits(plan);
  if (!limits) return { ok: false, reason: "The document vault is a Pro preview feature." };
  if (incomingBytes > VAULT_FILE_MAX_BYTES) return { ok: false, reason: "Keep files under 8 MB." };
  if (fileCount >= limits.maxFiles) {
    return {
      ok: false,
      reason: hasFeature(plan, "unlimitedVault")
        ? `This browser vault holds up to ${limits.maxFiles} files.`
        : `Pro preview allows ${limits.maxFiles} files. Preview Premium for a higher local cap.`,
    };
  }
  if (usedBytes + incomingBytes > limits.maxBytes) {
    return { ok: false, reason: "This would exceed the local vault size for your preview plan." };
  }
  return { ok: true };
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_PRO && process.env.STRIPE_PRICE_PREMIUM);
}

const PASSPORTISH = /\bpassport\b/i;
const LONG_NUMBER = /\b\d{8,9}\b/;

export function enquiryLooksLikeIdentity(text: string): boolean {
  return PASSPORTISH.test(text) && LONG_NUMBER.test(text);
}

export const ENQUIRY_KINDS = [
  "plan_pro",
  "plan_premium",
  "oneoff_review",
  "oneoff_audit",
  "oneoff_statement",
  "adviser_intro",
  "white_label",
  "employer_seats",
  "priority_support",
  "expert_qa",
] as const;

export type EnquiryKind = (typeof ENQUIRY_KINDS)[number];

export function parseEnquiryKind(value: unknown): EnquiryKind | null {
  return typeof value === "string" && (ENQUIRY_KINDS as readonly string[]).includes(value)
    ? (value as EnquiryKind)
    : null;
}

import { z } from "zod";
import { inferPathway } from "@/lib/pathways";
import { getRouteForPathway } from "@/lib/routes";
import { createProfile, emptyProfile, normalizeProfile } from "@/lib/storage";
import {
  MAJORITY_ENGLISH_SPEAKING_COUNTRIES,
  OTHER_COMMON_NATIONALITIES,
  type EnglishStatus,
  type LifeInUkStatus,
  type Profile,
} from "@/lib/types";

export const englishLevels = ["none", "A2", "B1", "B2"] as const;
export const relationshipOptions = ["none", "british_citizen", "settled"] as const;

export const ONBOARDING_VISA_GROUPS: { label: string; options: { id: string; label: string }[] }[] = [
  {
    label: "Work",
    options: [
      { id: "skilled-worker", label: "Skilled Worker visa" },
      { id: "health-care-worker", label: "Health and Care Worker visa" },
      { id: "scale-up", label: "Scale-up visa" },
      { id: "sportsperson", label: "International Sportsperson visa" },
      { id: "minister-of-religion", label: "Minister of Religion visa" },
      { id: "gbm", label: "Global Business Mobility (no ILR clock)" },
    ],
  },
  {
    label: "Talent & business",
    options: [
      { id: "global-talent-talent", label: "Global Talent (exceptional talent / prize)" },
      { id: "global-talent-promise", label: "Global Talent (exceptional promise)" },
      { id: "innovator-founder", label: "Innovator Founder visa" },
      { id: "hpi", label: "High Potential Individual (no ILR clock)" },
    ],
  },
  {
    label: "Family & dependants",
    options: [
      { id: "spouse-5", label: "Family visa — partner (5-year route)" },
      { id: "spouse-10", label: "Family visa — partner (10-year route)" },
      { id: "dependant", label: "Dependant of a worker / talent / business visa" },
      { id: "child-registration", label: "Child — citizenship by registration" },
    ],
  },
  {
    label: "Study & youth",
    options: [
      { id: "student", label: "Student visa" },
      { id: "graduate", label: "Graduate visa" },
      { id: "youth-mobility", label: "Youth Mobility Scheme (no ILR clock)" },
    ],
  },
  {
    label: "Other settlement paths",
    options: [
      { id: "long-residence", label: "Counting 10 years of mixed lawful leave" },
      { id: "ancestry", label: "UK Ancestry visa" },
      { id: "bno", label: "BN(O) visa" },
      { id: "refugee", label: "Refugee permission" },
      { id: "humanitarian", label: "Humanitarian protection" },
      { id: "pre-settled", label: "EU Settlement Scheme — pre-settled status" },
      { id: "ilr", label: "Already have ILR / settled status" },
    ],
  },
];

export const ONBOARDING_VISA_OPTIONS = ONBOARDING_VISA_GROUPS.flatMap((group) => group.options);

export const SWITCH_VISA_OPTIONS = [
  { id: "", label: "No further switch planned" },
  { id: "skilled-worker", label: "Skilled Worker" },
  { id: "graduate", label: "Graduate" },
  { id: "global-talent-talent", label: "Global Talent (3-year ILR)" },
  { id: "innovator-founder", label: "Innovator Founder" },
  { id: "scale-up", label: "Scale-up" },
  { id: "spouse-5", label: "Partner visa (5-year)" },
];

export const NATIONALITY_OPTIONS = [
  ...MAJORITY_ENGLISH_SPEAKING_COUNTRIES,
  ...OTHER_COMMON_NATIONALITIES,
];

export const onboardingSchema = z
  .object({
    nationality: z.string().trim().min(2, "Select your nationality"),
    currentVisaId: z.string().min(1, "Select your current visa"),
    visaGrantDate: z.string().min(1, "Enter your visa start date"),
    visaExpiryDate: z.string().min(1, "Enter your visa expiry date"),
    ukEntryDate: z.string().optional().default(""),
    relationship: z.enum(relationshipOptions),
    englishLevel: z.enum(englishLevels),
    lifeInUkPassed: z.enum(["yes", "no"]),
    ageBand: z.enum(["under_18", "18_to_64", "65_plus"]).optional(),
    dependantCount: z.coerce.number().int().min(0).max(8).optional(),
    bornInUk: z.boolean().optional(),
    hasBritishParent: z.boolean().optional(),
    priorVisaId: z.string().optional(),
    priorVisaStart: z.string().optional(),
    priorVisaEnd: z.string().optional(),
    plannedSwitch1To: z.string().optional(),
    plannedSwitch1On: z.string().optional(),
    plannedSwitch2To: z.string().optional(),
    plannedSwitch2On: z.string().optional(),
    mainApplicantIlrOn: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.visaExpiryDate <= value.visaGrantDate) {
      ctx.addIssue({
        code: "custom",
        path: ["visaExpiryDate"],
        message: "Expiry must be after the visa start date",
      });
    }
    if (value.ukEntryDate && value.visaGrantDate && value.ukEntryDate > value.visaGrantDate) {
      ctx.addIssue({
        code: "custom",
        path: ["ukEntryDate"],
        message: "UK entry date is usually on or before the current visa start date",
      });
    }
  });

export type OnboardingValues = {
  nationality: string;
  currentVisaId: string;
  visaGrantDate: string;
  visaExpiryDate: string;
  ukEntryDate: string;
  relationship: (typeof relationshipOptions)[number];
  englishLevel: (typeof englishLevels)[number];
  lifeInUkPassed: "yes" | "no";
  ageBand: "under_18" | "18_to_64" | "65_plus";
  dependantCount: number;
  bornInUk: boolean;
  hasBritishParent: boolean;
  priorVisaId: string;
  priorVisaStart: string;
  priorVisaEnd: string;
  plannedSwitch1To: string;
  plannedSwitch1On: string;
  plannedSwitch2To: string;
  plannedSwitch2On: string;
  mainApplicantIlrOn: string;
};

export const ONBOARDING_STEPS = [
  { id: "nationality", title: "Nationality", fields: ["nationality"] as const },
  { id: "visa", title: "Current visa", fields: ["currentVisaId"] as const },
  { id: "dates", title: "Visa dates", fields: ["visaGrantDate", "visaExpiryDate"] as const },
  { id: "entry", title: "UK entry", fields: ["ukEntryDate"] as const },
  { id: "relationship", title: "Relationship", fields: ["relationship"] as const },
  { id: "english", title: "English", fields: ["englishLevel"] as const },
  { id: "lifeInUk", title: "Life in the UK", fields: ["lifeInUkPassed"] as const },
] as const;

export function emptyOnboardingValues(): OnboardingValues {
  return {
    nationality: "OTHER",
    currentVisaId: "skilled-worker",
    visaGrantDate: "",
    visaExpiryDate: "",
    ukEntryDate: "",
    relationship: "none",
    englishLevel: "none",
    lifeInUkPassed: "no",
    ageBand: "18_to_64",
    dependantCount: 0,
    bornInUk: false,
    hasBritishParent: false,
    priorVisaId: "",
    priorVisaStart: "",
    priorVisaEnd: "",
    plannedSwitch1To: "",
    plannedSwitch1On: "",
    plannedSwitch2To: "",
    plannedSwitch2On: "",
    mainApplicantIlrOn: "",
  };
}

export function englishLevelToStatus(level: OnboardingValues["englishLevel"]): EnglishStatus {
  if (level === "B1" || level === "B2") return "b1_or_higher";
  return "not_met";
}

export function englishStatusToOnboardingLevel(
  status: EnglishStatus,
): OnboardingValues["englishLevel"] {
  if (status === "b1_or_higher" || status === "degree_taught_in_english") return "B1";
  return "none";
}

export function relationshipFromProfile(profile: Profile): OnboardingValues["relationship"] {
  if (profile.marriedToBritishCitizen) return "british_citizen";
  if (profile.hasSettledPartner) return "settled";
  return "none";
}

export function profileToOnboarding(profile: Profile): OnboardingValues {
  const hops = profile.plannedSwitches?.length
    ? profile.plannedSwitches
    : profile.plannedSwitchOn && profile.plannedSwitchTo
      ? [{ toVisaId: profile.plannedSwitchTo, on: profile.plannedSwitchOn }]
      : [];
  const prior = profile.priorStages?.[0];
  return {
    nationality: profile.nationality,
    currentVisaId: profile.currentVisaId,
    visaGrantDate: profile.visaGrantedOn,
    visaExpiryDate: profile.visaExpiresOn,
    ukEntryDate: profile.ukEntryDate ?? "",
    relationship: relationshipFromProfile(profile),
    englishLevel: englishStatusToOnboardingLevel(profile.englishStatus),
    lifeInUkPassed: profile.lifeInUkStatus === "passed" ? "yes" : "no",
    ageBand: profile.ageBand,
    dependantCount: profile.dependantCount,
    bornInUk: profile.bornInUk,
    hasBritishParent: profile.hasBritishParent,
    priorVisaId: prior?.visaId ?? "",
    priorVisaStart: prior?.start ?? "",
    priorVisaEnd: prior?.end ?? "",
    plannedSwitch1To: hops[0]?.toVisaId ?? "",
    plannedSwitch1On: hops[0]?.on ?? "",
    plannedSwitch2To: hops[1]?.toVisaId ?? "",
    plannedSwitch2On: hops[1]?.on ?? "",
    mainApplicantIlrOn: profile.mainApplicantIlrOn ?? "",
  };
}

export function firstInvalidOnboardingStep(values: OnboardingValues): number | null {
  const parsed = onboardingSchema.safeParse(values);
  if (parsed.success) return null;
  const paths = new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? "")));
  const index = ONBOARDING_STEPS.findIndex((step) =>
    step.fields.some((field) => paths.has(field)),
  );
  return index === -1 ? 0 : index;
}

export function resolvePathwayId(
  visaId: string,
  previous?: Profile | null,
): Profile["pathwayId"] {
  if (visaId === "long-residence") return "long-residence";
  if (
    previous?.pathwayId === "long-residence" &&
    visaId === previous.currentVisaId &&
    visaId !== "ilr"
  ) {
    return "long-residence";
  }
  return inferPathway(visaId);
}

export function onboardingToProfile(
  values: Partial<OnboardingValues> &
    Pick<
      OnboardingValues,
      | "nationality"
      | "currentVisaId"
      | "visaGrantDate"
      | "visaExpiryDate"
      | "relationship"
      | "englishLevel"
      | "lifeInUkPassed"
    >,
  previous?: Profile | null,
): Profile {
  const full: OnboardingValues = { ...emptyOnboardingValues(), ...values };
  const pathwayId = resolvePathwayId(full.currentVisaId, previous);
  const ukEntryDate = full.ukEntryDate?.trim() || "";
  const qualifyingResidenceStart =
    pathwayId === "long-residence" ? ukEntryDate || full.visaGrantDate : full.visaGrantDate;
  const keepEnglish =
    Boolean(previous) &&
    full.englishLevel === englishStatusToOnboardingLevel(previous!.englishStatus);
  const keepLifeInUk =
    Boolean(previous) &&
    ((full.lifeInUkPassed === "yes" && previous!.lifeInUkStatus === "passed") ||
      (full.lifeInUkPassed === "no" && previous!.lifeInUkStatus !== "passed"));

  const hops = [
    full.plannedSwitch1To && full.plannedSwitch1On
      ? { toVisaId: full.plannedSwitch1To, on: full.plannedSwitch1On }
      : null,
    full.plannedSwitch2To && full.plannedSwitch2On
      ? { toVisaId: full.plannedSwitch2To, on: full.plannedSwitch2On }
      : null,
  ].filter((item): item is { toVisaId: string; on: string } => Boolean(item));

  const priorFromForm =
    full.priorVisaId && full.priorVisaStart
      ? [
          {
            visaId: full.priorVisaId,
            start: full.priorVisaStart,
            end: full.priorVisaEnd || full.visaGrantDate,
          },
          ...(previous?.priorStages ?? []).slice(1),
        ]
      : previous?.priorStages ?? [];

  const patch: Partial<Profile> & Pick<Profile, "currentVisaId"> = {
    nationality: full.nationality.trim(),
    currentVisaId: full.currentVisaId,
    pathwayId,
    visaGrantedOn: full.visaGrantDate,
    visaExpiresOn: full.visaExpiryDate,
    qualifyingResidenceStart,
    ukEntryDate,
    englishStatus: keepEnglish
      ? previous!.englishStatus
      : englishLevelToStatus(full.englishLevel),
    lifeInUkStatus: keepLifeInUk
      ? previous!.lifeInUkStatus
      : ((full.lifeInUkPassed === "yes" ? "passed" : "not_taken") satisfies LifeInUkStatus),
    marriedToBritishCitizen: full.relationship === "british_citizen",
    hasSettledPartner: full.relationship === "settled" || full.relationship === "british_citizen",
    ageBand: full.ageBand ?? previous?.ageBand ?? "18_to_64",
    dependantCount: full.dependantCount ?? previous?.dependantCount ?? 0,
    bornInUk: full.bornInUk ?? previous?.bornInUk ?? false,
    hasBritishParent: full.hasBritishParent ?? previous?.hasBritishParent ?? false,
    mainApplicantIlrOn: full.mainApplicantIlrOn || previous?.mainApplicantIlrOn || "",
    priorStages: priorFromForm,
    plannedSwitches: hops.length ? hops : previous?.plannedSwitches ?? [],
    plannedSwitchOn: hops[0]?.on ?? previous?.plannedSwitchOn ?? "",
    plannedSwitchTo: hops[0]?.toVisaId ?? previous?.plannedSwitchTo ?? "skilled-worker",
  };

  if (previous) {
    return normalizeProfile({ ...previous, ...patch, updatedAt: new Date().toISOString() });
  }
  return createProfile({ ...emptyProfile(), ...patch });
}

export function pathwayHint(visaId: string, previous?: Profile | null): string {
  return getRouteForPathway(resolvePathwayId(visaId, previous)).name;
}

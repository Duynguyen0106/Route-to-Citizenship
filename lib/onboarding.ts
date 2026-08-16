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

export const ONBOARDING_VISA_OPTIONS = [
  { id: "skilled-worker", label: "Skilled Worker visa" },
  { id: "health-care-worker", label: "Health and Care Worker visa" },
  { id: "spouse-5", label: "Family visa — partner (5-year route)" },
  { id: "spouse-10", label: "Family visa — partner (10-year route)" },
  { id: "student", label: "Student visa" },
  { id: "graduate", label: "Graduate visa" },
  { id: "global-talent-talent", label: "Global Talent (exceptional talent / prize)" },
  { id: "global-talent-promise", label: "Global Talent (exceptional promise)" },
  { id: "long-residence", label: "Counting 10 years of mixed lawful leave" },
  { id: "ilr", label: "Already have ILR / settled status" },
] as const;

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
    ukEntryDate: z.string().optional(),
    relationship: z.enum(relationshipOptions),
    englishLevel: z.enum(englishLevels),
    lifeInUkPassed: z.enum(["yes", "no"]),
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

export type OnboardingValues = z.infer<typeof onboardingSchema>;

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
  return {
    nationality: profile.nationality,
    currentVisaId: profile.currentVisaId,
    visaGrantDate: profile.visaGrantedOn,
    visaExpiryDate: profile.visaExpiresOn,
    ukEntryDate: profile.ukEntryDate ?? "",
    relationship: relationshipFromProfile(profile),
    englishLevel: englishStatusToOnboardingLevel(profile.englishStatus),
    lifeInUkPassed: profile.lifeInUkStatus === "passed" ? "yes" : "no",
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
  values: OnboardingValues,
  previous?: Profile | null,
): Profile {
  const pathwayId = resolvePathwayId(values.currentVisaId, previous);
  const ukEntryDate = values.ukEntryDate?.trim() || "";
  const qualifyingResidenceStart =
    pathwayId === "long-residence" ? ukEntryDate || values.visaGrantDate : values.visaGrantDate;
  const keepEnglish =
    Boolean(previous) &&
    values.englishLevel === englishStatusToOnboardingLevel(previous!.englishStatus);
  const keepLifeInUk =
    Boolean(previous) &&
    ((values.lifeInUkPassed === "yes" && previous!.lifeInUkStatus === "passed") ||
      (values.lifeInUkPassed === "no" && previous!.lifeInUkStatus !== "passed"));

  const patch: Partial<Profile> & Pick<Profile, "currentVisaId"> = {
    nationality: values.nationality.trim(),
    currentVisaId: values.currentVisaId,
    pathwayId,
    visaGrantedOn: values.visaGrantDate,
    visaExpiresOn: values.visaExpiryDate,
    qualifyingResidenceStart,
    ukEntryDate,
    englishStatus: keepEnglish
      ? previous!.englishStatus
      : englishLevelToStatus(values.englishLevel),
    lifeInUkStatus: keepLifeInUk
      ? previous!.lifeInUkStatus
      : ((values.lifeInUkPassed === "yes" ? "passed" : "not_taken") satisfies LifeInUkStatus),
    marriedToBritishCitizen: values.relationship === "british_citizen",
    hasSettledPartner: values.relationship === "settled" || values.relationship === "british_citizen",
  };

  if (previous) {
    return normalizeProfile({ ...previous, ...patch, updatedAt: new Date().toISOString() });
  }
  return createProfile({ ...emptyProfile(), ...patch });
}

export function pathwayHint(visaId: string, previous?: Profile | null): string {
  return getRouteForPathway(resolvePathwayId(visaId, previous)).name;
}

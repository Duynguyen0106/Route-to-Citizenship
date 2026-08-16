export const RULES_REVIEWED_ON = "2026-08-01";

export type VisaCategory =
  | "work"
  | "family"
  | "study"
  | "protection"
  | "ancestry"
  | "talent"
  | "business"
  | "visit"
  | "eu"
  | "settlement"
  | "other";

export type AbsenceRule = "180_in_12" | "eu_settled" | "none";

export type EnglishStatus =
  | "not_met"
  | "b1_or_higher"
  | "degree_taught_in_english"
  | "majority_english_national"
  | "exempt_age"
  | "exempt_medical";

export type LifeInUkStatus =
  | "not_taken"
  | "passed"
  | "exempt_age"
  | "exempt_under_18"
  | "exempt_medical";

export type AgeBand = "under_18" | "18_to_64" | "65_plus";

export type PathwayId =
  | "skilled-worker"
  | "family"
  | "student-to-skilled"
  | "global-talent"
  | "long-residence"
  | "innovator-founder"
  | "scale-up"
  | "sportsperson"
  | "minister-of-religion"
  | "global-business-mobility"
  | "youth-mobility"
  | "ancestry"
  | "bno"
  | "hpi"
  | "protection"
  | "euss"
  | "dependant"
  | "child-registration";

export type DependantKind = "partner" | "child";

export type CitizenshipPath =
  | "naturalisation"
  | "naturalisation_spouse"
  | "registration_birth"
  | "registration_parent"
  | "already_british"
  | "none";

export interface PlannedSwitch {
  toVisaId: string;
  on: string;
}

export interface Dependant {
  id: string;
  kind: DependantKind;
  ageBand: AgeBand;
  bornInUk: boolean;
  britishParent: boolean;
  visaGrantedOn: string;
  visaExpiresOn: string;
  ukEntryDate: string;
}

export interface PathwayStage {
  id: string;
  visaId: string;
  label: string;
}

export interface Pathway {
  id: PathwayId;
  title: string;
  blurb: string;
  stages: PathwayStage[];
  currentVisaChoices: { visaId: string; label: string }[];
}

export interface AbsenceTrip {
  id: string;
  departedOn: string;
  returnedOn: string;
  place: string;
}

export interface VisaStageRecord {
  visaId: string;
  start: string;
  end: string;
}

export interface VisaRoute {
  id: string;
  name: string;
  shortName: string;
  category: VisaCategory;
  /** Whether time on this route normally counts toward ILR. */
  leadsToIlr: boolean;
  /** Qualifying residence in years, if the route has a standard ILR clock. */
  ilrYears: number | null;
  /** Time on this route usually counts toward the 5-year work ILR combination. */
  countsTowardWorkIlr: boolean;
  /** Time on this route usually counts toward the family settlement clock. */
  countsTowardFamilyIlr: boolean;
  absenceRule: AbsenceRule;
  typicalGrantYears: number | null;
  inCountrySwitchFrom: "most" | "limited" | "none";
  englishRequiredForIlr: boolean;
  lifeInUkRequiredForIlr: boolean;
  summary: string;
  caveats: string[];
  officialUrl: string;
}

export interface Profile {
  id: string;
  updatedAt: string;
  pathwayId: PathwayId;
  currentVisaId: string;
  /** Date current leave was granted. */
  visaGrantedOn: string;
  /** Date current leave expires. */
  visaExpiresOn: string;
  /**
   * Date qualifying residence is treated as starting.
   * Usually first grant of a qualifying visa, or UK entry on that visa.
   */
  qualifyingResidenceStart: string;
  /** Optional UK entry date for citizenship residence calculations. */
  ukEntryDate: string;
  /** Earlier visas on a multi-stage path (e.g. Student then Graduate). */
  priorStages: VisaStageRecord[];
  /** Planned switch onto a qualifying visa (used on the student path). */
  plannedSwitchOn: string;
  plannedSwitchTo: string;
  /** Extra planned hops after the first switch, e.g. Skilled Worker → Global Talent. */
  plannedSwitches: PlannedSwitch[];
  dependants: Dependant[];
  /** Parent ILR date when this profile is a dependant or a child registering. */
  mainApplicantIlrOn: string;
  bornInUk: boolean;
  hasBritishParent: boolean;
  absences: AbsenceTrip[];
  daysAbsentLast12Months: number;
  exceeded180DaysInAny12Months: boolean;
  daysAbsentLast5Years: number;
  daysAbsentLast12MonthsCitizenship: number;
  englishStatus: EnglishStatus;
  lifeInUkStatus: LifeInUkStatus;
  nationality: string;
  ageBand: AgeBand;
  marriedToBritishCitizen: boolean;
  hasSettledPartner: boolean;
  dependantCount: number;
  applyFromInsideUk: boolean;
  sponsorshipOverThreeYears: boolean;
  reminderPrefs: ReminderPrefs;
  checkedDocumentIds: string[];
}

export interface ReminderPrefs {
  visaExpiry: boolean;
  ilrWindow: boolean;
  tests: boolean;
  citizenship: boolean;
  browserNotifications: boolean;
}

export interface EligibilityItem {
  id: string;
  label: string;
  status: "met" | "not_met" | "attention" | "not_applicable";
  detail: string;
}

export interface EligibilityRequirementsMet {
  continuousResidence: boolean;
  absenceLimit: boolean;
  english: boolean;
  lifeInUK: boolean;
  feesKnown: boolean;
}

export interface EligibilityCheck {
  eligible: boolean;
  reasons: string[];
  estimatedILRDate: Date | null;
  estimatedCitizenshipDate: Date | null;
  requirementsMet: EligibilityRequirementsMet;
}

export interface TimelineEvent {
  id: string;
  label: string;
  date: string;
  kind: "past" | "now" | "visa" | "ilr" | "citizenship" | "warning" | "stage";
  note?: string;
}

export interface AbsenceWindow {
  days: number;
  windowStart: string;
  windowEnd: string;
}

export interface AbsenceAnalysis {
  tripCount: number;
  last12Months: number;
  last3Years: number;
  last5Years: number;
  maxRolling12Months: AbsenceWindow;
  breached180: boolean;
  remainingLast12: number;
  remainingCitizenship12: number;
  remainingCitizenship5y: number;
  remainingCitizenship3y: number;
}

export interface FeeLine {
  id: string;
  label: string;
  amountGbp: number;
  note?: string;
}

export interface FeeBreakdown {
  people: number;
  lines: FeeLine[];
  totalGbp: number;
  disclaimer: string;
}

export interface AlternativeRoute {
  routeId: string;
  name: string;
  reason: string;
  inCountrySwitch: boolean;
  ilrEligibleOn: string | null;
  citizenshipEligibleOn: string | null;
  daysSavedVsCurrent: number | null;
  caveats: string[];
  officialUrl: string;
}

export interface PossibleSwitch {
  routeKey: string;
  name: string;
  toVisaId: string;
  inCountrySwitch: boolean;
  estimatedILRDate: Date | null;
  estimatedCitizenshipDate: Date | null;
  yearsToILR: number | null;
  clockNote: string;
  caveats: string[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  detail: string;
  required: boolean;
  group: "identity" | "residence" | "route" | "english" | "application";
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  kind: "visa_expiry" | "ilr" | "test" | "citizenship";
  detail: string;
  urgency: "overdue" | "soon" | "upcoming";
}

export interface DependantPlan {
  id: string;
  kind: DependantKind;
  label: string;
  ilrEligibleOn: string | null;
  citizenshipEligibleOn: string | null;
  citizenshipPath: CitizenshipPath;
  summary: string;
}

export interface SwitchChainHop {
  toVisaId: string;
  on: string;
  qualifyingStart: string;
  ilrEligibleOn: string | null;
  note: string;
}

export interface PlanResult {
  asOf: string;
  pathwayId: PathwayId;
  route: VisaRoute;
  hasIlrPath: boolean;
  ilrEligibleOn: string | null;
  ilrApplyFrom: string | null;
  citizenshipEligibleOn: string | null;
  citizenshipPath: CitizenshipPath;
  longResidenceIlrOn: string | null;
  switchChain: SwitchChainHop[];
  dependantPlans: DependantPlan[];
  needsVisaExtension: boolean;
  extensionNote: string | null;
  timeline: TimelineEvent[];
  eligibility: EligibilityItem[];
  eligibilityCheck: EligibilityCheck;
  alternatives: AlternativeRoute[];
  checklist: ChecklistItem[];
  reminders: Reminder[];
  absences: AbsenceAnalysis;
  fees: FeeBreakdown;
  summary: string;
}

export const DEFAULT_REMINDER_PREFS: ReminderPrefs = {
  visaExpiry: true,
  ilrWindow: true,
  tests: true,
  citizenship: true,
  browserNotifications: false,
};

export const MAJORITY_ENGLISH_SPEAKING_COUNTRIES = [
  { code: "AG", name: "Antigua and Barbuda" },
  { code: "AU", name: "Australia" },
  { code: "BS", name: "The Bahamas" },
  { code: "BB", name: "Barbados" },
  { code: "BZ", name: "Belize" },
  { code: "CA", name: "Canada" },
  { code: "DM", name: "Dominica" },
  { code: "GD", name: "Grenada" },
  { code: "GY", name: "Guyana" },
  { code: "JM", name: "Jamaica" },
  { code: "MT", name: "Malta" },
  { code: "NZ", name: "New Zealand" },
  { code: "KN", name: "St Kitts and Nevis" },
  { code: "LC", name: "St Lucia" },
  { code: "VC", name: "St Vincent and the Grenadines" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "US", name: "United States of America" },
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
] as const;

export const OTHER_COMMON_NATIONALITIES = [
  { code: "IN", name: "India" },
  { code: "NG", name: "Nigeria" },
  { code: "PK", name: "Pakistan" },
  { code: "PH", name: "Philippines" },
  { code: "CN", name: "China" },
  { code: "HK", name: "Hong Kong" },
  { code: "GH", name: "Ghana" },
  { code: "ZA", name: "South Africa" },
  { code: "BR", name: "Brazil" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "PL", name: "Poland" },
  { code: "TR", name: "Turkey" },
  { code: "UA", name: "Ukraine" },
  { code: "BD", name: "Bangladesh" },
  { code: "EG", name: "Egypt" },
  { code: "OTHER", name: "Other / not listed" },
] as const;

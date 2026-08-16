import type { FeeBreakdown, FeeLine, PathwayId } from "./types";

/** Home Office immigration and nationality fees from 8 April 2026. */
export const FEES_FROM = "2026-04-08";
export const FEES_SOURCE =
  "https://www.gov.uk/government/publications/visa-regulations-revised-table/home-office-immigration-and-nationality-fees-8-april-2026";

export const IHS_ADULT_PER_YEAR = 1035;
export const IHS_STUDENT_PER_YEAR = 776;
export const LIFE_IN_UK_TEST = 50;
export const ENGLISH_SELT_ESTIMATE = 150;
export const CITIZENSHIP_CEREMONY = 130;
export const ILR_FEE = 3226;
export const NATURALISATION_FEE = 1709;
export const STUDENT_FEE = 558;
export const GRADUATE_FEE = 937;
export const FAMILY_OUTSIDE_UK = 2064;
export const FAMILY_INSIDE_UK = 1407;
export const GLOBAL_TALENT_ENDORSEMENT = 561;
export const GLOBAL_TALENT_WITH_LETTER = 205;
export const GLOBAL_TALENT_NO_LETTER = 766;

export const SKILLED_WORKER = {
  outsideUpTo3: 819,
  outsideOver3: 1618,
  insideUpTo3: 943,
  insideOver3: 1865,
} as const;

export interface FeeInput {
  currentVisaId: string;
  pathwayId: PathwayId;
  applyFromInsideUk: boolean;
  sponsorshipOverThreeYears: boolean;
  dependantCount: number;
  includeNextVisa: boolean;
  includeIhs: boolean;
  ihsYears: number;
  includeIlr: boolean;
  includeCitizenship: boolean;
  includeTests: boolean;
  needsEnglishTest: boolean;
  needsLifeInUk: boolean;
  globalTalentNeedsEndorsement: boolean;
}

function line(id: string, label: string, amountGbp: number, note?: string): FeeLine {
  return { id, label, amountGbp, note };
}

export function skilledWorkerApplicationFee(insideUk: boolean, overThreeYears: boolean): number {
  if (insideUk) return overThreeYears ? SKILLED_WORKER.insideOver3 : SKILLED_WORKER.insideUpTo3;
  return overThreeYears ? SKILLED_WORKER.outsideOver3 : SKILLED_WORKER.outsideUpTo3;
}

export function ihsAnnualRate(visaId: string): number {
  return visaId === "student" ? IHS_STUDENT_PER_YEAR : IHS_ADULT_PER_YEAR;
}

export function nextVisaApplicationFee(input: Pick<
  FeeInput,
  | "currentVisaId"
  | "applyFromInsideUk"
  | "sponsorshipOverThreeYears"
  | "globalTalentNeedsEndorsement"
>): { amount: number; label: string; extra?: FeeLine } {
  const { currentVisaId, applyFromInsideUk, sponsorshipOverThreeYears } = input;
  if (currentVisaId === "student") {
    return { amount: STUDENT_FEE, label: "Student visa application (per person)" };
  }
  if (currentVisaId === "graduate") {
    return { amount: GRADUATE_FEE, label: "Graduate visa application (per person)" };
  }
  if (currentVisaId === "spouse-5" || currentVisaId === "spouse-10") {
    return {
      amount: applyFromInsideUk ? FAMILY_INSIDE_UK : FAMILY_OUTSIDE_UK,
      label: applyFromInsideUk
        ? "Partner visa extension / FLR(M) (per person)"
        : "Partner visa entry clearance (per person)",
    };
  }
  if (currentVisaId.startsWith("global-talent")) {
    if (input.globalTalentNeedsEndorsement) {
      return {
        amount: GLOBAL_TALENT_WITH_LETTER,
        label: "Global Talent application with endorsement letter (per person)",
        extra: line(
          "gt-endorsement",
          "Global Talent endorsement (main applicant)",
          GLOBAL_TALENT_ENDORSEMENT,
          "Paid once to the endorsing body, not per dependant.",
        ),
      };
    }
    return {
      amount: GLOBAL_TALENT_NO_LETTER,
      label: "Global Talent application — prize / no endorsement letter (per person)",
    };
  }
  if (currentVisaId === "skilled-worker") {
    return {
      amount: skilledWorkerApplicationFee(applyFromInsideUk, sponsorshipOverThreeYears),
      label: `Skilled Worker application, ${sponsorshipOverThreeYears ? "over 3 years" : "up to 3 years"} (${applyFromInsideUk ? "in UK" : "outside UK"}, per person)`,
    };
  }
  if (currentVisaId === "long-residence" || currentVisaId === "ilr") {
    return { amount: ILR_FEE, label: "Indefinite leave to remain (per person)" };
  }
  return {
    amount: skilledWorkerApplicationFee(applyFromInsideUk, sponsorshipOverThreeYears),
    label: "Visa application (per person)",
  };
}

export function estimateFees(input: FeeInput): FeeBreakdown {
  const people = Math.max(1, 1 + Math.max(0, input.dependantCount));
  const lines: FeeLine[] = [];

  if (input.includeNextVisa && input.currentVisaId !== "ilr") {
    const next = nextVisaApplicationFee(input);
    lines.push(line("visa", next.label, next.amount * people));
    if (next.extra) lines.push(next.extra);
  }

  if (input.includeIhs && input.currentVisaId !== "ilr" && input.currentVisaId !== "long-residence") {
    const years = Math.max(0.5, input.ihsYears);
    const rate = ihsAnnualRate(input.currentVisaId);
    lines.push(
      line(
        "ihs",
        `Immigration Health Surcharge (${years} year${years === 1 ? "" : "s"}, ${people} person${people === 1 ? "" : "s"})`,
        Math.round(rate * years * people),
        input.currentVisaId === "student"
          ? "Student rate. Graduate and work visas usually pay the standard adult rate."
          : "Standard adult rate. Charged up-front for the length of leave.",
      ),
    );
  }

  if (input.includeTests) {
    if (input.needsLifeInUk) {
      lines.push(line("life-in-uk", "Life in the UK test", LIFE_IN_UK_TEST));
    }
    if (input.needsEnglishTest) {
      lines.push(
        line(
          "english",
          "English language test (typical SELT, estimate)",
          ENGLISH_SELT_ESTIMATE,
          "Not a Home Office fee. Actual provider prices vary.",
        ),
      );
    }
  }

  if (input.includeIlr) {
    lines.push(line("ilr", "Indefinite leave to remain (per person)", ILR_FEE * people));
  }

  if (input.includeCitizenship) {
    lines.push(
      line(
        "naturalisation",
        "Naturalisation as a British citizen (main applicant)",
        NATURALISATION_FEE,
      ),
    );
    lines.push(line("ceremony", "Citizenship ceremony", CITIZENSHIP_CEREMONY));
  }

  const totalGbp = lines.reduce((sum, item) => sum + item.amountGbp, 0);
  return {
    people,
    lines,
    totalGbp,
    disclaimer: `Home Office fees from ${FEES_FROM}. IHS and optional tests included only if selected. Confirm live amounts on GOV.UK before you pay.`,
  };
}

export function defaultIhsYears(currentVisaId: string, sponsorshipOverThreeYears: boolean): number {
  if (currentVisaId === "graduate") return 2;
  if (currentVisaId === "student") return 1;
  if (currentVisaId === "spouse-5" || currentVisaId === "spouse-10") return 2.5;
  if (currentVisaId === "skilled-worker") return sponsorshipOverThreeYears ? 5 : 3;
  if (currentVisaId.startsWith("global-talent")) return 5;
  return 3;
}

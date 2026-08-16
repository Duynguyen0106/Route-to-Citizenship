import { RULES_REVIEWED_ON } from "./types";

/** Shown in the site-wide footer on every page. */
export const LEGAL_NOTICE =
  "This app provides general information only and does not constitute legal advice. Always check the official GOV.UK website or consult a regulated immigration adviser.";

export const GOVUK = {
  browse: "https://www.gov.uk/browse/visas-immigration",
  ilr: "https://www.gov.uk/indefinite-leave-to-remain",
  citizenship: "https://www.gov.uk/british-citizenship",
  skilledWorker: "https://www.gov.uk/skilled-worker-visa",
  familyPartner: "https://www.gov.uk/uk-family-visa/partner-spouse",
  student: "https://www.gov.uk/student-visa",
  graduate: "https://www.gov.uk/graduate-visa",
  globalTalent: "https://www.gov.uk/global-talent",
  adviser: "https://www.gov.uk/find-an-immigration-adviser",
} as const;

export interface OfficialLink {
  label: string;
  url: string;
}

export const SETTLEMENT_LINKS: OfficialLink[] = [
  { label: "Indefinite leave to remain", url: GOVUK.ilr },
  { label: "British citizenship", url: GOVUK.citizenship },
];

export const DEFAULT_LAST_REVIEWED_ON = RULES_REVIEWED_ON;

export const DATA_MINIMISATION_NOTE =
  "We store only what the planner needs: visa type, dates, nationality (for English-language exemptions), and optional account email. Never enter passport numbers, Home Office references, or biometric IDs.";

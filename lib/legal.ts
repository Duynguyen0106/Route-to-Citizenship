import { RULES_REVIEWED_ON } from "./types";

/** Shown in the site-wide footer on every page. */
export const LEGAL_NOTICE =
  "This app provides general information only and does not constitute legal advice. Always check the official GOV.UK website or consult a regulated immigration adviser.";

export const GOVUK = {
  browse: "https://www.gov.uk/browse/visas-immigration",
  ilr: "https://www.gov.uk/indefinite-leave-to-remain",
  citizenship: "https://www.gov.uk/british-citizenship",
  registerCitizen: "https://www.gov.uk/register-british-citizen",
  skilledWorker: "https://www.gov.uk/skilled-worker-visa",
  familyPartner: "https://www.gov.uk/uk-family-visa/partner-spouse",
  student: "https://www.gov.uk/student-visa",
  graduate: "https://www.gov.uk/graduate-visa",
  globalTalent: "https://www.gov.uk/global-talent",
  innovatorFounder: "https://www.gov.uk/innovator-founder-visa",
  scaleUp: "https://www.gov.uk/scale-up-visa",
  sportsperson: "https://www.gov.uk/sportsperson-visa",
  ministerOfReligion: "https://www.gov.uk/minister-of-religion-visa",
  gbm: "https://www.gov.uk/global-business-mobility-routes",
  youthMobility: "https://www.gov.uk/youth-mobility",
  ancestry: "https://www.gov.uk/ancestry-visa",
  bno: "https://www.gov.uk/british-national-overseas-bno-visa",
  hpi: "https://www.gov.uk/high-potential-individual-visa",
  refugeeSettlement: "https://www.gov.uk/settle-in-the-uk/refugee-settlement",
  euss: "https://www.gov.uk/settled-status-eu-citizens-families",
  dependants: "https://www.gov.uk/skilled-worker-visa/family-members",
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
  "We store only what the planner needs: visa type, dates, nationality (for English-language exemptions), and optional account email. Never enter passport numbers, Home Office references, or biometric IDs. Optional document copies stay in this browser only, encrypted on this device; at most the last four characters of a detected identity number are kept, and those files are never uploaded to our server. GOV.UK polls store page titles, descriptions and update timestamps only. Opt-in benchmarks store a visa category, coarse nationality region and sketched dates — not your name or email. Guidance questions are not saved.";

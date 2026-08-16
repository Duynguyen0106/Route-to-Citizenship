import { GOVUK } from "./legal";

export const ADVISER_COMMISSION_RATE = 0.15;

export const ADVISER_COMMISSION_NOTE =
  "If introductions go live, a 15% commission on the adviser’s published consultation fee would be disclosed to both sides. This prototype only stores the lead. It does not take booking fees or share your documents.";

export const OISC_REGISTER_URL = "https://www.gov.uk/find-an-immigration-adviser";
export const SRA_REGISTER_URL = "https://www.sra.org.uk/consumers/register/";

export type AdviserArea = "work" | "family" | "protection" | "nationality" | "student";

export interface AdviserListing {
  slug: string;
  name: string;
  kind: "oisc" | "solicitor";
  levelNote: string;
  areas: AdviserArea[];
  city: string;
  nation: "England" | "Scotland" | "Wales" | "Northern Ireland";
  registerUrl: string;
  illustrative: true;
}

/**
 * Placeholder directory rows so the marketplace UI can be reviewed.
 * They are not live OISC or SRA records. Always verify on the official registers.
 */
export const ADVISER_DIRECTORY: AdviserListing[] = [
  {
    slug: "example-work-london",
    name: "Example Work Route Practice (illustrative)",
    kind: "oisc",
    levelNote: "Would need a live OISC registration — verify on GOV.UK",
    areas: ["work", "nationality"],
    city: "London",
    nation: "England",
    registerUrl: GOVUK.adviser,
    illustrative: true,
  },
  {
    slug: "example-family-manchester",
    name: "Example Family Settlement Desk (illustrative)",
    kind: "oisc",
    levelNote: "Would need a live OISC registration — verify on GOV.UK",
    areas: ["family", "nationality"],
    city: "Manchester",
    nation: "England",
    registerUrl: GOVUK.adviser,
    illustrative: true,
  },
  {
    slug: "example-protection-glasgow",
    name: "Example Protection & Human Rights Chamber (illustrative)",
    kind: "solicitor",
    levelNote: "Would need a live SRA / Law Society of Scotland record",
    areas: ["protection", "family"],
    city: "Glasgow",
    nation: "Scotland",
    registerUrl: SRA_REGISTER_URL,
    illustrative: true,
  },
  {
    slug: "example-student-cardiff",
    name: "Example Study-to-Work Clinic (illustrative)",
    kind: "oisc",
    levelNote: "Would need a live OISC registration — verify on GOV.UK",
    areas: ["student", "work"],
    city: "Cardiff",
    nation: "Wales",
    registerUrl: GOVUK.adviser,
    illustrative: true,
  },
];

export function getAdviser(slug: string): AdviserListing | undefined {
  return ADVISER_DIRECTORY.find((item) => item.slug === slug);
}

export function filterAdvisers(filters: { area?: string; city?: string }): AdviserListing[] {
  const area = filters.area?.trim().toLowerCase();
  const city = filters.city?.trim().toLowerCase();
  return ADVISER_DIRECTORY.filter((item) => {
    if (area && area !== "all" && !item.areas.includes(area as AdviserArea)) return false;
    if (city && !item.city.toLowerCase().includes(city)) return false;
    return true;
  });
}

export function indicativeCommissionGbp(consultationGbp: number): number {
  if (!Number.isFinite(consultationGbp) || consultationGbp <= 0) return 0;
  return Math.round(consultationGbp * ADVISER_COMMISSION_RATE);
}

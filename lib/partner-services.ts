import { GOVUK } from "./legal";
import { IHS_ADULT_PER_YEAR, IHS_STUDENT_PER_YEAR } from "./fees";
import type { EnglishTestRecord, LifeInUkBooking, Profile } from "./types";

export interface SeltProvider {
  id: EnglishTestRecord["provider"];
  name: string;
  bookUrl: string;
  note: string;
}

export const SELT_PROVIDERS: SeltProvider[] = [
  {
    id: "ielts-ukvi",
    name: "IELTS for UKVI",
    bookUrl: "https://www.ielts.org/for-test-takers/book-a-test",
    note: "Only IELTS for UKVI (not standard IELTS) is a SELT. Confirm the live list on GOV.UK.",
  },
  {
    id: "trinity",
    name: "Trinity College London (ISE / GESE)",
    bookUrl: "https://www.trinitycollege.com/qualifications/english-language/SELT",
    note: "Book a UKVI Secure English Language Test. Check which skills your visa needs.",
  },
  {
    id: "languagecert",
    name: "LanguageCert SELT",
    bookUrl: "https://selt.languagecert.org/",
    note: "Provider on the Home Office approved SELT list — re-check GOV.UK before you book.",
  },
  {
    id: "psi",
    name: "Skills for English (PSI)",
    bookUrl: "https://skillsforenglish.com/",
    note: "Another approved SELT provider. The official list on GOV.UK always wins.",
  },
];

export interface LitukCentre {
  id: string;
  city: string;
  nation: "England" | "Scotland" | "Wales" | "Northern Ireland";
}

/** Typical Life in the UK test cities — not live Pearson/PSI slot data. */
export const LITUK_CENTRES: LitukCentre[] = [
  { id: "london", city: "London", nation: "England" },
  { id: "birmingham", city: "Birmingham", nation: "England" },
  { id: "manchester", city: "Manchester", nation: "England" },
  { id: "leeds", city: "Leeds", nation: "England" },
  { id: "bristol", city: "Bristol", nation: "England" },
  { id: "newcastle", city: "Newcastle", nation: "England" },
  { id: "nottingham", city: "Nottingham", nation: "England" },
  { id: "sheffield", city: "Sheffield", nation: "England" },
  { id: "liverpool", city: "Liverpool", nation: "England" },
  { id: "cardiff", city: "Cardiff", nation: "Wales" },
  { id: "edinburgh", city: "Edinburgh", nation: "Scotland" },
  { id: "glasgow", city: "Glasgow", nation: "Scotland" },
  { id: "belfast", city: "Belfast", nation: "Northern Ireland" },
];

export function ihsOfficialLinks() {
  return [
    { label: "Pay the Immigration Health Surcharge", url: GOVUK.ihs },
    { label: "How much you pay (official)", url: GOVUK.ihsHowMuch },
  ];
}

export function ihsSketchGbp(profile: Pick<Profile, "currentVisaId" | "dependantCount">, years: number): number {
  const people = Math.max(1, 1 + Math.max(0, profile.dependantCount));
  const rate = profile.currentVisaId === "student" ? IHS_STUDENT_PER_YEAR : IHS_ADULT_PER_YEAR;
  return Math.round(rate * Math.max(0.5, years) * people);
}

export function translationMailto(documentLabels: string[]): string {
  const list = documentLabels.length ? documentLabels.map((item) => `- ${item}`).join("\n") : "- (list the documents)";
  const body = encodeURIComponent(
    `Hello,\n\nPlease quote for a certified translation into English for UKVI:\n${list}\n\nI will attach scans separately. This is not a Home Office request.\n`,
  );
  return `mailto:?subject=${encodeURIComponent("Certified translation for a UK visa application")}&body=${body}`;
}

export function applyEnglishResult(profile: Profile, record: EnglishTestRecord): Profile {
  const b1up = ["B1", "B2", "C1", "C2"].includes(record.level);
  return {
    ...profile,
    englishTest: { ...record, last4: record.last4 ? record.last4.slice(-4) : null },
    englishStatus: b1up ? "b1_or_higher" : profile.englishStatus,
  };
}

export function applyLifeInUkBooking(profile: Profile, booking: LifeInUkBooking): Profile {
  return { ...profile, lifeInUkBooking: booking };
}

export const TRANSLATION_REGISTERS = [
  { label: "ITI Find a translator", url: GOVUK.findTranslatorIti },
  { label: "NRPSI (public service interpreters)", url: GOVUK.findTranslatorNrpsi },
];

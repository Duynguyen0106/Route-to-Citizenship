import { GOVUK } from "./legal";
import { SELT_PROVIDERS, TRANSLATION_REGISTERS } from "./partner-services";

export const AFFILIATE_DISCLOSURE =
  "Some outbound links may later sit on a referral programme. Today they are ordinary links to the provider. This app does not receive a live commission, does not set test prices, and is not an insurer, bank, or landlord.";

export interface AffiliateLink {
  id: string;
  category: "english" | "translation" | "money" | "insurance" | "accommodation";
  name: string;
  url: string;
  note: string;
}

export const AFFILIATE_LINKS: AffiliateLink[] = [
  ...SELT_PROVIDERS.map((item) => ({
    id: item.id,
    category: "english" as const,
    name: item.name,
    url: item.bookUrl,
    note: item.note,
  })),
  ...TRANSLATION_REGISTERS.map((item) => ({
    id: item.label.toLowerCase().replace(/\s+/g, "-"),
    category: "translation" as const,
    name: item.label,
    url: item.url,
    note: "Use a qualified translator. UKVI has rules on whose translations it will accept.",
  })),
  {
    id: "wise",
    category: "money",
    name: "Wise (international transfer)",
    url: "https://wise.com/",
    note: "Pay Home Office fees from overseas at the rate the provider quotes. Confirm the amount on GOV.UK first.",
  },
  {
    id: "moneyhelper-insurance",
    category: "insurance",
    name: "MoneyHelper — travel insurance",
    url: "https://www.moneyhelper.org.uk/en/everyday-money/insurance/travel-insurance",
    note: "Independent public guidance. This planner does not sell insurance.",
  },
  {
    id: "private-renting",
    category: "accommodation",
    name: "Private renting in England (GOV.UK)",
    url: "https://www.gov.uk/private-renting",
    note: "Official overview. Listings sit on the usual property sites — this app does not take deposits.",
  },
  {
    id: "prove-english",
    category: "english",
    name: "Prove your knowledge of English (GOV.UK)",
    url: GOVUK.proveEnglish,
    note: "The approved SELT list on GOV.UK always wins over a booking page.",
  },
];

export const AFFILIATE_CATEGORIES: { id: AffiliateLink["category"]; label: string }[] = [
  { id: "english", label: "English tests" },
  { id: "translation", label: "Translation" },
  { id: "money", label: "Paying visa fees" },
  { id: "insurance", label: "Insurance" },
  { id: "accommodation", label: "Accommodation" },
];

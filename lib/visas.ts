import type { VisaRoute } from "./types";

/** Individual visa catalogue used by timelines, checklists and in-country switch heuristics. */

export const ROUTES: VisaRoute[] = [
  {
    id: "skilled-worker",
    name: "Skilled Worker visa",
    shortName: "Skilled Worker",
    category: "work",
    leadsToIlr: true,
    ilrYears: 5,
    countsTowardWorkIlr: true,
    countsTowardFamilyIlr: false,
    absenceRule: "180_in_12",
    typicalGrantYears: 5,
    inCountrySwitchFrom: "most",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary:
      "A sponsored work visa. Time usually counts toward 5-year work settlement if you keep meeting the salary and sponsorship rules.",
    caveats: [
      "You generally need a valid sponsor and to meet the going rate / salary threshold throughout.",
      "Absences of more than 180 days in any 12-month period can break continuous residence.",
    ],
    officialUrl: "https://www.gov.uk/skilled-worker-visa",
  },
  {
    id: "health-care-worker",
    name: "Health and Care Worker visa",
    shortName: "Health and Care Worker",
    category: "work",
    leadsToIlr: true,
    ilrYears: 5,
    countsTowardWorkIlr: true,
    countsTowardFamilyIlr: false,
    absenceRule: "180_in_12",
    typicalGrantYears: 5,
    inCountrySwitchFrom: "most",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary:
      "A Skilled Worker variant for eligible health and care roles. Settlement is typically after 5 years of qualifying residence.",
    caveats: [
      "Role, sponsor, and salary rules are specific to this visa and have changed frequently.",
    ],
    officialUrl: "https://www.gov.uk/health-care-worker-visa",
  },
  {
    id: "global-talent-talent",
    name: "Global Talent visa (exceptional talent / prize)",
    shortName: "Global Talent (3-year ILR)",
    category: "talent",
    leadsToIlr: true,
    ilrYears: 3,
    countsTowardWorkIlr: true,
    countsTowardFamilyIlr: false,
    absenceRule: "180_in_12",
    typicalGrantYears: 5,
    inCountrySwitchFrom: "most",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary:
      "For people endorsed as exceptional talent or holding an eligible prestigious prize. ILR can be available after 3 years.",
    caveats: [
      "The 3-year route usually requires the qualifying time to be spent on Global Talent (or a permitted combination). Time on other work visas may not shorten the 3-year clock.",
      "You still need to show you have been economically active in your field.",
    ],
    officialUrl: "https://www.gov.uk/global-talent",
  },
  {
    id: "global-talent-promise",
    name: "Global Talent visa (exceptional promise)",
    shortName: "Global Talent (5-year ILR)",
    category: "talent",
    leadsToIlr: true,
    ilrYears: 5,
    countsTowardWorkIlr: true,
    countsTowardFamilyIlr: false,
    absenceRule: "180_in_12",
    typicalGrantYears: 5,
    inCountrySwitchFrom: "most",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary:
      "For people endorsed as exceptional promise. Settlement is typically after 5 years.",
    caveats: [
      "Time on some other qualifying work routes may count toward the 5-year total.",
    ],
    officialUrl: "https://www.gov.uk/global-talent",
  },
  {
    id: "innovator-founder",
    name: "Innovator Founder visa",
    shortName: "Innovator Founder",
    category: "business",
    leadsToIlr: true,
    ilrYears: 3,
    countsTowardWorkIlr: true,
    countsTowardFamilyIlr: false,
    absenceRule: "180_in_12",
    typicalGrantYears: 3,
    inCountrySwitchFrom: "most",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary:
      "For founders with an endorsing body. Settlement can be available after 3 years if the business meets the endorsement criteria.",
    caveats: [
      "ILR depends on a successful endorsement for settlement, not only on time spent in the UK.",
    ],
    officialUrl: "https://www.gov.uk/innovator-founder-visa",
  },
  {
    id: "scale-up",
    name: "Scale-up visa",
    shortName: "Scale-up",
    category: "work",
    leadsToIlr: true,
    ilrYears: 5,
    countsTowardWorkIlr: true,
    countsTowardFamilyIlr: false,
    absenceRule: "180_in_12",
    typicalGrantYears: 2,
    inCountrySwitchFrom: "most",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary:
      "A sponsored visa for eligible scale-up employers. Time usually counts toward 5-year work settlement.",
    caveats: [
      "The initial grant is often 2 years; you may need further leave on this or another qualifying route before ILR.",
    ],
    officialUrl: "https://www.gov.uk/scale-up-visa",
  },
  {
    id: "spouse-5",
    name: "Partner / spouse visa (5-year route)",
    shortName: "Partner (5-year)",
    category: "family",
    leadsToIlr: true,
    ilrYears: 5,
    countsTowardWorkIlr: false,
    countsTowardFamilyIlr: true,
    absenceRule: "180_in_12",
    typicalGrantYears: 2.5,
    inCountrySwitchFrom: "most",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary:
      "Family life with a British or settled partner on the 5-year route. Settlement is typically after 60 months in qualifying leave.",
    caveats: [
      "You must continue to meet the relationship and financial requirements at each extension and at ILR.",
      "Time on work visas does not usually transfer onto this family clock.",
    ],
    officialUrl: "https://www.gov.uk/uk-family-visa/partner-spouse",
  },
  {
    id: "spouse-10",
    name: "Partner / spouse visa (10-year route)",
    shortName: "Partner (10-year)",
    category: "family",
    leadsToIlr: true,
    ilrYears: 10,
    countsTowardWorkIlr: false,
    countsTowardFamilyIlr: true,
    absenceRule: "180_in_12",
    typicalGrantYears: 2.5,
    inCountrySwitchFrom: "most",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary:
      "Family life where the 5-year financial or other requirements are not met. Settlement is typically after 10 years.",
    caveats: [
      "If you later meet the 5-year route requirements you may be able to switch onto that shorter path.",
    ],
    officialUrl: "https://www.gov.uk/uk-family-visa/partner-spouse",
  },
  {
    id: "parent",
    name: "Parent of a British or settled child",
    shortName: "Parent visa",
    category: "family",
    leadsToIlr: true,
    ilrYears: 5,
    countsTowardWorkIlr: false,
    countsTowardFamilyIlr: true,
    absenceRule: "180_in_12",
    typicalGrantYears: 2.5,
    inCountrySwitchFrom: "most",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary:
      "Parent route leading to settlement, commonly after 5 years on the standard route (or 10 years if on the longer route).",
    caveats: [
      "Some parents are placed on a 10-year route. This planner uses the 5-year standard unless you choose the 10-year partner analogue and note it.",
    ],
    officialUrl: "https://www.gov.uk/uk-family-visa/parent",
  },
  {
    id: "ancestry",
    name: "UK Ancestry visa",
    shortName: "UK Ancestry",
    category: "ancestry",
    leadsToIlr: true,
    ilrYears: 5,
    countsTowardWorkIlr: true,
    countsTowardFamilyIlr: false,
    absenceRule: "180_in_12",
    typicalGrantYears: 5,
    inCountrySwitchFrom: "most",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary:
      "For Commonwealth citizens with a UK-born grandparent. Settlement is typically after 5 years, with a work requirement.",
    caveats: ["You usually need to show you have been working in the UK."],
    officialUrl: "https://www.gov.uk/ancestry-visa",
  },
  {
    id: "bno",
    name: "British National (Overseas) visa",
    shortName: "BN(O) visa",
    category: "ancestry",
    leadsToIlr: true,
    ilrYears: 5,
    countsTowardWorkIlr: false,
    countsTowardFamilyIlr: false,
    absenceRule: "180_in_12",
    typicalGrantYears: 5,
    inCountrySwitchFrom: "most",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary:
      "A 5-year path to settlement for eligible BN(O) status holders and family members.",
    caveats: [
      "Absence rules still apply. Check the latest BN(O) guidance for dependants and Hong Kong BN(O) specifics.",
    ],
    officialUrl: "https://www.gov.uk/british-national-overseas-bno-visa",
  },
  {
    id: "student",
    name: "Student visa",
    shortName: "Student",
    category: "study",
    leadsToIlr: false,
    ilrYears: null,
    countsTowardWorkIlr: false,
    countsTowardFamilyIlr: false,
    absenceRule: "none",
    typicalGrantYears: 1,
    inCountrySwitchFrom: "most",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary:
      "Study leave does not lead to ILR by itself. Most people switch to a work, talent, business, or family route after studying.",
    caveats: [
      "Time as a student does not usually count toward the 5-year work or family settlement clocks.",
    ],
    officialUrl: "https://www.gov.uk/student-visa",
  },
  {
    id: "graduate",
    name: "Graduate visa",
    shortName: "Graduate",
    category: "study",
    leadsToIlr: false,
    ilrYears: null,
    countsTowardWorkIlr: false,
    countsTowardFamilyIlr: false,
    absenceRule: "none",
    typicalGrantYears: 2,
    inCountrySwitchFrom: "most",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary:
      "Post-study work leave (typically 2 years, or 3 after a PhD). It does not lead to ILR unless you switch.",
    caveats: [
      "Graduate visa time does not usually count toward settlement. Switch to a qualifying route to start (or continue) an ILR clock.",
    ],
    officialUrl: "https://www.gov.uk/graduate-visa",
  },
  {
    id: "hpi",
    name: "High Potential Individual visa",
    shortName: "HPI",
    category: "work",
    leadsToIlr: false,
    ilrYears: null,
    countsTowardWorkIlr: false,
    countsTowardFamilyIlr: false,
    absenceRule: "none",
    typicalGrantYears: 2,
    inCountrySwitchFrom: "most",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary:
      "Unsponsored leave for graduates of eligible universities. It does not lead to ILR unless you switch.",
    caveats: ["HPI time does not usually count toward settlement."],
    officialUrl: "https://www.gov.uk/high-potential-individual-visa",
  },
  {
    id: "youth-mobility",
    name: "Youth Mobility Scheme visa",
    shortName: "Youth Mobility",
    category: "other",
    leadsToIlr: false,
    ilrYears: null,
    countsTowardWorkIlr: false,
    countsTowardFamilyIlr: false,
    absenceRule: "none",
    typicalGrantYears: 2,
    inCountrySwitchFrom: "limited",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary:
      "A temporary work and travel visa. It does not lead to ILR. Switching to a qualifying route is usually required.",
    caveats: ["YMS time does not count toward settlement."],
    officialUrl: "https://www.gov.uk/youth-mobility",
  },
  {
    id: "visitor",
    name: "Visitor visa / leave to enter as a visitor",
    shortName: "Visitor",
    category: "visit",
    leadsToIlr: false,
    ilrYears: null,
    countsTowardWorkIlr: false,
    countsTowardFamilyIlr: false,
    absenceRule: "none",
    typicalGrantYears: null,
    inCountrySwitchFrom: "none",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary:
      "Visitors generally cannot switch to another visa from inside the UK and visitor time does not count toward ILR.",
    caveats: [
      "You would usually leave the UK and apply for a qualifying visa from overseas.",
    ],
    officialUrl: "https://www.gov.uk/standard-visitor",
  },
  {
    id: "refugee",
    name: "Refugee permission",
    shortName: "Refugee",
    category: "protection",
    leadsToIlr: true,
    ilrYears: 5,
    countsTowardWorkIlr: false,
    countsTowardFamilyIlr: false,
    absenceRule: "180_in_12",
    typicalGrantYears: 5,
    inCountrySwitchFrom: "limited",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary:
      "People with refugee status have typically been able to apply for settlement after 5 years. Protection policy has been subject to reform — verify current rules.",
    caveats: [
      "Refugee settlement rules have been under active policy change. Confirm the current GOV.UK position before relying on a 5-year assumption.",
    ],
    officialUrl: "https://www.gov.uk/settle-in-the-uk/refugee-settlement",
  },
  {
    id: "humanitarian",
    name: "Humanitarian protection",
    shortName: "Humanitarian protection",
    category: "protection",
    leadsToIlr: true,
    ilrYears: 5,
    countsTowardWorkIlr: false,
    countsTowardFamilyIlr: false,
    absenceRule: "180_in_12",
    typicalGrantYears: 5,
    inCountrySwitchFrom: "limited",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary:
      "Humanitarian protection has typically led to settlement after 5 years, subject to the latest protection rules.",
    caveats: ["Confirm current GOV.UK guidance; protection settlement policy has been changing."],
    officialUrl: "https://www.gov.uk/settle-in-the-uk",
  },
  {
    id: "pre-settled",
    name: "EU Settlement Scheme — pre-settled status",
    shortName: "Pre-settled status",
    category: "eu",
    leadsToIlr: true,
    ilrYears: 5,
    countsTowardWorkIlr: false,
    countsTowardFamilyIlr: false,
    absenceRule: "eu_settled",
    typicalGrantYears: 5,
    inCountrySwitchFrom: "limited",
    englishRequiredForIlr: false,
    lifeInUkRequiredForIlr: false,
    summary:
      "Pre-settled status can convert to settled status after 5 years’ continuous residence under EUSS rules.",
    caveats: [
      "EUSS absence rules differ from the 180-day ILR rule (often a 6-month absence limit, with limited exceptions).",
      "English and Life in the UK tests are not required for EUSS settled status.",
    ],
    officialUrl: "https://www.gov.uk/settled-status-eu-citizens-families",
  },
  {
    id: "ilr",
    name: "Indefinite Leave to Remain / settled status",
    shortName: "Already settled (ILR)",
    category: "settlement",
    leadsToIlr: true,
    ilrYears: 0,
    countsTowardWorkIlr: true,
    countsTowardFamilyIlr: true,
    absenceRule: "none",
    typicalGrantYears: null,
    inCountrySwitchFrom: "most",
    englishRequiredForIlr: false,
    lifeInUkRequiredForIlr: false,
    summary:
      "You already have settlement. The next milestone is usually British citizenship (naturalisation), if you want it.",
    caveats: [
      "ILR can lapse after a long absence from the UK (commonly 2 years). Settled status has its own absence rules.",
    ],
    officialUrl: "https://www.gov.uk/indefinite-leave-to-remain",
  },
  {
    id: "long-residence",
    name: "Long residence (10-year route)",
    shortName: "Long residence",
    category: "other",
    leadsToIlr: true,
    ilrYears: 10,
    countsTowardWorkIlr: false,
    countsTowardFamilyIlr: false,
    absenceRule: "180_in_12",
    typicalGrantYears: null,
    inCountrySwitchFrom: "most",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary:
      "Settlement based on 10 years of continuous lawful residence, which can combine different visas.",
    caveats: [
      "Not all leave counts, and the 180-day absence rule is strictly applied. Get advice if your history is mixed.",
    ],
    officialUrl: "https://www.gov.uk/indefinite-leave-to-remain",
  },
  {
    id: "minister-of-religion",
    name: "Minister of Religion visa",
    shortName: "Minister of Religion",
    category: "work",
    leadsToIlr: true,
    ilrYears: 5,
    countsTowardWorkIlr: true,
    countsTowardFamilyIlr: false,
    absenceRule: "180_in_12",
    typicalGrantYears: 3,
    inCountrySwitchFrom: "most",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary: "A sponsored religious worker route that can lead to ILR after 5 years.",
    caveats: [],
    officialUrl: "https://www.gov.uk/minister-of-religion-visa",
  },
  {
    id: "sportsperson",
    name: "International Sportsperson visa",
    shortName: "Sportsperson",
    category: "work",
    leadsToIlr: true,
    ilrYears: 5,
    countsTowardWorkIlr: true,
    countsTowardFamilyIlr: false,
    absenceRule: "180_in_12",
    typicalGrantYears: 3,
    inCountrySwitchFrom: "most",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary: "A sponsored sporting route that can lead to ILR after 5 years.",
    caveats: [],
    officialUrl: "https://www.gov.uk/sportsperson-visa",
  },
  {
    id: "overseas-business",
    name: "Representative of an Overseas Business visa",
    shortName: "Overseas Business",
    category: "work",
    leadsToIlr: true,
    ilrYears: 5,
    countsTowardWorkIlr: true,
    countsTowardFamilyIlr: false,
    absenceRule: "180_in_12",
    typicalGrantYears: 3,
    inCountrySwitchFrom: "most",
    englishRequiredForIlr: true,
    lifeInUkRequiredForIlr: true,
    summary:
      "For sole representatives establishing a UK branch. Settlement is typically after 5 years.",
    caveats: [],
    officialUrl: "https://www.gov.uk/representative-overseas-business",
  },
];

const ROUTE_BY_ID = new Map(ROUTES.map((route) => [route.id, route]));

export function getRoute(id: string): VisaRoute {
  const route = ROUTE_BY_ID.get(id);
  if (!route) {
    throw new Error(`Unknown visa route: ${id}`);
  }
  return route;
}

export function tryGetRoute(id: string): VisaRoute | undefined {
  return ROUTE_BY_ID.get(id);
}

export const ROUTES_BY_CATEGORY: { category: VisaRoute["category"]; label: string }[] =
  [
    { category: "work", label: "Work" },
    { category: "talent", label: "Talent" },
    { category: "business", label: "Business" },
    { category: "family", label: "Family" },
    { category: "study", label: "Study" },
    { category: "ancestry", label: "Ancestry & BN(O)" },
    { category: "protection", label: "Protection" },
    { category: "eu", label: "EU Settlement Scheme" },
    { category: "settlement", label: "Already settled" },
    { category: "visit", label: "Visit" },
    { category: "other", label: "Other" },
  ];

/**
 * Typical in-country switch map. Conservative: visitor = none;
 * YMS/protection = limited; most others can switch to qualifying routes.
 */
export function canSwitchInCountry(fromId: string, toId: string): boolean {
  if (fromId === toId) return false;
  const from = getRoute(fromId);
  const to = getRoute(toId);
  if (to.category === "visit") return false;
  if (from.inCountrySwitchFrom === "none") return false;
  if (from.inCountrySwitchFrom === "limited") {
    return to.leadsToIlr && to.category !== "eu" && to.category !== "protection";
  }
  if (to.category === "eu") return false;
  return true;
}

export function isQualifyingWorkCombination(from: VisaRoute, to: VisaRoute): boolean {
  return from.countsTowardWorkIlr && to.countsTowardWorkIlr;
}

export function isFamilyCombination(from: VisaRoute, to: VisaRoute): boolean {
  return from.countsTowardFamilyIlr && to.countsTowardFamilyIlr;
}

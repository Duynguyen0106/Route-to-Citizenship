import type { PathwayId } from "./types";
import { GOVUK } from "./legal";

export interface GoalMatch {
  intent: string;
  label: string;
  visaIds: string[];
  pathwayIds: PathwayId[];
  summary: string;
  caveats: string[];
  officialUrl: string;
  score: number;
}

const INTENTS: Array<{
  intent: string;
  label: string;
  visaIds: string[];
  pathwayIds: PathwayId[];
  summary: string;
  caveats: string[];
  officialUrl: string;
  phrases: string[];
}> = [
  {
    intent: "bring_parents",
    label: "Bring parents to the UK",
    visaIds: ["visitor"],
    pathwayIds: ["family"],
    summary:
      "Adult Dependent Relative settlement is exceptionally tightly drawn. Most people can only host parents as visitors, not as settlers.",
    caveats: [
      "This is not a standard family ILR path like a partner visa.",
      "Confirm Adult Dependent Relative rules on GOV.UK — they are often refused.",
    ],
    officialUrl: GOVUK.familyPartner,
    phrases: ["parent", "parents", "mother", "father", "mum", "dad", "adult dependent", "adr"],
  },
  {
    intent: "bring_partner",
    label: "Join or bring a partner",
    visaIds: ["spouse-5", "spouse-10"],
    pathwayIds: ["family"],
    summary: "The partner/spouse family visa is the usual path if you are married or in a durable relationship with a settled or British person.",
    caveats: ["Financial, relationship and English rules are not checked here."],
    officialUrl: GOVUK.familyPartner,
    phrases: ["spouse", "partner", "husband", "wife", "fiance", "fiancée", "civil partner", "bring my wife", "bring my husband"],
  },
  {
    intent: "bring_child",
    label: "Child dependant or registration",
    visaIds: ["child-registration"],
    pathwayIds: ["dependant", "child-registration"],
    summary: "Children may be dependants on a parent’s visa, or register as British if born in the UK after a parent settles, or if a parent is British.",
    caveats: ["Child registration is not the same as adult naturalisation."],
    officialUrl: GOVUK.registerCitizen,
    phrases: ["child", "children", "son", "daughter", "born in the uk", "register as british"],
  },
  {
    intent: "work",
    label: "Work and settle",
    visaIds: ["skilled-worker", "global-talent", "scale-up", "hpi"],
    pathwayIds: ["skilled-worker", "global-talent", "scale-up", "hpi"],
    summary: "Skilled Worker is the common sponsored path to 5-year ILR. Global Talent, Scale-up and HPI are alternatives with different clocks.",
    caveats: ["Salary, SOC codes and sponsorship are not checked in this planner."],
    officialUrl: GOVUK.skilledWorker,
    phrases: ["job", "work", "sponsor", "skilled worker", "employment", "salary"],
  },
  {
    intent: "study",
    label: "Study, then switch",
    visaIds: ["student", "graduate"],
    pathwayIds: ["student-to-skilled"],
    summary: "Student and Graduate time does not usually count toward 5-year work ILR. A later Skilled Worker (or similar) switch starts that clock.",
    caveats: ["Graduate is not an ILR route on its own."],
    officialUrl: GOVUK.student,
    phrases: ["study", "student", "university", "graduate visa", "degree", "course"],
  },
  {
    intent: "talent",
    label: "Talent or high-potential work",
    visaIds: ["global-talent", "hpi"],
    pathwayIds: ["global-talent", "hpi"],
    summary: "Global Talent can lead to ILR in 3 or 5 years depending on the field. HPI is usually a 2-year visa and is not itself an ILR clock.",
    caveats: ["Endorsement and prize routes are not assessed here."],
    officialUrl: GOVUK.globalTalent,
    phrases: ["global talent", "endorsement", "hpi", "high potential", "research", "arts"],
  },
  {
    intent: "ancestry",
    label: "UK ancestry",
    visaIds: ["ancestry"],
    pathwayIds: ["ancestry"],
    summary: "UK Ancestry is for Commonwealth citizens with a grandparent born in the UK. It can lead to ILR after 5 years.",
    caveats: ["Ancestry evidence is not checked here."],
    officialUrl: GOVUK.ancestry,
    phrases: ["ancestry", "grandparent", "commonwealth"],
  },
  {
    intent: "bno",
    label: "British National (Overseas)",
    visaIds: ["bno"],
    pathwayIds: ["bno"],
    summary: "The BN(O) visa can lead to ILR after 5 years. Confirm current BN(O) pages on GOV.UK.",
    caveats: [],
    officialUrl: GOVUK.bno,
    phrases: ["bno", "bn(o)", "hong kong", "british national overseas"],
  },
  {
    intent: "protection",
    label: "Protection / refugee settlement",
    visaIds: ["refugee"],
    pathwayIds: ["protection"],
    summary: "Refugee and humanitarian protection settlement follows a different clock from work visas. Use the GOV.UK settlement pages.",
    caveats: ["This planner only sketches protection routes at a high level."],
    officialUrl: GOVUK.refugeeSettlement,
    phrases: ["refugee", "asylum", "humanitarian protection", "protection"],
  },
  {
    intent: "settle",
    label: "Indefinite leave to remain",
    visaIds: ["ilr"],
    pathwayIds: ["long-residence", "skilled-worker"],
    summary: "ILR is settlement. Most people qualify after 5 years on a work or family route, or 10 years’ lawful residence.",
    caveats: ["Absences, tests and good character still apply."],
    officialUrl: GOVUK.ilr,
    phrases: ["ilr", "indefinite leave", "settled", "settlement", "permanent"],
  },
  {
    intent: "citizenship",
    label: "British citizenship",
    visaIds: ["citizenship"],
    pathwayIds: ["skilled-worker"],
    summary: "Naturalisation is usually after ILR (12 months later, or immediately if married to a British citizen once ILR is held).",
    caveats: ["Good character and absences are not fully scored here."],
    officialUrl: GOVUK.citizenship,
    phrases: ["citizen", "citizenship", "naturalis", "passport british", "british passport"],
  },
  {
    intent: "visit",
    label: "Visit the UK",
    visaIds: ["visitor"],
    pathwayIds: ["youth-mobility"],
    summary: "Standard visitor leave does not count toward ILR or long residence.",
    caveats: ["Do not treat a visit as a settlement strategy."],
    officialUrl: GOVUK.browse,
    phrases: ["visit", "visitor", "holiday", "tourist"],
  },
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9()+'\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function interpretGoal(text: string, limit = 3): GoalMatch[] {
  const raw = text.trim();
  if (raw.length < 4) return [];
  const lower = raw.toLowerCase();
  const tokens = new Set(tokenize(lower));
  const scored = INTENTS.map((intent) => {
    let score = 0;
    for (const phrase of intent.phrases) {
      if (phrase.includes(" ") && lower.includes(phrase)) score += 3;
      else if (tokens.has(phrase) || lower.includes(phrase)) score += 2;
    }
    return { ...intent, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => ({
    intent: item.intent,
    label: item.label,
    visaIds: item.visaIds,
    pathwayIds: item.pathwayIds,
    summary: item.summary,
    caveats: item.caveats,
    officialUrl: item.officialUrl,
    score: item.score,
  }));
}

import type { Pathway, PathwayId, Profile } from "./types";

function settlementStages(
  visaId: string,
  label: string,
  extra?: { id: string; visaId: string; label: string }[],
): Pathway["stages"] {
  return [
    ...(extra ?? []),
    { id: "current", visaId, label },
    { id: "ilr", visaId: "ilr", label: "ILR" },
    { id: "citizenship", visaId: "citizenship", label: "Citizenship" },
  ];
}

export const PATHWAYS: Pathway[] = [
  {
    id: "skilled-worker",
    title: "Skilled Worker",
    blurb: "Sponsored work visa, typically 5 years to ILR, then citizenship.",
    stages: settlementStages("skilled-worker", "Skilled Worker"),
    currentVisaChoices: [
      { visaId: "skilled-worker", label: "Skilled Worker visa" },
      { visaId: "ilr", label: "Already have ILR" },
    ],
  },
  {
    id: "family",
    title: "Family visa (spouse / partner)",
    blurb: "Partner route, typically 5 years to ILR (or 10 on the longer route).",
    stages: [
      { id: "partner", visaId: "spouse-5", label: "Partner visa" },
      { id: "ilr", visaId: "ilr", label: "ILR" },
      { id: "citizenship", visaId: "citizenship", label: "Citizenship" },
    ],
    currentVisaChoices: [
      { visaId: "spouse-5", label: "Partner visa — 5-year route" },
      { visaId: "spouse-10", label: "Partner visa — 10-year route" },
      { visaId: "ilr", label: "Already have ILR" },
    ],
  },
  {
    id: "student-to-skilled",
    title: "Student → Graduate → Skilled Worker",
    blurb: "Study and post-study leave do not lead to ILR until you switch to a qualifying work visa.",
    stages: [
      { id: "student", visaId: "student", label: "Student" },
      { id: "graduate", visaId: "graduate", label: "Graduate" },
      { id: "sw", visaId: "skilled-worker", label: "Skilled Worker" },
      { id: "ilr", visaId: "ilr", label: "ILR" },
      { id: "citizenship", visaId: "citizenship", label: "Citizenship" },
    ],
    currentVisaChoices: [
      { visaId: "student", label: "Student visa" },
      { visaId: "graduate", label: "Graduate visa" },
      { visaId: "skilled-worker", label: "Skilled Worker (after study)" },
      { visaId: "ilr", label: "Already have ILR" },
    ],
  },
  {
    id: "global-talent",
    title: "Global Talent",
    blurb: "Endorsed talent or prize: ILR after 3 years (talent/prize) or 5 years (promise).",
    stages: settlementStages("global-talent-talent", "Global Talent"),
    currentVisaChoices: [
      { visaId: "global-talent-talent", label: "Global Talent — 3-year ILR (talent / prize)" },
      { visaId: "global-talent-promise", label: "Global Talent — 5-year ILR (promise)" },
      { visaId: "ilr", label: "Already have ILR" },
    ],
  },
  {
    id: "long-residence",
    title: "10-year long residence",
    blurb: "ILR after 10 years of continuous lawful residence, which can combine different visas.",
    stages: [
      { id: "lawful", visaId: "long-residence", label: "Lawful residence" },
      { id: "ilr", visaId: "ilr", label: "ILR" },
      { id: "citizenship", visaId: "citizenship", label: "Citizenship" },
    ],
    currentVisaChoices: [
      { visaId: "long-residence", label: "Counting 10 years of mixed lawful leave" },
      { visaId: "skilled-worker", label: "Currently on Skilled Worker" },
      { visaId: "student", label: "Currently on Student visa" },
      { visaId: "graduate", label: "Currently on Graduate visa" },
      { visaId: "spouse-5", label: "Currently on a partner visa" },
      { visaId: "ilr", label: "Already have ILR" },
    ],
  },
  {
    id: "innovator-founder",
    title: "Innovator Founder",
    blurb: "Endorsed business founders. ILR after 3 years if the business receives a settlement endorsement.",
    stages: settlementStages("innovator-founder", "Innovator Founder"),
    currentVisaChoices: [{ visaId: "innovator-founder", label: "Innovator Founder visa" }],
  },
  {
    id: "scale-up",
    title: "Scale-up",
    blurb: "Sponsored scale-up visa. Time usually counts toward 5-year work settlement.",
    stages: settlementStages("scale-up", "Scale-up"),
    currentVisaChoices: [{ visaId: "scale-up", label: "Scale-up visa" }],
  },
  {
    id: "sportsperson",
    title: "International Sportsperson",
    blurb: "Sponsored sporting route that can lead to ILR after 5 years.",
    stages: settlementStages("sportsperson", "Sportsperson"),
    currentVisaChoices: [{ visaId: "sportsperson", label: "International Sportsperson visa" }],
  },
  {
    id: "minister-of-religion",
    title: "Minister of Religion",
    blurb: "Sponsored religious worker route that can lead to ILR after 5 years.",
    stages: settlementStages("minister-of-religion", "Minister of Religion"),
    currentVisaChoices: [{ visaId: "minister-of-religion", label: "Minister of Religion visa" }],
  },
  {
    id: "global-business-mobility",
    title: "Global Business Mobility",
    blurb: "GBM does not lead to ILR. Time can still count toward 10-year long residence.",
    stages: [
      { id: "gbm", visaId: "gbm", label: "GBM" },
      { id: "switch", visaId: "skilled-worker", label: "Switch to a settlement visa" },
      { id: "ilr", visaId: "ilr", label: "ILR" },
      { id: "citizenship", visaId: "citizenship", label: "Citizenship" },
    ],
    currentVisaChoices: [{ visaId: "gbm", label: "Global Business Mobility visa" }],
  },
  {
    id: "youth-mobility",
    title: "Youth Mobility Scheme",
    blurb: "Temporary. Does not lead to ILR. Switching to a qualifying visa is usually required.",
    stages: [
      { id: "yms", visaId: "youth-mobility", label: "Youth Mobility" },
      { id: "switch", visaId: "skilled-worker", label: "Switch to a settlement visa" },
      { id: "ilr", visaId: "ilr", label: "ILR" },
      { id: "citizenship", visaId: "citizenship", label: "Citizenship" },
    ],
    currentVisaChoices: [{ visaId: "youth-mobility", label: "Youth Mobility Scheme" }],
  },
  {
    id: "ancestry",
    title: "UK Ancestry",
    blurb: "Commonwealth citizens with a UK-born grandparent. Settlement is typically after 5 years.",
    stages: settlementStages("ancestry", "UK Ancestry"),
    currentVisaChoices: [{ visaId: "ancestry", label: "UK Ancestry visa" }],
  },
  {
    id: "bno",
    title: "BN(O) visa",
    blurb: "A 5-year path to settlement for eligible BN(O) status holders and family members.",
    stages: settlementStages("bno", "BN(O)"),
    currentVisaChoices: [{ visaId: "bno", label: "BN(O) visa" }],
  },
  {
    id: "hpi",
    title: "High Potential Individual",
    blurb: "HPI does not lead to ILR. Switch to a qualifying work, talent or family visa.",
    stages: [
      { id: "hpi", visaId: "hpi", label: "HPI" },
      { id: "switch", visaId: "skilled-worker", label: "Switch to a settlement visa" },
      { id: "ilr", visaId: "ilr", label: "ILR" },
      { id: "citizenship", visaId: "citizenship", label: "Citizenship" },
    ],
    currentVisaChoices: [{ visaId: "hpi", label: "High Potential Individual visa" }],
  },
  {
    id: "protection",
    title: "Refugee / humanitarian protection",
    blurb: "People with refugee status or humanitarian protection have typically applied for settlement after 5 years.",
    stages: settlementStages("refugee", "Protection"),
    currentVisaChoices: [
      { visaId: "refugee", label: "Refugee permission" },
      { visaId: "humanitarian", label: "Humanitarian protection" },
    ],
  },
  {
    id: "euss",
    title: "EU Settlement Scheme",
    blurb: "Pre-settled status can convert to settled status after 5 years under EUSS rules.",
    stages: [
      { id: "pre", visaId: "pre-settled", label: "Pre-settled status" },
      { id: "ilr", visaId: "ilr", label: "Settled status" },
      { id: "citizenship", visaId: "citizenship", label: "Citizenship" },
    ],
    currentVisaChoices: [{ visaId: "pre-settled", label: "EUSS pre-settled status" }],
  },
  {
    id: "dependant",
    title: "Dependant of a worker / talent / business visa",
    blurb: "Partners and children typically apply for ILR after 5 years, often with the main applicant.",
    stages: settlementStages("dependant", "Dependant"),
    currentVisaChoices: [{ visaId: "dependant", label: "Dependant visa" }],
  },
  {
    id: "child-registration",
    title: "Child citizenship by registration",
    blurb: "A child born in the UK whose parent later settles, or a child under 18 with a British parent, may register.",
    stages: [
      { id: "child", visaId: "child-registration", label: "Child" },
      { id: "citizenship", visaId: "citizenship", label: "Registration" },
    ],
    currentVisaChoices: [{ visaId: "child-registration", label: "Child registration (not ILR)" }],
  },
];

const PATHWAY_BY_ID = new Map(PATHWAYS.map((pathway) => [pathway.id, pathway]));

export function getPathway(id: PathwayId): Pathway {
  const pathway = PATHWAY_BY_ID.get(id);
  if (!pathway) throw new Error(`Unknown pathway: ${id}`);
  return pathway;
}

export function inferPathway(visaId: string): PathwayId {
  if (visaId === "skilled-worker" || visaId === "health-care-worker") return "skilled-worker";
  if (visaId.startsWith("spouse") || visaId === "parent") return "family";
  if (visaId === "student" || visaId === "graduate") return "student-to-skilled";
  if (visaId.startsWith("global-talent")) return "global-talent";
  if (visaId === "long-residence") return "long-residence";
  if (visaId === "innovator-founder") return "innovator-founder";
  if (visaId === "scale-up") return "scale-up";
  if (visaId === "sportsperson") return "sportsperson";
  if (visaId === "minister-of-religion") return "minister-of-religion";
  if (visaId === "gbm" || visaId.startsWith("gbm-")) return "global-business-mobility";
  if (visaId === "youth-mobility") return "youth-mobility";
  if (visaId === "ancestry") return "ancestry";
  if (visaId === "bno") return "bno";
  if (visaId === "hpi") return "hpi";
  if (visaId === "refugee" || visaId === "humanitarian") return "protection";
  if (visaId === "pre-settled") return "euss";
  if (visaId === "dependant") return "dependant";
  if (visaId === "child-registration") return "child-registration";
  if (visaId === "ilr") return "skilled-worker";
  return "skilled-worker";
}

export const SWITCH_TARGETS: { visaId: string; label: string; pathwayId: PathwayId }[] = [
  { visaId: "skilled-worker", label: "Skilled Worker", pathwayId: "skilled-worker" },
  { visaId: "spouse-5", label: "Partner visa (5-year)", pathwayId: "family" },
  { visaId: "spouse-10", label: "Partner visa (10-year)", pathwayId: "family" },
  { visaId: "graduate", label: "Graduate visa", pathwayId: "student-to-skilled" },
  { visaId: "global-talent-talent", label: "Global Talent (3-year ILR)", pathwayId: "global-talent" },
  { visaId: "global-talent-promise", label: "Global Talent (5-year ILR)", pathwayId: "global-talent" },
  { visaId: "innovator-founder", label: "Innovator Founder", pathwayId: "innovator-founder" },
  { visaId: "scale-up", label: "Scale-up", pathwayId: "scale-up" },
  { visaId: "sportsperson", label: "International Sportsperson", pathwayId: "sportsperson" },
  { visaId: "minister-of-religion", label: "Minister of Religion", pathwayId: "minister-of-religion" },
  { visaId: "ancestry", label: "UK Ancestry", pathwayId: "ancestry" },
  { visaId: "bno", label: "BN(O) visa", pathwayId: "bno" },
  { visaId: "long-residence", label: "10-year long residence ILR", pathwayId: "long-residence" },
];

export function studentPathNeedsSwitch(profile: Profile): boolean {
  return (
    profile.pathwayId === "student-to-skilled" &&
    (profile.currentVisaId === "student" || profile.currentVisaId === "graduate")
  );
}

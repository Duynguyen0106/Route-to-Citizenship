import type { Pathway, PathwayId, Profile } from "./types";

export const PATHWAYS: Pathway[] = [
  {
    id: "skilled-worker",
    title: "Skilled Worker",
    blurb: "Sponsored work visa, typically 5 years to ILR, then citizenship.",
    stages: [
      { id: "sw", visaId: "skilled-worker", label: "Skilled Worker" },
      { id: "ilr", visaId: "ilr", label: "ILR" },
      { id: "citizenship", visaId: "citizenship", label: "Citizenship" },
    ],
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
    stages: [
      { id: "gt", visaId: "global-talent-talent", label: "Global Talent" },
      { id: "ilr", visaId: "ilr", label: "ILR" },
      { id: "citizenship", visaId: "citizenship", label: "Citizenship" },
    ],
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
  { visaId: "long-residence", label: "10-year long residence ILR", pathwayId: "long-residence" },
];

export function studentPathNeedsSwitch(profile: Profile): boolean {
  return (
    profile.pathwayId === "student-to-skilled" &&
    (profile.currentVisaId === "student" || profile.currentVisaId === "graduate")
  );
}

import { GOVUK, LEGAL_NOTICE } from "./legal";

export interface GuidanceHit {
  id: string;
  question: string;
  answer: string;
  officialUrl: string;
  score: number;
}

export interface GuidanceReply {
  disclaimer: string;
  notLegalAdvice: true;
  answer: string;
  hits: GuidanceHit[];
  refused: boolean;
  officialLinks: { label: string; url: string }[];
}

const FAQ: Array<{ id: string; question: string; answer: string; keywords: string[]; officialUrl: string }> = [
  {
    id: "not-advice",
    question: "Is this immigration advice?",
    answer:
      "No. This app is general information only. It is not advice from an OISC-regulated adviser or a solicitor, and it is not a Home Office decision. For case-specific advice use GOV.UK’s find-an-adviser page.",
    keywords: ["advice", "lawyer", "solicitor", "oisc", "legal", "adviser"],
    officialUrl: GOVUK.adviser,
  },
  {
    id: "ilr-28",
    question: "When can I apply for ILR?",
    answer:
      "You can usually apply for indefinite leave to remain up to 28 days before your qualifying period ends. Applying earlier is often treated as premature. Confirm the live rule on GOV.UK.",
    keywords: ["ilr", "28", "early", "apply", "indefinite", "window"],
    officialUrl: GOVUK.ilr,
  },
  {
    id: "absence-180",
    question: "How many days can I spend outside the UK?",
    answer:
      "For most work and family ILR routes, more than 180 days outside the UK in any 12-month period can break continuous residence. Citizenship uses tighter sketches (often 90 days in 12 months and 450 in 5 years). Keep your own travel record.",
    keywords: ["absence", "180", "travel", "outside", "days", "continuous", "residence"],
    officialUrl: GOVUK.ilr,
  },
  {
    id: "citizenship-wait",
    question: "When can I apply for British citizenship?",
    answer:
      "Standard naturalisation is usually 12 months after ILR. If you are married to a British citizen you may apply once you have ILR and 3 years’ residence — ILR still comes first. Good character still applies.",
    keywords: ["citizenship", "naturalis", "british", "12 month", "spouse"],
    officialUrl: GOVUK.citizenship,
  },
  {
    id: "english",
    question: "What English level do I need?",
    answer:
      "Most ILR applications need English at B1 (or an accepted degree / majority-English nationality exemption). Partner entry clearance often starts at A1/A2. Check the live list of tests on GOV.UK.",
    keywords: ["english", "b1", "selt", "ielts", "language", "a1"],
    officialUrl: GOVUK.ilr,
  },
  {
    id: "life-in-uk",
    question: "Do I need the Life in the UK test?",
    answer:
      "Most adult ILR and citizenship applicants need a Life in the UK pass unless an age or medical exemption applies. Book early — centres fill up.",
    keywords: ["life in the uk", "life in uk", "test"],
    officialUrl: GOVUK.ilr,
  },
  {
    id: "student-clock",
    question: "Does Student or Graduate time count toward ILR?",
    answer:
      "Usually not toward the 5-year work ILR clock. Those years may still count toward 10-year long residence if the leave was lawful and not as a visitor. A Skilled Worker (or similar) switch typically starts the 5-year work clock.",
    keywords: ["student", "graduate", "count", "clock", "switch"],
    officialUrl: GOVUK.graduate,
  },
  {
    id: "parents",
    question: "Can I bring my parents to the UK?",
    answer:
      "Adult Dependent Relative settlement is exceptionally restricted. Most families can only host parents as visitors. This is not the same as a partner visa. Read the family visa pages and take regulated advice if the facts are complex.",
    keywords: ["parent", "parents", "mother", "father", "adult dependent", "adr"],
    officialUrl: GOVUK.familyPartner,
  },
  {
    id: "fees",
    question: "What are the fees?",
    answer:
      "This planner uses the Home Office table from 8 April 2026 for a sketch only. IHS, dependants and optional tests change the total. Confirm live amounts on GOV.UK before you pay.",
    keywords: ["fee", "fees", "cost", "ihs", "price", "pay"],
    officialUrl: "https://www.gov.uk/government/publications/visa-regulations-revised-table",
  },
  {
    id: "salary",
    question: "Does the planner check Skilled Worker salary?",
    answer:
      "No. Salary thresholds and going rates changed in April 2024 for many new applications and can change again. Confirm the live Skilled Worker salary rules on GOV.UK.",
    keywords: ["salary", "threshold", "going rate", "sponsor", "skilled"],
    officialUrl: GOVUK.skilledWorker,
  },
  {
    id: "processing",
    question: "How long does a decision take?",
    answer:
      "Published service standards change. This planner sketches typical waits (for example about 8 weeks in-UK for many work visas, longer for ILR). Priority services and case complexity can shorten or lengthen a decision. Check GOV.UK before you book travel.",
    keywords: ["processing", "wait", "decision", "how long", "weeks", "priority"],
    officialUrl: GOVUK.browse,
  },
  {
    id: "character",
    question: "Do criminal convictions matter?",
    answer:
      "Yes, they can. ILR and citizenship include good-character checks. This app does not collect criminal records and cannot score your character. Speak to a regulated adviser if you have convictions, pending cases, or NHS debt.",
    keywords: ["criminal", "conviction", "character", "police", "caution", "nhs debt"],
    officialUrl: GOVUK.citizenship,
  },
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

export function looksLikeIdentityDocument(text: string): boolean {
  return /\bpassport\b/i.test(text) && /\b\d{8,9}\b/.test(text);
}

export function retrieveGuidance(question: string, limit = 3): GuidanceHit[] {
  const tokens = tokenize(question);
  if (tokens.length === 0) return [];
  return FAQ.map((entry) => {
    let score = 0;
    const hay = `${entry.question} ${entry.keywords.join(" ")} ${entry.answer}`.toLowerCase();
    for (const token of tokens) {
      if (entry.keywords.some((key) => key.includes(token) || token.includes(key))) score += 3;
      else if (hay.includes(token)) score += 1;
    }
    return { id: entry.id, question: entry.question, answer: entry.answer, officialUrl: entry.officialUrl, score };
  })
    .filter((hit) => hit.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function answerGuidance(question: string): GuidanceReply {
  const trimmed = question.trim();
  const officialLinks = [
    { label: "GOV.UK visas and immigration", url: GOVUK.browse },
    { label: "Find a regulated adviser", url: GOVUK.adviser },
  ];

  if (trimmed.length < 8) {
    return {
      disclaimer: LEGAL_NOTICE,
      notLegalAdvice: true,
      answer: "Ask a short question about ILR, absences, fees, English tests, or switching. This is not legal advice.",
      hits: [],
      refused: false,
      officialLinks,
    };
  }

  if (looksLikeIdentityDocument(trimmed)) {
    return {
      disclaimer: LEGAL_NOTICE,
      notLegalAdvice: true,
      answer: "Do not paste passport numbers or other identity documents. Ask about the rule instead.",
      hits: [],
      refused: true,
      officialLinks,
    };
  }

  const hits = retrieveGuidance(trimmed);
  if (hits.length === 0) {
    return {
      disclaimer: LEGAL_NOTICE,
      notLegalAdvice: true,
      answer:
        "This assistant only answers from a short FAQ aligned with GOV.UK public pages. It is not trained on OISC practice notes or your file. Check GOV.UK or a regulated adviser.",
      hits: [],
      refused: false,
      officialLinks,
    };
  }

  const top = hits[0];
  const extra = hits.slice(1).map((hit) => hit.question);
  const answer = extra.length
    ? `${top.answer} Related: ${extra.join("; ")}.`
    : top.answer;

  return {
    disclaimer: LEGAL_NOTICE,
    notLegalAdvice: true,
    answer,
    hits,
    refused: false,
    officialLinks: [
      { label: "GOV.UK page for this answer", url: top.officialUrl },
      ...officialLinks,
    ],
  };
}

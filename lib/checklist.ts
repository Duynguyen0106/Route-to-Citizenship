import type { ChecklistItem, Profile, VisaRoute } from "./types";

export function buildChecklist(profile: Profile, route: VisaRoute): ChecklistItem[] {
  const items: ChecklistItem[] = [
    {
      id: "passport",
      label: "Passport",
      detail:
        "Have a valid passport ready when you apply on GOV.UK. This planner never asks for or stores passport numbers.",
      required: true,
      group: "identity",
    },
    {
      id: "evisa",
      label: "Biometric residence permit",
      detail:
        "BRP if still held, or your UKVI eVisa share code as proof of current immigration status.",
      required: true,
      group: "identity",
    },
    {
      id: "photos",
      label: "Digital photograph",
      detail: "A recent digital photo that meets UKVI specifications, if the form asks for one.",
      required: true,
      group: "identity",
    },
    {
      id: "travel-history",
      label: "Travel history / absence record",
      detail:
        "List of trips outside the UK with dates. Used to check the 180-day ILR rule and citizenship absence limits.",
      required: true,
      group: "residence",
    },
    {
      id: "address-history",
      label: "Proof of residence (council tax, utility bills)",
      detail:
        "Council tax, utility bills, tenancy or mortgage documents covering the qualifying period.",
      required: true,
      group: "residence",
    },
  ];

  if (route.countsTowardWorkIlr || route.category === "work" || route.category === "talent") {
    items.push(
      {
        id: "payslips",
        label: "Salary slips / bank statements",
        detail:
          "Usually six months of payslips and matching bank statements for work and talent routes.",
        required: true,
        group: "route",
      },
      {
        id: "employer-letter",
        label: "Employer or sponsor letter",
        detail: "Job title, salary, start date, and that the role is still genuine.",
        required: true,
        group: "route",
      },
    );
  }

  if (route.id === "skilled-worker" || route.id === "health-care-worker") {
    items.push({
      id: "cos",
      label: "Certificate of Sponsorship history",
      detail: "COS / sponsor licence details covering the qualifying period.",
      required: true,
      group: "route",
    });
  }

  if (route.id.startsWith("global-talent")) {
    items.push({
      id: "endorsement",
      label: "Global Talent endorsement or prize evidence",
      detail: "Endorsing body letter or prestigious prize documentation, plus evidence of work in your field.",
      required: true,
      group: "route",
    });
  }

  if (route.id === "innovator-founder") {
    items.push({
      id: "business-endorsement",
      label: "Settlement endorsement from an endorsing body",
      detail: "ILR on this route usually needs a fresh endorsement that the business has succeeded.",
      required: true,
      group: "route",
    });
  }

  if (route.countsTowardFamilyIlr) {
    items.push(
      {
        id: "relationship",
        label: "Relationship evidence",
        detail: "Marriage / civil partnership certificate or durable-relationship evidence, plus ongoing cohabitation.",
        required: true,
        group: "route",
      },
      {
        id: "finance-family",
        label: "Financial requirement evidence",
        detail: "Income, savings, or adequate maintenance documents matching the family rules that apply to you.",
        required: true,
        group: "route",
      },
    );
  }

  if (route.id === "ancestry") {
    items.push({
      id: "grandparent",
      label: "Grandparent born in the UK evidence",
      detail: "Birth certificates linking you to a UK-born grandparent, plus work in the UK.",
      required: true,
      group: "route",
    });
  }

  if (route.id === "student") {
    items.push({
      id: "cas",
      label: "CAS / student status",
      detail: "Confirmation of Acceptance for Studies and proof you are still studying, if extending.",
      required: true,
      group: "route",
    });
  }

  if (route.id === "graduate") {
    items.push({
      id: "award",
      label: "Degree award confirmation",
      detail: "Evidence your UK sponsor notified the Home Office that you successfully completed the course.",
      required: true,
      group: "route",
    });
  }

  if (route.id === "long-residence" || profile.pathwayId === "long-residence") {
    items.push({
      id: "lawful-leave",
      label: "Record of 10 years' lawful leave",
      detail: "Grants, vignettes, eVisa history and any gaps. Long residence is unforgiving of overstaying.",
      required: true,
      group: "route",
    });
  }

  if (route.englishRequiredForIlr && profile.ageBand === "18_to_64") {
    items.push({
      id: "english-cert",
      label: "Proof of English",
      detail: "Approved B1 SELT, degree taught in English (ECCTIS), or nationality exemption.",
      required: profile.englishStatus === "not_met",
      group: "english",
    });
  }

  if (route.lifeInUkRequiredForIlr && profile.ageBand === "18_to_64") {
    items.push({
      id: "life-in-uk-pass",
      label: "Life in UK test pass certificate",
      detail: "Unique reference number from a passed test. Book early — centres can have waits.",
      required: profile.lifeInUkStatus === "not_taken",
      group: "english",
    });
  }

  items.push(
    {
      id: "form",
      label: "Correct application form and fee",
      detail: "SET(O), SET(M), SET(LR), naturalisation Form AN, or EUSS — whichever matches your route.",
      required: true,
      group: "application",
    },
    {
      id: "biometrics",
      label: "Biometric appointment",
      detail: "UKVCAS / Service Point appointment if required after you submit.",
      required: true,
      group: "application",
    },
    {
      id: "translations",
      label: "Certified translations",
      detail: "Any document not in English or Welsh needs a certified translation.",
      required: false,
      group: "application",
    },
  );

  if (route.id === "ilr") {
    items.push({
      id: "naturalisation-refs",
      label: "Citizenship referees",
      detail: "Two referees who meet Home Office rules (often one professional and one British passport holder).",
      required: true,
      group: "application",
    });
  }

  return items;
}

export const CHECKLIST_GROUPS: { id: ChecklistItem["group"]; label: string }[] = [
  { id: "identity", label: "Identity" },
  { id: "residence", label: "Residence" },
  { id: "route", label: "Your visa route" },
  { id: "english", label: "English & Life in the UK" },
  { id: "application", label: "Application mechanics" },
];

import { GOVUK } from "./legal";
import { tryGetRoute } from "./visas";
import type { PlanResult, Profile } from "./types";

export interface ApplyLink {
  label: string;
  url: string;
  note: string;
}

export interface ApplicationField {
  label: string;
  value: string;
}

export interface ApplicationPack {
  cannotPrefill:
    "UKVI application forms are on GOV.UK / your UKVI account. This planner cannot inject data into those forms.";
  apply: ApplyLink[];
  status: ApplyLink[];
  biometrics: ApplyLink[];
  fields: ApplicationField[];
  warnings: string[];
}

export const APPLY_URLS: Record<string, string> = {
  "skilled-worker": "https://www.gov.uk/skilled-worker-visa/apply",
  "health-care-worker": "https://www.gov.uk/health-care-worker-visa/apply",
  student: "https://www.gov.uk/student-visa/apply",
  graduate: "https://www.gov.uk/graduate-visa",
  "spouse-5": "https://www.gov.uk/uk-family-visa/apply",
  "spouse-10": "https://www.gov.uk/uk-family-visa/apply",
  parent: "https://www.gov.uk/uk-family-visa/apply",
  ilr: "https://www.gov.uk/indefinite-leave-to-remain/apply",
  "long-residence": "https://www.gov.uk/indefinite-leave-to-remain/apply",
  citizenship: "https://www.gov.uk/apply-citizenship-indefinite-leave-to-remain",
  "child-registration": "https://www.gov.uk/register-british-citizen",
};

export function applyUrlForVisa(visaId: string): string {
  if (APPLY_URLS[visaId]) return APPLY_URLS[visaId];
  return tryGetRoute(visaId)?.officialUrl ?? GOVUK.browse;
}

function field(label: string, value: string | null | undefined): ApplicationField | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  return { label, value: trimmed };
}

export function buildApplicationPack(profile: Profile, plan: PlanResult): ApplicationPack {
  const route = tryGetRoute(profile.currentVisaId);
  const fields = [
    field("Current visa (planner)", route?.name ?? profile.currentVisaId),
    field("Applying from", profile.applyFromInsideUk ? "Inside the UK (switch / extend)" : "Outside the UK (entry clearance)"),
    field("Nationality (ISO code)", profile.nationality),
    field("Current leave granted", profile.visaGrantedOn),
    field("Current leave expires", profile.visaExpiresOn),
    field("UK qualifying residence start", profile.qualifyingResidenceStart),
    field("UK entry date", profile.ukEntryDate),
    field("English (self-declared)", profile.englishStatus),
    field("Life in the UK (self-declared)", profile.lifeInUkStatus),
    field("Married to a British citizen", profile.marriedToBritishCitizen ? "Yes" : "No"),
    field("Dependant count", String(profile.dependantCount)),
    field("Sketched ILR eligibility", plan.ilrEligibleOn),
    field("ILR apply-from (28-day window)", plan.ilrApplyFrom),
    field("Sketched citizenship eligibility", plan.citizenshipEligibleOn),
    field("Days away last 12 months (sketch)", String(plan.absences.last12Months)),
  ].filter((item): item is ApplicationField => Boolean(item));

  const warnings = [
    "Do not paste passport numbers, UAN/UIN, or biometric IDs into this planner.",
    "Copy these dates into the official form yourself and confirm every answer on GOV.UK.",
    "This pack is not a visa application and is not submitted to the Home Office.",
  ];

  if (profile.englishTest?.last4) {
    fields.push({
      label: "English test candidate number (last 4 only)",
      value: `••••${profile.englishTest.last4}`,
    });
  }

  return {
    cannotPrefill:
      "UKVI application forms are on GOV.UK / your UKVI account. This planner cannot inject data into those forms.",
    apply: [
      {
        label: profile.applyFromInsideUk ? "Start the in-UK application on GOV.UK" : "Start the application on GOV.UK",
        url: applyUrlForVisa(profile.currentVisaId),
        note: "Opens the official page for this visa. You will use your UKVI account.",
      },
      {
        label: "How to apply for a visa to come to the UK",
        url: GOVUK.applyUk,
        note: "Overview of applying from overseas.",
      },
      {
        label: "Indefinite leave to remain — apply",
        url: APPLY_URLS.ilr,
        note: "Only when you are in the ILR window.",
      },
      {
        label: "British citizenship — apply",
        url: APPLY_URLS.citizenship,
        note: "Usually after ILR. Good character still applies.",
      },
    ],
    status: [
      {
        label: "View and prove your immigration status (eVisa)",
        url: GOVUK.viewProve,
        note: "Official UKVI service. This planner cannot check your visa status.",
      },
      {
        label: "eVisa / UKVI account",
        url: GOVUK.ukviAccount,
        note: "Update details and generate a share code for employers.",
      },
    ],
    biometrics: [
      {
        label: "VFS Global (UK visa application centres)",
        url: GOVUK.vfsUk,
        note: "UKVI commercial partner. Appointment slots are not available through this app.",
      },
      {
        label: "TLS Contact",
        url: GOVUK.tlsContact,
        note: "UKVI commercial partner in some countries. Check which provider GOV.UK names for your location.",
      },
    ],
    fields,
    warnings,
  };
}

export function applicationPackText(pack: ApplicationPack): string {
  const lines = [
    pack.cannotPrefill,
    "",
    ...pack.warnings.map((line) => `• ${line}`),
    "",
    "Answers to copy into the official form:",
    ...pack.fields.map((item) => `${item.label}: ${item.value}`),
  ];
  return lines.join("\n");
}

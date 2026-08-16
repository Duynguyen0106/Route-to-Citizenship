export const GDPR_EXPORT_SCHEMA = "route-to-citizenship.gdpr.v1";

export type ProcessingLocation = "device" | "server" | "not-stored";

export interface ProcessingRecord {
  id: string;
  category: string;
  location: ProcessingLocation;
  purpose: string;
  legalBasis: string;
  retained: string;
  identifiers: string;
}

export const PROCESSING_INVENTORY: ProcessingRecord[] = [
  {
    id: "guest-plan",
    category: "Guest plan",
    location: "device",
    purpose: "Sketch a visa → ILR → citizenship path in this browser",
    legalBasis: "Consent / legitimate interest in providing the tool you asked for",
    retained: "Until you clear this browser",
    identifiers: "Visa type, dates, nationality (English exemption). No passport numbers.",
  },
  {
    id: "account",
    category: "Signed-in account",
    location: "server",
    purpose: "Reopen a plan across devices",
    legalBasis: "Contract (account you created)",
    retained: "Until you delete the account",
    identifiers: "Email, optional name, password hash, visa type, dates, absences, reminder prefs",
  },
  {
    id: "vault",
    category: "Document vault",
    location: "device",
    purpose: "Optional encrypted copies of evidence",
    legalBasis: "Consent",
    retained: "Until you clear the vault or this browser",
    identifiers: "Last four characters of a detected identity number only. Ciphertext never uploaded.",
  },
  {
    id: "share",
    category: "Read-only share links",
    location: "server",
    purpose: "Let you show a redacted snapshot to an adviser or employer",
    legalBasis: "Consent",
    retained: "Until expiry, revoke, or account deletion",
    identifiers: "Redacted plan snapshot. No vault files or passport numbers.",
  },
  {
    id: "benchmarks",
    category: "Anonymous benchmarks",
    location: "server",
    purpose: "Opt-in averages once a cohort has at least five sketches",
    legalBasis: "Consent",
    retained: "Not tied to an account; cannot be erased by email",
    identifiers: "Visa category, coarse nationality region, sketched dates — not name or email",
  },
  {
    id: "enquiries",
    category: "Service and adviser enquiries",
    location: "server",
    purpose: "Preview introductions (not a live marketplace instruction)",
    legalBasis: "Consent",
    retained: "Until account erasure (matched by user id or email)",
    identifiers: "Email and a short note. No passport numbers.",
  },
  {
    id: "employers",
    category: "Employer worker sketches",
    location: "server",
    purpose: "HR expiry buckets and GOV.UK right-to-work links",
    legalBasis: "Legitimate interest / contract with the signed-in HR user",
    retained: "Until the organisation owner deletes the account",
    identifiers: "Staff label, visa type, dates, ticks. No share codes or passports.",
  },
  {
    id: "govuk-polls",
    category: "GOV.UK page polls",
    location: "server",
    purpose: "Notice when an official page was updated after encoded review",
    legalBasis: "Legitimate interest",
    retained: "Page title, description, timestamp — not your plan",
    identifiers: "None (not personal data)",
  },
];

export const GDPR_RIGHTS = [
  {
    id: "access",
    title: "Access",
    how: "Open /account while signed in, or download guest data from the same page.",
  },
  {
    id: "portability",
    title: "Data portability",
    how: "Download JSON (GDPR export schema). Vault files stay on the device and are not in the file.",
  },
  {
    id: "erasure",
    title: "Erasure",
    how: "Delete the account (type DELETE) or clear this browser as a guest. Anonymous benchmarks cannot be matched back to you.",
  },
  {
    id: "minimisation",
    title: "Minimisation",
    how: "Do not enter passport numbers, Home Office references, or biometric IDs. The vault redacts detected numbers to the last four characters.",
  },
] as const;

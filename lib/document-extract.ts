/**
 * Client-side document scan helpers.
 * Full passport numbers and Home Office references are detected so they can be
 * redacted — they are never stored.
 */

export type VaultDocKind =
  | "passport"
  | "brp"
  | "payslip"
  | "residence"
  | "english"
  | "life-in-uk"
  | "birth"
  | "other";

export interface ExtractedDocumentFields {
  kind: VaultDocKind | null;
  issueOn: string | null;
  expiresOn: string | null;
  last4: string | null;
  redactedNumberCount: number;
  flags: string[];
}

const PASSPORT_NEAR = /\b(?:passport|passeport|pasaporte)\b/i;
const NUMBERISH = /\b(?=[A-Z0-9]*\d)[A-Z0-9]{8,12}\b/g;
const ISO_DATE = /\b(20\d{2}|19\d{2})[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])\b/g;
const UK_DATE = /\b(0?[1-9]|[12]\d|3[01])[-/.\s](0?[1-9]|1[0-2]|Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[-/.\s](20\d{2}|19\d{2})\b/gi;

const MONTHS: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
};

function toIso(year: string, month: string, day: string): string | null {
  const mm = month.padStart(2, "0");
  const dd = day.padStart(2, "0");
  if (Number(mm) < 1 || Number(mm) > 12 || Number(dd) < 1 || Number(dd) > 31) return null;
  return `${year}-${mm}-${dd}`;
}

function collectDates(text: string): string[] {
  const found: string[] = [];
  for (const match of text.matchAll(ISO_DATE)) {
    const iso = toIso(match[1], match[2], match[3]);
    if (iso) found.push(iso);
  }
  for (const match of text.matchAll(UK_DATE)) {
    const monthToken = match[2].toLowerCase();
    const month = MONTHS[monthToken] ?? monthToken.padStart(2, "0");
    const iso = toIso(match[3], month, match[1]);
    if (iso) found.push(iso);
  }
  return [...new Set(found)].sort();
}

export function redactIdentityNumbers(text: string): { text: string; count: number; last4: string | null } {
  let count = 0;
  let last4: string | null = null;
  const redacted = text.replace(NUMBERISH, (value, offset) => {
    const window = text.slice(Math.max(0, offset - 24), offset + value.length + 12);
    const looksLikeId =
      PASSPORT_NEAR.test(window) ||
      /\b(?:brp|uin|uan|ho\s*ref|document\s*no)\b/i.test(window) ||
      /^\d{8,9}$/.test(value);
    if (!looksLikeId) return value;
    count += 1;
    last4 = value.slice(-4);
    return "••••" + last4;
  });
  return { text: redacted, count, last4 };
}

export function inferVaultKind(text: string, filename = ""): VaultDocKind | null {
  const hay = `${filename} ${text}`.toLowerCase();
  if (/\bpassport\b/.test(hay)) return "passport";
  if (/\b(brp|biometric residence|evisa)\b/.test(hay)) return "brp";
  if (/\b(payslip|salary|p60)\b/.test(hay)) return "payslip";
  if (/\b(council tax|tenancy|utility)\b/.test(hay)) return "residence";
  if (/\b(selt|ielts|life in the uk|life in uk)\b/.test(hay) && /\blife\b/.test(hay)) return "life-in-uk";
  if (/\b(selt|ielts|english)\b/.test(hay)) return "english";
  if (/\bbirth certificate\b/.test(hay)) return "birth";
  return null;
}

export function extractDocumentFields(raw: string, filename = ""): ExtractedDocumentFields {
  const { text, count, last4 } = redactIdentityNumbers(raw);
  const dates = collectDates(text);
  const lower = text.toLowerCase();
  let issueOn: string | null = null;
  let expiresOn: string | null = null;

  const expiryHint = lower.search(/\b(expir|valid until|valid to|date of expiry)\b/);
  const issueHint = lower.search(/\b(issued|date of issue|issue date)\b/);

  if (dates.length === 1) {
    if (expiryHint >= 0) expiresOn = dates[0];
    else if (issueHint >= 0) issueOn = dates[0];
    else expiresOn = dates[0];
  } else if (dates.length >= 2) {
    issueOn = dates[0];
    expiresOn = dates[dates.length - 1];
  }

  const flags: string[] = [];
  if (count > 0) {
    flags.push(
      "A passport or identity number was detected and redacted. Only the last four characters are kept.",
    );
  }
  if (!dates.length) {
    flags.push("No dates found. Type the issue and expiry dates if you have them.");
  }

  return {
    kind: inferVaultKind(text, filename),
    issueOn,
    expiresOn,
    last4,
    redactedNumberCount: count,
    flags,
  };
}

export const VAULT_KIND_LABEL: Record<VaultDocKind, string> = {
  passport: "Passport (file only — number redacted)",
  brp: "BRP / eVisa status",
  payslip: "Payslip / salary evidence",
  residence: "Proof of residence",
  english: "English language evidence",
  "life-in-uk": "Life in the UK pass",
  birth: "Birth certificate",
  other: "Other supporting document",
};

export const CHECKLIST_TO_VAULT: Record<string, VaultDocKind> = {
  passport: "passport",
  evisa: "brp",
  payslips: "payslip",
  "address-history": "residence",
  "english-cert": "english",
  "life-in-uk-pass": "life-in-uk",
  "birth-certificate": "birth",
};

import { enquiryLooksLikeIdentity, parseEnquiryKind, type EnquiryKind } from "../billing";

export function validateEnquiry(input: unknown):
  | { error: string }
  | { email: string; kind: EnquiryKind; message: string; adviserSlug: string | null } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Send a JSON object with email, kind and a short message." };
  }
  const record = input as { email?: string; kind?: string; message?: string; adviserSlug?: string };
  const email = record.email?.trim().toLowerCase() ?? "";
  if (!email.includes("@")) return { error: "Enter a valid email address." };
  const kind = parseEnquiryKind(record.kind);
  if (!kind) return { error: "Choose a recognised enquiry type." };
  const message = record.message?.trim() ?? "";
  if (message.length < 12) return { error: "Please add a short note (at least 12 characters)." };
  if (message.length > 4000) return { error: "Please keep the note under 4,000 characters." };
  if (enquiryLooksLikeIdentity(message)) {
    return { error: "Do not include passport numbers. Describe the work you need instead." };
  }
  const adviserSlug = record.adviserSlug?.trim() || null;
  if (adviserSlug && adviserSlug.length > 80) return { error: "Adviser reference is too long." };
  return { email, kind, message, adviserSlug };
}

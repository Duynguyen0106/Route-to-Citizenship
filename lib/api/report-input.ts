export function validateInaccuracyReport(input: unknown): { error: string } | { routeKey: string | null; message: string; contactEmail: string | null } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Please describe the inaccuracy in at least 20 characters." };
  }
  const record = input as {
    routeKey?: string | null;
    message?: string;
    contactEmail?: string | null;
  };
  const message = record.message?.trim() ?? "";
  if (message.length < 20) {
    return { error: "Please describe the inaccuracy in at least 20 characters." };
  }
  if (message.length > 4000) {
    return { error: "Please keep the report under 4,000 characters." };
  }
  if (/\b[0-9]{8,9}\b/.test(message) && /passport/i.test(message)) {
    return { error: "Do not include passport numbers. Describe the rule or page instead." };
  }

  const routeKey = record.routeKey?.trim() || null;
  const contactEmail = record.contactEmail?.trim() || null;
  if (contactEmail && !contactEmail.includes("@")) {
    return { error: "Enter a valid email address or leave it blank." };
  }

  return { routeKey, message, contactEmail };
}

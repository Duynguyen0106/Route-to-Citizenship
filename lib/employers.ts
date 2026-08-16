import { differenceInCalendarDays, parseISO } from "date-fns";
import { toIsoDate } from "./dates";

export const EMPLOYER_PRICE_PER_SEAT_GBP = 12;
export const EMPLOYER_TRIAL_SEATS = 3;

export const EMPLOYER_PRICING_NOTE = `Indicative B2B price: £${EMPLOYER_PRICE_PER_SEAT_GBP} per sponsored worker per year. This prototype does not invoice. A signed-in HR account can preview up to ${EMPLOYER_TRIAL_SEATS} worker sketches.`;

export const RIGHT_TO_WORK_LINKS = [
  {
    label: "Check a job applicant’s right to work",
    url: "https://www.gov.uk/check-job-applicant-right-to-work",
  },
  {
    label: "View a job applicant’s right to work (share code)",
    url: "https://www.gov.uk/view-right-to-work",
  },
  {
    label: "Sponsor a worker (employers)",
    url: "https://www.gov.uk/uk-visa-sponsorship-employers",
  },
] as const;

export const SPONSORED_VISA_OPTIONS = [
  { id: "skilled-worker", label: "Skilled Worker" },
  { id: "health-care-worker", label: "Health and Care Worker" },
  { id: "gbm", label: "Global Business Mobility" },
  { id: "scale-up", label: "Scale-up" },
  { id: "sportsperson", label: "International Sportsperson" },
  { id: "minister-of-religion", label: "Minister of Religion" },
  { id: "senior-or-specialist", label: "Senior or Specialist Worker" },
  { id: "graduate", label: "Graduate (not usually sponsored)" },
  { id: "other", label: "Other / not sure" },
] as const;

export type ExpiryBucket = "overdue" | "d30" | "d60" | "d90" | "ok";

export interface WorkerSketch {
  id: string;
  label: string;
  visaType: string;
  visaExpiresOn: string;
  jobTitle: string;
  rtwCheckedOn: string;
  hasCos: boolean;
  hasBrpCopy: boolean;
}

export function daysToExpiry(iso: string, asOf: Date): number | null {
  if (!iso) return null;
  const date = parseISO(iso);
  if (Number.isNaN(date.getTime())) return null;
  return differenceInCalendarDays(date, asOf);
}

export function expiryBucket(days: number | null): ExpiryBucket {
  if (days === null) return "ok";
  if (days < 0) return "overdue";
  if (days <= 30) return "d30";
  if (days <= 60) return "d60";
  if (days <= 90) return "d90";
  return "ok";
}

export function bucketWorkers(workers: WorkerSketch[], asOf: Date): Record<ExpiryBucket, WorkerSketch[]> {
  const groups: Record<ExpiryBucket, WorkerSketch[]> = {
    overdue: [],
    d30: [],
    d60: [],
    d90: [],
    ok: [],
  };
  for (const worker of workers) {
    groups[expiryBucket(daysToExpiry(worker.visaExpiresOn, asOf))].push(worker);
  }
  return groups;
}

export function workersToCsv(workers: WorkerSketch[], asOf: Date): string {
  const header = [
    "label",
    "visaType",
    "visaExpiresOn",
    "daysUntilExpiry",
    "jobTitle",
    "rtwCheckedOn",
    "hasCos",
    "hasBrpCopy",
  ];
  const lines = [header.join(",")];
  for (const worker of workers) {
    const days = daysToExpiry(worker.visaExpiresOn, asOf);
    const cells = [
      csvCell(worker.label),
      csvCell(worker.visaType),
      csvCell(worker.visaExpiresOn),
      csvCell(days === null ? "" : String(days)),
      csvCell(worker.jobTitle),
      csvCell(worker.rtwCheckedOn),
      csvCell(worker.hasCos ? "yes" : "no"),
      csvCell(worker.hasBrpCopy ? "yes" : "no"),
    ];
    lines.push(cells.join(","));
  }
  return `${lines.join("\n")}\n`;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

export function defaultWorker(): Omit<WorkerSketch, "id"> {
  return {
    label: "",
    visaType: "skilled-worker",
    visaExpiresOn: toIsoDate(new Date()),
    jobTitle: "",
    rtwCheckedOn: "",
    hasCos: false,
    hasBrpCopy: false,
  };
}

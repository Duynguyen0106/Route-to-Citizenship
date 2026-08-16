import { differenceInCalendarDays, format, parseISO } from "date-fns";

function parseValid(iso: string): Date | null {
  if (!iso) return null;
  const date = parseISO(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatLongDate(iso: string): string {
  const date = parseValid(iso);
  return date ? format(date, "d MMMM yyyy") : "—";
}

export function formatShortDate(iso: string): string {
  const date = parseValid(iso);
  return date ? format(date, "d MMM yyyy") : "—";
}

export function daysUntil(iso: string, asOf: Date = new Date()): number {
  const date = parseValid(iso);
  if (!date) return 0;
  return differenceInCalendarDays(date, asOf);
}

export function formatDaysUntil(iso: string, asOf: Date = new Date()): string {
  const days = daysUntil(iso, asOf);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 0 && days < 60) return `in ${days} days`;
  if (days >= 60) {
    const months = Math.round(days / 30.44);
    return `in about ${months} month${months === 1 ? "" : "s"}`;
  }
  const ago = Math.abs(days);
  if (ago < 60) return `${ago} days ago`;
  const months = Math.round(ago / 30.44);
  return `about ${months} month${months === 1 ? "" : "s"} ago`;
}

export function formatDayCount(days: number): string {
  const abs = Math.abs(days);
  if (abs >= 365) {
    const years = (abs / 365.25).toFixed(1).replace(/\.0$/, "");
    return `${years} year${years === "1" ? "" : "s"}`;
  }
  if (abs >= 60) {
    const months = Math.round(abs / 30.44);
    return `${months} month${months === 1 ? "" : "s"}`;
  }
  return `${abs} day${abs === 1 ? "" : "s"}`;
}

export function formatGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

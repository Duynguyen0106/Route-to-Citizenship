import { formatISO } from "date-fns";

export function toIsoDate(date: Date): string {
  return formatISO(date, { representation: "date" });
}

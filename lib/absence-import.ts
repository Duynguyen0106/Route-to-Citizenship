import { differenceInCalendarDays, parseISO } from "date-fns";
import { toIsoDate } from "./dates";
import type { AbsenceTrip } from "./types";

const UK_PLACE =
  /\b(united kingdom|great britain|england|scotland|wales|northern ireland|\buk\b|london|manchester|birmingham|leeds|glasgow|edinburgh|cardiff|belfast|bristol|liverpool|nottingham|sheffield|newcastle)\b/i;

function icsUnfold(raw: string): string {
  return raw.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}

function icsValue(block: string, key: string): string | null {
  const match = block.match(new RegExp(`^${key}[^:]*:(.+)$`, "im"));
  return match ? match[1].trim() : null;
}

function icsDate(value: string | null): string | null {
  if (!value) return null;
  const compact = value.replace(/[^0-9T]/g, "");
  if (/^\d{8}$/.test(compact)) {
    return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
  }
  if (/^\d{8}T/.test(compact)) {
    const iso = `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
    return iso;
  }
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return toIsoDate(parsed);
}

export interface ParsedCalendarEvent {
  summary: string;
  location: string;
  departedOn: string;
  returnedOn: string;
  days: number;
  likelyOutsideUk: boolean;
}

export function parseIcsEvents(ics: string): ParsedCalendarEvent[] {
  const unfolded = icsUnfold(ics);
  const blocks = unfolded.split(/BEGIN:VEVENT/i).slice(1);
  const events: ParsedCalendarEvent[] = [];
  for (const chunk of blocks) {
    const block = chunk.split(/END:VEVENT/i)[0] ?? "";
    const departedOn = icsDate(icsValue(block, "DTSTART"));
    // All-day DTEND is exclusive (first day back), which matches absence maths.
    const returnedOn = icsDate(icsValue(block, "DTEND")) ?? departedOn;
    if (!departedOn || !returnedOn) continue;
    const start = parseISO(departedOn);
    const end = parseISO(returnedOn);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
    const days = Math.max(0, differenceInCalendarDays(end, start) || 1);
    if (days < 1) continue;
    const summary = icsValue(block, "SUMMARY") ?? "Calendar event";
    const location = icsValue(block, "LOCATION") ?? "";
    const hay = `${summary} ${location}`;
    const likelyOutsideUk = location ? !UK_PLACE.test(location) : !UK_PLACE.test(hay);
    events.push({ summary, location, departedOn, returnedOn, days, likelyOutsideUk });
  }
  return events;
}

export function eventsToTrips(events: ParsedCalendarEvent[], onlyOutsideUk = true): AbsenceTrip[] {
  return events
    .filter((event) => (onlyOutsideUk ? event.likelyOutsideUk : true))
    .map((event) => ({
      id: crypto.randomUUID(),
      departedOn: event.departedOn,
      returnedOn: event.returnedOn,
      place: [event.summary, event.location].filter(Boolean).join(" — ").slice(0, 120),
    }));
}

/** Rough GB + NI bounding box. Republic of Ireland can false-positive on the west. */
export function isRoughlyInUnitedKingdom(lat: number, lon: number): boolean {
  return lat >= 49.8 && lat <= 60.9 && lon >= -8.25 && lon <= 1.8;
}

export function gpsTripSuggestion(lat: number, lon: number, asOf: Date): {
  inUk: boolean;
  message: string;
  draft: AbsenceTrip | null;
} {
  const inUk = isRoughlyInUnitedKingdom(lat, lon);
  if (inUk) {
    return {
      inUk: true,
      message:
        "This device looks to be inside a rough UK bounding box. GPS is a hint only — it does not prove entry or exit for ILR.",
      draft: null,
    };
  }
  const today = toIsoDate(asOf);
  return {
    inUk: false,
    message:
      "This device looks to be outside a rough UK bounding box. You can start an absence from today. GPS is opt-in and is not stored.",
    draft: {
      id: "gps-draft",
      departedOn: today,
      returnedOn: "",
      place: "GPS suggestion (confirm country)",
    },
  };
}

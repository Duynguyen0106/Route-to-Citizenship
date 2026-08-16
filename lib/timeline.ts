import { differenceInCalendarDays, parseISO } from "date-fns";
import type { TimelineEvent } from "@/lib/types";

export const TIMELINE_MARKER_COLOURS: Record<TimelineEvent["kind"], string> = {
  past: "#A8A29E",
  now: "#C4A35A",
  visa: "#B85C38",
  ilr: "#2F5D45",
  citizenship: "#1B2A4A",
  warning: "#B85C38",
  stage: "#24365E",
  window: "#3A7356",
  processing: "#B08D3E",
};

export interface TimelineScale {
  startMs: number;
  endMs: number;
  spanMs: number;
  progress: number;
}

export function timelineScale(
  events: TimelineEvent[],
  residenceStart: string,
  asOf: string,
): TimelineScale {
  const dates = [residenceStart, asOf, ...events.map((event) => event.date)].filter((value) => {
    if (!value) return false;
    const time = parseISO(value).getTime();
    return !Number.isNaN(time);
  });
  if (dates.length === 0) {
    const now = Date.now();
    return { startMs: now, endMs: now + 1, spanMs: 1, progress: 0 };
  }
  const startMs = Math.min(...dates.map((value) => parseISO(value).getTime()));
  const endMs = Math.max(...dates.map((value) => parseISO(value).getTime()));
  const spanMs = Math.max(endMs - startMs, 1);
  const nowMs = parseISO(asOf).getTime();
  const progress = Number.isNaN(nowMs) ? 0 : Math.min(1, Math.max(0, (nowMs - startMs) / spanMs));
  return { startMs, endMs, spanMs, progress };
}

export function timelineX(date: string, scale: TimelineScale): number {
  const ms = parseISO(date).getTime();
  return Math.min(100, Math.max(0, ((ms - scale.startMs) / scale.spanMs) * 100));
}

export function daysSpentInUk(residenceStart: string, asOf: string): number {
  const start = parseISO(residenceStart);
  const end = parseISO(asOf);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(0, differenceInCalendarDays(end, start));
}

const KEY_KINDS: TimelineEvent["kind"][] = ["now", "visa", "ilr", "citizenship"];

/** Spec markers: today, visa expiry, ILR, citizenship. Extra stage events stay off the SVG. */
export function keyTimelineEvents(events: TimelineEvent[]): TimelineEvent[] {
  const picked: TimelineEvent[] = [];
  for (const kind of KEY_KINDS) {
    const match = events.find((event) => event.kind === kind);
    if (match) picked.push(match);
  }
  return picked;
}

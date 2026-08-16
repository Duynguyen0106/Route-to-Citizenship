"use client";

import { formatShortDate } from "@/lib/format";
import { useLocale } from "@/components/LocaleProvider";
import {
  TIMELINE_MARKER_COLOURS,
  daysSpentInUk,
  keyTimelineEvents,
  timelineScale,
  timelineX,
} from "@/lib/timeline";
import type { TimelineEvent } from "@/lib/types";

export function Timeline({
  events,
  residenceStart,
  asOf,
}: {
  events: TimelineEvent[];
  residenceStart: string;
  asOf: string;
}) {
  const { t } = useLocale();
  const kindLabel: Partial<Record<TimelineEvent["kind"], string>> = {
    now: t("timeline.today"),
    visa: t("timeline.visaExpiry"),
    ilr: t("timeline.ilr"),
    citizenship: t("timeline.citizenship"),
    window: t("timeline.window"),
    processing: t("timeline.processing"),
  };
  const keyEvents = keyTimelineEvents(events);
  const scale = timelineScale(keyEvents, residenceStart, asOf);
  const spentDays = daysSpentInUk(residenceStart, asOf);
  const markers = keyEvents.map((event, index) => ({
    ...event,
    x: timelineX(event.date, scale),
    stagger: index % 2 === 0 ? 0 : 1,
  }));
  const otherEvents = events.filter((event) => !keyEvents.some((key) => key.id === event.id));

  return (
    <div className="mt-6 rounded-2xl border border-navy/10 bg-paper-50 p-4 sm:mt-8 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-ink-muted">
          {t("timeline.counted", { date: formatShortDate(residenceStart) })}{" "}
          <strong className="text-navy">{t("timeline.days", { days: spentDays })}</strong>
        </p>
        <p className="text-xs text-ink-muted">
          {t("timeline.percent", { pct: Math.round(scale.progress * 100) })}
        </p>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-navy/10" aria-hidden>
        <div
          className="h-full rounded-full bg-moss"
          style={{ width: `${Math.round(scale.progress * 100)}%` }}
        />
      </div>

      <ol className="mt-6 space-y-3 md:hidden">
        {markers.map((marker) => (
          <li key={marker.id} className="flex gap-3">
            <span
              className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full"
              style={{ background: TIMELINE_MARKER_COLOURS[marker.kind] }}
            />
            <div>
              <p className="text-sm font-medium text-navy">{kindLabel[marker.kind] ?? marker.label}</p>
              <p className="text-xs text-ink-muted">{formatShortDate(marker.date)}</p>
              {marker.note ? <p className="mt-1 text-xs text-clay-600">{marker.note}</p> : null}
            </div>
          </li>
        ))}
      </ol>

      <svg
        viewBox="0 0 1000 210"
        className="mt-6 hidden w-full overflow-visible md:block"
        role="img"
        aria-label={t("timeline.aria")}
      >
        <line x1="48" y1="58" x2="952" y2="58" stroke="#1B2A4A" strokeOpacity="0.2" strokeWidth="4" />
        <rect
          x="48"
          y="50"
          width={Math.max(4, scale.progress * 904)}
          height="16"
          rx="8"
          fill="#2F5D45"
          opacity="0.85"
        />
        {markers.map((marker) => {
          const cx = Math.min(940, Math.max(60, 48 + (marker.x / 100) * 904));
          const labelY = marker.stagger === 0 ? 108 : 158;
          const anchor = marker.x < 8 ? "start" : marker.x > 92 ? "end" : "middle";
          return (
            <g key={marker.id}>
              <line
                x1={cx}
                y1="58"
                x2={cx}
                y2={labelY - 16}
                stroke={TIMELINE_MARKER_COLOURS[marker.kind]}
                strokeOpacity="0.35"
              />
              <circle
                cx={cx}
                cy="58"
                r={marker.kind === "now" ? 10 : 8}
                fill={TIMELINE_MARKER_COLOURS[marker.kind]}
                stroke="#FBF8F3"
                strokeWidth="3"
              />
              <text
                x={cx}
                y={labelY}
                textAnchor={anchor}
                fill="#1B2A4A"
                fontSize="13"
                fontFamily="var(--font-public-sans), system-ui, sans-serif"
              >
                {kindLabel[marker.kind] ?? marker.label}
              </text>
              <text
                x={cx}
                y={labelY + 18}
                textAnchor={anchor}
                fill="#57534E"
                fontSize="12"
                fontFamily="var(--font-public-sans), system-ui, sans-serif"
              >
                {formatShortDate(marker.date)}
              </text>
            </g>
          );
        })}
      </svg>

      <ul className="mt-4 hidden flex-wrap gap-4 text-xs text-ink-muted md:flex">
        {(["now", "visa", "ilr", "citizenship", "window", "processing"] as const).map((kind) => (
          <li key={kind} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: TIMELINE_MARKER_COLOURS[kind] }}
            />
            {kindLabel[kind]}
          </li>
        ))}
      </ul>

      {otherEvents.length > 0 ? (
        <ol className="mt-5 grid gap-2 border-t border-navy/10 pt-4 text-sm sm:grid-cols-2">
          {otherEvents.map((event) => (
            <li key={event.id} className="text-ink-muted">
              <span className="font-medium text-navy">{event.label}</span>
              <span className="mt-0.5 block text-xs">{formatShortDate(event.date)}</span>
              {event.note ? <span className="mt-1 block text-xs text-ink-faint">{event.note}</span> : null}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

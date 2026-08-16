import { formatShortDate } from "@/lib/format";
import {
  TIMELINE_MARKER_COLOURS,
  daysSpentInUk,
  timelineScale,
  timelineX,
} from "@/lib/timeline";
import type { TimelineEvent } from "@/lib/types";

const KIND_LABEL: Partial<Record<TimelineEvent["kind"], string>> = {
  now: "Today",
  visa: "Visa expiry",
  ilr: "ILR",
  citizenship: "Citizenship",
};

export function Timeline({
  events,
  residenceStart,
  asOf,
}: {
  events: TimelineEvent[];
  residenceStart: string;
  asOf: string;
}) {
  const scale = timelineScale(events, residenceStart, asOf);
  const spentDays = daysSpentInUk(residenceStart, asOf);
  const markers = [
    ...events.filter((event) => ["now", "visa", "ilr", "citizenship"].includes(event.kind)),
    ...events.filter((event) => !["now", "visa", "ilr", "citizenship"].includes(event.kind)),
  ].map((event, index) => ({
    ...event,
    x: timelineX(event.date, scale),
    stagger: index % 2 === 0 ? 0 : 1,
  }));

  return (
    <div className="mt-8 rounded-2xl border border-navy/10 bg-paper-50 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-ink-muted">
          Time already counted from {formatShortDate(residenceStart)}:{" "}
          <strong className="text-navy">{spentDays} days</strong>
        </p>
        <p className="text-xs text-ink-muted">{Math.round(scale.progress * 100)}% of this sketch</p>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-navy/10" aria-hidden>
        <div
          className="h-full rounded-full bg-moss"
          style={{ width: `${Math.round(scale.progress * 100)}%` }}
        />
      </div>

      <svg
        viewBox="0 0 1000 220"
        className="mt-6 w-full overflow-visible"
        role="img"
        aria-label="Immigration timeline with visa expiry, ILR and citizenship markers"
      >
        <line x1="40" y1="70" x2="960" y2="70" stroke="#1B2A4A" strokeOpacity="0.2" strokeWidth="4" />
        <rect
          x="40"
          y="62"
          width={Math.max(4, scale.progress * 920)}
          height="16"
          rx="8"
          fill="#2F5D45"
          opacity="0.85"
        />
        {markers.map((marker) => {
          const cx = 40 + (marker.x / 100) * 920;
          const labelY = marker.stagger === 0 ? 118 : 168;
          return (
            <g key={marker.id}>
              <line
                x1={cx}
                y1="70"
                x2={cx}
                y2={labelY - 14}
                stroke={TIMELINE_MARKER_COLOURS[marker.kind]}
                strokeOpacity="0.35"
              />
              <circle
                cx={cx}
                cy="70"
                r={marker.kind === "now" ? 10 : 8}
                fill={TIMELINE_MARKER_COLOURS[marker.kind]}
                stroke="#FBF8F3"
                strokeWidth="3"
              />
              <text
                x={cx}
                y={labelY}
                textAnchor="middle"
                fill="#1B2A4A"
                fontSize="12"
                fontFamily="var(--font-public-sans), system-ui, sans-serif"
              >
                {marker.label}
              </text>
              <text
                x={cx}
                y={labelY + 16}
                textAnchor="middle"
                fill="#57534E"
                fontSize="11"
                fontFamily="var(--font-public-sans), system-ui, sans-serif"
              >
                {formatShortDate(marker.date)}
              </text>
            </g>
          );
        })}
      </svg>

      <ul className="mt-4 flex flex-wrap gap-4 text-xs text-ink-muted">
        {(["now", "visa", "ilr", "citizenship"] as const).map((kind) => (
          <li key={kind} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: TIMELINE_MARKER_COLOURS[kind] }}
            />
            {KIND_LABEL[kind]}
          </li>
        ))}
      </ul>
    </div>
  );
}

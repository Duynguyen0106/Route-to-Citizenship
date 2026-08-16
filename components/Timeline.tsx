import { formatShortDate } from "@/lib/format";
import type { TimelineEvent } from "@/lib/types";

const KIND_COLOUR: Record<TimelineEvent["kind"], string> = {
  past: "bg-ink-faint",
  now: "bg-gold",
  visa: "bg-clay",
  ilr: "bg-moss",
  citizenship: "bg-navy",
  warning: "bg-clay",
};

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="mt-8 overflow-x-auto pb-2">
      <div className="relative flex min-w-[640px] items-start justify-between gap-4 px-2">
        <div className="absolute left-6 right-6 top-3 h-0.5 bg-navy/15" />
        {events.map((event) => (
          <li key={event.id} className="relative z-10 flex w-36 flex-col items-center text-center">
            <span className={`h-6 w-6 rounded-full border-4 border-paper-50 ${KIND_COLOUR[event.kind]}`} />
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
              {formatShortDate(event.date)}
            </p>
            <p className="mt-1 text-sm font-medium text-navy">{event.label}</p>
            {event.note && <p className="mt-1 text-xs text-ink-muted">{event.note}</p>}
          </li>
        ))}
      </div>
    </ol>
  );
}

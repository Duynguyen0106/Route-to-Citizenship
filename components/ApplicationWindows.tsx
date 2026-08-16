import { formatLongDate } from "@/lib/format";
import type { ApplicationWindow, ProcessingEstimate } from "@/lib/types";

export function ApplicationWindows({
  windows,
  processing,
}: {
  windows: ApplicationWindow[];
  processing: ProcessingEstimate[];
}) {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <div>
        <h3 className="text-xs uppercase tracking-[0.16em] text-ink-faint">Windows</h3>
        <ul className="mt-2 space-y-3">
          {windows.map((window) => (
            <li key={window.id} className="rounded-xl border border-moss/25 bg-moss/5 px-4 py-3">
              <p className="font-medium text-navy">{window.title}</p>
              <p className="mt-1 text-sm text-ink-muted">
                Opens {formatLongDate(window.opensOn)}
                {window.closesOn ? ` · closes ${formatLongDate(window.closesOn)}` : ""}
              </p>
              <p className="mt-2 text-sm text-ink-muted">{window.detail}</p>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-xs uppercase tracking-[0.16em] text-ink-faint">Typical decision waits</h3>
        <ul className="mt-2 space-y-3">
          {processing.map((item) => (
            <li key={item.id} className="rounded-xl border border-navy/10 bg-paper-50 px-4 py-3">
              <p className="font-medium text-navy">{item.label}</p>
              <p className="mt-1 text-sm text-ink-muted">
                About {item.typicalWeeks} weeks · decision sketched {formatLongDate(item.decisionOn)}
              </p>
              <p className="mt-2 text-xs text-ink-faint">{item.caveat}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

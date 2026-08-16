import { formatLongDate } from "@/lib/format";
import { RULES_REVIEWED_ON } from "@/lib/types";

export function LastReviewed({ date }: { date?: string }) {
  return (
    <p className="text-xs uppercase tracking-[0.16em] text-ink-faint">
      Last reviewed: {formatLongDate(date ?? RULES_REVIEWED_ON)}
    </p>
  );
}

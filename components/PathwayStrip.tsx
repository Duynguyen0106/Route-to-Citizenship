import { getPathway } from "@/lib/pathways";
import type { PathwayId } from "@/lib/types";

export function PathwayStrip({
  pathwayId,
  currentVisaId,
}: {
  pathwayId: PathwayId;
  currentVisaId: string;
}) {
  const pathway = getPathway(pathwayId);
  const currentIndex = pathway.stages.findIndex((stage) => {
    if (currentVisaId === "spouse-10") return stage.visaId === "spouse-5";
    if (currentVisaId.startsWith("global-talent")) return stage.visaId.startsWith("global-talent") || stage.id === "gt";
    if (pathwayId === "long-residence" && currentVisaId !== "ilr") return stage.id === "lawful";
    return stage.visaId === currentVisaId;
  });

  return (
    <ol className="mt-6 flex flex-wrap items-center gap-2 text-sm">
      {pathway.stages.map((stage, index) => {
        const active = index === currentIndex;
        const done =
          currentIndex > index || (currentVisaId === "ilr" && stage.visaId !== "citizenship");
        return (
          <li key={stage.id} className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 ${
                active
                  ? "bg-navy text-paper-50"
                  : done
                    ? "bg-moss/15 text-moss-700"
                    : "bg-navy/10 text-ink-muted"
              }`}
            >
              {stage.label}
            </span>
            {index < pathway.stages.length - 1 && <span className="text-ink-faint">→</span>}
          </li>
        );
      })}
    </ol>
  );
}

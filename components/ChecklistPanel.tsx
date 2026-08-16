import { CHECKLIST_GROUPS } from "@/lib/checklist";
import type { ChecklistItem } from "@/lib/types";

export function ChecklistPanel({
  items,
  checkedIds,
  onToggle,
}: {
  items: ChecklistItem[];
  checkedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="mt-6 space-y-6">
      {CHECKLIST_GROUPS.map((group) => {
        const groupItems = items.filter((item) => item.group === group.id);
        if (groupItems.length === 0) return null;
        return (
          <div key={group.id}>
            <h3 className="text-xs uppercase tracking-[0.16em] text-ink-faint">{group.label}</h3>
            <ul className="mt-2 divide-y divide-navy/10 rounded-2xl border border-navy/10 bg-paper-50">
              {groupItems.map((item) => {
                const checked = checkedIds.includes(item.id);
                return (
                  <li key={item.id}>
                    <label className="flex cursor-pointer gap-3 px-4 py-3">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={checked}
                        onChange={() => onToggle(item.id)}
                      />
                      <span>
                        <span className="font-medium text-navy">
                          {item.label}
                          {item.required && (
                            <span className="ml-2 text-xs font-normal text-clay">Usually needed</span>
                          )}
                        </span>
                        <span className="mt-1 block text-sm text-ink-muted">{item.detail}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

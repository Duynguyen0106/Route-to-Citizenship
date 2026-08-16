import { CHECKLIST_TO_VAULT, type VaultDocKind } from "./document-extract";
import type { ChecklistItem } from "./types";

export interface VaultItemMeta {
  id: string;
  kind: VaultDocKind;
  label: string;
  filename: string;
  issueOn: string | null;
  expiresOn: string | null;
  last4: string | null;
  addedOn: string;
  bytes: number;
}

export type CompletenessStatus = "present" | "missing" | "expired" | "expiring" | "not_tracked";

export interface CompletenessRow {
  checklistId: string;
  label: string;
  required: boolean;
  vaultKind: VaultDocKind | null;
  status: CompletenessStatus;
  detail: string;
}

function daysUntil(iso: string | null, asOf: string): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso) - Date.parse(asOf);
  if (Number.isNaN(ms)) return null;
  return Math.round(ms / 86_400_000);
}

export function assessDocumentCompleteness(
  checklist: ChecklistItem[],
  vault: VaultItemMeta[],
  asOf: string,
): CompletenessRow[] {
  return checklist.map((item) => {
    const kind = CHECKLIST_TO_VAULT[item.id] ?? null;
    if (!kind) {
      return {
        checklistId: item.id,
        label: item.label,
        required: item.required,
        vaultKind: null,
        status: "not_tracked",
        detail: "Tick this when you have the evidence. The vault only stores a few identity-document types.",
      };
    }
    const matches = vault.filter((entry) => entry.kind === kind);
    if (matches.length === 0) {
      return {
        checklistId: item.id,
        label: item.label,
        required: item.required,
        vaultKind: kind,
        status: "missing",
        detail: item.required ? "No matching file in the local vault." : "Optional — nothing stored yet.",
      };
    }
    const soonest = matches
      .map((entry) => entry.expiresOn)
      .filter((value): value is string => Boolean(value))
      .sort()[0];
    const remaining = daysUntil(soonest ?? null, asOf);
    if (remaining !== null && remaining < 0) {
      return {
        checklistId: item.id,
        label: item.label,
        required: item.required,
        vaultKind: kind,
        status: "expired",
        detail: `A stored ${kind} file looks expired (${soonest}).`,
      };
    }
    if (remaining !== null && remaining <= 90) {
      return {
        checklistId: item.id,
        label: item.label,
        required: item.required,
        vaultKind: kind,
        status: "expiring",
        detail: `A stored file expires on ${soonest}.`,
      };
    }
    return {
      checklistId: item.id,
      label: item.label,
      required: item.required,
      vaultKind: kind,
      status: "present",
      detail: `${matches.length} matching file${matches.length === 1 ? "" : "s"} in the local vault.`,
    };
  });
}

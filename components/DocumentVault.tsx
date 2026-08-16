"use client";

import { useEffect, useMemo, useState } from "react";
import { assessDocumentCompleteness } from "@/lib/document-completeness";
import {
  VAULT_KIND_LABEL,
  extractDocumentFields,
  type VaultDocKind,
} from "@/lib/document-extract";
import { addVaultFile, listVaultMeta, removeVaultFile } from "@/lib/document-vault";
import { useLocale } from "@/components/LocaleProvider";
import { formatLongDate } from "@/lib/format";
import type { ChecklistItem } from "@/lib/types";
import type { VaultItemMeta } from "@/lib/document-completeness";

const KINDS = Object.keys(VAULT_KIND_LABEL) as VaultDocKind[];

export function DocumentVault({
  checklist,
  asOf,
}: {
  checklist: ChecklistItem[];
  asOf: string;
}) {
  const { t } = useLocale();
  const [items, setItems] = useState<VaultItemMeta[]>([]);
  const [scan, setScan] = useState("");
  const [kind, setKind] = useState<VaultDocKind>("other");
  const [issueOn, setIssueOn] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [last4, setLast4] = useState<string | null>(null);
  const [flags, setFlags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(listVaultMeta());
  }, []);

  const extracted = useMemo(() => (scan.trim() ? extractDocumentFields(scan) : null), [scan]);

  useEffect(() => {
    if (!extracted) return;
    if (extracted.kind) setKind(extracted.kind);
    if (extracted.issueOn) setIssueOn(extracted.issueOn);
    if (extracted.expiresOn) setExpiresOn(extracted.expiresOn);
    setLast4(extracted.last4);
    setFlags(extracted.flags);
  }, [extracted]);

  const completeness = useMemo(
    () => assessDocumentCompleteness(checklist, items, asOf),
    [checklist, items, asOf],
  );

  async function onFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setError(null);
    if (file.size > 8 * 1024 * 1024) {
      setError("Keep files under 8 MB.");
      return;
    }
    try {
      if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
        const text = await file.text();
        setScan(text);
      }
      await addVaultFile({
        file,
        kind,
        label: VAULT_KIND_LABEL[kind],
        issueOn: issueOn || null,
        expiresOn: expiresOn || null,
        last4,
      });
      setItems(listVaultMeta());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not encrypt this file in the browser.");
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <p className="text-sm text-ink-muted">{t("vault.intro")}</p>

      <label className="block text-sm font-medium text-navy">
        {t("vault.scan")}
        <textarea
          className="field-input min-h-28"
          value={scan}
          onChange={(event) => setScan(event.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
      </label>
      {flags.length > 0 ? (
        <ul className="list-disc pl-5 text-sm text-clay-600">
          {flags.map((flag) => (
            <li key={flag}>{flag}</li>
          ))}
        </ul>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-medium text-navy">
          {t("vault.kind")}
          <select className="field-input" value={kind} onChange={(event) => setKind(event.target.value as VaultDocKind)}>
            {KINDS.map((item) => (
              <option key={item} value={item}>
                {VAULT_KIND_LABEL[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-navy">
          Issue date
          <input className="field-input" type="date" value={issueOn} onChange={(event) => setIssueOn(event.target.value)} />
        </label>
        <label className="text-sm font-medium text-navy">
          Expiry date
          <input
            className="field-input"
            type="date"
            value={expiresOn}
            onChange={(event) => setExpiresOn(event.target.value)}
          />
        </label>
        <label className="text-sm font-medium text-navy">
          {t("vault.upload")}
          <input
            className="field-input"
            type="file"
            accept="image/*,.pdf,.txt,.png,.jpg,.jpeg,.webp"
            onChange={(event) => void onFile(event.target.files)}
          />
        </label>
      </div>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      {last4 ? <p className="text-xs text-ink-muted">Redacted identity ending {last4} — full number not stored.</p> : null}

      <div>
        <h3 className="text-xs uppercase tracking-[0.16em] text-ink-faint">Stored in this browser</h3>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">Nothing stored yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-navy/10 rounded-2xl border border-navy/10 bg-white">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  <span className="font-medium text-navy">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    {item.filename}
                    {item.expiresOn ? ` · expires ${formatLongDate(item.expiresOn)}` : ""}
                    {item.last4 ? ` · ending ${item.last4}` : ""}
                  </span>
                </span>
                <button
                  type="button"
                  className="min-h-11 text-clay"
                  onClick={() => {
                    void removeVaultFile(item.id).then(() => setItems(listVaultMeta()));
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-[0.16em] text-ink-faint">Completeness against the checklist</h3>
        <ul className="mt-2 space-y-2">
          {completeness
            .filter((row) => row.status !== "not_tracked")
            .map((row) => (
              <li
                key={row.checklistId}
                className={`rounded-xl border px-4 py-3 text-sm ${
                  row.status === "present"
                    ? "border-moss/30 bg-moss/5"
                    : row.status === "missing"
                      ? "border-clay/30 bg-clay/5"
                      : "border-gold/40 bg-gold/10"
                }`}
              >
                <p className="font-medium text-navy">
                  {row.label}
                  <span className="ml-2 text-xs font-normal uppercase tracking-wide text-ink-faint">
                    {row.status}
                  </span>
                </p>
                <p className="mt-1 text-ink-muted">{row.detail}</p>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

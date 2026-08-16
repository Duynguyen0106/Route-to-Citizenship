import { FEES_SOURCE } from "./fees";
import { APPLY_URLS, applyUrlForVisa } from "./govuk-apply";
import { GOVUK } from "./legal";
import { SELT_PROVIDERS, TRANSLATION_REGISTERS } from "./partner-services";
import { GOVUK_CONTENT_SOURCES } from "./govuk-content";

export type OfficialUrlGroup = "govuk" | "partner";

export interface OfficialUrl {
  id: string;
  url: string;
  group: OfficialUrlGroup;
}

export function listOfficialUrls(): OfficialUrl[] {
  const rows: OfficialUrl[] = [];
  const seen = new Set<string>();

  function add(id: string, url: string, group: OfficialUrlGroup) {
    if (!url || seen.has(url)) return;
    seen.add(url);
    rows.push({ id, url, group });
  }

  for (const [id, url] of Object.entries(GOVUK)) {
    add(id, url, url.includes("gov.uk") ? "govuk" : "partner");
  }
  add("fees-table", FEES_SOURCE, "govuk");
  for (const [visaId, url] of Object.entries(APPLY_URLS)) {
    add(`apply-${visaId}`, url, "govuk");
  }
  add("apply-fallback-skilled", applyUrlForVisa("skilled-worker"), "govuk");
  for (const source of GOVUK_CONTENT_SOURCES) {
    add(`content-${source.key}`, `https://www.gov.uk${source.path}`, "govuk");
  }
  for (const item of SELT_PROVIDERS) add(`selt-${item.id}`, item.bookUrl, "partner");
  for (const item of TRANSLATION_REGISTERS) add(`translator-${item.label}`, item.url, "partner");
  return rows;
}

export function assertHttpsOfficialUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

import { createHash } from "node:crypto";
import { GOVUK } from "./legal";
import { FEES_SOURCE } from "./fees";

export const GOVUK_CONTENT_API = "https://www.gov.uk/api/content";

export interface GovukContentSource {
  key: string;
  path: string;
  routeKeys: string[];
  label: string;
}

export interface GovukSnapshotDraft {
  sourceKey: string;
  govukPath: string;
  title: string;
  description: string;
  publicUpdatedAt: string | null;
  contentHash: string;
  fetchedAt: string;
}

function pathFromUrl(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url.startsWith("/") ? url : `/${url}`;
  }
}

/** Official GOV.UK pages we poll via the Content API — no HTML scraping. */
export const GOVUK_CONTENT_SOURCES: GovukContentSource[] = [
  { key: "skilled-worker", path: pathFromUrl(GOVUK.skilledWorker), routeKeys: ["skilled-worker", "student-graduate-skilled-worker"], label: "Skilled Worker visa" },
  { key: "family", path: pathFromUrl(GOVUK.familyPartner), routeKeys: ["family"], label: "Family visa (partner)" },
  { key: "student", path: pathFromUrl(GOVUK.student), routeKeys: ["student-graduate-skilled-worker"], label: "Student visa" },
  { key: "graduate", path: pathFromUrl(GOVUK.graduate), routeKeys: ["student-graduate-skilled-worker"], label: "Graduate visa" },
  { key: "global-talent", path: pathFromUrl(GOVUK.globalTalent), routeKeys: ["global-talent"], label: "Global Talent" },
  { key: "innovator-founder", path: pathFromUrl(GOVUK.innovatorFounder), routeKeys: ["innovator-founder"], label: "Innovator Founder" },
  { key: "scale-up", path: pathFromUrl(GOVUK.scaleUp), routeKeys: ["scale-up"], label: "Scale-up" },
  { key: "ilr", path: pathFromUrl(GOVUK.ilr), routeKeys: ["*"], label: "Indefinite leave to remain" },
  { key: "citizenship", path: pathFromUrl(GOVUK.citizenship), routeKeys: ["*"], label: "British citizenship" },
  { key: "bno", path: pathFromUrl(GOVUK.bno), routeKeys: ["bno"], label: "BN(O) visa" },
  { key: "ancestry", path: pathFromUrl(GOVUK.ancestry), routeKeys: ["ancestry"], label: "Ancestry visa" },
  { key: "hpi", path: pathFromUrl(GOVUK.hpi), routeKeys: ["hpi"], label: "High Potential Individual" },
  { key: "protection", path: pathFromUrl(GOVUK.refugeeSettlement), routeKeys: ["protection"], label: "Refugee settlement" },
  { key: "euss", path: pathFromUrl(GOVUK.euss), routeKeys: ["euss"], label: "EU Settlement Scheme" },
  { key: "fees", path: pathFromUrl(FEES_SOURCE), routeKeys: ["*"], label: "Home Office fees table" },
];

export function hashGovukText(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function parseGovukContentItem(json: unknown, source: GovukContentSource): GovukSnapshotDraft | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const record = json as {
    title?: unknown;
    description?: unknown;
    public_updated_at?: unknown;
    base_path?: unknown;
  };
  const title = typeof record.title === "string" ? record.title.trim() : "";
  if (!title) return null;
  const description = typeof record.description === "string" ? record.description.trim().slice(0, 2000) : "";
  const publicUpdatedAt =
    typeof record.public_updated_at === "string" && record.public_updated_at
      ? record.public_updated_at
      : null;
  const govukPath =
    typeof record.base_path === "string" && record.base_path.startsWith("/")
      ? record.base_path
      : source.path;
  return {
    sourceKey: source.key,
    govukPath,
    title: title.slice(0, 300),
    description,
    publicUpdatedAt,
    contentHash: hashGovukText(`${title}\n${description}\n${publicUpdatedAt ?? ""}`),
    fetchedAt: new Date().toISOString(),
  };
}

export function contentApiUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${GOVUK_CONTENT_API}${clean}`;
}

export async function fetchGovukSource(
  source: GovukContentSource,
  fetcher: typeof fetch = fetch,
): Promise<GovukSnapshotDraft | { error: string; sourceKey: string }> {
  try {
    const response = await fetcher(contentApiUrl(source.path), {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      return { error: `GOV.UK returned ${response.status}`, sourceKey: source.key };
    }
    const json: unknown = await response.json();
    const parsed = parseGovukContentItem(json, source);
    if (!parsed) return { error: "GOV.UK response was missing a title", sourceKey: source.key };
    return parsed;
  } catch {
    return { error: "Could not reach the GOV.UK Content API", sourceKey: source.key };
  }
}

export function snapshotDiffers(
  previous: { contentHash: string } | null | undefined,
  next: GovukSnapshotDraft,
): boolean {
  return !previous || previous.contentHash !== next.contentHash;
}

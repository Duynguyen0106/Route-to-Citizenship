import { prisma } from "./prisma";
import {
  GOVUK_CONTENT_SOURCES,
  fetchGovukSource,
  snapshotDiffers,
  type GovukSnapshotDraft,
} from "./govuk-content";
import { type EncodedRuleNotice } from "./rule-versions";

const MIN_SYNC_MS = 15 * 60 * 1000;
let lastSyncAt = 0;

export interface StoredGovukSnapshot {
  sourceKey: string;
  govukPath: string;
  title: string;
  description: string;
  publicUpdatedAt: string | null;
  contentHash: string;
  fetchedAt: string;
}

export interface PageUpdateNotice {
  id: string;
  title: string;
  detail: string;
  kind: "page";
  effectiveOn: string;
  routeKeys: string[];
  sourceUrl: string;
}

export async function listGovukSnapshots(): Promise<StoredGovukSnapshot[]> {
  try {
    const rows = await prisma.govukSnapshot.findMany({
      orderBy: { fetchedAt: "desc" },
    });
    const latest = new Map<string, StoredGovukSnapshot>();
    for (const row of rows) {
      if (latest.has(row.sourceKey)) continue;
      latest.set(row.sourceKey, {
        sourceKey: row.sourceKey,
        govukPath: row.govukPath,
        title: row.title,
        description: row.description,
        publicUpdatedAt: row.publicUpdatedAt?.toISOString() ?? null,
        contentHash: row.contentHash,
        fetchedAt: row.fetchedAt.toISOString(),
      });
    }
    return [...latest.values()];
  } catch {
    return [];
  }
}

export async function latestSnapshot(sourceKey: string): Promise<StoredGovukSnapshot | null> {
  try {
    const row = await prisma.govukSnapshot.findFirst({
      where: { sourceKey },
      orderBy: { fetchedAt: "desc" },
    });
    if (!row) return null;
    return {
      sourceKey: row.sourceKey,
      govukPath: row.govukPath,
      title: row.title,
      description: row.description,
      publicUpdatedAt: row.publicUpdatedAt?.toISOString() ?? null,
      contentHash: row.contentHash,
      fetchedAt: row.fetchedAt.toISOString(),
    };
  } catch {
    return null;
  }
}

export function pageNoticesFromSnapshots(snapshots: StoredGovukSnapshot[], reviewedOn: string): PageUpdateNotice[] {
  return snapshots.flatMap((snap) => {
    const updated = snap.publicUpdatedAt?.slice(0, 10);
    if (!updated || updated <= reviewedOn) return [];
    const source = GOVUK_CONTENT_SOURCES.find((item) => item.key === snap.sourceKey);
    return [
      {
        id: `govuk-${snap.sourceKey}-${updated}`,
        title: `${snap.title} was updated on GOV.UK`,
        detail: `GOV.UK last marked a significant update on ${updated}, which is after this planner’s encoded review (${reviewedOn}). Re-read the official page before you apply. Description kept here: “${snap.description.slice(0, 240)}”`,
        kind: "page" as const,
        effectiveOn: updated,
        routeKeys: source?.routeKeys ?? ["*"],
        sourceUrl: `https://www.gov.uk${snap.govukPath}`,
      },
    ];
  });
}

export async function syncGovukContent(options?: {
  force?: boolean;
  fetcher?: typeof fetch;
}): Promise<{
  fetched: number;
  changed: number;
  errors: { sourceKey: string; error: string }[];
  skipped: boolean;
}> {
  const now = Date.now();
  if (!options?.force && lastSyncAt && now - lastSyncAt < MIN_SYNC_MS) {
    return { fetched: 0, changed: 0, errors: [], skipped: true };
  }

  const errors: { sourceKey: string; error: string }[] = [];
  let fetched = 0;
  let changed = 0;
  const fetcher = options?.fetcher ?? fetch;

  for (const source of GOVUK_CONTENT_SOURCES) {
    const result = await fetchGovukSource(source, fetcher);
    if ("error" in result) {
      errors.push({ sourceKey: result.sourceKey, error: result.error });
      continue;
    }
    fetched += 1;
    const previous = await latestSnapshot(source.key);
    if (snapshotDiffers(previous, result)) changed += 1;
    await persistSnapshot(result);
  }

  lastSyncAt = now;
  return { fetched, changed, errors, skipped: false };
}

async function persistSnapshot(draft: GovukSnapshotDraft): Promise<void> {
  await prisma.govukSnapshot.create({
    data: {
      sourceKey: draft.sourceKey,
      govukPath: draft.govukPath,
      title: draft.title,
      description: draft.description,
      publicUpdatedAt: draft.publicUpdatedAt ? new Date(draft.publicUpdatedAt) : null,
      contentHash: draft.contentHash,
      fetchedAt: new Date(draft.fetchedAt),
    },
  });
}

export function mergeNotices(
  encoded: EncodedRuleNotice[],
  page: PageUpdateNotice[],
  routeKeys: string[],
): Array<EncodedRuleNotice | PageUpdateNotice> {
  const applies = (keys: string[]) => keys.includes("*") || keys.some((key) => routeKeys.includes(key));
  return [...page, ...encoded].filter((notice) => applies(notice.routeKeys));
}

/** Test helper — allows unit tests to reset the in-memory rate limit. */
export function resetGovukSyncClock(): void {
  lastSyncAt = 0;
}

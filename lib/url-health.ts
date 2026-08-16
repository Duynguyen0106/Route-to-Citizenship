import { assertHttpsOfficialUrl, listOfficialUrls, type OfficialUrl } from "./official-urls";

export interface UrlHealthResult {
  id: string;
  url: string;
  group: OfficialUrl["group"];
  ok: boolean;
  status: number | null;
  error: string | null;
}

const cache: { at: number; results: UrlHealthResult[] } = { at: 0, results: [] };
const CACHE_MS = 6 * 60 * 60 * 1000;

export async function probeOfficialUrl(
  url: string,
  fetcher: typeof fetch = fetch,
  timeoutMs = 8000,
): Promise<{ ok: boolean; status: number | null; error: string | null }> {
  if (!assertHttpsOfficialUrl(url)) {
    return { ok: false, status: null, error: "URL is not https." };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const head = await fetcher(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    if (head.status > 0 && head.status < 400) {
      return { ok: true, status: head.status, error: null };
    }
    const get = await fetcher(url, { method: "GET", redirect: "follow", signal: controller.signal });
    return {
      ok: get.status > 0 && get.status < 400,
      status: get.status,
      error: get.status >= 400 ? `HTTP ${get.status}` : null,
    };
  } catch (error) {
    return { ok: false, status: null, error: error instanceof Error ? error.message : "Request failed" };
  } finally {
    clearTimeout(timer);
  }
}

export async function checkOfficialUrls(
  options: { live?: boolean; fetcher?: typeof fetch; force?: boolean } = {},
): Promise<{ checkedOn: string; live: boolean; results: UrlHealthResult[] }> {
  const urls = listOfficialUrls();
  if (!options.live) {
    return {
      checkedOn: new Date().toISOString(),
      live: false,
      results: urls.map((item) => ({
        ...item,
        ok: assertHttpsOfficialUrl(item.url),
        status: null,
        error: assertHttpsOfficialUrl(item.url) ? null : "URL is not https.",
      })),
    };
  }

  const now = Date.now();
  if (!options.force && now - cache.at < CACHE_MS && cache.results.length) {
    return { checkedOn: new Date(cache.at).toISOString(), live: true, results: cache.results };
  }

  const fetcher = options.fetcher ?? fetch;
  const govuk = urls.filter((row) => row.group === "govuk");
  const results: UrlHealthResult[] = [];
  const chunkSize = 6;
  for (let index = 0; index < govuk.length; index += chunkSize) {
    const chunk = govuk.slice(index, index + chunkSize);
    const probed = await Promise.all(
      chunk.map(async (item) => {
        const probe = await probeOfficialUrl(item.url, fetcher);
        return { ...item, ...probe };
      }),
    );
    results.push(...probed);
  }
  cache.at = now;
  cache.results = results;
  return { checkedOn: new Date(now).toISOString(), live: true, results };
}

import { cacheGet, cacheSet, getCacheKey } from "./cache";
import { type FetchOptions, type FetchResponse, fetchWithRetry } from "./fetch";

export async function cachedFetch(
  url: string,
  config?: FetchOptions,
  options?: { cacheExtras?: Record<string, string> },
): Promise<FetchResponse> {
  const key = getCacheKey(url, options?.cacheExtras);
  const isBinary = config?.responseType === "arraybuffer";
  const cacheFile = isBinary ? `${key}.bin` : `${key}.json`;

  const cached = await cacheGet(cacheFile);
  if (cached !== null) {
    const raw = cached.toString("utf-8");
    const data = isBinary ? cached : JSON.parse(raw);
    return { data, status: 200 };
  }

  const resp = await fetchWithRetry(url, config);
  const toStore = isBinary
    ? Buffer.from(resp.data as ArrayBuffer)
    : JSON.stringify(resp.data);
  await cacheSet(cacheFile, toStore);
  return resp;
}

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchCitationCount } from "./orcid";

describe("fetchCitationCount", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("requests Crossref without the unsupported `select` parameter", async () => {
    // Regression: Crossref's /works/{doi} endpoint returns HTTP 400 when the
    // `select` query parameter is supplied, so we must not include it.
    const calls: string[] = [];
    const fetchMock = vi.fn(async (input: unknown) => {
      calls.push(String(input));
      return new Response(
        JSON.stringify({ message: { "is-referenced-by-count": 42 } }),
        { status: 200 },
      );
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const count = await fetchCitationCount("10.1093/pcp/pcaf159");

    expect(count).toBe(42);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = calls[0];
    expect(calledUrl).toContain(
      "https://api.crossref.org/works/10.1093%2Fpcp%2Fpcaf159",
    );
    expect(calledUrl).not.toContain("select");
  });

  it("returns undefined and does not throw when Crossref responds with an error", async () => {
    globalThis.fetch = vi.fn(
      async () => new Response("bad request", { status: 400 }),
    ) as unknown as typeof fetch;

    const count = await fetchCitationCount("10.1093/pcp/pcaf159");
    expect(count).toBeUndefined();
  });

  it("returns undefined when fetch throws", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;

    const count = await fetchCitationCount("10.1093/pcp/pcaf159");
    expect(count).toBeUndefined();
  });
});

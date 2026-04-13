import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { dedupeWorksByTitle, fetchCitationCount } from "./orcid";

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

describe("dedupeWorksByTitle", () => {
  it("collapses preprint and published versions sharing a normalized title", () => {
    // Regression: ORCID groups duplicates by external-id, so a bioRxiv
    // preprint and the corresponding journal publication land in separate
    // groups and both leak into the profile. Title-based dedup should keep
    // only the published (non-preprint) version.
    const result = dedupeWorksByTitle([
      {
        title:
          "MarpolBase Expression: A Web-Based, Comprehensive Platform for Visualization and Analysis of Transcriptomes in the Liverwort Marchantia polymorpha",
        doi: "10.1093/pcp/pcac129",
        type: "journal-article",
        publicationYear: 2022,
      },
      {
        title:
          "MarpolBase Expression: A Web-based, Comprehensive Platform for Visualization and Analysis of Transcriptomes in the Liverwort Marchantia polymorpha",
        doi: "10.1101/2022.06.03.494633",
        type: "preprint",
        publicationYear: 2022,
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.doi).toBe("10.1093/pcp/pcac129");
    expect(result[0]?.type).toBe("journal-article");
  });

  it("prefers the published version regardless of input order", () => {
    const result = dedupeWorksByTitle([
      {
        title: "Example paper",
        doi: "10.1101/2024.01.01.000001",
        type: "preprint",
      },
      {
        title: "Example paper",
        doi: "10.1234/example",
        type: "journal-article",
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.doi).toBe("10.1234/example");
  });

  it("keeps the preprint when no published version exists", () => {
    const result = dedupeWorksByTitle([
      {
        title: "Solo preprint",
        doi: "10.1101/2024.02.02.000002",
        type: "preprint",
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("preprint");
  });

  it("ignores HTML tags and whitespace differences when matching titles", () => {
    const result = dedupeWorksByTitle([
      {
        title:
          "Diminished Auxin Signaling Triggers Cellular Reprogramming in <i>Marchantia polymorpha</i>",
        doi: "10.1093/pcp/pcac004",
        type: "journal-article",
      },
      {
        title:
          "Diminished Auxin Signaling Triggers Cellular Reprogramming in Marchantia polymorpha",
        doi: "10.1101/duplicate",
        type: "preprint",
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.doi).toBe("10.1093/pcp/pcac004");
  });

  it("keeps distinct works with different titles", () => {
    const result = dedupeWorksByTitle([
      { title: "Paper A", doi: "10.1/a", type: "journal-article" },
      { title: "Paper B", doi: "10.1/b", type: "journal-article" },
    ]);

    expect(result).toHaveLength(2);
  });
});

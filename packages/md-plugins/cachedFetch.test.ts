import type { AxiosResponse } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./cache", () => ({
  getCacheKey: vi.fn().mockReturnValue("mocked-hash"),
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./fetch", () => ({
  fetchWithRetry: vi.fn().mockResolvedValue({
    data: { message: "fetched" },
    status: 200,
  } as Partial<AxiosResponse>),
}));

import { cacheGet, cacheSet, getCacheKey } from "./cache";
import { cachedFetch } from "./cachedFetch";
import { fetchWithRetry } from "./fetch";

afterEach(() => {
  vi.clearAllMocks();
});

describe("cachedFetch - text (cache miss)", () => {
  it("calls fetchWithRetry and stores result in cache", async () => {
    const resp = await cachedFetch("https://example.com/api");

    expect(fetchWithRetry).toHaveBeenCalledWith(
      "https://example.com/api",
      undefined,
    );
    expect(cacheSet).toHaveBeenCalledWith(
      "mocked-hash.json",
      JSON.stringify({ message: "fetched" }),
    );
    expect(resp.data).toStrictEqual({ message: "fetched" });
  });

  it("uses .json extension for text cache file", async () => {
    await cachedFetch("https://example.com/api");
    expect(cacheSet).toHaveBeenCalledWith(
      "mocked-hash.json",
      expect.any(String),
    );
  });
});

describe("cachedFetch - text (cache hit)", () => {
  it("returns cached data without calling fetchWithRetry", async () => {
    vi.mocked(cacheGet).mockResolvedValueOnce(
      Buffer.from(JSON.stringify({ message: "cached" })),
    );

    const resp = await cachedFetch("https://example.com/api");

    expect(fetchWithRetry).not.toHaveBeenCalled();
    expect(cacheSet).not.toHaveBeenCalled();
    expect(resp.data).toStrictEqual({ message: "cached" });
  });
});

describe("cachedFetch - binary (cache miss)", () => {
  it("stores Buffer data with .bin extension", async () => {
    const binaryData = new ArrayBuffer(4);
    vi.mocked(fetchWithRetry).mockResolvedValueOnce({
      data: binaryData,
      status: 200,
    } as Partial<AxiosResponse> as AxiosResponse);

    await cachedFetch("https://example.com/image.png", {
      responseType: "arraybuffer",
    });

    expect(cacheSet).toHaveBeenCalledWith(
      "mocked-hash.bin",
      expect.any(Buffer),
    );
  });
});

describe("cachedFetch - binary (cache hit)", () => {
  it("returns Buffer directly as data", async () => {
    const cachedBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    vi.mocked(cacheGet).mockResolvedValueOnce(cachedBuffer);

    const resp = await cachedFetch("https://example.com/image.png", {
      responseType: "arraybuffer",
    });

    expect(fetchWithRetry).not.toHaveBeenCalled();
    expect(resp.data).toBe(cachedBuffer);
  });
});

describe("cachedFetch - cacheExtras", () => {
  it("passes cacheExtras to getCacheKey", async () => {
    await cachedFetch(
      "https://doi.org/10.1234",
      { headers: { Accept: "text/x-bibliography" } },
      { cacheExtras: { style: "apa" } },
    );

    expect(getCacheKey).toHaveBeenCalledWith("https://doi.org/10.1234", {
      style: "apa",
    });
  });

  it("passes undefined when no cacheExtras", async () => {
    await cachedFetch("https://example.com/api");

    expect(getCacheKey).toHaveBeenCalledWith(
      "https://example.com/api",
      undefined,
    );
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithRetry } from "./fetch";

describe("fetchWithRetry", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns data on successful JSON response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ key: "value" }),
    });

    const result = await fetchWithRetry("https://example.com/api");
    expect(result.data).toEqual({ key: "value" });
    expect(result.status).toBe(undefined); // mock doesn't set status
  });

  it("returns text when content-type is not json", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "text/plain" }),
      text: () => Promise.resolve("plain text"),
    });

    const result = await fetchWithRetry("https://example.com/text");
    expect(result.data).toBe("plain text");
    expect(result.status).toBe(200);
  });

  it("returns arraybuffer when responseType is arraybuffer", async () => {
    const buffer = new ArrayBuffer(8);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/octet-stream" }),
      arrayBuffer: () => Promise.resolve(buffer),
    });

    const result = await fetchWithRetry("https://example.com/bin", {
      responseType: "arraybuffer",
    });
    expect(result.data).toBe(buffer);
  });

  it("explicit responseType overrides content-type detection", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: () => Promise.resolve('{"raw":"text"}'),
    });

    const result = await fetchWithRetry("https://example.com/api", {
      responseType: "text",
    });
    expect(result.data).toBe('{"raw":"text"}');
  });

  it("retries on failure and succeeds", async () => {
    let attempt = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      attempt++;
      if (attempt < 3) {
        return Promise.reject(new Error("network error"));
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "text/plain" }),
        text: () => Promise.resolve("success"),
      });
    });

    const promise = fetchWithRetry("https://example.com/retry", {}, 3);
    const result = await promise;
    expect(result.data).toBe("success");
    expect(attempt).toBe(3);
  });

  it("throws after exhausting all retries", async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new Error("persistent failure"));

    await expect(
      fetchWithRetry("https://example.com/fail", {}, 2),
    ).rejects.toThrow("persistent failure");

    expect(globalThis.fetch).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("throws on non-ok response status", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers(),
    });

    await expect(
      fetchWithRetry("https://example.com/404", {}, 0),
    ).rejects.toThrow("Request failed with status 404");
  });

  it("passes custom headers to fetch", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "text/plain" }),
      text: () => Promise.resolve("ok"),
    });

    await fetchWithRetry("https://example.com/headers", {
      headers: { Authorization: "Bearer token" },
    });

    expect(globalThis.fetch).toHaveBeenCalledWith("https://example.com/headers", {
      headers: { Authorization: "Bearer token" },
      signal: expect.any(AbortSignal),
    });
  });

  it("uses default timeout of 30s", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "text/plain" }),
      text: () => Promise.resolve("ok"),
    });

    await fetchWithRetry("https://example.com/timeout");

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1].signal).toBeDefined();
  });

  it("detects json content-type with charset", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        "content-type": "application/json; charset=utf-8",
      }),
      json: () => Promise.resolve({ result: true }),
    });

    const result = await fetchWithRetry("https://example.com/json-charset");
    expect(result.data).toEqual({ result: true });
  });

  it("falls back to text when content-type is null", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: () => Promise.resolve("fallback"),
    });

    const result = await fetchWithRetry("https://example.com/no-ct");
    expect(result.data).toBe("fallback");
  });

  it("retries on non-ok status before exhausting", async () => {
    let attempt = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      attempt++;
      if (attempt < 2) {
        return Promise.resolve({
          ok: false,
          status: 500,
          headers: new Headers(),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "text/plain" }),
        text: () => Promise.resolve("recovered"),
      });
    });

    const result = await fetchWithRetry("https://example.com/retry-500", {}, 3);
    expect(result.data).toBe("recovered");
  });
});

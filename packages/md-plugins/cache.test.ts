import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { cacheGet, cacheSet, getCacheKey, getDefaultCacheDir } from "./cache";

const savedEnv = process.env.EMBED_CACHE_DIR;
let tmpDir: string;

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cache-test-"));
});

afterEach(() => {
  process.env.EMBED_CACHE_DIR = savedEnv ?? "";
});

afterAll(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("getCacheKey", () => {
  it("returns the same key for the same URL", () => {
    const key1 = getCacheKey("https://example.com/file.ts");
    const key2 = getCacheKey("https://example.com/file.ts");
    expect(key1).toBe(key2);
  });

  it("returns different keys for different URLs", () => {
    const key1 = getCacheKey("https://example.com/a.ts");
    const key2 = getCacheKey("https://example.com/b.ts");
    expect(key1).not.toBe(key2);
  });

  it("returns different keys when extras differ", () => {
    const key1 = getCacheKey("https://example.com/a", { style: "apa" });
    const key2 = getCacheKey("https://example.com/a", { style: "mla" });
    expect(key1).not.toBe(key2);
  });

  it("returns the same key regardless of extras key order", () => {
    const key1 = getCacheKey("https://example.com/a", { a: "1", b: "2" });
    const key2 = getCacheKey("https://example.com/a", { b: "2", a: "1" });
    expect(key1).toBe(key2);
  });

  it("returns a hex string", () => {
    const key = getCacheKey("https://example.com/file.ts");
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns different keys with and without extras", () => {
    const key1 = getCacheKey("https://example.com/a");
    const key2 = getCacheKey("https://example.com/a", { style: "apa" });
    expect(key1).not.toBe(key2);
  });
});

describe("cacheGet", () => {
  it("returns null for a non-existent key", async () => {
    const result = await cacheGet("nonexistent.txt", tmpDir);
    expect(result).toBeNull();
  });

  it("returns null for a non-existent directory", async () => {
    const result = await cacheGet("any.txt", "/tmp/nonexistent-dir-12345");
    expect(result).toBeNull();
  });

  it("returns Buffer for an existing key", async () => {
    await cacheSet("existing.txt", "hello", tmpDir);
    const result = await cacheGet("existing.txt", tmpDir);
    expect(result).toBeInstanceOf(Buffer);
    expect(result?.toString("utf-8")).toBe("hello");
  });
});

describe("cacheSet", () => {
  it("creates the cache directory recursively", async () => {
    const nestedDir = path.join(tmpDir, "nested", "deep");
    await cacheSet("file.txt", "data", nestedDir);
    const result = await cacheGet("file.txt", nestedDir);
    expect(result?.toString("utf-8")).toBe("data");
  });

  it("round-trips Buffer data", async () => {
    const buf = Buffer.from([0x00, 0x01, 0xff, 0xfe]);
    await cacheSet("binary.bin", buf, tmpDir);
    const result = await cacheGet("binary.bin", tmpDir);
    expect(result).toStrictEqual(buf);
  });

  it("round-trips string data", async () => {
    const str = '{"key":"value","num":42}';
    await cacheSet("text.json", str, tmpDir);
    const result = await cacheGet("text.json", tmpDir);
    expect(result?.toString("utf-8")).toBe(str);
  });

  it("overwrites existing data", async () => {
    await cacheSet("overwrite.txt", "first", tmpDir);
    await cacheSet("overwrite.txt", "second", tmpDir);
    const result = await cacheGet("overwrite.txt", tmpDir);
    expect(result?.toString("utf-8")).toBe("second");
  });
});

describe("getDefaultCacheDir", () => {
  it("uses EMBED_CACHE_DIR env var when set", () => {
    const envDir = path.join(tmpDir, "env-cache");
    process.env.EMBED_CACHE_DIR = envDir;

    expect(getDefaultCacheDir()).toBe(path.resolve(envDir));
  });

  it("falls back to .cache/embed under cwd when env var is empty", () => {
    process.env.EMBED_CACHE_DIR = "";

    const expected = path.resolve(path.join(process.cwd(), ".cache", "embed"));
    expect(getDefaultCacheDir()).toBe(expected);
  });
});

describe("default cache directory integration", () => {
  it("cacheGet/cacheSet use EMBED_CACHE_DIR when set", async () => {
    const envDir = path.join(tmpDir, "default-dir-test");
    process.env.EMBED_CACHE_DIR = envDir;

    await cacheSet("integration.txt", "works");
    const result = await cacheGet("integration.txt");
    expect(result?.toString("utf-8")).toBe("works");

    const stat = await fs.stat(path.join(envDir, "integration.txt"));
    expect(stat.isFile()).toBe(true);
  });
});

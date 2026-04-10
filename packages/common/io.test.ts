import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Dump } from ".";
import { readDump } from "./io";

function makeValidDump(): Dump {
  return {
    posts: [
      {
        meta: {
          uuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          title: "Hello",
          description: "desc",
          category: "techblog",
          tags: ["ts"],
          lang: "ja",
          created_at: "2024-01-01",
          updated_at: "2024-01-02",
        },
        rawMarkdown: "# Hello",
        headings: [{ depth: 1, value: "Hello" }],
        compiledMarkdown: "<h1>Hello</h1>",
      },
    ],
    categories: ["techblog"],
    tags: ["ts"],
  };
}

describe("readDump", () => {
  let workDir: string;

  beforeEach(() => {
    workDir = mkdtempSync(path.join(tmpdir(), "common-io-test-"));
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it("parses a valid dump file", async () => {
    const dumpPath = path.join(workDir, "dump.json");
    writeFileSync(dumpPath, JSON.stringify(makeValidDump()));

    const result = await readDump(dumpPath);

    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].meta.title).toBe("Hello");
    expect(result.categories).toEqual(["techblog"]);
    expect(result.tags).toEqual(["ts"]);
  });

  it("throws when the dump fails schema validation", async () => {
    const dumpPath = path.join(workDir, "dump.json");
    writeFileSync(
      dumpPath,
      JSON.stringify({ posts: [], categories: "not-an-array", tags: [] }),
    );

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(readDump(dumpPath)).rejects.toBe("Invalid dump file");
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("rejects when the file does not exist", async () => {
    await expect(
      readDump(path.join(workDir, "missing.json")),
    ).rejects.toBeDefined();
  });
});

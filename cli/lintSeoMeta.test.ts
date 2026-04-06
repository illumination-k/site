import type { PostMeta } from "common";
import { describe, expect, it } from "vitest";

import { extractFrontMatterLines, lintSeoMeta } from "./lintSeoMeta";

function makeMeta(overrides: Partial<PostMeta> = {}): PostMeta {
  return {
    uuid: "00000000-0000-0000-0000-000000000000",
    title: "テスト用のタイトルです。十分な長さがあります。",
    description:
      "テスト用のディスクリプションです。SEOの観点から十分な長さになるように書いています。これで五十文字を超えるはずです。",
    category: "test",
    tags: ["test"],
    lang: "ja",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    ...overrides,
  };
}

const DUMMY_PATH = "posts/test.md";
const EMPTY_LINES = new Map<string, number>();

describe("lintSeoMeta", () => {
  describe("Japanese (ja)", () => {
    it("no errors when title and description are within limits", () => {
      const meta = makeMeta({
        title: "あ".repeat(30),
        description: "あ".repeat(100),
      });
      const errors = lintSeoMeta(meta, DUMMY_PATH, EMPTY_LINES);
      expect(errors).toHaveLength(0);
    });

    it("reports error when title is too short", () => {
      const meta = makeMeta({ title: "短い" });
      const errors = lintSeoMeta(meta, DUMMY_PATH, EMPTY_LINES);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain("title is too short");
      expect(errors[0].message).toContain('lang="ja"');
      expect(errors[0].ruleId).toBe("seo-meta-length");
    });

    it("reports error when title is too long", () => {
      const meta = makeMeta({ title: "あ".repeat(61) });
      const errors = lintSeoMeta(meta, DUMMY_PATH, EMPTY_LINES);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain("title is too long");
    });

    it("reports error when description is too short", () => {
      const meta = makeMeta({ description: "短い説明" });
      const errors = lintSeoMeta(meta, DUMMY_PATH, EMPTY_LINES);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain("description is too short");
    });

    it("reports error when description is too long", () => {
      const meta = makeMeta({ description: "あ".repeat(161) });
      const errors = lintSeoMeta(meta, DUMMY_PATH, EMPTY_LINES);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain("description is too long");
    });

    it("reports errors for both title and description", () => {
      const meta = makeMeta({ title: "短", description: "短" });
      const errors = lintSeoMeta(meta, DUMMY_PATH, EMPTY_LINES);
      expect(errors).toHaveLength(2);
    });

    it("accepts boundary values (min)", () => {
      const meta = makeMeta({
        title: "あ".repeat(15),
        description: "あ".repeat(50),
      });
      const errors = lintSeoMeta(meta, DUMMY_PATH, EMPTY_LINES);
      expect(errors).toHaveLength(0);
    });

    it("accepts boundary values (max)", () => {
      const meta = makeMeta({
        title: "あ".repeat(60),
        description: "あ".repeat(160),
      });
      const errors = lintSeoMeta(meta, DUMMY_PATH, EMPTY_LINES);
      expect(errors).toHaveLength(0);
    });
  });

  describe("English (en)", () => {
    it("no errors when within limits", () => {
      const meta = makeMeta({
        lang: "en",
        title: "A sufficiently long title for SEO purposes here",
        description:
          "This is a description that is long enough to meet the minimum SEO requirements for English language content.",
      });
      const errors = lintSeoMeta(meta, DUMMY_PATH, EMPTY_LINES);
      expect(errors).toHaveLength(0);
    });

    it("reports error when title is too short", () => {
      const meta = makeMeta({
        lang: "en",
        title: "Short",
        description:
          "This is a description that is long enough to meet the minimum SEO requirements for English language content.",
      });
      const errors = lintSeoMeta(meta, DUMMY_PATH, EMPTY_LINES);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain("title is too short");
      expect(errors[0].message).toContain('lang="en"');
    });

    it("reports error when title is too long", () => {
      const meta = makeMeta({
        lang: "en",
        title: "a".repeat(71),
        description:
          "This is a description that is long enough to meet the minimum SEO requirements for English language content.",
      });
      const errors = lintSeoMeta(meta, DUMMY_PATH, EMPTY_LINES);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain("title is too long");
    });

    it("reports error when description is too short", () => {
      const meta = makeMeta({
        lang: "en",
        title: "A sufficiently long title for SEO purposes here",
        description: "Too short",
      });
      const errors = lintSeoMeta(meta, DUMMY_PATH, EMPTY_LINES);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain("description is too short");
    });
  });

  describe("line number reporting", () => {
    it("includes line numbers from frontMatterLines", () => {
      const lines = new Map([
        ["title", 3],
        ["description", 4],
      ]);
      const meta = makeMeta({ title: "短", description: "短" });
      const errors = lintSeoMeta(meta, DUMMY_PATH, lines);
      expect(errors[0].line).toBe(3);
      expect(errors[1].line).toBe(4);
    });
  });
});

describe("extractFrontMatterLines", () => {
  it("extracts field line numbers from front-matter", () => {
    const raw = `---
uuid: test-uuid
title: "Test Title"
description: "Test Description"
category: test
---

# Content`;
    const lines = extractFrontMatterLines(raw);
    expect(lines.get("uuid")).toBe(2);
    expect(lines.get("title")).toBe(3);
    expect(lines.get("description")).toBe(4);
    expect(lines.get("category")).toBe(5);
  });

  it("stops at closing front-matter delimiter", () => {
    const raw = `---
title: "Test"
---
notafield: value`;
    const lines = extractFrontMatterLines(raw);
    expect(lines.has("title")).toBe(true);
    expect(lines.has("notafield")).toBe(false);
  });

  it("returns empty map for files without front-matter", () => {
    const raw = "# Just a heading\nSome content";
    const lines = extractFrontMatterLines(raw);
    expect(lines.size).toBe(0);
  });
});

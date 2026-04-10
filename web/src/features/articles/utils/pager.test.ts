import type { PostMeta } from "common";
import { describe, expect, it } from "vitest";

import pager, { Pager, range } from "./pager";

function makeMeta(
  uuid: string,
  updated_at: string,
  created_at = updated_at,
): PostMeta {
  return {
    uuid,
    title: `post-${uuid}`,
    description: "",
    category: "techblog",
    tags: [],
    lang: "ja",
    created_at,
    updated_at,
  };
}

describe("range", () => {
  it("returns [1..stop]", () => {
    expect(range(3)).toEqual([1, 2, 3]);
  });

  it("returns empty array when stop is 0", () => {
    expect(range(0)).toEqual([]);
  });
});

describe("Pager", () => {
  const metas: PostMeta[] = [
    makeMeta("a1b2c3d4-e5f6-7890-abcd-ef1234567890", "2024-01-01"),
    makeMeta("a2b2c3d4-e5f6-7890-abcd-ef1234567890", "2024-03-01"),
    makeMeta("a3b2c3d4-e5f6-7890-abcd-ef1234567890", "2024-02-01"),
    makeMeta("a4b2c3d4-e5f6-7890-abcd-ef1234567890", "2024-05-01"),
    makeMeta("a5b2c3d4-e5f6-7890-abcd-ef1234567890", "2024-04-01"),
  ];

  describe("sortPost", () => {
    it("sorts posts by updated_at descending by default", () => {
      const sorted = Pager.sortPost([...metas]);
      expect(sorted.map((p) => p.updated_at)).toEqual([
        "2024-05-01",
        "2024-04-01",
        "2024-03-01",
        "2024-02-01",
        "2024-01-01",
      ]);
    });

    it("sorts posts by created_at when specified", () => {
      const items = [
        makeMeta(
          "a1b2c3d4-e5f6-7890-abcd-ef1234567891",
          "2024-01-01",
          "2020-01-01",
        ),
        makeMeta(
          "a1b2c3d4-e5f6-7890-abcd-ef1234567892",
          "2024-01-01",
          "2022-01-01",
        ),
      ];
      const sorted = Pager.sortPost(items, "created_at");
      expect(sorted[0].created_at).toBe("2022-01-01");
    });
  });

  describe("getTotalPage", () => {
    it("rounds up", () => {
      const p = new Pager(2);
      expect(p.getTotalPage(new Array(5).fill(0))).toBe(3);
    });

    it("returns 0 for empty", () => {
      const p = new Pager(10);
      expect(p.getTotalPage([])).toBe(0);
    });

    it("returns exact when evenly divisible", () => {
      const p = new Pager(2);
      expect(p.getTotalPage(new Array(4).fill(0))).toBe(2);
    });
  });

  describe("getPages", () => {
    it("returns range of page numbers", () => {
      const p = new Pager(2);
      expect(p.getPages(metas)).toEqual([1, 2, 3]);
    });
  });

  describe("getPageInformation", () => {
    it("returns first page with sorted slice", () => {
      const p = new Pager(2);
      const info = p.getPageInformation([...metas], 1);
      expect(info.curPage).toBe(1);
      expect(info.pages).toEqual([1, 2, 3]);
      expect(info.pagePostMetas.map((m) => m.updated_at)).toEqual([
        "2024-05-01",
        "2024-04-01",
      ]);
    });

    it("returns last page which may be partial", () => {
      const p = new Pager(2);
      const info = p.getPageInformation([...metas], 3);
      expect(info.pagePostMetas.map((m) => m.updated_at)).toEqual([
        "2024-01-01",
      ]);
    });

    it("returns empty slice for out-of-range page", () => {
      const p = new Pager(2);
      const info = p.getPageInformation([...metas], 99);
      expect(info.pagePostMetas).toEqual([]);
      expect(info.curPage).toBe(99);
    });
  });

  describe("default export", () => {
    it("uses count_per_page 10", () => {
      expect(pager.count_per_page).toBe(10);
    });
  });
});

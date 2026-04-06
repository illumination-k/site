import type { Directives } from "mdast-util-directive";
import { describe, expect, it, vi } from "vitest";
import { BookTransformer, getBookInfo } from "./book";

vi.mock("../../cache", () => ({
  getCacheKey: vi.fn().mockReturnValue("test-key"),
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../fetch", () => ({
  fetchWithRetry: vi.fn().mockResolvedValue({
    data: {
      items: [
        {
          volumeInfo: {
            title: "Test Book",
            description: "A test book description",
            authors: ["Author One", "Author Two"],
            imageLinks: { thumbnail: "https://example.com/thumb.jpg" },
          },
        },
      ],
    },
    status: 200,
  }),
}));

describe("getBookInfo", () => {
  it("fetches and parses book info from Google Books API", async () => {
    const info = await getBookInfo("0123456789");
    expect(info.title).toBe("Test Book");
    expect(info.description).toBe("A test book description");
    expect(info.authors).toEqual(["Author One", "Author Two"]);
    expect(info.thumbnail).toBe("https://example.com/thumb.jpg");
    expect(info.isbn10).toBe("0123456789");
  });
});

describe("BookTransformer", () => {
  const transformer = new BookTransformer();

  it("accepts valid isbn leafDirective with 10-digit ISBN", () => {
    const node = {
      type: "leafDirective",
      name: "isbn",
      children: [{ type: "text", value: "0123456789" }],
    } as unknown as Directives;

    expect(transformer.shouldTransform(node)).toBe(true);
    expect(transformer.isbn10).toBe("0123456789");
  });

  it("rejects non-leafDirective", () => {
    const node = {
      type: "textDirective",
      name: "isbn",
      children: [{ type: "text", value: "0123456789" }],
    } as unknown as Directives;

    expect(transformer.shouldTransform(node)).toBe(false);
  });

  it("rejects non-isbn directive", () => {
    const node = {
      type: "leafDirective",
      name: "doi",
      children: [{ type: "text", value: "0123456789" }],
    } as unknown as Directives;

    expect(transformer.shouldTransform(node)).toBe(false);
  });

  it("rejects ISBN with wrong length", () => {
    const node = {
      type: "leafDirective",
      name: "isbn",
      children: [{ type: "text", value: "12345" }],
    } as unknown as Directives;

    expect(transformer.shouldTransform(node)).toBe(false);
  });

  it("rejects ISBN with 11 digits", () => {
    const node = {
      type: "leafDirective",
      name: "isbn",
      children: [{ type: "text", value: "01234567890" }],
    } as unknown as Directives;

    expect(transformer.shouldTransform(node)).toBe(false);
  });
});

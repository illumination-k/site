import type { Directives } from "mdast-util-directive";
import type { Parent } from "unist";
import { describe, expect, it, vi } from "vitest";
import { BookTransformer, buildAmazonUrl, getBookInfo } from "./book";

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
    expect(info.isbn).toBe("0123456789");
  });

  it("handles ISBN-13", async () => {
    const info = await getBookInfo("9780123456789");
    expect(info.isbn).toBe("9780123456789");
  });
});

describe("buildAmazonUrl", () => {
  it("generates Amazon.co.jp URL for jp region", () => {
    const url = buildAmazonUrl("0123456789", "jp");
    expect(url).toBe("https://www.amazon.co.jp/dp/0123456789");
  });

  it("generates Amazon.com URL for us region", () => {
    const url = buildAmazonUrl("0123456789", "us");
    expect(url).toBe("https://www.amazon.com/dp/0123456789");
  });

  it("includes associate tag when provided", () => {
    const url = buildAmazonUrl("0123456789", "jp", "mytag-22");
    expect(url).toBe("https://www.amazon.co.jp/dp/0123456789?tag=mytag-22");
  });

  it("includes US associate tag when provided", () => {
    const url = buildAmazonUrl("0123456789", "us", "mytag-20");
    expect(url).toBe("https://www.amazon.com/dp/0123456789?tag=mytag-20");
  });

  it("omits tag param when tag is undefined", () => {
    const url = buildAmazonUrl("0123456789", "jp", undefined);
    expect(url).toBe("https://www.amazon.co.jp/dp/0123456789");
  });
});

describe("BookTransformer", () => {
  describe("shouldTransform", () => {
    const transformer = new BookTransformer();

    it("accepts valid isbn leafDirective with 10-digit ISBN", () => {
      const node = {
        type: "leafDirective",
        name: "isbn",
        children: [{ type: "text", value: "0123456789" }],
      } as unknown as Directives;

      expect(transformer.shouldTransform(node)).toBe(true);
      expect(transformer.isbn).toBe("0123456789");
    });

    it("accepts 13-digit ISBN", () => {
      const node = {
        type: "leafDirective",
        name: "isbn",
        children: [{ type: "text", value: "9780123456789" }],
      } as unknown as Directives;

      expect(transformer.shouldTransform(node)).toBe(true);
      expect(transformer.isbn).toBe("9780123456789");
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

  describe("transform", () => {
    it("generates a book card with Amazon.co.jp link by default", async () => {
      const transformer = new BookTransformer();
      const node = {
        type: "leafDirective",
        name: "isbn",
        children: [{ type: "text", value: "0123456789" }],
      } as unknown as Directives;

      const parent: Parent = {
        type: "root",
        children: [node],
      };

      await transformer.transform(node, 0, parent);

      const card = parent.children[0] as Parent;
      expect(card.data).toEqual({
        hName: "div",
        hProperties: { className: "book-card" },
      });

      // Check thumbnail link points to Amazon.co.jp (no tag by default)
      const thumbnailLink = card.children[0] as unknown as {
        type: string;
        url: string;
        data: unknown;
      };
      expect(thumbnailLink.url).toBe("https://www.amazon.co.jp/dp/0123456789");
      expect(thumbnailLink.data).toEqual({
        hProperties: { target: "_blank", rel: "noopener sponsored" },
      });
    });

    it("generates Amazon.com link with {#us} attribute", async () => {
      const transformer = new BookTransformer();
      const node = {
        type: "leafDirective",
        name: "isbn",
        attributes: { id: "us" },
        children: [{ type: "text", value: "0123456789" }],
      } as unknown as Directives;

      const parent: Parent = {
        type: "root",
        children: [node],
      };

      await transformer.transform(node, 0, parent);

      const card = parent.children[0] as Parent;
      const thumbnailLink = card.children[0] as unknown as {
        type: string;
        url: string;
      };
      expect(thumbnailLink.url).toBe("https://www.amazon.com/dp/0123456789");

      // Check button text is English
      const infoNode = card.children[1] as Parent;
      const buttonNode = infoNode.children[2] as Parent;
      expect(buttonNode.children[0]).toEqual({
        type: "text",
        value: "View on Amazon",
      });
    });

    it("includes JP associate tag in URL when injected via constructor", async () => {
      const transformer = new BookTransformer({
        associateTagJp: "test-22",
      });
      const node = {
        type: "leafDirective",
        name: "isbn",
        children: [{ type: "text", value: "0123456789" }],
      } as unknown as Directives;

      const parent: Parent = {
        type: "root",
        children: [node],
      };

      await transformer.transform(node, 0, parent);

      const card = parent.children[0] as Parent;
      const thumbnailLink = card.children[0] as unknown as {
        type: string;
        url: string;
      };
      expect(thumbnailLink.url).toBe(
        "https://www.amazon.co.jp/dp/0123456789?tag=test-22",
      );
    });

    it("includes US associate tag for {#us} region", async () => {
      const transformer = new BookTransformer({
        associateTagJp: "jp-tag-22",
        associateTagUs: "us-tag-20",
      });
      const node = {
        type: "leafDirective",
        name: "isbn",
        attributes: { id: "us" },
        children: [{ type: "text", value: "0123456789" }],
      } as unknown as Directives;

      const parent: Parent = {
        type: "root",
        children: [node],
      };

      await transformer.transform(node, 0, parent);

      const card = parent.children[0] as Parent;
      const thumbnailLink = card.children[0] as unknown as {
        type: string;
        url: string;
      };
      expect(thumbnailLink.url).toBe(
        "https://www.amazon.com/dp/0123456789?tag=us-tag-20",
      );
    });

    it("renders book title and authors from API response", async () => {
      const transformer = new BookTransformer();
      const node = {
        type: "leafDirective",
        name: "isbn",
        children: [{ type: "text", value: "0123456789" }],
      } as unknown as Directives;

      const parent: Parent = {
        type: "root",
        children: [node],
      };

      await transformer.transform(node, 0, parent);

      const card = parent.children[0] as Parent;
      const infoNode = card.children[1] as Parent;

      // Title link
      const titleLink = infoNode.children[0] as unknown as {
        children: { children: { value: string }[] }[];
      };
      expect(titleLink.children[0].children[0].value).toBe("Test Book");

      // Authors
      const authorsNode = infoNode.children[1] as Parent;
      expect(authorsNode.children[0]).toEqual({
        type: "text",
        value: "Author One, Author Two",
      });
    });
  });
});

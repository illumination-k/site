import type { Directives } from "mdast-util-directive";
import type { Parent } from "unist";
import { describe, expect, it, vi } from "vitest";
import { BookTransformer, buildAmazonUrl, getBookInfo } from "./book";

const { fetchWithRetry } = vi.hoisted(() => ({
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

vi.mock("../../cache", () => ({
  getCacheKey: vi.fn().mockReturnValue("test-key"),
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../fetch", () => ({ fetchWithRetry }));

describe("getBookInfo", () => {
  it("fetches and parses book info from Google Books API", async () => {
    const info = await getBookInfo("0123456789");
    expect(info.title).toBe("Test Book");
    expect(info.description).toBe("A test book description");
    expect(info.authors).toEqual(["Author One", "Author Two"]);
    expect(info.thumbnail).toBe("https://example.com/thumb.jpg");
    expect(info.isbn).toBe("0123456789");
  });

  it("constructs the correct Google Books API URL", async () => {
    await getBookInfo("0123456789");
    expect(fetchWithRetry).toHaveBeenCalledWith(
      "https://www.googleapis.com/books/v1/volumes?q=isbn:0123456789",
      undefined,
    );
  });

  it("handles ISBN-13", async () => {
    const info = await getBookInfo("9780123456789");
    expect(info.isbn).toBe("9780123456789");
  });

  it("throws when no items returned", async () => {
    fetchWithRetry.mockResolvedValueOnce({
      data: { items: [] },
      status: 200,
    });
    await expect(getBookInfo("0000000000")).rejects.toThrow(
      "No book found for ISBN: 0000000000",
    );
  });

  it("throws when items is undefined", async () => {
    fetchWithRetry.mockResolvedValueOnce({
      data: {},
      status: 200,
    });
    await expect(getBookInfo("0000000000")).rejects.toThrow(
      "No book found for ISBN:",
    );
  });

  it("falls back to empty values for missing optional fields", async () => {
    fetchWithRetry.mockResolvedValueOnce({
      data: {
        items: [
          {
            volumeInfo: {
              title: "Minimal Book",
            },
          },
        ],
      },
      status: 200,
    });
    const info = await getBookInfo("1111111111");
    expect(info.title).toBe("Minimal Book");
    expect(info.description).toBe("");
    expect(info.authors).toEqual([]);
    expect(info.thumbnail).toBe("");
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
  describe("constructor defaults", () => {
    it("accepts being constructed with no arguments at all", () => {
      // Guards the `options?.xxx` optional-chaining on the constructor arg:
      // if any `?.` is removed, `new BookTransformer()` would throw because
      // `undefined.associateTagJp` is a TypeError.
      expect(() => new BookTransformer()).not.toThrow();
    });

    it("falls back to the JP region when no options are provided", async () => {
      // Indirectly verifies that `defaultRegion ?? \"jp\"` is active: a
      // mutation replacing `"jp"` with `""` would break the default region.
      const transformer = new BookTransformer();
      const node = {
        type: "leafDirective",
        name: "isbn",
        children: [{ type: "text", value: "0123456789" }],
      } as unknown as Directives;
      const parent: Parent = { type: "root", children: [node] };
      await transformer.transform(node, 0, parent);

      const card = parent.children[0] as Parent;
      const thumbnailLink = card.children[0] as unknown as { url: string };
      expect(thumbnailLink.url).toBe("https://www.amazon.co.jp/dp/0123456789");

      // Button label must be the Japanese default.
      const infoNode = card.children[1] as Parent;
      const buttonNode = infoNode.children[2] as Parent;
      expect(buttonNode.children[0]).toEqual({
        type: "text",
        value: "Amazonで見る",
      });
    });
  });

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

    it("uses defaultRegion 'us' when set via constructor", async () => {
      const transformer = new BookTransformer({
        defaultRegion: "us",
        associateTagUs: "us-tag-20",
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
        "https://www.amazon.com/dp/0123456789?tag=us-tag-20",
      );

      // Button text should be English
      const infoNode = card.children[1] as Parent;
      const buttonNode = infoNode.children[2] as Parent;
      expect(buttonNode.children[0]).toEqual({
        type: "text",
        value: "View on Amazon",
      });
    });

    it("directive attribute overrides defaultRegion", async () => {
      const transformer = new BookTransformer({
        defaultRegion: "us",
        associateTagJp: "jp-tag-22",
      });
      const node = {
        type: "leafDirective",
        name: "isbn",
        attributes: { id: "jp" },
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
        "https://www.amazon.co.jp/dp/0123456789?tag=jp-tag-22",
      );

      // Button text should be Japanese despite defaultRegion=us
      const infoNode = card.children[1] as Parent;
      const buttonNode = infoNode.children[2] as Parent;
      expect(buttonNode.children[0]).toEqual({
        type: "text",
        value: "Amazonで見る",
      });
    });

    it("renders full card structure with correct hName and hProperties", async () => {
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

      // Card wrapper
      expect(card.data).toEqual({
        hName: "div",
        hProperties: { className: "book-card" },
      });
      expect(card.children).toHaveLength(2);

      // Thumbnail link
      const thumbnailLink = card.children[0] as unknown as {
        type: string;
        url: string;
        data: unknown;
        children: Parent[];
      };
      expect(thumbnailLink.type).toBe("link");
      expect(thumbnailLink.data).toEqual({
        hProperties: { target: "_blank", rel: "noopener sponsored" },
      });

      // Thumbnail image
      const thumbnailImg = thumbnailLink.children[0] as unknown as {
        type: string;
        url: string;
        alt: string;
        data: unknown;
      };
      expect(thumbnailImg.type).toBe("image");
      expect(thumbnailImg.url).toBe("https://example.com/thumb.jpg");
      expect(thumbnailImg.alt).toBe("Test Book");
      expect(thumbnailImg.data).toEqual({
        hProperties: { className: "book-card-thumbnail" },
      });

      // Info node
      const infoNode = card.children[1] as Parent;
      expect(infoNode.data).toEqual({
        hName: "div",
        hProperties: { className: "book-card-info" },
      });
      expect(infoNode.children).toHaveLength(3);

      // Title link
      const titleLink = infoNode.children[0] as unknown as {
        type: string;
        url: string;
        data: unknown;
        children: {
          type: string;
          children: { type: string; value: string }[];
        }[];
      };
      expect(titleLink.type).toBe("link");
      expect(titleLink.url).toBe("https://www.amazon.co.jp/dp/0123456789");
      expect(titleLink.data).toEqual({
        hProperties: { target: "_blank", rel: "noopener sponsored" },
      });
      expect(titleLink.children[0].type).toBe("strong");
      expect(titleLink.children[0].children[0].value).toBe("Test Book");

      // Authors node
      const authorsNode = infoNode.children[1] as Parent;
      expect(authorsNode.data).toEqual({
        hName: "p",
        hProperties: { className: "book-card-authors" },
      });
      expect(authorsNode.children[0]).toEqual({
        type: "text",
        value: "Author One, Author Two",
      });

      // Amazon button
      const buttonNode = infoNode.children[2] as Parent;
      expect(buttonNode.data).toEqual({
        hName: "a",
        hProperties: {
          className: "book-card-amazon-link",
          href: "https://www.amazon.co.jp/dp/0123456789",
          target: "_blank",
          rel: "noopener sponsored",
        },
      });
      expect(buttonNode.children[0]).toEqual({
        type: "text",
        value: "Amazonで見る",
      });
    });

    it("shows 'Unknown' when authors array is empty", async () => {
      fetchWithRetry.mockResolvedValueOnce({
        data: {
          items: [
            {
              volumeInfo: {
                title: "No Author Book",
              },
            },
          ],
        },
        status: 200,
      });

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
      const authorsNode = infoNode.children[1] as Parent;
      expect(authorsNode.children[0]).toEqual({
        type: "text",
        value: "Unknown",
      });
    });
  });
});

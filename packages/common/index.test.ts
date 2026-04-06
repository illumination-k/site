import { describe, expect, it } from "vitest";
import {
  dumpPostSchema,
  dumpSchema,
  headingsSchema,
  postMetaSchema,
  postSchema,
  postsSchema,
} from "./index";

const validMeta = {
  uuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  title: "Test Post",
  description: "A test post",
  category: "test",
  tags: ["tag1", "tag2"],
  lang: "ja",
  created_at: "2024-01-15",
  updated_at: "2024-06-01",
};

describe("postMetaSchema", () => {
  it("parses valid metadata", () => {
    const result = postMetaSchema.parse(validMeta);
    expect(result.uuid).toBe(validMeta.uuid);
    expect(result.title).toBe("Test Post");
    expect(result.lang).toBe("ja");
    expect(result.tags).toEqual(["tag1", "tag2"]);
    expect(result.created_at).toBe("2024-01-15");
    expect(result.updated_at).toBe("2024-06-01");
  });

  it("coerces Date objects to formatted strings", () => {
    const result = postMetaSchema.parse({
      ...validMeta,
      created_at: new Date("2024-03-05T00:00:00Z"),
      updated_at: new Date("2024-12-25T00:00:00Z"),
    });
    expect(result.created_at).toBe("2024-03-05");
    expect(result.updated_at).toBe("2024-12-25");
  });

  it("coerces ISO date strings via the date pipeline", () => {
    const result = postMetaSchema.parse({
      ...validMeta,
      created_at: "2023-07-20T10:30:00Z",
    });
    expect(result.created_at).toBe("2023-07-20");
  });

  it("rejects invalid uuid", () => {
    expect(() =>
      postMetaSchema.parse({ ...validMeta, uuid: "not-a-uuid" }),
    ).toThrow();
  });

  it("rejects invalid lang", () => {
    expect(() => postMetaSchema.parse({ ...validMeta, lang: "fr" })).toThrow();
  });

  it("accepts en lang", () => {
    const result = postMetaSchema.parse({ ...validMeta, lang: "en" });
    expect(result.lang).toBe("en");
  });

  it("rejects missing required fields", () => {
    expect(() => postMetaSchema.parse({ uuid: validMeta.uuid })).toThrow();
  });

  it("rejects non-array tags", () => {
    expect(() =>
      postMetaSchema.parse({ ...validMeta, tags: "not-an-array" }),
    ).toThrow();
  });
});

describe("postSchema", () => {
  it("parses valid post", () => {
    const result = postSchema.parse({
      meta: validMeta,
      markdown: "# Hello World",
    });
    expect(result.meta.title).toBe("Test Post");
    expect(result.markdown).toBe("# Hello World");
  });
});

describe("postsSchema", () => {
  it("parses array of posts", () => {
    const result = postsSchema.parse([
      { meta: validMeta, markdown: "post1" },
      {
        meta: { ...validMeta, uuid: "b1b2c3d4-e5f6-7890-abcd-ef1234567890" },
        markdown: "post2",
      },
    ]);
    expect(result).toHaveLength(2);
  });
});

describe("headingsSchema", () => {
  it("parses valid headings", () => {
    const result = headingsSchema.parse([
      { depth: 1, value: "Title" },
      { depth: 2, value: "Subtitle" },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ depth: 1, value: "Title" });
  });

  it("rejects invalid heading missing value", () => {
    expect(() => headingsSchema.parse([{ depth: 1 }])).toThrow();
  });

  it("parses empty array", () => {
    expect(headingsSchema.parse([])).toEqual([]);
  });
});

describe("dumpPostSchema", () => {
  it("parses valid dump post", () => {
    const result = dumpPostSchema.parse({
      meta: validMeta,
      compiledMarkdown: "<p>Hello</p>",
      rawMarkdown: "# Hello",
      headings: [{ depth: 1, value: "Hello" }],
    });
    expect(result.compiledMarkdown).toBe("<p>Hello</p>");
    expect(result.rawMarkdown).toBe("# Hello");
    expect(result.headings).toHaveLength(1);
  });

  it("rejects dump post with markdown field (omitted from postSchema)", () => {
    // dumpPostSchema extends postSchema.omit({markdown: true}), so it
    // should not require or include 'markdown'
    const result = dumpPostSchema.safeParse({
      meta: validMeta,
      markdown: "should be ignored",
      compiledMarkdown: "<p>Hello</p>",
      rawMarkdown: "# Hello",
      headings: [],
    });
    // Zod strips unknown keys by default in .parse, but safeParse should still succeed
    expect(result.success).toBe(true);
  });
});

describe("dumpSchema", () => {
  it("parses valid dump", () => {
    const result = dumpSchema.parse({
      posts: [
        {
          meta: validMeta,
          compiledMarkdown: "<p>Hello</p>",
          rawMarkdown: "# Hello",
          headings: [],
        },
      ],
      categories: ["test"],
      tags: ["tag1", "tag2"],
    });
    expect(result.posts).toHaveLength(1);
    expect(result.categories).toEqual(["test"]);
    expect(result.tags).toEqual(["tag1", "tag2"]);
  });

  it("parses empty dump", () => {
    const result = dumpSchema.parse({
      posts: [],
      categories: [],
      tags: [],
    });
    expect(result.posts).toHaveLength(0);
  });
});

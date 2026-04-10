import { describe, expect, it } from "vitest";

import { pageObjectSchema, propertiesSchema } from "./propertiesSchema";

const validProperties = {
  URL: { type: "url", url: "https://example.com" },
  Github: { type: "url", url: "https://github.com/x/y" },
  Name: {
    id: "title-id",
    type: "title",
    title: [{ type: "text", plain_text: "Hello" }],
  },
  AiDesc: {
    id: "desc-id",
    type: "rich_text",
    rich_text: [{ type: "text", plain_text: "description" }],
  },
  Tag: {
    id: "tag-id",
    type: "multi_select",
    multi_select: [{ name: "ts" }, { name: "go" }],
  },
  Journal: {
    id: "journal-id",
    type: "multi_select",
    multi_select: [{ name: "nature" }],
  },
};

describe("propertiesSchema", () => {
  it("parses a fully populated properties object", () => {
    const parsed = propertiesSchema.parse(validProperties);
    expect(parsed.Name.title[0].plain_text).toBe("Hello");
    expect(parsed.Tag.multi_select.map((t) => t.name)).toEqual(["ts", "go"]);
  });

  it("allows Github url to be null", () => {
    const parsed = propertiesSchema.parse({
      ...validProperties,
      Github: { type: "url", url: null },
    });
    expect(parsed.Github.url).toBeNull();
  });

  it("allows Github url to be undefined", () => {
    const parsed = propertiesSchema.parse({
      ...validProperties,
      Github: { type: "url" },
    });
    expect(parsed.Github.url).toBeUndefined();
  });

  it("requires URL.url to be a string", () => {
    expect(() =>
      propertiesSchema.parse({
        ...validProperties,
        URL: { type: "url", url: null },
      }),
    ).toThrow();
  });

  it("rejects wrong type literal", () => {
    expect(() =>
      propertiesSchema.parse({
        ...validProperties,
        Name: {
          id: "title-id",
          type: "rich_text",
          title: [],
        },
      }),
    ).toThrow();
  });

  it("accepts empty multi_select arrays", () => {
    const parsed = propertiesSchema.parse({
      ...validProperties,
      Tag: { id: "t", type: "multi_select", multi_select: [] },
    });
    expect(parsed.Tag.multi_select).toEqual([]);
  });
});

describe("pageObjectSchema", () => {
  it("parses a valid page object", () => {
    const parsed = pageObjectSchema.parse({
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      created_time: "2024-01-01T00:00:00.000Z",
      last_edited_time: "2024-02-01T00:00:00.000Z",
      properties: validProperties,
    });
    expect(parsed.id).toBe("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
  });

  it("rejects non-uuid id", () => {
    expect(() =>
      pageObjectSchema.parse({
        id: "not-a-uuid",
        created_time: "t",
        last_edited_time: "t",
        properties: validProperties,
      }),
    ).toThrow();
  });
});

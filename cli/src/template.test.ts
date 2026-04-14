import type { PostMeta } from "common";
import YAML from "yaml";
import { describe, expect, it } from "vitest";

import { template, templateFromPostMeta } from "./template";

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseFrontMatter(input: string): Record<string, unknown> {
  const match = input.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    throw new Error(`No front-matter delimiter found in: ${input}`);
  }
  return YAML.parse(match[1]) as Record<string, unknown>;
}

describe("template", () => {
  it("wraps the YAML in front-matter delimiters", () => {
    const result = template();
    expect(result.startsWith("---\n")).toBe(true);
    expect(result).toMatch(/\n---\n$/);
  });

  it("produces YAML with all required PostMeta fields", () => {
    const meta = parseFrontMatter(template());
    expect(meta).toMatchObject({
      title: "",
      description: "",
      category: "",
      lang: "ja",
      tags: [],
    });
    expect(meta).toHaveProperty("uuid");
    expect(meta).toHaveProperty("created_at");
    expect(meta).toHaveProperty("updated_at");
  });

  it("generates a valid v4 uuid", () => {
    const meta = parseFrontMatter(template());
    expect(meta.uuid).toMatch(UUID_V4_REGEX);
  });

  it("generates a fresh uuid on every call", () => {
    const a = parseFrontMatter(template());
    const b = parseFrontMatter(template());
    expect(a.uuid).not.toBe(b.uuid);
  });

  it("uses today's date for created_at and updated_at", () => {
    const meta = parseFrontMatter(template());
    const today = new Date();
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    expect(meta.created_at).toBe(expected);
    expect(meta.updated_at).toBe(expected);
  });

  it("uses the provided tags array", () => {
    const meta = parseFrontMatter(template(["typescript", "react"]));
    expect(meta.tags).toEqual(["typescript", "react"]);
  });

  it("falls back to an empty tags array when none are provided", () => {
    const meta = parseFrontMatter(template());
    expect(meta.tags).toEqual([]);
  });

  it("falls back to an empty tags array when an empty array is passed (truthy fallback semantics)", () => {
    // Note: template(undefined) and template([]) currently differ — empty
    // array is truthy so it overrides the default. This pins that behavior.
    const meta = parseFrontMatter(template([]));
    expect(meta.tags).toEqual([]);
  });
});

describe("templateFromPostMeta", () => {
  function makePostMeta(): PostMeta {
    return {
      uuid: "abcdef01-2345-4678-89ab-cdef01234567",
      title: "Existing Title",
      description: "Existing Description",
      category: "techblog",
      lang: "en",
      tags: ["existing", "tag"],
      created_at: "2024-05-01",
      updated_at: "2024-05-15",
    };
  }

  it("starts with the front-matter delimiter", () => {
    const result = templateFromPostMeta(makePostMeta());
    expect(result.startsWith("---\n")).toBe(true);
  });

  it("emits every field from the input PostMeta", () => {
    const input = makePostMeta();
    const result = templateFromPostMeta(input);
    // Strip the leading ---\n so the rest is plain YAML
    const yamlBody = result.replace(/^---\n/, "").trimEnd();
    const parsed = YAML.parse(yamlBody) as PostMeta;

    expect(parsed).toEqual(input);
  });

  it("preserves a custom uuid (does not overwrite it)", () => {
    const input = makePostMeta();
    const result = templateFromPostMeta(input);
    expect(result).toContain("uuid: abcdef01-2345-4678-89ab-cdef01234567");
  });

  it("preserves the existing tags list", () => {
    const result = templateFromPostMeta(makePostMeta());
    expect(result).toContain("- existing");
    expect(result).toContain("- tag");
  });
});

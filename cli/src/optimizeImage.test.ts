import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseTitleToSize, replacePathAsPublicRoot } from "./optimizeImage";

describe("parseTitleToSize", () => {
  it("returns undefined when the title is null", () => {
    expect(parseTitleToSize(null)).toBeUndefined();
  });

  it("returns undefined when the title is undefined", () => {
    expect(parseTitleToSize(undefined)).toBeUndefined();
  });

  it("returns undefined when the title is an empty string", () => {
    expect(parseTitleToSize("")).toBeUndefined();
  });

  it("parses a width-only title", () => {
    expect(parseTitleToSize("width=300")).toEqual({ width: 300 });
  });

  it("parses a height-only title", () => {
    expect(parseTitleToSize("height=200")).toEqual({ height: 200 });
  });

  it("parses both width and height when present", () => {
    expect(parseTitleToSize("width=300,height=200")).toEqual({
      width: 300,
      height: 200,
    });
  });

  it("accepts the short aliases w and h", () => {
    expect(parseTitleToSize("w=120,h=80")).toEqual({ width: 120, height: 80 });
  });

  it("ignores unknown keys but still extracts known ones", () => {
    expect(parseTitleToSize("alt=foo,width=50")).toEqual({ width: 50 });
  });

  it("returns undefined when a token is malformed (no =)", () => {
    expect(parseTitleToSize("width=100,broken")).toBeUndefined();
  });

  it("returns undefined when a token has too many = signs", () => {
    expect(parseTitleToSize("width=100=200")).toBeUndefined();
  });
});

describe("replacePathAsPublicRoot", () => {
  it("strips everything before the public segment and prefixes with /", () => {
    const input = path.resolve("/home/user/site/web/public/techblog/foo.avif");
    expect(replacePathAsPublicRoot(input)).toBe("/techblog/foo.avif");
  });

  it("preserves nested directories under public", () => {
    const input = path.resolve(
      "/home/user/site/web/public/techblog/sub/dir/bar.png",
    );
    expect(replacePathAsPublicRoot(input)).toBe("/techblog/sub/dir/bar.png");
  });

  it("throws when the path is not inside a public directory", () => {
    expect(() =>
      replacePathAsPublicRoot(path.resolve("/tmp/notpublic/foo.avif")),
    ).toThrow(/is not in public dir/);
  });
});

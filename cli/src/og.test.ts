import { describe, expect, it } from "vitest";

import { buildOgSvgMarkup } from "./og";

type Node = {
  type: string;
  props: {
    style?: Record<string, unknown>;
    children?: unknown;
  };
};

function isNode(value: unknown): value is Node {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "props" in value
  );
}

function findFirst(node: Node, predicate: (n: Node) => boolean): Node | null {
  if (predicate(node)) return node;
  const children = node.props.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      if (isNode(child)) {
        const found = findFirst(child, predicate);
        if (found) return found;
      }
    }
  } else if (isNode(children)) {
    return findFirst(children, predicate);
  }
  return null;
}

function findAll(node: Node, predicate: (n: Node) => boolean): Node[] {
  const matches: Node[] = [];
  const walk = (current: Node) => {
    if (predicate(current)) matches.push(current);
    const children = current.props.children;
    if (Array.isArray(children)) {
      for (const child of children) {
        if (isNode(child)) walk(child);
      }
    } else if (isNode(children)) {
      walk(children);
    }
  };
  walk(node);
  return matches;
}

describe("buildOgSvgMarkup", () => {
  const baseInput = {
    title: "Hello World",
    category: "techblog",
    tags: ["typescript", "react"],
    siteName: "illumination-k.dev",
  };

  it("renders the title verbatim when it is short", () => {
    const markup = buildOgSvgMarkup(baseInput) as Node;
    const heading = findFirst(markup, (n) => n.type === "h1");
    expect(heading).not.toBeNull();
    expect(heading?.props.children).toBe("Hello World");
  });

  it("uses a larger font size for short titles", () => {
    const markup = buildOgSvgMarkup(baseInput) as Node;
    const heading = findFirst(markup, (n) => n.type === "h1");
    expect(heading?.props.style?.fontSize).toBe("52px");
  });

  it("uses a smaller font size for titles longer than 30 chars", () => {
    const markup = buildOgSvgMarkup({
      ...baseInput,
      title: "a".repeat(40),
    }) as Node;
    const heading = findFirst(markup, (n) => n.type === "h1");
    expect(heading?.props.style?.fontSize).toBe("42px");
  });

  it("truncates titles longer than 60 characters with an ellipsis", () => {
    const longTitle = "a".repeat(80);
    const markup = buildOgSvgMarkup({ ...baseInput, title: longTitle }) as Node;
    const heading = findFirst(markup, (n) => n.type === "h1");
    const rendered = heading?.props.children as string;
    expect(rendered).toHaveLength(60);
    expect(rendered.endsWith("...")).toBe(true);
    expect(rendered.startsWith("a".repeat(57))).toBe(true);
  });

  it("does not truncate a title that is exactly 60 characters", () => {
    const title = "a".repeat(60);
    const markup = buildOgSvgMarkup({ ...baseInput, title }) as Node;
    const heading = findFirst(markup, (n) => n.type === "h1");
    expect(heading?.props.children).toBe(title);
  });

  it("renders the category badge", () => {
    const markup = buildOgSvgMarkup(baseInput) as Node;
    const badge = findFirst(
      markup,
      (n) => n.type === "span" && n.props.children === "techblog",
    );
    expect(badge).not.toBeNull();
  });

  it("renders the site name", () => {
    const markup = buildOgSvgMarkup(baseInput) as Node;
    const siteName = findFirst(
      markup,
      (n) => n.type === "span" && n.props.children === "illumination-k.dev",
    );
    expect(siteName).not.toBeNull();
  });

  it("renders all tags prefixed with #", () => {
    const markup = buildOgSvgMarkup(baseInput) as Node;
    const tagSpans = findAll(
      markup,
      (n) =>
        n.type === "span" &&
        typeof n.props.children === "string" &&
        n.props.children.startsWith("#"),
    );
    const tagTexts = tagSpans.map((s) => s.props.children);
    expect(tagTexts).toEqual(["#typescript", "#react"]);
  });

  it("renders at most 4 tags", () => {
    const markup = buildOgSvgMarkup({
      ...baseInput,
      tags: ["a", "b", "c", "d", "e", "f"],
    }) as Node;
    const tagSpans = findAll(
      markup,
      (n) =>
        n.type === "span" &&
        typeof n.props.children === "string" &&
        n.props.children.startsWith("#"),
    );
    expect(tagSpans).toHaveLength(4);
    expect(tagSpans.map((s) => s.props.children)).toEqual([
      "#a",
      "#b",
      "#c",
      "#d",
    ]);
  });

  it("uses the correct OG image dimensions on the root container", () => {
    const markup = buildOgSvgMarkup(baseInput) as Node;
    expect(markup.type).toBe("div");
    expect(markup.props.style?.width).toBe("1200px");
    expect(markup.props.style?.height).toBe("630px");
  });
});

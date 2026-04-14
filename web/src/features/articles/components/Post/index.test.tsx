import { render, screen } from "@testing-library/react";
import type { Headings, PostMeta } from "common";
import { describe, expect, it, vi } from "vitest";

import jaDict from "@/lib/i18n/dictionaries/ja";

// MdxView calls runSync on a compiled MDX program — replace it with a stub
// that just renders a <div data-testid="mdx-view"/> so we can exercise the
// rest of <Post>. Adsense and ArticleJsonLd are stubbed for the same reason.
vi.mock("./MdxView", () => ({
  default: () => <div data-testid="mdx-view">mdx-content</div>,
}));
vi.mock("@/components/Adsense", () => ({
  default: () => <div data-testid="adsense" />,
}));
vi.mock("@/components/ArticleJsonLd", () => ({
  default: () => <script data-testid="article-json-ld" />,
}));

import Post from "./index";

const baseMeta: PostMeta = {
  uuid: "00000000-0000-4000-8000-000000000000",
  title: "Hello, World",
  description: "An introductory post",
  category: "techblog",
  tags: [],
  lang: "ja",
  created_at: "2024-01-01",
  updated_at: "2024-02-01",
};

const headings: Headings = [{ depth: 1, value: "Hello" }];

describe("Post", () => {
  it("renders the title, MdxView, and the JSON-LD block", () => {
    render(
      <Post
        meta={baseMeta}
        headings={headings}
        prefix="ja/techblog"
        relatedPostMeta={[]}
        compiledMarkdown=""
        dict={jaDict}
      />,
    );

    expect(screen.getByText("Hello, World")).toBeTruthy();
    expect(screen.getByTestId("mdx-view")).toBeTruthy();
    expect(screen.getByTestId("article-json-ld")).toBeTruthy();
  });

  it("renders the readNext heading from the dictionary", () => {
    render(
      <Post
        meta={baseMeta}
        headings={headings}
        prefix="ja/techblog"
        relatedPostMeta={[]}
        compiledMarkdown=""
        dict={jaDict}
      />,
    );
    expect(screen.getByText(jaDict.post.readNext)).toBeTruthy();
  });

  it("renders one related-post card per related meta", () => {
    const related: PostMeta[] = [
      {
        ...baseMeta,
        uuid: "11111111-0000-4000-8000-000000000001",
        title: "rel1",
      },
      {
        ...baseMeta,
        uuid: "11111111-0000-4000-8000-000000000002",
        title: "rel2",
      },
      {
        ...baseMeta,
        uuid: "11111111-0000-4000-8000-000000000003",
        title: "rel3",
      },
    ];
    render(
      <Post
        meta={baseMeta}
        headings={headings}
        prefix="ja/techblog"
        relatedPostMeta={related}
        compiledMarkdown=""
        dict={jaDict}
      />,
    );

    expect(screen.getByText("rel1")).toBeTruthy();
    expect(screen.getByText("rel2")).toBeTruthy();
    expect(screen.getByText("rel3")).toBeTruthy();
  });

  it("emits the data-pagefind-body attribute on the article wrapper", () => {
    const { container } = render(
      <Post
        meta={baseMeta}
        headings={headings}
        prefix="ja/techblog"
        relatedPostMeta={[]}
        compiledMarkdown=""
        dict={jaDict}
      />,
    );

    const wrapper = container.querySelector("article[data-pagefind-body]");
    expect(wrapper).toBeTruthy();
  });

  it("renders archive warning via Header when meta tags include 'archive'", () => {
    render(
      <Post
        meta={{ ...baseMeta, tags: ["archive"] }}
        headings={headings}
        prefix="ja/techblog"
        relatedPostMeta={[]}
        compiledMarkdown=""
        dict={jaDict}
      />,
    );
    expect(screen.getByText(jaDict.post.archiveWarning)).toBeTruthy();
  });
});

import { render, screen } from "@testing-library/react";
import type { PostMeta } from "common";
import type { Route } from "next";
import { describe, expect, it } from "vitest";

import Pager from "./Pager";

function meta(uuid: string, title: string): PostMeta {
  return {
    uuid,
    title,
    description: "",
    category: "techblog",
    tags: [],
    lang: "ja",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  };
}

const linkGen = (page: number) => `/ja/techblog/${page}` as Route;

function uuid(n: number): string {
  return `${n.toString(16).padStart(8, "0")}-0000-4000-8000-000000000000`;
}

describe("Pager", () => {
  it("renders one PostCard per page post", () => {
    const posts = [meta(uuid(1), "first"), meta(uuid(2), "second")];
    render(
      <Pager
        prefix="ja/techblog"
        pageInformation={{
          pagePostMetas: posts,
          curPage: 1,
          pages: [1],
        }}
        pageLinkGenerator={linkGen}
      />,
    );
    expect(screen.getByText("first")).toBeTruthy();
    expect(screen.getByText("second")).toBeTruthy();
  });

  it("renders all page numbers when there are 10 or fewer pages", () => {
    render(
      <Pager
        prefix="ja/techblog"
        pageInformation={{
          pagePostMetas: [],
          curPage: 3,
          pages: [1, 2, 3, 4, 5],
        }}
        pageLinkGenerator={linkGen}
      />,
    );
    for (const n of ["1", "2", "3", "4", "5"]) {
      expect(screen.getByText(n)).toBeTruthy();
    }
    expect(screen.queryByText("...")).toBeNull();
  });

  it("renders an ellipsis when there are more than 10 pages and curPage is near the start", () => {
    const pages = Array.from({ length: 12 }, (_, i) => i + 1);
    render(
      <Pager
        prefix="ja/techblog"
        pageInformation={{
          pagePostMetas: [],
          curPage: 1,
          pages,
        }}
        pageLinkGenerator={linkGen}
      />,
    );
    expect(screen.getByText("...")).toBeTruthy();
    // Last page should be visible
    expect(screen.getByText("12")).toBeTruthy();
  });

  it("renders two ellipses when curPage is in the middle", () => {
    const pages = Array.from({ length: 20 }, (_, i) => i + 1);
    render(
      <Pager
        prefix="ja/techblog"
        pageInformation={{
          pagePostMetas: [],
          curPage: 10,
          pages,
        }}
        pageLinkGenerator={linkGen}
      />,
    );
    expect(screen.getAllByText("...")).toHaveLength(2);
    expect(screen.getByText("9")).toBeTruthy();
    expect(screen.getByText("10")).toBeTruthy();
    expect(screen.getByText("11")).toBeTruthy();
  });

  it("renders an ellipsis at the start when curPage is near the end", () => {
    const pages = Array.from({ length: 12 }, (_, i) => i + 1);
    render(
      <Pager
        prefix="ja/techblog"
        pageInformation={{
          pagePostMetas: [],
          curPage: 12,
          pages,
        }}
        pageLinkGenerator={linkGen}
      />,
    );
    expect(screen.getAllByText("...")).toHaveLength(1);
    expect(screen.getByText("9")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
  });

  it("renders the previous-page chevron only when curPage > 1", () => {
    // curPage === 1: chevron should NOT be wrapped in a link
    const { container, unmount } = render(
      <Pager
        prefix="ja/techblog"
        pageInformation={{
          pagePostMetas: [],
          curPage: 1,
          pages: [1, 2, 3],
        }}
        pageLinkGenerator={linkGen}
      />,
    );
    // Page-1 link itself isn't wrapping the prev chevron
    const prevLinks = container.querySelectorAll('a[href="/ja/techblog/0"]');
    expect(prevLinks.length).toBe(0);

    unmount();

    render(
      <Pager
        prefix="ja/techblog"
        pageInformation={{
          pagePostMetas: [],
          curPage: 2,
          pages: [1, 2, 3],
        }}
        pageLinkGenerator={linkGen}
      />,
    );
    const nextPrevLinks = document.querySelectorAll('a[href="/ja/techblog/1"]');
    // Both the "1" page item and the prev chevron point to /ja/techblog/1
    expect(nextPrevLinks.length).toBeGreaterThanOrEqual(2);
  });

  it("renders the next-page chevron only when curPage < pageCount", () => {
    render(
      <Pager
        prefix="ja/techblog"
        pageInformation={{
          pagePostMetas: [],
          curPage: 3,
          pages: [1, 2, 3],
        }}
        pageLinkGenerator={linkGen}
      />,
    );
    // No link should point past the last page
    const links = document.querySelectorAll('a[href="/ja/techblog/4"]');
    expect(links.length).toBe(0);
  });
});

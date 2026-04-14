import { render, screen } from "@testing-library/react";
import type { PostMeta } from "common";
import { describe, expect, it } from "vitest";

import PostCard from "./PostCard";

const baseMeta: PostMeta = {
  uuid: "00000000-0000-4000-8000-000000000000",
  title: "Hello, World",
  description: "An introductory post",
  category: "techblog",
  tags: ["rust", "go"],
  lang: "ja",
  created_at: "2024-01-01",
  updated_at: "2024-02-01",
};

describe("PostCard", () => {
  it("links the title to the post URL using prefix and uuid", () => {
    render(<PostCard prefix="ja/techblog" meta={baseMeta} />);
    const titleLink = screen.getByText("Hello, World").closest("a");
    expect(titleLink?.getAttribute("href")).toBe(
      `/ja/techblog/post/${baseMeta.uuid}`,
    );
  });

  it("renders the category, description, and updated_at", () => {
    render(<PostCard prefix="ja/techblog" meta={baseMeta} />);
    expect(screen.getByText("techblog")).toBeTruthy();
    expect(screen.getByText("An introductory post")).toBeTruthy();
    expect(screen.getByText("2024-02-01")).toBeTruthy();
  });

  it("renders one Tag link per tag", () => {
    render(<PostCard prefix="ja/techblog" meta={baseMeta} />);
    const rustLink = screen.getByText("rust").closest("a");
    const goLink = screen.getByText("go").closest("a");
    expect(rustLink?.getAttribute("href")).toBe("/ja/techblog/tag/rust/1");
    expect(goLink?.getAttribute("href")).toBe("/ja/techblog/tag/go/1");
  });

  it("renders no tag list when there are no tags", () => {
    render(<PostCard prefix="ja/techblog" meta={{ ...baseMeta, tags: [] }} />);
    // Title link still exists, but no tag links should be rendered
    const links = document.querySelectorAll("a");
    expect(links.length).toBe(1);
  });
});

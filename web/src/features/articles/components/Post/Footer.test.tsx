import { render, screen } from "@testing-library/react";
import type { PostMeta } from "common";
import { describe, expect, it } from "vitest";

import jaDict from "@/lib/i18n/dictionaries/ja";

import Footer from "./Footer";

const baseMeta: PostMeta = {
  uuid: "00000000-0000-4000-8000-000000000000",
  title: "title",
  description: "desc",
  category: "techblog",
  tags: [],
  lang: "ja",
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
};

describe("Post/Footer", () => {
  it("renders the github issue prompt from the dictionary", () => {
    render(<Footer meta={baseMeta} dict={jaDict} />);
    expect(screen.getByText(jaDict.post.githubIssuePrompt)).toBeTruthy();
  });

  it("renders the comment and problem links pointing to the github issues form", () => {
    render(<Footer meta={baseMeta} dict={jaDict} />);

    const commentLink = screen.getByText("Comment").closest("a");
    expect(commentLink).toBeTruthy();
    expect(commentLink?.getAttribute("href")).toContain(
      "github.com/illumination-k/site/issues/new",
    );
    expect(commentLink?.getAttribute("href")).toContain("labels=comment");

    const problemLink = screen.getByText("Problem").closest("a");
    expect(problemLink).toBeTruthy();
    expect(problemLink?.getAttribute("href")).toContain("labels=bug");
  });
});

import { render, screen } from "@testing-library/react";
import type { PostMeta } from "common";
import { describe, expect, it } from "vitest";

import jaDict from "@/lib/i18n/dictionaries/ja";

import Header from "./Header";

function meta(tags: string[] = []): PostMeta {
  return {
    uuid: "00000000-0000-4000-8000-000000000000",
    title: "title",
    description: "desc",
    category: "techblog",
    tags,
    lang: "ja",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  };
}

describe("Post/Header", () => {
  it("renders nothing when there are no special tags", () => {
    const { container } = render(<Header meta={meta()} dict={jaDict} />);
    expect(container.textContent).toBe("");
  });

  it("renders the archive warning when the post is tagged 'archive'", () => {
    render(<Header meta={meta(["archive"])} dict={jaDict} />);
    expect(screen.getByText(jaDict.post.archiveWarning)).toBeTruthy();
    expect(screen.queryByText(jaDict.post.draftWarning)).toBeNull();
    expect(screen.queryByText(jaDict.post.aiGeneratedWarning)).toBeNull();
  });

  it("renders the draft warning when the post is tagged 'draft'", () => {
    render(<Header meta={meta(["draft"])} dict={jaDict} />);
    expect(screen.getByText(jaDict.post.draftWarning)).toBeTruthy();
    expect(screen.queryByText(jaDict.post.archiveWarning)).toBeNull();
  });

  it("renders the ai-generated warning when tagged 'ai-generated'", () => {
    render(<Header meta={meta(["ai-generated"])} dict={jaDict} />);
    expect(screen.getByText(jaDict.post.aiGeneratedWarning)).toBeTruthy();
  });

  it("renders multiple warnings when multiple flag tags are present", () => {
    render(
      <Header
        meta={meta(["archive", "draft", "ai-generated"])}
        dict={jaDict}
      />,
    );
    expect(screen.getByText(jaDict.post.archiveWarning)).toBeTruthy();
    expect(screen.getByText(jaDict.post.draftWarning)).toBeTruthy();
    expect(screen.getByText(jaDict.post.aiGeneratedWarning)).toBeTruthy();
  });
});

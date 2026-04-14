import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Tag from "./Tag";

describe("Tag", () => {
  it("renders the tag text", () => {
    render(<Tag tag="rust" prefix="ja/techblog" />);
    expect(screen.getByText("rust")).toBeTruthy();
  });

  it("links to the locale-prefixed tag page-1 route", () => {
    render(<Tag tag="rust" prefix="ja/techblog" />);
    const link = screen.getByText("rust").closest("a");
    expect(link?.getAttribute("href")).toBe("/ja/techblog/tag/rust/1");
  });

  it("uses the prefix verbatim — does not normalize the locale", () => {
    render(<Tag tag="go" prefix="en/paperstream" />);
    const link = screen.getByText("go").closest("a");
    expect(link?.getAttribute("href")).toBe("/en/paperstream/tag/go/1");
  });
});

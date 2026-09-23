import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { OssProject } from "../projects";
import { ProjectCard } from "./ProjectCard";

const project: OssProject = {
  name: "example",
  repo: "illumination-k/example",
  languages: ["Rust", "Go"],
  tags: ["cli", "mcp"],
  description: {
    ja: "日本語の説明",
    en: "English description",
    es: "Descripción",
  },
};

describe("ProjectCard", () => {
  it("renders the description for the given locale", () => {
    render(<ProjectCard project={project} locale="en" homepageLabel="Docs" />);
    expect(screen.getByText("English description")).toBeTruthy();
    expect(screen.queryByText("日本語の説明")).toBeNull();
  });

  it("links to the GitHub repository", () => {
    render(<ProjectCard project={project} locale="ja" homepageLabel="Docs" />);
    const link = screen.getByRole("link", { name: "example" });
    expect(link.getAttribute("href")).toBe(
      "https://github.com/illumination-k/example",
    );
    expect(screen.getByText("Rust / Go")).toBeTruthy();
    expect(screen.getByText("cli")).toBeTruthy();
  });

  it("renders homepage and package links only when present", () => {
    const { rerender } = render(
      <ProjectCard project={project} locale="ja" homepageLabel="Docs" />,
    );
    expect(screen.queryByText("Docs")).toBeNull();

    rerender(
      <ProjectCard
        project={{
          ...project,
          homepage: "https://example.com",
          packages: [{ label: "npm", url: "https://www.npmjs.com/package/x" }],
        }}
        locale="ja"
        homepageLabel="Docs"
      />,
    );
    expect(screen.getByText("Docs").getAttribute("href")).toBe(
      "https://example.com",
    );
    expect(screen.getByText("npm").getAttribute("href")).toBe(
      "https://www.npmjs.com/package/x",
    );
  });
});

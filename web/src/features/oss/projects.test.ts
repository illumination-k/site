import { describe, expect, it } from "vitest";

import { locales } from "@/lib/i18n";

import { OSS_PROJECTS } from "./projects";

describe("OSS_PROJECTS", () => {
  it("has unique repositories", () => {
    const repos = OSS_PROJECTS.map((p) => p.repo);
    expect(new Set(repos).size).toBe(repos.length);
  });

  it("has a non-empty description for every locale", () => {
    for (const project of OSS_PROJECTS) {
      for (const locale of locales) {
        expect(project.description[locale].trim(), project.name).not.toBe("");
      }
    }
  });

  it("uses owner/repo form", () => {
    for (const project of OSS_PROJECTS) {
      expect(project.repo).toMatch(/^[\w.-]+\/[\w.-]+$/);
    }
  });
});

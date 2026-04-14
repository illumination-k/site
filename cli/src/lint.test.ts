import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { lintPosts } from "./lint";

// Long enough title/description to satisfy the SEO linter for lang=ja.
function validFrontMatter(uuid: string, body = "本文サンプルです。\n"): string {
  return `---
uuid: ${uuid}
title: テスト用のタイトルです。十分な長さがあります。
description: テスト用のディスクリプションです。SEOの観点から十分な長さになるように書いています。これで五十文字を超えるはずです。
lang: ja
category: test
tags:
  - tag1
created_at: "2024-01-01T00:00:00+00:00"
updated_at: "2024-01-02T00:00:00+00:00"
---

${body}`;
}

describe("lintPosts", () => {
  let workDir: string;

  beforeEach(async () => {
    workDir = await mkdtemp(path.join(tmpdir(), "cli-lint-test-"));
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  it("returns an empty array when no markdown files exist", async () => {
    const errors = await lintPosts(workDir);
    expect(errors).toEqual([]);
  });

  it("returns no errors when every post is valid", async () => {
    await writeFile(
      path.join(workDir, "ok-1.md"),
      validFrontMatter("11111111-1111-4111-8111-111111111111"),
    );
    await writeFile(
      path.join(workDir, "ok-2.md"),
      validFrontMatter("22222222-2222-4222-8222-222222222222"),
    );

    const errors = await lintPosts(workDir);
    expect(errors).toEqual([]);
  });

  it("walks markdown files in nested directories", async () => {
    const sub = path.join(workDir, "ja", "development");
    await mkdir(sub, { recursive: true });
    await writeFile(
      path.join(sub, "nested.md"),
      validFrontMatter("33333333-3333-4333-8333-333333333333"),
    );

    const errors = await lintPosts(workDir);
    expect(errors).toEqual([]);
  });

  it("reports SEO errors for posts with overly short titles", async () => {
    const content = `---
uuid: 44444444-4444-4444-8444-444444444444
title: 短い
description: テスト用のディスクリプションです。SEOの観点から十分な長さになるように書いています。これで五十文字を超えるはずです。
lang: ja
category: test
tags:
  - tag1
created_at: "2024-01-01T00:00:00+00:00"
updated_at: "2024-01-02T00:00:00+00:00"
---

本文。
`;
    await writeFile(path.join(workDir, "bad.md"), content);

    const errors = await lintPosts(workDir);
    expect(errors.length).toBeGreaterThan(0);
    const titleError = errors.find((e) =>
      e.message.includes("title is too short"),
    );
    expect(titleError).toBeDefined();
    expect(titleError?.ruleId).toBe("seo-meta-length");
    expect(titleError?.file).toContain("bad.md");
  });

  it("captures lint failures as a LintError instead of throwing", async () => {
    // Front-matter is unparseable as YAML → fm() will throw → Promise.allSettled
    // catches it and lintPosts converts it into a "Failed to lint" error.
    await writeFile(
      path.join(workDir, "broken.md"),
      "---\n: invalid : yaml :\n  unmatched indent\n---\nbody\n",
    );

    const errors = await lintPosts(workDir);
    const failure = errors.find((e) => e.message.startsWith("Failed to lint"));
    expect(failure).toBeDefined();
    expect(failure?.file).toContain("broken.md");
  });

  it("aggregates errors across multiple files", async () => {
    // One valid post, one with an SEO error.
    await writeFile(
      path.join(workDir, "good.md"),
      validFrontMatter("55555555-5555-4555-8555-555555555555"),
    );
    await writeFile(
      path.join(workDir, "short-title.md"),
      `---
uuid: 66666666-6666-4666-8666-666666666666
title: 短い
description: テスト用のディスクリプションです。SEOの観点から十分な長さになるように書いています。これで五十文字を超えるはずです。
lang: ja
category: test
tags:
  - tag1
created_at: "2024-01-01T00:00:00+00:00"
updated_at: "2024-01-02T00:00:00+00:00"
---

本文。
`,
    );

    const errors = await lintPosts(workDir);
    // All reported errors should originate from the bad file.
    expect(errors.length).toBeGreaterThan(0);
    for (const err of errors) {
      expect(err.file).toContain("short-title.md");
    }
  });
});

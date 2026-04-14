import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { generateRedirect } from "./migration";

const VALID_FRONT_MATTER = (uuid: string, title = "Title") =>
  `---
uuid: ${uuid}
title: ${title}
description: A description
lang: ja
category: test
tags:
  - tag1
created_at: "2024-01-01T00:00:00+00:00"
updated_at: "2024-01-02T00:00:00+00:00"
---

Body content here.
`;

describe("generateRedirect", () => {
  let workDir: string;

  beforeEach(async () => {
    workDir = await mkdtemp(path.join(tmpdir(), "cli-migration-test-"));
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  it("returns an empty array when no markdown files exist", async () => {
    const redirects = await generateRedirect(workDir);
    expect(redirects).toEqual([]);
  });

  it("creates a redirect for each markdown file using uuid as the destination", async () => {
    await writeFile(
      path.join(workDir, "first-post.md"),
      VALID_FRONT_MATTER("11111111-1111-4111-8111-111111111111", "First"),
    );
    await writeFile(
      path.join(workDir, "second-post.md"),
      VALID_FRONT_MATTER("22222222-2222-4222-8222-222222222222", "Second"),
    );

    const redirects = await generateRedirect(workDir);

    expect(redirects).toHaveLength(2);
    const sorted = [...redirects].sort((a, b) =>
      a.source.localeCompare(b.source),
    );
    expect(sorted).toEqual([
      {
        source: "/techblog/posts/first-post",
        destination: "/techblog/post/11111111-1111-4111-8111-111111111111",
        permanent: true,
      },
      {
        source: "/techblog/posts/second-post",
        destination: "/techblog/post/22222222-2222-4222-8222-222222222222",
        permanent: true,
      },
    ]);
  });

  it("walks markdown files in nested directories", async () => {
    const nested = path.join(workDir, "ja", "development");
    await mkdir(nested, { recursive: true });
    await writeFile(
      path.join(nested, "nested-post.md"),
      VALID_FRONT_MATTER("33333333-3333-4333-8333-333333333333"),
    );

    const redirects = await generateRedirect(workDir);

    expect(redirects).toHaveLength(1);
    expect(redirects[0]).toEqual({
      source: "/techblog/posts/nested-post",
      destination: "/techblog/post/33333333-3333-4333-8333-333333333333",
      permanent: true,
    });
  });

  it("uses only the basename (without .md) as the slug", async () => {
    const sub = path.join(workDir, "category");
    await mkdir(sub, { recursive: true });
    await writeFile(
      path.join(sub, "my-slug.md"),
      VALID_FRONT_MATTER("44444444-4444-4444-8444-444444444444"),
    );

    const [redirect] = await generateRedirect(workDir);
    expect(redirect.source).toBe("/techblog/posts/my-slug");
  });

  it("marks every redirect as permanent", async () => {
    await writeFile(
      path.join(workDir, "perm.md"),
      VALID_FRONT_MATTER("55555555-5555-4555-8555-555555555555"),
    );

    const redirects = await generateRedirect(workDir);
    expect(redirects.every((r) => r.permanent === true)).toBe(true);
  });

  it("propagates an error when a post has invalid front-matter", async () => {
    await writeFile(
      path.join(workDir, "bad.md"),
      `---
uuid: not-a-uuid
title: Bad
---
body
`,
    );

    await expect(generateRedirect(workDir)).rejects.toThrow();
  });
});

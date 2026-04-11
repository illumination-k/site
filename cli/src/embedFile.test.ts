import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import type { Code, Root } from "mdast";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import embedFile, { detectLanguage } from "./embedFile";

// Same minimal shape used inside embedFile.ts; inlining here keeps the test
// independent of `mdast-util-directive` (which cli does not depend on).
type LeafDirectiveLike = {
  type: "leafDirective";
  name: string;
  attributes?: Record<string, string>;
  children: Array<{ type: string; value?: string }>;
};

// Helper to build a minimal ::file[path]{attrs} leafDirective node by hand,
// so the test does not need to take a runtime dependency on remark-directive
// (same approach used by packages/md-plugins/remark-plugins/embed/book.test.ts).
function fileDirective(
  value: string,
  attributes: Record<string, string> = {},
): LeafDirectiveLike {
  return {
    type: "leafDirective",
    name: "file",
    attributes,
    children: [{ type: "text", value }],
  };
}

function rootWith(
  ...children: Array<LeafDirectiveLike | Root["children"][number]>
): Root {
  return { type: "root", children: children as Root["children"] };
}

async function runPlugin(ast: Root, postPath: string): Promise<void> {
  const plugin = embedFile({ postPath });
  await plugin(ast);
}

describe("detectLanguage", () => {
  it("maps common extensions to prism language ids", () => {
    expect(detectLanguage("flake.nix")).toBe("nix");
    expect(detectLanguage("hello.py")).toBe("python");
    expect(detectLanguage("main.ts")).toBe("typescript");
    expect(detectLanguage("lib.rs")).toBe("rust");
    expect(detectLanguage("Cargo.toml")).toBe("toml");
    expect(detectLanguage("config.yaml")).toBe("yaml");
    expect(detectLanguage("config.yml")).toBe("yaml");
    expect(detectLanguage("data.json")).toBe("json");
  });

  it("maps well-known basenames with no extension", () => {
    expect(detectLanguage("Dockerfile")).toBe("docker");
    expect(detectLanguage("/some/path/Dockerfile")).toBe("docker");
    expect(detectLanguage("Makefile")).toBe("makefile");
  });

  it("falls back to 'text' for unknown files", () => {
    expect(detectLanguage(".gitignore")).toBe("text");
    expect(detectLanguage("unknown.xyz")).toBe("text");
    expect(detectLanguage("no-extension")).toBe("text");
  });

  it("is case-insensitive for the extension", () => {
    expect(detectLanguage("SCRIPT.PY")).toBe("python");
    expect(detectLanguage("Main.TS")).toBe("typescript");
  });
});

describe("embedFile", () => {
  let tmpDir: string;
  let postPath: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(tmpdir(), "embed-file-test-"));
    postPath = path.join(tmpDir, "post.md");
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("replaces a ::file directive with a code node containing the file contents", async () => {
    await writeFile(
      path.join(tmpDir, "flake.nix"),
      '{ description = "example"; }\n',
    );

    const ast = rootWith(fileDirective("./flake.nix"));
    await runPlugin(ast, postPath);

    expect(ast.children).toHaveLength(1);
    const node = ast.children[0] as Code;
    expect(node.type).toBe("code");
    expect(node.lang).toBe("nix");
    expect(node.meta).toBe("title=flake.nix");
    expect(node.value).toBe('{ description = "example"; }');
  });

  it("resolves relative paths against the post's directory", async () => {
    const subdir = path.join(tmpDir, "companion");
    await mkdir(subdir);
    await writeFile(path.join(subdir, "hello.py"), "print('hi')\n");

    const ast = rootWith(fileDirective("./companion/hello.py"));
    await runPlugin(ast, postPath);

    const node = ast.children[0] as Code;
    expect(node.type).toBe("code");
    expect(node.lang).toBe("python");
    expect(node.meta).toBe("title=hello.py");
    expect(node.value).toBe("print('hi')");
  });

  it("allows overriding the language via the lang attribute", async () => {
    await writeFile(path.join(tmpDir, "config.txt"), "key = value\n");

    const ast = rootWith(fileDirective("./config.txt", { lang: "toml" }));
    await runPlugin(ast, postPath);

    const node = ast.children[0] as Code;
    expect(node.lang).toBe("toml");
  });

  it("allows overriding the title via the title attribute", async () => {
    await writeFile(path.join(tmpDir, "script.sh"), "echo hi\n");

    const ast = rootWith(
      fileDirective("./script.sh", { title: "custom title.sh" }),
    );
    await runPlugin(ast, postPath);

    const node = ast.children[0] as Code;
    expect(node.meta).toBe("title=custom title.sh");
    // Default lang detection still applies when lang is not overridden.
    expect(node.lang).toBe("bash");
  });

  it("ignores leaf directives with a different name", async () => {
    const otherDirective: LeafDirectiveLike = {
      type: "leafDirective",
      name: "other",
      attributes: {},
      children: [{ type: "text", value: "./flake.nix" }],
    };
    const ast = rootWith(otherDirective);

    await runPlugin(ast, postPath);

    expect(ast.children).toHaveLength(1);
    expect((ast.children[0] as { type: string; name?: string }).type).toBe(
      "leafDirective",
    );
    expect((ast.children[0] as { name: string }).name).toBe("other");
  });

  it("handles multiple ::file directives in the same document", async () => {
    await writeFile(path.join(tmpDir, "a.nix"), "a\n");
    await writeFile(path.join(tmpDir, "b.py"), "b\n");

    const ast = rootWith(fileDirective("./a.nix"), fileDirective("./b.py"));
    await runPlugin(ast, postPath);

    expect(ast.children).toHaveLength(2);
    const first = ast.children[0] as Code;
    const second = ast.children[1] as Code;
    expect(first.type).toBe("code");
    expect(first.lang).toBe("nix");
    expect(first.value).toBe("a");
    expect(second.type).toBe("code");
    expect(second.lang).toBe("python");
    expect(second.value).toBe("b");
  });

  it("throws with a useful error when the file does not exist", async () => {
    const ast = rootWith(fileDirective("./missing.txt"));
    await expect(runPlugin(ast, postPath)).rejects.toThrow(
      /Failed to read file for ::file directive/,
    );
  });

  it("throws when the path is empty", async () => {
    // A `::file[]` directive parses to a leafDirective whose text content is
    // an empty string; the plugin should refuse rather than silently read the
    // post directory.
    const ast = rootWith(fileDirective(""));
    await expect(runPlugin(ast, postPath)).rejects.toThrow(
      /Empty path in ::file directive/,
    );
  });

  it("strips only the trailing newline, not leading whitespace or blank lines in the middle", async () => {
    const raw = "\n  indented\n\nmiddle\n\n";
    await writeFile(path.join(tmpDir, "sample.txt"), raw);

    const ast = rootWith(fileDirective("./sample.txt"));
    await runPlugin(ast, postPath);

    const node = ast.children[0] as Code;
    expect(node.value).toBe("\n  indented\n\nmiddle");
  });
});

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import type { Code, Root } from "mdast";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import embedFile, {
  detectLanguage,
  formatRangeSuffix,
  parsePathAndRange,
  sliceLines,
} from "./embedFile";

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
    expect(detectLanguage("comp.tsx")).toBe("tsx");
    expect(detectLanguage("lib.rs")).toBe("rust");
    expect(detectLanguage("main.go")).toBe("go");
    expect(detectLanguage("Cargo.toml")).toBe("toml");
    expect(detectLanguage("config.yaml")).toBe("yaml");
    expect(detectLanguage("config.yml")).toBe("yaml");
    expect(detectLanguage("data.json")).toBe("json");
  });

  it("maps JavaScript and JSX-family extensions", () => {
    expect(detectLanguage("a.js")).toBe("javascript");
    expect(detectLanguage("a.jsx")).toBe("jsx");
    expect(detectLanguage("a.mjs")).toBe("javascript");
    expect(detectLanguage("a.cjs")).toBe("javascript");
  });

  it("maps shell-family extensions to bash", () => {
    expect(detectLanguage("a.sh")).toBe("bash");
    expect(detectLanguage("a.bash")).toBe("bash");
    expect(detectLanguage("a.zsh")).toBe("bash");
    expect(detectLanguage("a.fish")).toBe("bash");
  });

  it("maps web frontend extensions", () => {
    expect(detectLanguage("a.html")).toBe("html");
    expect(detectLanguage("a.css")).toBe("css");
    expect(detectLanguage("a.scss")).toBe("scss");
  });

  it("maps systems-language extensions", () => {
    expect(detectLanguage("a.c")).toBe("c");
    expect(detectLanguage("a.h")).toBe("c");
    expect(detectLanguage("a.cpp")).toBe("cpp");
    expect(detectLanguage("a.hpp")).toBe("cpp");
  });

  it("maps additional common scripting languages", () => {
    expect(detectLanguage("a.rb")).toBe("ruby");
    expect(detectLanguage("a.php")).toBe("php");
    expect(detectLanguage("a.java")).toBe("java");
    expect(detectLanguage("a.sql")).toBe("sql");
    expect(detectLanguage("a.md")).toBe("markdown");
    expect(detectLanguage("a.mdx")).toBe("markdown");
    expect(detectLanguage("a.jsonc")).toBe("json");
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

describe("parsePathAndRange", () => {
  it("returns the path unchanged when there is no fragment", () => {
    expect(parsePathAndRange("./foo.py")).toEqual({ filePath: "./foo.py" });
    expect(parsePathAndRange("a/b/c.ts")).toEqual({ filePath: "a/b/c.ts" });
  });

  it("parses a two-sided line range `#L<start>-L<end>`", () => {
    expect(parsePathAndRange("./foo.py#L10-L20")).toEqual({
      filePath: "./foo.py",
      range: { start: 10, end: 20 },
    });
  });

  it("parses a single-line fragment `#L<n>` as a range of one line", () => {
    expect(parsePathAndRange("./foo.py#L15")).toEqual({
      filePath: "./foo.py",
      range: { start: 15, end: 15 },
    });
  });

  it("accepts `#L1-L1` as a valid one-line range", () => {
    expect(parsePathAndRange("./foo.py#L1-L1")).toEqual({
      filePath: "./foo.py",
      range: { start: 1, end: 1 },
    });
  });

  it("throws on a malformed fragment (non-numeric)", () => {
    expect(() => parsePathAndRange("./foo.py#Labc")).toThrow(
      /Invalid line range in ::file path/,
    );
  });

  it("throws on a fragment missing the `L` prefix on the end", () => {
    expect(() => parsePathAndRange("./foo.py#L10-20")).toThrow(
      /Invalid line range in ::file path/,
    );
  });

  it("throws on a trailing-garbage fragment", () => {
    expect(() => parsePathAndRange("./foo.py#L10-L20x")).toThrow(
      /Invalid line range in ::file path/,
    );
  });

  it("rejects a zero start (line numbers are 1-indexed)", () => {
    expect(() => parsePathAndRange("./foo.py#L0")).toThrow(/1-indexed/);
  });

  it("rejects a range where end < start", () => {
    expect(() => parsePathAndRange("./foo.py#L20-L10")).toThrow(
      /end \(L10\) must be >= start \(L20\)/,
    );
  });

  it("rejects a fragment whose suffix matches `L<n>` only partially (anchored)", () => {
    // Guards against dropping the `^` anchor in the regex: without it,
    // "#LXYZ-L10" would be silently accepted because the tail matches.
    expect(() => parsePathAndRange("./foo.py#LXYZ-L10")).toThrow(
      /Invalid line range in ::file path/,
    );
    expect(() => parsePathAndRange("./foo.py#L10abc")).toThrow(
      /Invalid line range in ::file path/,
    );
  });
});

describe("sliceLines", () => {
  const sample = "line1\nline2\nline3\nline4\nline5\n";

  it("returns the requested inclusive slice for a multi-line range", () => {
    expect(sliceLines(sample, { start: 2, end: 4 })).toBe(
      "line2\nline3\nline4",
    );
  });

  it("returns a single line when start === end", () => {
    expect(sliceLines(sample, { start: 3, end: 3 })).toBe("line3");
  });

  it("includes the first line for an L1 start", () => {
    expect(sliceLines(sample, { start: 1, end: 2 })).toBe("line1\nline2");
  });

  it("includes the last line for an L<lastLine> end", () => {
    expect(sliceLines(sample, { start: 4, end: 5 })).toBe("line4\nline5");
  });

  it("throws when the requested end exceeds the file length", () => {
    expect(() => sliceLines(sample, { start: 1, end: 6 })).toThrow(
      /Line range L1-L6 exceeds file length \(5 lines\)/,
    );
  });

  it("ignores trailing newlines when computing the file length", () => {
    // Two files, same content, one with a trailing newline and one without.
    const withTrailing = "a\nb\nc\n";
    const withoutTrailing = "a\nb\nc";
    expect(sliceLines(withTrailing, { start: 1, end: 3 })).toBe("a\nb\nc");
    expect(sliceLines(withoutTrailing, { start: 1, end: 3 })).toBe("a\nb\nc");
    // And asking for L4 must throw in both cases rather than returning "".
    expect(() => sliceLines(withTrailing, { start: 4, end: 4 })).toThrow(
      /exceeds file length/,
    );
    expect(() => sliceLines(withoutTrailing, { start: 4, end: 4 })).toThrow(
      /exceeds file length/,
    );
  });

  it("strips multiple trailing newlines, not just one", () => {
    // Guards against a `/\n+$/` → `/\n$/` mutation: with just `/\n$/`, the
    // second-to-last newline would remain and `a\n` would be counted as a
    // 4th (empty) line, making `L3` unexpectedly point at an empty string.
    const multipleTrailing = "a\nb\nc\n\n\n";
    expect(sliceLines(multipleTrailing, { start: 3, end: 3 })).toBe("c");
    expect(() =>
      sliceLines(multipleTrailing, { start: 4, end: 4 }),
    ).toThrow(/exceeds file length \(3 lines\)/);
  });

  it("handles CRLF line endings", () => {
    const crlf = "line1\r\nline2\r\nline3\r\n";
    expect(sliceLines(crlf, { start: 1, end: 2 })).toBe("line1\nline2");
  });
});

describe("formatRangeSuffix", () => {
  it("formats a multi-line range as `#L<start>-L<end>`", () => {
    expect(formatRangeSuffix({ start: 10, end: 20 })).toBe("#L10-L20");
  });

  it("collapses a single-line range to `#L<n>`", () => {
    expect(formatRangeSuffix({ start: 5, end: 5 })).toBe("#L5");
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

  it("embeds only the requested line range when a `#L<s>-L<e>` fragment is present", async () => {
    // 5 distinct lines so the slice is unambiguous.
    await writeFile(
      path.join(tmpDir, "slice.py"),
      `${["line1", "line2", "line3", "line4", "line5"].join("\n")}\n`,
    );

    const ast = rootWith(fileDirective("./slice.py#L2-L4"));
    await runPlugin(ast, postPath);

    const node = ast.children[0] as Code;
    expect(node.type).toBe("code");
    expect(node.value).toBe("line2\nline3\nline4");
    // Default title reflects the requested range so readers can tell this is
    // an excerpt and not the full file.
    expect(node.meta).toBe("title=slice.py#L2-L4");
    // Language detection still comes from the extension, not the fragment.
    expect(node.lang).toBe("python");
  });

  it("embeds a single line when the fragment is `#L<n>`", async () => {
    await writeFile(path.join(tmpDir, "slice.py"), "a\nb\nc\n");

    const ast = rootWith(fileDirective("./slice.py#L2"));
    await runPlugin(ast, postPath);

    const node = ast.children[0] as Code;
    expect(node.value).toBe("b");
    expect(node.meta).toBe("title=slice.py#L2");
  });

  it("still honours an explicit title override even when a range is given", async () => {
    await writeFile(path.join(tmpDir, "slice.py"), "x\ny\nz\n");

    const ast = rootWith(
      fileDirective("./slice.py#L1-L2", { title: "first two lines" }),
    );
    await runPlugin(ast, postPath);

    const node = ast.children[0] as Code;
    expect(node.meta).toBe("title=first two lines");
    expect(node.value).toBe("x\ny");
  });

  it("throws when the line range exceeds the file length", async () => {
    await writeFile(path.join(tmpDir, "tiny.py"), "only\ntwo\n");
    const ast = rootWith(fileDirective("./tiny.py#L1-L10"));
    await expect(runPlugin(ast, postPath)).rejects.toThrow(
      /Line range L1-L10 exceeds file length/,
    );
  });

  it("throws when the line range fragment is malformed", async () => {
    await writeFile(path.join(tmpDir, "tiny.py"), "anything\n");
    const ast = rootWith(fileDirective("./tiny.py#Labc"));
    await expect(runPlugin(ast, postPath)).rejects.toThrow(
      /Invalid line range in ::file path/,
    );
  });

  it("trims leading and trailing whitespace from the path text", async () => {
    // Guards against removal of the `.trim()` call: without trim, the
    // leading "  " would be glued onto the path, `fs.readFile("  ./flake.nix")`
    // would fail with ENOENT, and we would silently hit the "file not found"
    // branch rather than successfully embedding the file.
    await writeFile(path.join(tmpDir, "flake.nix"), '{ description = "x"; }\n');

    const ast = rootWith(fileDirective("  ./flake.nix  "));
    await runPlugin(ast, postPath);

    const node = ast.children[0] as Code;
    expect(node.type).toBe("code");
    expect(node.value).toBe('{ description = "x"; }');
    expect(node.meta).toBe("title=flake.nix");
  });
});

import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

import remarkLintUnrenderedEmphasis from "./lintUnrenderedEmphasis";

function createProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkLintUnrenderedEmphasis)
    .use(remarkRehype)
    .use(rehypeStringify);
}

describe("remarkLintUnrenderedEmphasis", () => {
  describe("should NOT report errors for valid emphasis", () => {
    it("renders **bold** correctly", async () => {
      const vfile = await createProcessor().process("**bold**");
      expect(vfile.messages).toHaveLength(0);
    });

    it("renders *italic* correctly", async () => {
      const vfile = await createProcessor().process("*italic*");
      expect(vfile.messages).toHaveLength(0);
    });

    it("renders CJK-adjacent bold correctly", async () => {
      const vfile = await createProcessor().process("日本語**bold**テスト");
      expect(vfile.messages).toHaveLength(0);
    });

    it("renders CJK-adjacent italic correctly", async () => {
      const vfile = await createProcessor().process("これは**太字**です");
      expect(vfile.messages).toHaveLength(0);
    });

    it("ignores plain asterisks in math-like expressions", async () => {
      const vfile = await createProcessor().process("2 * 3 * 4");
      expect(vfile.messages).toHaveLength(0);
    });

    it("ignores asterisks in code blocks", async () => {
      const vfile = await createProcessor().process(
        "```\n**not emphasis**\n```",
      );
      expect(vfile.messages).toHaveLength(0);
    });

    it("ignores asterisks in inline code", async () => {
      const vfile = await createProcessor().process("`**not emphasis**`");
      expect(vfile.messages).toHaveLength(0);
    });

    it("handles single isolated asterisk", async () => {
      const vfile = await createProcessor().process(
        "this is a * single asterisk",
      );
      expect(vfile.messages).toHaveLength(0);
    });
  });

  describe("should report errors for unrendered emphasis", () => {
    it("detects ** bold ** (spaces inside markers)", async () => {
      const vfile = await createProcessor().process("** bold **");
      expect(vfile.messages).toHaveLength(1);
      expect(vfile.messages[0].message).toContain("** bold **");
      // Message source should be the rule id passed to file.message.
      expect(vfile.messages[0].ruleId).toBe("remark-lint-unrendered-emphasis");
      // Exact message shape (guards against the template literal being blanked).
      expect(vfile.messages[0].message).toBe(
        'Unrendered emphasis found: "** bold **"',
      );
    });

    it("detects **bold ** (trailing space)", async () => {
      const vfile = await createProcessor().process("**bold **");
      expect(vfile.messages).toHaveLength(1);
    });

    it("detects ** bold** (leading space)", async () => {
      const vfile = await createProcessor().process("** bold**");
      expect(vfile.messages).toHaveLength(1);
    });

    it("detects *bold * (italic with trailing space)", async () => {
      const vfile = await createProcessor().process("*bold *");
      expect(vfile.messages).toHaveLength(1);
      expect(vfile.messages[0].ruleId).toBe("remark-lint-unrendered-emphasis");
      // Exact italic message shape (guards the italic branch template literal).
      expect(vfile.messages[0].message).toBe(
        'Unrendered emphasis found: "*bold *"',
      );
    });

    it("detects *bold* with only leading inner space (italic branch)", async () => {
      // Inner is " bold": starts with space, does NOT end with space → reported.
      // Ensures the endsWith(" ") half of the filter is exercised.
      // Surrounded by CJK so *…* parses as a text node (not rendered emphasis).
      const vfile = await createProcessor().process("あ* bold*い");
      expect(vfile.messages).toHaveLength(1);
      expect(vfile.messages[0].message).toContain("* bold*");
    });

    it("detects *bold* with only trailing inner space using non-emphasis context", async () => {
      // Inner is "bold ": does NOT start with space, ends with space → reported.
      // Ensures the startsWith(" ") half of the filter is exercised.
      const vfile = await createProcessor().process("あ*bold *い");
      expect(vfile.messages).toHaveLength(1);
      expect(vfile.messages[0].message).toContain("*bold *");
    });

    it("detects unrendered emphasis with CJK surroundings", async () => {
      const vfile = await createProcessor().process("テスト** bold **テスト");
      expect(vfile.messages).toHaveLength(1);
    });

    it("includes the unrendered text in error message", async () => {
      const vfile = await createProcessor().process("** bold **");
      expect(vfile.messages[0].message).toContain("** bold **");
    });

    it("detects multiple issues in one text", async () => {
      const vfile = await createProcessor().process(
        "** bold ** and ** another **",
      );
      expect(vfile.messages.length).toBeGreaterThanOrEqual(2);
    });
  });
});

import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

import remarkLintBannedPhrases, {
  DEFAULT_BANNED_PHRASES,
  RULE_ID,
} from "./lintBannedPhrases";

function createProcessor(phrases?: typeof DEFAULT_BANNED_PHRASES) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkLintBannedPhrases, phrases ? { phrases } : undefined)
    .use(remarkRehype)
    .use(rehypeStringify);
}

describe("remarkLintBannedPhrases", () => {
  describe("reports banned rhetorical filler", () => {
    it("detects 半分だけ正しい", async () => {
      const vfile = await createProcessor().process(
        "「pageを小さくすればいい」は半分だけ正しい",
      );
      expect(vfile.messages).toHaveLength(1);
      expect(vfile.messages[0].ruleId).toBe(RULE_ID);
      expect(vfile.messages[0].message).toContain("半分だけ正しい");
      expect(vfile.messages[0].message).toContain("どこが正しく");
    });

    it("detects the 半分正しい variant without だけ", async () => {
      const vfile = await createProcessor().process("この要約は半分正しい。");
      expect(vfile.messages).toHaveLength(1);
    });

    it("detects と言っても過言ではない", async () => {
      const vfile = await createProcessor().process(
        "最速と言っても過言ではない。",
      );
      expect(vfile.messages).toHaveLength(1);
    });

    it("detects ある意味 followed by a comma", async () => {
      const vfile = await createProcessor().process(
        "ある意味で、これは正しい選択になる。",
      );
      expect(vfile.messages).toHaveLength(1);
    });

    it("detects 言うまでもないが", async () => {
      const vfile = await createProcessor().process(
        "言うまでもないが、Parquetは列指向になる。",
      );
      expect(vfile.messages).toHaveLength(1);
    });

    it("reports every occurrence in one paragraph", async () => {
      const vfile = await createProcessor().process(
        "これは半分正しい。あれも半分正しい。",
      );
      expect(vfile.messages).toHaveLength(2);
    });

    it("reports the position of the match, not the whole node", async () => {
      const vfile = await createProcessor().process("abcdefghij は半分正しい");
      expect(vfile.messages[0].line).toBe(1);
      // "半分正しい" starts at the 13th character (1-indexed column).
      expect(vfile.messages[0].column).toBe(13);
    });

    it("reports the correct line for a match on a later line", async () => {
      const vfile = await createProcessor().process(
        "一行目のテキスト\n二行目は半分正しい",
      );
      expect(vfile.messages).toHaveLength(1);
      expect(vfile.messages[0].line).toBe(2);
    });
  });

  describe("does NOT report legitimate usage", () => {
    it("allows 半分だけ used literally", async () => {
      const vfile = await createProcessor().process(
        "row groupの半分だけを読めば足りる。",
      );
      expect(vfile.messages).toHaveLength(0);
    });

    it("allows ある意味 without a following comma", async () => {
      const vfile = await createProcessor().process(
        "この語のある意味を調べる。",
      );
      expect(vfile.messages).toHaveLength(0);
    });

    it("ignores banned phrases inside code blocks", async () => {
      const vfile = await createProcessor().process(
        "```text\nこれは半分正しい\n```",
      );
      expect(vfile.messages).toHaveLength(0);
    });

    it("ignores banned phrases inside inline code", async () => {
      const vfile = await createProcessor().process("`半分正しい`");
      expect(vfile.messages).toHaveLength(0);
    });

    it("passes clean prose", async () => {
      const vfile = await createProcessor().process(
        "pageを8KiBまで縮めるとランダムアクセスは20倍速くなるが、ファイルサイズが13%増える。",
      );
      expect(vfile.messages).toHaveLength(0);
    });
  });

  describe("configuration", () => {
    it("accepts a custom phrase list", async () => {
      const vfile = await createProcessor([
        { pattern: /とても/g, reason: "程度を数字で書く" },
        { pattern: /すごく/g, reason: "程度を数字で書く" },
      ]).process("とても速い。半分正しい。");
      expect(vfile.messages).toHaveLength(1);
      expect(vfile.messages[0].message).toContain("とても");
    });

    it("does not leak regex lastIndex between runs", async () => {
      const phrases = [{ pattern: /半分正しい/g, reason: "具体的に書く" }];
      const first = await createProcessor(phrases).process("半分正しい");
      const second = await createProcessor(phrases).process("半分正しい");
      expect(first.messages).toHaveLength(1);
      expect(second.messages).toHaveLength(1);
    });

    it("ships a non-empty default list", () => {
      expect(DEFAULT_BANNED_PHRASES.length).toBeGreaterThan(0);
      for (const { pattern, reason } of DEFAULT_BANNED_PHRASES) {
        expect(pattern.flags).toContain("g");
        expect(reason.length).toBeGreaterThan(0);
      }
    });
  });
});

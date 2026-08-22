import type { Root, Text } from "mdast";
import type { Position } from "unist";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";

export const RULE_ID = "remark-lint-banned-phrases";

export interface BannedPhrase {
  /** Must carry the `g` flag: every occurrence in a text node is reported. */
  pattern: RegExp;
  /** Shown to the author, so say what to write instead — not just "don't". */
  reason: string;
}

/**
 * Rhetorical filler that reads as insight but carries none.
 *
 * Patterns are matched against text nodes only, so code blocks, inline code
 * and URLs are never touched. Keep each pattern narrow enough that a literal,
 * technical use of the same words still passes: "半分だけ" on its own is a
 * perfectly good sentence about reading half a row group, so the pattern
 * targets the "half right" construction rather than the bare word.
 */
export const DEFAULT_BANNED_PHRASES: BannedPhrase[] = [
  {
    pattern: /半分(だけ|ほど|くらい)?(は)?(正しい|当たって)/g,
    reason:
      "「半分だけ正しい」は、どこが正しくどこが違うのかを説明していない。成り立つ条件と成り立たない条件を具体的に書く",
  },
  {
    pattern: /と言っても過言では(ない|あるまい)/g,
    reason: "「過言ではない」は誇張の予防線でしかない。主張するなら根拠を添えて言い切る",
  },
  {
    pattern: /ある意味(で|では)?[、,]/g,
    reason: "「ある意味」はどの意味かを示していない。どの観点から見た話なのかを書く",
  },
  {
    pattern: /言うまでもない(が|けれど)/g,
    reason: "「言うまでもない」なら書かない。書く価値があるなら前置きなしに書く",
  },
];

/** Count how many newlines appear before `index`. */
function offsetToPoint(
  value: string,
  index: number,
  start: { line: number; column: number; offset?: number },
) {
  const before = value.slice(0, index);
  const newlines = before.split("\n").length - 1;
  if (newlines === 0) {
    return {
      line: start.line,
      column: start.column + index,
      offset: start.offset === undefined ? undefined : start.offset + index,
    };
  }
  const lastNewline = before.lastIndexOf("\n");
  return {
    line: start.line + newlines,
    column: index - lastNewline,
    offset: start.offset === undefined ? undefined : start.offset + index,
  };
}

function matchPosition(
  node: Text,
  index: number,
  length: number,
): Position | undefined {
  const start = node.position?.start;
  if (!start) {
    return undefined;
  }
  return {
    start: offsetToPoint(node.value, index, start),
    end: offsetToPoint(node.value, index + length, start),
  };
}

export default function remarkLintBannedPhrases(options?: {
  phrases?: BannedPhrase[];
}) {
  const phrases = options?.phrases ?? DEFAULT_BANNED_PHRASES;

  return (ast: Root, file: VFile) => {
    visit(ast, "text", (node: Text) => {
      for (const { pattern, reason } of phrases) {
        // Patterns are shared across files, so never trust lastIndex.
        pattern.lastIndex = 0;
        for (
          let match = pattern.exec(node.value);
          match !== null;
          match = pattern.exec(node.value)
        ) {
          file.message(
            `Banned phrase "${match[0]}": ${reason}`,
            matchPosition(node, match.index, match[0].length) ?? node.position,
            RULE_ID,
          );
          // A zero-length match would spin forever.
          if (match[0].length === 0) {
            pattern.lastIndex += 1;
          }
        }
      }
    });
  };
}

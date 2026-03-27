import type { Root, Text } from "mdast";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";

// Detect **...** or *...* patterns remaining as plain text.
// These indicate emphasis that failed to render (e.g. spaces inside markers, unclosed markers).
const UNRENDERED_STRONG = /\*\*(.+?)\*\*/g;
const UNRENDERED_EMPHASIS = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;

/**
 * Check if a matched emphasis pattern looks intentional (not just math like "2 * 3 * 4").
 * If the inner content starts AND ends with whitespace, it's likely not intended emphasis.
 */
function isLikelyIntendedEmphasis(inner: string): boolean {
  return !(inner.startsWith(" ") && inner.endsWith(" "));
}

function findMatches(pattern: RegExp, value: string): RegExpExecArray[] {
  pattern.lastIndex = 0;
  const matches: RegExpExecArray[] = [];
  for (let m = pattern.exec(value); m !== null; m = pattern.exec(value)) {
    matches.push(m);
  }
  return matches;
}

export default function remarkLintUnrenderedEmphasis() {
  return (ast: Root, file: VFile) => {
    visit(ast, "text", (node: Text) => {
      const { value, position } = node;

      // Check for unrendered **strong**
      for (const match of findMatches(UNRENDERED_STRONG, value)) {
        file.message(
          `Unrendered emphasis found: "${match[0]}"`,
          position,
          "remark-lint-unrendered-emphasis",
        );
      }

      // Check for unrendered *emphasis* (with false-positive filtering)
      for (const match of findMatches(UNRENDERED_EMPHASIS, value)) {
        if (!isLikelyIntendedEmphasis(match[1])) {
          continue;
        }
        file.message(
          `Unrendered emphasis found: "${match[0]}"`,
          position,
          "remark-lint-unrendered-emphasis",
        );
      }
    });
  };
}

import type { Root, Text } from "mdast";
import type { VFile } from "vfile";
import { visit } from "unist-util-visit";

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

export default function remarkLintUnrenderedEmphasis() {
	return (ast: Root, file: VFile) => {
		visit(ast, "text", (node: Text) => {
			const { value, position } = node;

			// Check for unrendered **strong**
			UNRENDERED_STRONG.lastIndex = 0;
			let match: RegExpExecArray | null;
			while ((match = UNRENDERED_STRONG.exec(value)) !== null) {
				file.message(
					`Unrendered emphasis found: "${match[0]}"`,
					position,
					"remark-lint-unrendered-emphasis",
				);
			}

			// Check for unrendered *emphasis* (with false-positive filtering)
			UNRENDERED_EMPHASIS.lastIndex = 0;
			while ((match = UNRENDERED_EMPHASIS.exec(value)) !== null) {
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

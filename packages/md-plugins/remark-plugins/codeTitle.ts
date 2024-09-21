import { visit } from "unist-util-visit";

import type { Code, Paragraph, Parent, Root } from "mdast";

function extractTitleFromMeta(meta: string | null | undefined) {
  if (!meta) {
    return;
  }

  const title = meta
    .split(",")
    .map((m) => {
      const kv = m.split("=");
      if (kv.length !== 2) {
        return;
      }

      if (kv[0] !== "title") {
        return;
      }

      return kv[1];
    })
    .filter((v) => v)
    .pop();

  return title;
}

export default function () {
  return (ast: Root) => {
    // @ts-expect-error
    visit(ast, "code", (node: Code, index: number | undefined, parent: Parent) => {
      const title = extractTitleFromMeta(node.meta);

      if (!title) {
        return;
      }

      const titleNode: Paragraph = {
        type: "paragraph",
        children: [{ type: "text", value: title }],
        data: { hProperties: { className: "code-title" } },
      };

      const wrapNode = {
        type: "wrap",
        children: [titleNode, node],
        data: {
          hName: "div",
          hProperties: { className: "code-title-container" },
        },
      };

      // @ts-ignore
      parent.children[index || 0] = wrapNode;
    });
  };
}

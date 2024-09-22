import { visit } from "unist-util-visit";

import type { Code, Paragraph, Root } from "mdast";
import type { Node } from "unist";

import { isUnistParentNode } from "./type-guard";

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
    visit(
      ast,
      "code",
      (node: Code, index: number | null | undefined, parent?: Node) => {
        const title = extractTitleFromMeta(node.meta);

        if (!title) {
          console.warn(`No title found in code meta: ${node.meta}`);
          return;
        }

        if (!parent) {
          console.warn(`No parent found for code node: ${node}`);
          return;
        }

        if (!isUnistParentNode(parent)) {
          console.warn(`Parent is not a parent node: ${parent}`);
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

        parent.children[index || 0] = wrapNode;
      },
    );
  };
}

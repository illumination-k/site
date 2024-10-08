import { h } from "hastscript";
import { visit } from "unist-util-visit";

import type { Heading, Root } from "mdast";

type Option = {
  depth: number;
};

export default function (option: Option = { depth: 3 }) {
  let id = 0;

  return (ast: Root) => {
    visit(ast, "heading", (node: Heading) => {
      if (option.depth < node.depth) {
        return;
      }

      if (!node.data) node.data = {};

      const hast = h(`h${node.depth}`, { id });
      node.data.hName = hast.tagName;
      node.data.hProperties = hast.properties;

      id += 1;
    });
  };
}

import { h } from "hastscript";
import { visit } from "unist-util-visit";

import type { Heading, Parent, Root } from "mdast";

type Option = {
  depth: number;
};

export default function(option: Option = { depth: 3 }) {
  let id = 0;

  return (ast: Root) => {
    //@ts-ignore
    visit(ast, "heading", (node: Heading) => {
      if (option.depth < node.depth) {
        return;
      }

      if (!node.data) node.data = {};

      const hast = h(`h${node.depth + 1}`, { id });
      node.data.hName = hast.tagName;
      node.data.hProperties = hast.properties;

      id += 1;
    });
  };
}

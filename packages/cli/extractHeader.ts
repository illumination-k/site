import type { Headings } from "common";
import type { Heading as AstHeading } from "mdast";
import type { Compiler } from "unified";
import type { Node } from "unist";

import { toString as mdastToString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";

export function headings(ast: Node, depth: number) {
  const headingsList: Headings = [];

  visit(ast, "heading", (node: AstHeading) => {
    if (node.depth > depth) {
      return;
    }
    headingsList.push({
      depth: node.depth,
      value: mdastToString(node, { includeImageAlt: false }),
    });
  });

  return headingsList;
}

type Option = {
  depth: number;
};

export default function extractHeader(option: Option = { depth: 3 }): Compiler {
  return (node, file) => {
    file.data.headings = headings(node, option.depth);

    return "";
  };
}

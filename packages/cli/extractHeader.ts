import type { Headings } from "common";
import type { Heading as AstHeading, Root } from "mdast";
import type { VFileWithOutput } from "unified";

import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";

export function headings(ast: Root, depth: number) {
  const headingsList: Headings = [];

  // @ts-ignore
  visit(ast, "heading", (node: AstHeading) => {
    if (node.depth > depth) {
      return;
    }
    headingsList.push({
      depth: node.depth,
      value: toString(node, { includeImageAlt: false }),
    });
  });

  return headingsList;
}

type Option = {
  depth: number;
};

export default function extractHeader(option: Option = { depth: 3 }) {
  return (node: Root, file: VFileWithOutput<any>) => {
    file.data.headings = headings(node, option.depth);
  };
}

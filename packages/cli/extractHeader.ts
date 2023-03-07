import type { Heading as AstHeading, Root } from "mdast";
import { toString } from "mdast-util-to-string";
import { Plugin, VFileWithOutput } from "unified";
import { visit } from "unist-util-visit";

type Heading = {
  depth: number;
  value: string;
};

export function headings(ast: Root, depth: number) {
  const headingsList: Heading[] = [];

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

import type { Root } from "mdast";
import type { ContainerDirective } from "mdast-util-directive";
import { toString as mdastToString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";

export default function FigureDirective() {
  return (ast: Root) => {
    let figureCount = 0;

    // @ts-ignore
    visit(ast, "containerDirective", (node: ContainerDirective) => {
      if (node.name !== "figure") {
        return;
      }

      figureCount++;

      const label = node.children
        // @ts-ignore
        .filter((child) => child.data?.directiveLabel)
        .pop();
      const content = node.children.filter(
        // @ts-ignore
        (child) => !child.data?.directiveLabel,
      );

      const caption = label ? mdastToString(label) : undefined;

      node.data = { hName: "figure", ...node.data };

      const figcaptionText = caption
        ? `Figure ${figureCount}: ${caption}`
        : `Figure ${figureCount}`;

      const figcaptionNode = {
        type: "figcaption",
        data: { hName: "figcaption" },
        children: [{ type: "text", value: figcaptionText }],
      };

      // @ts-ignore
      node.children = [...content, figcaptionNode];
    });
  };
}

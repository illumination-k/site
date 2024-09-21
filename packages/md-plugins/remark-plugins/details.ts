import type { Root } from "mdast";
import type { ContainerDirective } from "mdast-util-directive";
import { toString as mdastToString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";

export default function DetailsDirective() {
  return (ast: Root) => {
    // @ts-ignore
    visit(ast, "containerDirective", (node: ContainerDirective) => {
      if (node.name !== "details") {
        return;
      }

      const title = node.children
        // @ts-ignore
        .filter((child) => child.data?.directiveLabel)
        .pop();
      const content = node.children.filter(
        // @ts-ignore
        (child) => !child.data?.directiveLabel,
      );

      const summary = title ? mdastToString(title) : "Details";

      const summaryNode = {
        type: "summary",
        data: { hName: "summary" },
        children: [{ type: "text", value: summary }],
      };

      node.data = { hName: "details", ...node.data };

      // @ts-ignore
      node.children = [summaryNode].concat(content);
    });
  };
}

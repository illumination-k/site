import { Root } from "mdast";
import { visit } from "unist-util-visit";
import { toString } from "mdast-util-to-string";
import { ContainerDirective } from "mdast-util-directive";

export default function DetailsDirective() {
  return (ast: Root) => {
    // @ts-ignore
    visit(ast, "containerDirective", (node: ContainerDirective) => {
      if (node.name !== "details") {
        return;
      }

      const title = node.children.filter((child) => child.data?.directiveLabel).pop();
      const content = node.children.filter((child) => !child.data?.directiveLabel);

      const summary = title ? toString(title) : "Details";

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

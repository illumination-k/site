import type { Root } from "mdast";
import type { Directives } from "mdast-util-directive";
import type { Node, Parent } from "unist";
import { visit } from "unist-util-visit";

export { GithubTransformer } from "./github";
export { default as GithubCardTransformer } from "./github-card";

export interface DirectiveTransformer {
  shouldTransform: (node: Directives) => boolean;
  transform: (
    node: Directives,
    index: number | null | undefined,
    parent: Parent,
  ) => Promise<void>;
}

function isParent(node?: Node): node is Parent {
  if (!node) {
    return false;
  }

  return "children" in node;
}

export default function remarkDirectiveEmbedGenerator(
  transformers: DirectiveTransformer[],
) {
  return () => {
    return async (ast: Root) => {
      const promises: (() => Promise<void>)[] = [];

      visit(ast, (node, index, parent) => {
        if (
          node.type === "textDirective" ||
          node.type === "leafDirective" ||
          node.type === "containerDirective"
        ) {
          for (const transformer of transformers) {
            if (transformer.shouldTransform(node)) {
              promises.push(async () => {
                if (isParent(parent)) {
                  await transformer.transform(node, index, parent);
                }
              });
            }
          }
        }
      });

      await Promise.all(promises.map((f) => f()));
    };
  };
}

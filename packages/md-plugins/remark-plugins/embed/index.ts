import type { Parent, Root } from "mdast";
import type { Directive } from "mdast-util-directive";
import { visit } from "unist-util-visit";

export { GithubTransformer } from "./embedGithub";

export interface DirectiveTransformer {
  shouldTransform: (node: Directive) => boolean;
  transform: (node: Directive, index: number | null, parent: Parent) => Promise<void>;
}

export default function remarkDirectiveEmbedGenerator(transformers: DirectiveTransformer[]) {
  return () => {
    return (async (ast: Root) => {
      const promises: (() => Promise<void>)[] = [];

      // @ts-ignore
      visit(ast, (node, index, parent) => {
        if (
          node.type === "textDirective"
          || node.type === "leafDirective"
          || node.type === "containerDirective"
        ) {
          transformers.forEach((transformer) => {
            if (!transformer.shouldTransform(node)) {
              return;
            }

            promises.push(async () => transformer.transform(node, index, parent));
          });
        }
      });

      await Promise.all(promises.map((f) => f()));
    });
  };
}

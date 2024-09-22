import type { Node as UnistNode, Parent as UnistParent } from "unist";

export function isUnistParentNode(node: UnistNode): node is UnistParent {
  return "children" in node;
}

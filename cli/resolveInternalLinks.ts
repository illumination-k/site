import path from "node:path";
import type { Link, Root } from "mdast";
import { visit } from "unist-util-visit";
import { logger } from "./logger";

export type PostMetaMap = Map<string, { uuid: string; category: string }>;

type Option = {
  postPath: string;
  postMetaMap: PostMetaMap;
};

const resolveInternalLinks = (option: Option) => {
  const postDirPath = path.resolve(path.dirname(option.postPath));

  return (ast: Root) => {
    visit(ast, "link", (node: Link) => {
      const url = node.url;

      // Skip external links, anchors, and mailto
      if (
        url.startsWith("http") ||
        url.startsWith("#") ||
        url.startsWith("mailto:")
      ) {
        return;
      }

      // Split off fragment
      const [filePart, fragment] = url.split("#", 2);

      if (!filePart.endsWith(".md")) {
        return;
      }

      // Resolve relative path to absolute
      const targetPath = path.resolve(postDirPath, filePart);
      const meta = option.postMetaMap.get(targetPath);

      if (!meta) {
        logger.warn(
          { url, postPath: option.postPath, resolvedTo: targetPath },
          "Internal link target not found",
        );
        return;
      }

      // Rewrite to internal URL: /{category}/post/{uuid}
      node.url = `/${meta.category}/post/${meta.uuid}${fragment ? `#${fragment}` : ""}`;
    });
  };
};

export default resolveInternalLinks;

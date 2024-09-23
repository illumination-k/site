import type { Image, Link } from "mdast";
import type { Directives } from "mdast-util-directive";
import { toString as mdastToString } from "mdast-util-to-string";
import type { DirectiveTransformer } from ".";

export default class GithubCardTransformer implements DirectiveTransformer {
  shouldTransform(node: Directives): boolean {
    if (node.type !== "leafDirective") return false;
    if (node.name !== "gh-card") return false;

    return true;
  }

  async transform(node: Directives) {
    const repo = mdastToString(node);

    const repoUrl = `https://github.com/${repo}`;
    const svgUrl = `https://gh-card.dev/repos/${repo}.svg?fullname=`;

    const imageNode: Image = { type: "image", url: svgUrl, alt: repo };
    const linkNode: Link = {
      type: "link",
      url: repoUrl,
      children: [imageNode],
    };

    node.data = { hProperties: { className: "gh-card" } };

    node.children = [linkNode];
  }
}
